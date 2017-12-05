#include "builtin.h"
#include "commit.h"
#include "refs.h"
#include "pkt-line.h"
#include "sideband.h"
#include "run-command.h"
#include "remote.h"
#include "connect.h"
#include "send-pack.h"
#include "quote.h"
#include "transport.h"
#include "version.h"
#include "sha1-array.h"
#include "gpg-interface.h"

static int feed_object(const unsigned char *sha1, int fd, int negative)
{
	char buf[42];

	if (negative && !has_sha1_file(sha1))
		return 1;

	memcpy(buf + negative, sha1_to_hex(sha1), 40);
	if (negative)
		buf[0] = '^';
	buf[40 + negative] = '\n';
	return write_or_whine(fd, buf, 41 + negative, "send-pack: send refs");
}

/*
 * Make a pack stream and spit it out into file descriptor fd
 */
static int pack_objects(int fd, struct ref *refs, struct sha1_array *extra, struct send_pack_args *args)
{
	/*
	 * The child becomes pack-objects --revs; we feed
	 * the revision parameters to it via its stdin and
	 * let its stdout go back to the other end.
	 */
	const char *argv[] = {
		"pack-objects",
		"--all-progress-implied",
		"--revs",
		"--stdout",
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
	};
	struct child_process po = CHILD_PROCESS_INIT;
	int i;

	i = 4;
	if (args->use_thin_pack)
		argv[i++] = "--thin";
	if (args->use_ofs_delta)
		argv[i++] = "--delta-base-offset";
	if (args->quiet || !args->progress)
		argv[i++] = "-q";
	if (args->progress)
		argv[i++] = "--progress";
	if (is_repository_shallow())
		argv[i++] = "--shallow";
	po.argv = argv;
	po.in = -1;
	po.out = args->stateless_rpc ? -1 : fd;
	po.git_cmd = 1;
	if (start_command(&po))
		die_errno("git pack-objects failed");

	/*
	 * We feed the pack-objects we just spawned with revision
	 * parameters by writing to the pipe.
	 */
	for (i = 0; i < extra->nr; i++)
		if (!feed_object(extra->sha1[i], po.in, 1))
			break;

	while (refs) {
		if (!is_null_sha1(refs->old_sha1) &&
		    !feed_object(refs->old_sha1, po.in, 1))
			break;
		if (!is_null_sha1(refs->new_sha1) &&
		    !feed_object(refs->new_sha1, po.in, 0))
			break;
		refs = refs->next;
	}

	close(po.in);

	if (args->stateless_rpc) {
		char *buf = xmalloc(LARGE_PACKET_MAX);
		while (1) {
			ssize_t n = xread(po.out, buf, LARGE_PACKET_MAX);
			if (n <= 0)
				break;
			send_sideband(fd, -1, buf, n, LARGE_PACKET_MAX);
		}
		free(buf);
		close(po.out);
		po.out = -1;
	}

	if (finish_command(&po))
		return -1;
	return 0;
}

static int receive_status(int in, struct ref *refs)
{
	struct ref *hint;
	int ret = 0;
	char *line = packet_read_line(in, NULL);
	if (!starts_with(line, "unpack "))
		return error("did not receive remote status");
	if (strcmp(line, "unpack ok")) {
		error("unpack failed: %s", line + 7);
		ret = -1;
	}
	hint = NULL;
	while (1) {
		char *refname;
		char *msg;
		line = packet_read_line(in, NULL);
		if (!line)
			break;
		if (!starts_with(line, "ok ") && !starts_with(line, "ng ")) {
			error("invalid ref status from remote: %s", line);
			ret = -1;
			break;
		}

		refname = line + 3;
		msg = strchr(refname, ' ');
		if (msg)
			*msg++ = '\0';

		/* first try searching at our hint, falling back to all refs */
		if (hint)
			hint = find_ref_by_name(hint, refname);
		if (!hint)
			hint = find_ref_by_name(refs, refname);
		if (!hint) {
			warning("remote reported status on unknown ref: %s",
					refname);
			continue;
		}
		if (hint->status != REF_STATUS_EXPECTING_REPORT) {
			warning("remote reported status on unexpected ref: %s",
					refname);
			continue;
		}

		if (line[0] == 'o' && line[1] == 'k')
			hint->status = REF_STATUS_OK;
		else {
			hint->status = REF_STATUS_REMOTE_REJECT;
			ret = -1;
		}
		if (msg)
			hint->remote_status = xstrdup(msg);
		/* start our next search from the next ref */
		hint = hint->next;
	}
	return ret;
}

