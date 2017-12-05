
#include <tesla/util.h>
#include <tesla/handle.h>
#include <tesla/json.h>
#include <tesla/fs.h>
#include <svn_client.h>
#include <apr.h>

TSUse

svn_error_t* svn_auth_plaintext_prompt(svn_boolean_t* may_save_plaintext,
                                       ccharp realmstring,
                                       void* baton,
                                       apr_pool_t* pool) {
  *may_save_plaintext = false;
  return SVN_NO_ERROR;
}

svn_error_t* svn_auth_simple_prompt(svn_auth_cred_simple_t** cred,
                                    voidp baton, ccharp realm,
                                    ccharp username,
                                    svn_boolean_t may_save,
                                    apr_pool_t* pool){
  svn_auth_cred_simple_t* ret =
    (svn_auth_cred_simple_t*)apr_pcalloc(pool, sizeof(*ret));
  ret->username = apr_pstrdup(pool, "louischu");
  ret->password = apr_pstrdup(pool, "Alsk106612");
  ret->may_save = true;
  *cred = ret;
  return SVN_NO_ERROR;
}

svn_error_t* svn_auth_username_prompt(svn_auth_cred_username_t** cred,
                                      voidp baton,
                                      ccharp realm,
                                      svn_boolean_t may_save,
                                      apr_pool_t* pool){
  svn_auth_cred_username_t* ret =
    (svn_auth_cred_username_t*)apr_pcalloc(pool, sizeof(*ret));
  ret->username = apr_pstrdup(pool, "louischu");
  ret->may_save = false;
  *cred = ret;
  return SVN_NO_ERROR;
}

svn_error_t * svn_auth_ssl_server_trust_prompt(svn_auth_cred_ssl_server_trust_t** cred,
                                               voidp baton,
                                               ccharp realm,
                                               apr_uint32_t failures,
                                               const svn_auth_ssl_server_cert_info_t* cert_info,
                                               svn_boolean_t may_save,
                                               apr_pool_t* pool){
  svn_auth_cred_ssl_server_trust_t* ret =
    (svn_auth_cred_ssl_server_trust_t*)apr_pcalloc(pool, sizeof(**cred));
  ret->may_save = false;
  ret->accepted_failures = failures;
  *cred = ret;
  return SVN_NO_ERROR;
}

svn_error_t* svn_auth_ssl_client_cert_prompt(svn_auth_cred_ssl_client_cert_t** cred,
                                             voidp baton,
                                             ccharp realm,
                                             svn_boolean_t may_save,
                                             apr_pool_t* pool){
  svn_auth_cred_ssl_client_cert_t* ret =
    (svn_auth_cred_ssl_client_cert_t*)apr_pcalloc(pool, sizeof(**cred));
  ret->cert_file = apr_pstrdup(pool, "");
  ret->may_save = false;
  *cred = ret;
  return SVN_NO_ERROR;
}

svn_error_t* svn_auth_ssl_client_cert_pw_prompt(svn_auth_cred_ssl_client_cert_pw_t** cred,
                                                voidp baton,
                                                ccharp realm,
                                                svn_boolean_t may_save,
                                                apr_pool_t* pool){
  svn_auth_cred_ssl_client_cert_pw_t* ret =
    (svn_auth_cred_ssl_client_cert_pw_t*)apr_pcalloc(pool, sizeof(*ret));
  ret->password = apr_pstrdup(pool, "");
  ret->may_save = false;
  *cred = ret;
  return SVN_NO_ERROR;
}

void test_svn() {
  
  svn_error_t* err;
  svn_revnum_t rev;
  ts::String config_dir = FilePath::document_dir() + ".subversion";
//  ccharp url = "http://mooogame.com:81/svn/TeIDE/trunk/server";
//  ts::String path = FilePath::document_dir() + "TeIDE/server";
  ccharp url = "https://svnchina.com/svn/kennyproject/trunk/DebugKit/DebugKit";
  ts::String path = FilePath::document_dir() + "DebugKit";
//  ccharp url = "https://svn.code.sf.net/p/tortoisesvn/code/trunk/www";
//  ts::String path = FilePath::document_dir() + "tortoisesvn/www";
//  ccharp url = "http://svn.webkit.org/repository/webkit/trunk/LayoutTests/fast/events/touch";
//  ts::String path = FilePath::document_dir() + "LayoutTests";
  
  apr_pool_t* pool;
  apr_pool_initialize();
  apr_pool_create_core(&pool);
  
  svn_client_ctx_t* ctx;
  
  err = svn_client_create_context2(&ctx, apr_hash_make(pool), pool);
  
  svn_auth_provider_object_t* provider;
  svn_auth_baton_t* auth_baton;
  
  apr_array_header_t* providers = apr_array_make(pool, 13, sizeof(svn_auth_provider_object_t*));
  
  svn_auth_get_simple_provider2(&provider, svn_auth_plaintext_prompt, NULL, pool); //
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  svn_auth_get_username_provider(&provider, pool);
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  
  svn_auth_get_ssl_server_trust_file_provider(&provider, pool);
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  svn_auth_get_ssl_client_cert_file_provider(&provider, pool);
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  svn_auth_get_ssl_client_cert_pw_file_provider2(&provider, svn_auth_plaintext_prompt, NULL, pool);
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  
  svn_auth_get_simple_prompt_provider(&provider, svn_auth_simple_prompt, NULL, 3, pool); //
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  svn_auth_get_username_prompt_provider(&provider, svn_auth_username_prompt, NULL, 3, pool);
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  
  svn_auth_get_ssl_server_trust_prompt_provider(&provider, svn_auth_ssl_server_trust_prompt, NULL, pool);
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  svn_auth_get_ssl_client_cert_prompt_provider(&provider, svn_auth_ssl_client_cert_prompt, NULL, 2, pool);
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  svn_auth_get_ssl_client_cert_pw_prompt_provider(&provider, svn_auth_ssl_client_cert_pw_prompt, NULL, 2, pool);
  APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
  
  svn_auth_open(&auth_baton, providers, pool);
  
  svn_auth_set_parameter(auth_baton, SVN_AUTH_PARAM_CONFIG_DIR, *config_dir);
  svn_auth_set_parameter(auth_baton, SVN_AUTH_PARAM_NON_INTERACTIVE, "");
  svn_auth_set_parameter(auth_baton, SVN_AUTH_PARAM_DEFAULT_USERNAME, apr_pstrdup(pool, "louischu"));
  svn_auth_set_parameter(auth_baton, SVN_AUTH_PARAM_DEFAULT_PASSWORD, apr_pstrdup(pool, "Alsk106612"));
  
  ctx->auth_baton = auth_baton;
  
  svn_opt_revision_t peg_revision = { svn_opt_revision_head };
  svn_opt_revision_t revision = { svn_opt_revision_head };
  
  err = svn_client_checkout3(&rev,
                             url,
                             *path,
                             &peg_revision,
                             &revision,
                             svn_depth_unknown,
                             true,
                             false,
                             ctx,
                             pool);
  
//  apr_array_header_t* result_revs;
//  apr_array_header_t* paths = apr_array_make (pool, 1, sizeof(ccharp));
//  APR_ARRAY_PUSH(paths, ccharp) = *path;
//  
//  err = svn_client_update4(&result_revs,
//                           paths,
//                           &revision,
//                           svn_depth_unknown,
//                           true, true, false, false, false,
//                           ctx,
//                           pool);
  
  if(err){
    TSLog("%s", err->message);
  }
  
  apr_pool_destroy(pool);
}

