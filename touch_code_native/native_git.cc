/**
 * @createTime 2015-05-30
 * @author louis.tru <louistru@live.com>
 * @copyright © 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#include <node.h>
#include <async-wrap.h>
#include <async-wrap-inl.h>
#include <env.h>
#include <env-inl.h>
#include <util.h>
#include <tr/util.h>
#include <tr/fs.h>
#include <tr/handle.h>
#include <svn_client.h>
#include <tr/exception.h>
#include <thread>
#include <mutex>
#include <node_context.h>
#include "native_util.h"

using namespace node;
using namespace v8;

T_Ns(tc);

static void InitNativeGit(Handle<Object> target, Handle<Value> unused,
                          Handle<Context> context, void* priv) {
//  Environment* env = Environment::GetCurrent(context);
//  Local<FunctionTemplate> svn = FunctionTemplate::New(env->isolate(), Subversion::New);
//  svn->InstanceTemplate()->SetInternalFieldCount(1);
//  NODE_SET_PROTOTYPE_METHOD(svn, "release", Subversion::Release);
//  NODE_SET_PROTOTYPE_METHOD(svn, "set_user", Subversion::Set_user);
//  NODE_SET_PROTOTYPE_METHOD(svn, "set_passwd", Subversion::Set_passwd);
//  NODE_SET_PROTOTYPE_METHOD(svn, "user", Subversion::User);
//  NODE_SET_PROTOTYPE_METHOD(svn, "passwd", Subversion::Passwd);
//  NODE_SET_PROTOTYPE_METHOD(svn, "add", Subversion::Add);
//  NODE_SET_PROTOTYPE_METHOD(svn, "checkout", Subversion::Checkout);
//  NODE_SET_PROTOTYPE_METHOD(svn, "cleanup", Subversion::Cleanup);
//  NODE_SET_PROTOTYPE_METHOD(svn, "commit", Subversion::Commit);
//  NODE_SET_PROTOTYPE_METHOD(svn, "remove", Subversion::Remove);
//  NODE_SET_PROTOTYPE_METHOD(svn, "merge", Subversion::Merge);
//  NODE_SET_PROTOTYPE_METHOD(svn, "rename", Subversion::Rename);
//  NODE_SET_PROTOTYPE_METHOD(svn, "resolved", Subversion::Resolved);
//  NODE_SET_PROTOTYPE_METHOD(svn, "revert", Subversion::Revert);
//  NODE_SET_PROTOTYPE_METHOD(svn, "status", Subversion::Status);
//  NODE_SET_PROTOTYPE_METHOD(svn, "stat_code", Subversion::Stat_code);
//  NODE_SET_PROTOTYPE_METHOD(svn, "unlock", Subversion::Unlock);
//  NODE_SET_PROTOTYPE_METHOD(svn, "update", Subversion::Update);
//  NODE_SET_PROTOTYPE_METHOD(svn, "conflict_list", Subversion::Conflict_list);
//  NODE_SET_PROTOTYPE_METHOD(svn, "test", Subversion::Test);
//  NODE_SET_PROTOTYPE_METHOD(svn, "cancel", Subversion::Cancel);
//  NODE_SET_PROTOTYPE_METHOD(svn, "onconsole_log_handle", Subversion::Noop);
//  target->Set(FIXED_ONE_BYTE_STRING(env->isolate(), "Subversion"), svn->GetFunction());
}

TEnd

NODE_MODULE_CONTEXT_AWARE_BUILTIN(native_git, tc::InitNativeGit);