static int sideband_demux(int in, int out, void *data)
{
	int *fd = data, ret;
#ifdef NO_PTHREADS
	close(fd[1]);
#endif
	ret = recv_sideband("send-pack", fd[0], out);
	close(out);
	return ret;
}

static int advertise_shallow_grafts_cb(const struct commit_graft *graft, void *cb)
{
	struct strbuf *sb = cb;
	if (graft->nr_parent == -1)
		packet_buf_write(sb, "shallow %s\n", oid_to_hex(&graft->oid));
	return 0;
}

static void advertise_shallow_grafts_buf(struct strbuf *sb)
{
	if (!is_repository_shallow())
		return;
	for_each_commit_graft(advertise_shallow_grafts_cb, sb);
}

#define CHECK_REF_NO_PUSH -1
#define CHECK_REF_STATUS_REJECTED -2
#define CHECK_REF_UPTODATE -3
static int check_to_send_update(const struct ref *ref, const struct send_pack_args *args)
{
	if (!ref->peer_ref && !args->send_mirror)
		return CHECK_REF_NO_PUSH;

	/* Check for statuses set by set_ref_status_for_push() */
	switch (ref->status) {
	case REF_STATUS_REJECT_NONFASTFORWARD:
	case REF_STATUS_REJECT_ALREADY_EXISTS:
	case REF_STATUS_REJECT_FETCH_FIRST:
	case REF_STATUS_REJECT_NEEDS_FORCE:
	case REF_STATUS_REJECT_STALE:
	case REF_STATUS_REJECT_NODELETE:
		return CHECK_REF_STATUS_REJECTED;
	case REF_STATUS_UPTODATE:
		return CHECK_REF_UPTODATE;
	default:
		return 0;
	}
}

/*
 * the beginning of the next line, or the end of buffer.
 *
 * NEEDSWORK: perhaps move this to git-compat-util.h or somewhere and
 * convert many similar uses found by "git grep -A4 memchr".
 */
static const char *next_line(const char *line, size_t len)
{
	const char *nl = memchr(line, '\n', len);
	if (!nl)
		return line + len; /* incomplete line */
	return nl + 1;
}

static int generate_push_cert(struct strbuf *req_buf,
			      const struct ref *remote_refs,
			      struct send_pack_args *args,
			      const char *cap_string,
			      const char *push_cert_nonce)
{
	const struct ref *ref;
	char *signing_key = xstrdup(get_signing_key());
	const char *cp, *np;
	struct strbuf cert = STRBUF_INIT;
	int update_seen = 0;

	strbuf_addf(&cert, "certificate version 0.1\n");
	strbuf_addf(&cert, "pusher %s ", signing_key);
	datestamp(&cert);
	strbuf_addch(&cert, '\n');
	if (args->url && *args->url) {
		char *anon_url = transport_anonymize_url(args->url);
		strbuf_addf(&cert, "pushee %s\n", anon_url);
		free(anon_url);
	}
	if (push_cert_nonce[0])
		strbuf_addf(&cert, "nonce %s\n", push_cert_nonce);
	strbuf_addstr(&cert, "\n");

	for (ref = remote_refs; ref; ref = ref->next) {
		if (check_to_send_update(ref, args) < 0)
			continue;
		update_seen = 1;
		strbuf_addf(&cert, "%s %s %s\n",
			    sha1_to_hex(ref->old_sha1),
			    sha1_to_hex(ref->new_sha1),
			    ref->name);
	}
	if (!update_seen)
		goto free_return;

	if (sign_buffer(&cert, &cert, signing_key))
		die(_("failed to sign the push certificate"));

	packet_buf_write(req_buf, "push-cert%c%s", 0, cap_string);
	for (cp = cert.buf; cp < cert.buf + cert.len; cp = np) {
		np = next_line(cp, cert.buf + cert.len - cp);
		packet_buf_write(req_buf,
				 "%.*s", (int)(np - cp), cp);
	}
	packet_buf_write(req_buf, "push-cert-end\n");

free_return:
	free(signing_key);
	strbuf_release(&cert);
	return update_seen;
}


