// Subversion.cpp

#include "StdAfx.h"
#include "Subversion.h"
#include <svn_path.h>

///////////////////////////////////////////////////////////////////////////

Subversion::Subversion()
: inited_(false)
, allocator_(NULL)
, pool_(NULL)
, ctx_(NULL)
{
}

Subversion::~Subversion()
{
  Uninitialize();
}

///////////////////////////////////////////////////////////////////////////

bool Subversion::Initialize()
{
  if ( ! inited_)
    {
    apr_status_t status = apr_pool_initialize();
    if (status != APR_SUCCESS)
      {
      std::cerr << "apr_pool_initialize() failed!" << std::endl;
      return false;
      }
    inited_ = true;
    }
  
  if ( ! allocator_)
    {
    apr_status_t status = apr_allocator_create(&allocator_);
    if (status != APR_SUCCESS)
      {
      std::cerr << "apr_allocator_create() failed!" << std::endl;
      return false;
      }
    }
  
  if ( ! pool_)
    {
    pool_ = svn_pool_create(NULL);
    if ( ! pool_)
      {
      std::cerr << "svn_pool_create() failed!" << std::endl;
      return false;
      }
    }
  
  if ( ! ctx_)
    {
    svn_error_t* e = svn_client_create_context(&ctx_, pool_);
    if (e)
      {
      std::cerr << "svn_client_create_context() failed! " << e->message << std::endl;
      svn_error_clear(e);
      return false;
      }
    
    e = svn_config_ensure(NULL, pool_);
    if (e)
      {
      std::cerr << "svn_config_ensure() failed! " << e->message << std::endl;
      svn_error_clear(e);
      return false;
      }
    
    e = svn_config_get_config(&ctx_->config, NULL, pool_);
    if (e)
      {
      std::cerr << "svn_config_get_config() failed! " << e->message << std::endl;
      svn_error_clear(e);
      return false;
      }
    
    svn_auth_provider_object_t* provider;
    apr_array_header_t* providers = apr_array_make(pool_, 13, sizeof(svn_auth_provider_object_t*));
    svn_config_t* cfg_config = static_cast<svn_config_t*>(apr_hash_get(ctx_->config, SVN_CONFIG_CATEGORY_CONFIG, APR_HASH_KEY_STRING));
    svn_auth_get_platform_specific_client_providers(&providers, cfg_config, pool_);
    
    svn_auth_get_simple_provider2(&provider, svn_auth_plaintext_prompt, this, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    svn_auth_get_username_provider(&provider, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    
    svn_auth_get_platform_specific_provider(&provider, "windows", "ssl_server_trust", pool_);
    if (provider)
      APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    svn_auth_get_ssl_server_trust_file_provider(&provider, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    svn_auth_get_ssl_client_cert_file_provider (&provider, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    svn_auth_get_ssl_client_cert_pw_file_provider2(&provider, svn_auth_plaintext_passphrase_prompt, this, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    
    svn_auth_get_simple_prompt_provider(&provider, (svn_auth_simple_prompt_func_t)simpleprompt, this, 3, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    svn_auth_get_username_prompt_provider(&provider, (svn_auth_username_prompt_func_t)userprompt, this, 3, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    
    svn_auth_get_ssl_server_trust_prompt_provider(&provider, sslserverprompt, this, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    svn_auth_get_ssl_client_cert_prompt_provider (&provider, sslclientprompt, this, 2, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    svn_auth_get_ssl_client_cert_pw_prompt_provider (&provider, sslpwprompt, this, 2, pool_);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    
    svn_auth_open(&auth_baton_, providers, pool_);
    ctx_->auth_baton = auth_baton_;
    }
  return true;
}

void Subversion::Uninitialize()
{
  if (pool_)
    {
    svn_pool_destroy(pool_);
    pool_ = NULL;
    }
  
  if (allocator_)
    {
    apr_allocator_destroy(allocator_);
    allocator_ = NULL;
    }
  
  if (inited_)
    {
    apr_pool_terminate();
    inited_ = false;
    }
}

///////////////////////////////////////////////////////////////////////////

bool Subversion::Info(const std::string& url_or_path)
{
  std::cout << "Subversion::Info(\"" << url_or_path << "\")" << std::endl;
  
  std::string path = url_or_path;
  
  if (svn_path_is_url(path.c_str()))
    {
    path = svn_path_uri_from_iri(path.c_str(), pool_);
    path = svn_path_uri_autoescape(path.c_str(), pool_);
    if ( ! svn_path_is_uri_safe(path.c_str()))
      {
      std::cerr << "path is invalid! " << url_or_path << std::endl;
      return false;
      }
    if (svn_path_is_backpath_present(path.c_str()))
      {
      std::cerr << "path contains a '..'! " << url_or_path << std::endl;
      return false;
      }
    }
  else
    {
    path = svn_path_internal_style(path.c_str(), pool_);
    }
  path = svn_path_canonicalize(path.c_str(), pool_);
  
  svn_opt_revision_t peg_revision = { svn_opt_revision_head };
  svn_opt_revision_t revision = { svn_opt_revision_head };
  svn_error_t* e = svn_client_info2(path.c_str(), &peg_revision, &revision, InfoReceiver, this, svn_depth_empty, NULL, ctx_, pool_);
  if (e)
    {
    std::cerr << "svn_client_info2() failed! " << e->message << std::endl;
    svn_error_clear(e);
    return false;
    }
  return true;
}

svn_error_t* Subversion::InfoReceiver(void*, const char* path, const svn_info_t* info, apr_pool_t*)
{
  std::cout << "Info result:" << std::endl;
  std::cout << "  Path: " << path                 << std::endl;
  std::cout << "  URL: "  << info->URL            << std::endl;
  std::cout << "  Root: " << info->repos_root_URL << std::endl;
  std::cout << "  Rev: "  << info->rev            << std::endl;
  std::cout << "  Node: " << info->kind           << std::endl;
  std::cout << "  Uuid: " << info->repos_UUID     << std::endl;
  std::cout << "  Last Rev: "    << info->last_changed_rev    << std::endl;
  std::cout << "  Last Date: "   << info->last_changed_date   << std::endl;
  std::cout << "  Last Author: " << info->last_changed_author << std::endl;
  
  std::cout << "  Depth: " << info->depth << std::endl;
  return NULL;
}

bool Subversion::GetRootUrl(const std::string& url_or_path, std::string& rootUrl)
{
  std::cout << "Subversion::GetRootUrl(\"" << url_or_path << "\")" << std::endl;
  
  svn_error_t* e = svn_client_info2(url_or_path.c_str(), NULL, NULL, InfoReceiverForRootUrl, &rootUrl, svn_depth_empty, NULL, ctx_, pool_);
  if (e)
    {
    std::cerr << "svn_client_info2() failed! " << e->message << std::endl;
    svn_error_clear(e);
    return false;
    }
  return true;
}

svn_error_t* Subversion::InfoReceiverForRootUrl(void* baton, const char*, const svn_info_t* info, apr_pool_t*)
{
  std::string* rootUrl = reinterpret_cast<std::string*>(baton);
  *rootUrl = info->repos_root_URL;
  return NULL;
}

svn_error_t* svn_client_list_func(void* baton, const char* path, const svn_dirent_t* /*dirent*/, const svn_lock_t* /*lock*/, const char* /*abs_path*/, apr_pool_t* /*pool*/)
{
  std::vector<std::string>& files = *reinterpret_cast<std::vector<std::string>*>(baton);
  files.push_back(path);
#if 0
  std::cout << "List Result:" << std::endl;
  std::cout << "  path: " << path << std::endl;
  std::cout << "  dirent->kind: " << dirent->kind << std::endl;
  std::cout << "  dirent->size: " << dirent->size << std::endl;
  std::cout << "  dirent->has_props: " << dirent->has_props << std::endl;
  std::cout << "  dirent->created_rev: " << dirent->created_rev << std::endl;
  std::cout << "  dirent->time: " << dirent->time << std::endl;
  std::cout << "  dirent->last_author: " << dirent->last_author << std::endl;
  std::cout << "  abs_path: " << abs_path << std::endl;
#endif
  return NULL;
}

bool Subversion::ListFiles(const std::string& path, std::vector<std::string>& files)
{
  std::cout << "List: " << path << std::endl;
  svn_opt_revision_t peg_revision = { svn_opt_revision_head };
  svn_opt_revision_t revision = { svn_opt_revision_head };
  svn_error_t* e = svn_client_list2(path.c_str(), &peg_revision, &revision, svn_depth_immediates, SVN_DIRENT_ALL, FALSE, svn_client_list_func, &files, ctx_, pool_);
  if (e)
    {
    std::cerr << "svn_client_list2() failed! " << e->message << std::endl;
    svn_error_clear(e);
    return false;
    }
  return true;
}

bool Subversion::ExportFile(const std::string& remoteFile, const std::string& localFile)
{
  std::cout << "Export: " << remoteFile << std::endl;
  std::cout << "    to: " << localFile << std::endl;
  
  svn_opt_revision_t peg_revision = { svn_opt_revision_head };
  svn_opt_revision_t revision = { svn_opt_revision_head };
  svn_revnum_t rev;
  svn_error_t* e = svn_client_export4(&rev, remoteFile.c_str(), localFile.c_str(), &peg_revision, &revision, TRUE, TRUE, svn_depth_immediates, NULL, ctx_, pool_);
  if (e)
    {
    std::cerr << "svn_client_export4() failed! " << e->message << std::endl;
    svn_error_clear(e);
    return false;
    }
  return true;
}

struct log_msg_baton3
{
  const char* message;  /* the message. */
  const char* message_encoding; /* the locale/encoding of the message. */
  const char* base_dir; /* the base directory for an external edit. UTF-8! */
  const char* tmpfile_left; /* the tmpfile left by an external edit. UTF-8! */
  apr_pool_t* pool; /* a pool. */
};

svn_error_t* GetLogMessage(const char** log_msg, const char** tmp_file, const apr_array_header_t* /*commit_items*/, void* baton, apr_pool_t* pool)
{
  log_msg_baton3* lmb = (log_msg_baton3*)baton;
  *tmp_file = NULL;
  if (lmb->message)
    {
    *log_msg = apr_pstrdup(pool, lmb->message);
    }
  return SVN_NO_ERROR;
}

bool Subversion::ImportFile(const std::string& localFile, const std::string& remoteFile, const std::string& message)
{
  std::cout << "Import: " << localFile << std::endl;
  std::cout << "    to: " << remoteFile << std::endl;
  
  svn_commit_info_t* commit_info = svn_create_commit_info(pool_);
  
  log_msg_baton3* baton = (log_msg_baton3*)apr_palloc(pool_, sizeof(log_msg_baton3));
  baton->message = apr_pstrdup(pool_, message.c_str());
  baton->base_dir = "";
  baton->message_encoding = NULL;
  baton->tmpfile_left = NULL;
  baton->pool = pool_;
  ctx_->log_msg_baton3 = baton;
  ctx_->log_msg_func3 = GetLogMessage;
  
  svn_error_t* e = svn_client_import3(&commit_info, localFile.c_str(), remoteFile.c_str(), svn_depth_immediates, TRUE, FALSE, NULL, ctx_, pool_);
  if (e)
    {
    std::cerr << "svn_client_import3() failed! " << e->message << std::endl;
    svn_error_clear(e);
    return false;
    }
  return true;
}

bool Subversion::CheckOut(const std::string& url, const std::string& localPath)
{
  std::cout << "Check Out: " << url << std::endl;
  std::cout << "       to: " << localPath << std::endl;
  
  svn_opt_revision_t peg_revision = { svn_opt_revision_head };
  svn_opt_revision_t revision = { svn_opt_revision_head };
  svn_error_t* e = svn_client_checkout3(NULL, url.c_str(), localPath.c_str(), &peg_revision, &revision, svn_depth_files, TRUE, FALSE, ctx_, pool_);
  if (e)
    {
    std::cerr << "svn_client_checkout() failed! " << e->message << std::endl;
    svn_error_clear(e);
    return false;
    }
  return true;
}

bool Subversion::Commit(const std::vector<std::string>& files, const std::string& message)
{
  std::cout << "Commit:" << std::endl;
  for (size_t i = 0; i < files.size(); i++)
    {
    std::cout << "    " << files[i] << std::endl;
    }
  
  svn_commit_info_t* commit_info = svn_create_commit_info(pool_);
  
  log_msg_baton3* baton = (log_msg_baton3*)apr_palloc(pool_, sizeof(log_msg_baton3));
  baton->message = apr_pstrdup(pool_, message.c_str());
  baton->base_dir = "";
  baton->message_encoding = NULL;
  baton->tmpfile_left = NULL;
  baton->pool = pool_;
  ctx_->log_msg_baton3 = baton;
  ctx_->log_msg_func3 = GetLogMessage;
  
  apr_array_header_t* targets = apr_array_make(pool_, static_cast<int>(files.size()), sizeof(const char*));
  for (size_t i = 0; i < files.size(); i++)
    {
    ((const char**)apr_array_push(targets))[i] = files[i].c_str();
    }
  
  svn_error_t* e = svn_client_commit4(&commit_info, targets, svn_depth_files, FALSE, FALSE, NULL, NULL, ctx_, pool_);
  if (e)
    {
    std::cerr << "svn_client_commit4() failed! " << e->message << std::endl;
    svn_error_clear(e);
    return false;
    }
  return true;
}

///////////////////////////////////////////////////////////////////////////

const svn_version_t* Subversion::Version()
{
  return svn_client_version();
}

std::ostream& operator << (std::ostream& os, const svn_version_t* version)
{
  return (os << version->major << "." << version->minor << "." << version->patch << version->tag);
}

std::ostream& operator << (std::ostream& os, svn_node_kind_t kind)
{
  switch (kind)
  {
    default:
    case svn_node_unknown: return (os << "svn_node_unknown (" << static_cast<int>(kind) << ")");
    case svn_node_none: return (os << "svn_node_none");
    case svn_node_file: return (os << "svn_node_file");
    case svn_node_dir:  return (os << "svn_node_dir");
  }
}

///////////////////////////////////////////////////////////////////////////

svn_error_t* Subversion::svn_auth_plaintext_prompt(svn_boolean_t* may_save_plaintext, const char* /*realmstring*/, void* /*baton*/, apr_pool_t* /*pool*/)
{
  // we allow saving plaintext passwords without asking the user. The reason is simple:
  // TSVN requires at least Win2k, which means the password is always stored encrypted because
  // the corresponding APIs are available.
  // If for some unknown reason it wouldn't be possible to save the passwords encrypted,
  // most users wouldn't know what to do anyway so asking them would just confuse them.
  *may_save_plaintext = true;
  return SVN_NO_ERROR;
}

svn_error_t* Subversion::sslpwprompt(svn_auth_cred_ssl_client_cert_pw_t** cred, void* baton, const char* /*realm*/, svn_boolean_t /*may_save*/, apr_pool_t* pool)
{
  Subversion* svn = reinterpret_cast<Subversion*>(baton);
  svn_auth_cred_ssl_client_cert_pw_t* ret = (svn_auth_cred_ssl_client_cert_pw_t*)apr_pcalloc(pool, sizeof(*ret));
  ret->password = apr_pstrdup(svn->pool_, "");
  ret->may_save = false;
  *cred = ret;
  return SVN_NO_ERROR;
}

svn_error_t* Subversion::sslclientprompt(svn_auth_cred_ssl_client_cert_t** cred, void* baton, const char* /*realm*/, svn_boolean_t /*may_save*/, apr_pool_t* /*pool*/)
{
  Subversion* svn = (Subversion*)baton;
  const char* cert_file = NULL;
  *cred = (svn_auth_cred_ssl_client_cert_t*)apr_pcalloc(svn->pool_, sizeof (**cred));
  cert_file = apr_pstrdup(svn->pool_, "");
  (*cred)->cert_file = cert_file;
  (*cred)->may_save = false;
  return SVN_NO_ERROR;
}

svn_error_t* Subversion::sslserverprompt(svn_auth_cred_ssl_server_trust_t** cred_p, void* /*baton*/, const char* /*realm*/, apr_uint32_t /*failures*/, const svn_auth_ssl_server_cert_info_t* /*cert_info*/, svn_boolean_t /*may_save*/, apr_pool_t* pool)
{
  *cred_p = (svn_auth_cred_ssl_server_trust_t*)apr_pcalloc (pool, sizeof (**cred_p));
  (*cred_p)->may_save = FALSE;
  return SVN_NO_ERROR;
}

svn_error_t* Subversion::userprompt(svn_auth_cred_username_t** cred, void* baton, const char* /*realm*/, svn_boolean_t /*may_save*/, apr_pool_t* pool)
{
  Subversion* svn = (Subversion*)baton;
  svn_auth_cred_username_t* ret = (svn_auth_cred_username_t*)apr_pcalloc (pool, sizeof (*ret));
  std::string username = "user";
  ret->username = apr_pstrdup(svn->pool_, username.c_str());
  ret->may_save = false;
  *cred = ret;
  return SVN_NO_ERROR;
}

svn_error_t* Subversion::simpleprompt(svn_auth_cred_simple_t** cred, void* baton, const char* /*realm*/, const char* /*username*/, svn_boolean_t /*may_save*/, apr_pool_t* pool)
{
  Subversion* svn = (Subversion*)baton;
  svn_auth_cred_simple_t* ret = (svn_auth_cred_simple_t*)apr_pcalloc (pool, sizeof (*ret));
  std::string theUsername = "user";
  std::string password = "pass";
  ret->username = apr_pstrdup(svn->pool_, theUsername.c_str());
  ret->password = apr_pstrdup(svn->pool_, password.c_str());
  ret->may_save = false;
  *cred = ret;
  return SVN_NO_ERROR;
}

svn_error_t* Subversion::svn_auth_plaintext_passphrase_prompt(svn_boolean_t* may_save_plaintext, const char* /*realmstring*/, void* /*baton*/, apr_pool_t* /*pool*/)
{
  *may_save_plaintext = true;
  return SVN_NO_ERROR;
}

///////////////////////////////////////////////////////////////////////////