static int atomic_push_failure(struct send_pack_args *args,
			       struct ref *remote_refs,
			       struct ref *failing_ref)
{
	struct ref *ref;
	/* Mark other refs as failed */
	for (ref = remote_refs; ref; ref = ref->next) {
		if (!ref->peer_ref && !args->send_mirror)
			continue;

		switch (ref->status) {
		case REF_STATUS_EXPECTING_REPORT:
			ref->status = REF_STATUS_ATOMIC_PUSH_FAILED;
			continue;
		default:
			break; /* do nothing */
		}
	}
	return error("atomic push failed for ref %s. status: %d\n",
		     failing_ref->name, failing_ref->status);
}

#define NONCE_LEN_LIMIT 256

static void reject_invalid_nonce(const char *nonce, int len)
{
	int i = 0;

	if (NONCE_LEN_LIMIT <= len)
		die("the receiving end asked to sign an invalid nonce <%.*s>",
		    len, nonce);

	for (i = 0; i < len; i++) {
		int ch = nonce[i] & 0xFF;
		if (isalnum(ch) ||
		    ch == '-' || ch == '.' ||
		    ch == '/' || ch == '+' ||
		    ch == '=' || ch == '_')
			continue;
		die("the receiving end asked to sign an invalid nonce <%.*s>",
		    len, nonce);
	}
}

int send_pack(struct send_pack_args *args,
	      int fd[], struct child_process *conn,
	      struct ref *remote_refs,
	      struct sha1_array *extra_have)
{
	int in = fd[0];
	int out = fd[1];
	struct strbuf req_buf = STRBUF_INIT;
	struct strbuf cap_buf = STRBUF_INIT;
	struct ref *ref;
	int need_pack_data = 0;
	int allow_deleting_refs = 0;
	int status_report = 0;
	int use_sideband = 0;
	int quiet_supported = 0;
	int agent_supported = 0;
	int use_atomic = 0;
	int atomic_supported = 0;
	unsigned cmds_sent = 0;
	int ret;
	struct async demux;
	const char *push_cert_nonce = NULL;

	/* Does the other end support the reporting? */
	if (server_supports("report-status"))
		status_report = 1;
	if (server_supports("delete-refs"))
		allow_deleting_refs = 1;
	if (server_supports("ofs-delta"))
		args->use_ofs_delta = 1;
	if (server_supports("side-band-64k"))
		use_sideband = 1;
	if (server_supports("quiet"))
		quiet_supported = 1;
	if (server_supports("agent"))
		agent_supported = 1;
	if (server_supports("no-thin"))
		args->use_thin_pack = 0;
	if (server_supports("atomic"))
		atomic_supported = 1;
	if (args->push_cert) {
		int len;

		push_cert_nonce = server_feature_value("push-cert", &len);
		if (!push_cert_nonce)
			die(_("the receiving end does not support --signed push"));
		reject_invalid_nonce(push_cert_nonce, len);
		push_cert_nonce = xmemdupz(push_cert_nonce, len);
	}

	if (!remote_refs) {
		fprintf(stderr, "No refs in common and none specified; doing nothing.\n"
			"Perhaps you should specify a branch such as 'master'.\n");
		return 0;
	}
	if (args->atomic && !atomic_supported)
		die(_("the receiving end does not support --atomic push"));

	use_atomic = atomic_supported && args->atomic;

	if (status_report)
		strbuf_addstr(&cap_buf, " report-status");
	if (use_sideband)
		strbuf_addstr(&cap_buf, " side-band-64k");
	if (quiet_supported && (args->quiet || !args->progress))
		strbuf_addstr(&cap_buf, " quiet");
	if (use_atomic)
		strbuf_addstr(&cap_buf, " atomic");
	if (agent_supported)
		strbuf_addf(&cap_buf, " agent=%s", git_user_agent_sanitized());

	/*
	 * NEEDSWORK: why does delete-refs have to be so specific to
	 * send-pack machinery that set_ref_status_for_push() cannot
	 * set this bit for us???
	 */
	for (ref = remote_refs; ref; ref = ref->next)
		if (ref->deletion && !allow_deleting_refs)
			ref->status = REF_STATUS_REJECT_NODELETE;

	if (!args->dry_run)
		advertise_shallow_grafts_buf(&req_buf);

	if (!args->dry_run && args->push_cert)
		cmds_sent = generate_push_cert(&req_buf, remote_refs, args,
					       cap_buf.buf, push_cert_nonce);

	/*
	 * Clear the status for each ref and see if we need to send
	 * the pack data.
	 */
	for (ref = remote_refs; ref; ref = ref->next) {
		switch (check_to_send_update(ref, args)) {
		case 0: /* no error */
			break;
		case CHECK_REF_STATUS_REJECTED:
			/*
			 * When we know the server would reject a ref update if
			 * we were to send it and we're trying to send the refs
			 * atomically, abort the whole operation.
			 */
			if (use_atomic)
				return atomic_push_failure(args, remote_refs, ref);
			/* Fallthrough for non atomic case. */
		default:
			continue;
		}
		if (!ref->deletion)
			need_pack_data = 1;

		if (args->dry_run || !status_report)
			ref->status = REF_STATUS_OK;
		else
			ref->status = REF_STATUS_EXPECTING_REPORT;
	}

	/*
	 * Finally, tell the other end!
	 */
	for (ref = remote_refs; ref; ref = ref->next) {
		char *old_hex, *new_hex;

		if (args->dry_run || args->push_cert)
			continue;

		if (check_to_send_update(ref, args) < 0)
			continue;

		old_hex = sha1_to_hex(ref->old_sha1);
		new_hex = sha1_to_hex(ref->new_sha1);
		if (!cmds_sent) {
			packet_buf_write(&req_buf,
					 "%s %s %s%c%s",
					 old_hex, new_hex, ref->name, 0,
					 cap_buf.buf);
			cmds_sent = 1;
		} else {
			packet_buf_write(&req_buf, "%s %s %s",
					 old_hex, new_hex, ref->name);
		}
	}

	if (args->stateless_rpc) {
		if (!args->dry_run && (cmds_sent || is_repository_shallow())) {
			packet_buf_flush(&req_buf);
			send_sideband(out, -1, req_buf.buf, req_buf.len, LARGE_PACKET_MAX);
		}
	} else {
		write_or_die(out, req_buf.buf, req_buf.len);
		packet_flush(out);
	}
	strbuf_release(&req_buf);
	strbuf_release(&cap_buf);

	if (use_sideband && cmds_sent) {
		memset(&demux, 0, sizeof(demux));
		demux.proc = sideband_demux;
		demux.data = fd;
		demux.out = -1;
		if (start_async(&demux))
			die("send-pack: unable to fork off sideband demultiplexer");
		in = demux.out;
	}

	if (need_pack_data && cmds_sent) {
		if (pack_objects(out, remote_refs, extra_have, args) < 0) {
			for (ref = remote_refs; ref; ref = ref->next)
				ref->status = REF_STATUS_NONE;
			if (args->stateless_rpc)
				close(out);
			if (git_connection_is_socket(conn))
				shutdown(fd[0], SHUT_WR);
			if (use_sideband)
				finish_async(&demux);
			fd[1] = -1;
			return -1;
		}
		if (!args->stateless_rpc)
			/* Closed by pack_objects() via start_command() */
			fd[1] = -1;
	}
	if (args->stateless_rpc && cmds_sent)
		packet_flush(out);

	if (status_report && cmds_sent)
		ret = receive_status(in, remote_refs);
	else
		ret = 0;
	if (args->stateless_rpc)
		packet_flush(out);

	if (use_sideband && cmds_sent) {
		if (finish_async(&demux)) {
			error("error in sideband demultiplexer");
			ret = -1;
		}
		close(demux.out);
	}

	if (ret < 0)
		return ret;

	if (args->porcelain)
		return 0;

	for (ref = remote_refs; ref; ref = ref->next) {
		switch (ref->status) {
		case REF_STATUS_NONE:
		case REF_STATUS_UPTODATE:
		case REF_STATUS_OK:
			break;
		default:
			return -1;
		}
	}
	return 0;
}
