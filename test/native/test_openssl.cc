
#include <tesla/util.h>
#include <tesla/fs.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <openssl/crypto.h>
#include <openssl/err.h>
#include <openssl/rand.h>
#include <openssl/bn.h>
#include <node_buffer.h>

TSUse

TSNs(test)

//// Base 64 ////

#define base64_encoded_size(size) ((size + 2 - ((size + 2) % 3)) / 3 * 4)


// Doesn't check for padding at the end.  Can be 1-2 bytes over.
static inline size_t base64_decoded_size_fast(size_t size) {
  size_t remainder = size % 4;
  
  size = (size / 4) * 3;
  if (remainder) {
    if (size == 0 && remainder == 1) {
      // special case: 1-byte input cannot be decoded
      size = 0;
    } else {
      // non-padded input, add 1 or 2 extra bytes
      size += 1 + (remainder == 3);
    }
  }
  
  return size;
}

template <typename TypeName>
size_t base64_decoded_size(const TypeName* src, size_t size) {
  if (size == 0)
    return 0;
  
  if (src[size - 1] == '=')
    size--;
  if (size > 0 && src[size - 1] == '=')
    size--;
  
  return base64_decoded_size_fast(size);
}

// supports regular and URL-safe base64
static const int unbase64_table[] =
{ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -2, -1, -1, -2, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, 62, -1, 63,
  52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
  -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, 63,
  -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
};
#define unbase64(x) unbase64_table[(uint8_t)(x)]


template <typename TypeName>
size_t base64_decode(char* buf,
                     size_t len,
                     const TypeName* src,
                     const size_t srcLen) {
  char a, b, c, d;
  char* dst = buf;
  char* dstEnd = buf + len;
  const TypeName* srcEnd = src + srcLen;
  
  while (src < srcEnd && dst < dstEnd) {
    int remaining = srcEnd - src;
    
    while (unbase64(*src) < 0 && src < srcEnd)
      src++, remaining--;
    if (remaining == 0 || *src == '=')
      break;
    a = unbase64(*src++);
    
    while (unbase64(*src) < 0 && src < srcEnd)
      src++, remaining--;
    if (remaining <= 1 || *src == '=')
      break;
    b = unbase64(*src++);
    
    *dst++ = (a << 2) | ((b & 0x30) >> 4);
    if (dst == dstEnd)
      break;
    
    while (unbase64(*src) < 0 && src < srcEnd)
      src++, remaining--;
    if (remaining <= 2 || *src == '=')
      break;
    c = unbase64(*src++);
    
    *dst++ = ((b & 0x0F) << 4) | ((c & 0x3C) >> 2);
    if (dst == dstEnd)
      break;
    
    while (unbase64(*src) < 0 && src < srcEnd)
      src++, remaining--;
    if (remaining <= 3 || *src == '=')
      break;
    d = unbase64(*src++);
    
    *dst++ = ((c & 0x03) << 6) | (d & 0x3F);
  }
  
  return dst - buf;
}

size_t base64_encode(const char* src,
                     size_t slen,
                     char* dst,
                     size_t dlen) {
  // We know how much we'll write, just make sure that there's space.
  assert(dlen >= base64_encoded_size(slen) &&
         "not enough space provided for base64 encode");
  
  dlen = base64_encoded_size(slen);
  
  unsigned a;
  unsigned b;
  unsigned c;
  unsigned i;
  unsigned k;
  unsigned n;
  
  static const char table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  "abcdefghijklmnopqrstuvwxyz"
  "0123456789+/";
  
  i = 0;
  k = 0;
  n = slen / 3 * 3;
  
  while (i < n) {
    a = src[i + 0] & 0xff;
    b = src[i + 1] & 0xff;
    c = src[i + 2] & 0xff;
    
    dst[k + 0] = table[a >> 2];
    dst[k + 1] = table[((a & 3) << 4) | (b >> 4)];
    dst[k + 2] = table[((b & 0x0f) << 2) | (c >> 6)];
    dst[k + 3] = table[c & 0x3f];
    
    i += 3;
    k += 4;
  }
  
  if (n != slen) {
    switch (slen - n) {
      case 1:
        a = src[i + 0] & 0xff;
        dst[k + 0] = table[a >> 2];
        dst[k + 1] = table[(a & 3) << 4];
        dst[k + 2] = '=';
        dst[k + 3] = '=';
        break;
        
      case 2:
        a = src[i + 0] & 0xff;
        b = src[i + 1] & 0xff;
        dst[k + 0] = table[a >> 2];
        dst[k + 1] = table[((a & 3) << 4) | (b >> 4)];
        dst[k + 2] = table[(b & 0x0f) << 2];
        dst[k + 3] = '=';
        break;
    }
  }
  
  return dlen;
}

static size_t hex_encode(const char* src, size_t slen, char* dst, size_t dlen) {
  // We know how much we'll write, just make sure that there's space.
  assert(dlen >= slen * 2 &&
         "not enough space provided for hex encode");
  
  dlen = slen * 2;
  for (uint32_t i = 0, k = 0; k < dlen; i += 1, k += 2) {
    static const char hex[] = "0123456789abcdef";
    uint8_t val = static_cast<uint8_t>(src[i]);
    dst[k + 0] = hex[val >> 4];
    dst[k + 1] = hex[val & 15];
  }
  
  return dlen;
}

//// HEX ////

template <typename TypeName>
unsigned hex2bin(TypeName c) {
  if (c >= '0' && c <= '9')
    return c - '0';
  if (c >= 'A' && c <= 'F')
    return 10 + (c - 'A');
  if (c >= 'a' && c <= 'f')
    return 10 + (c - 'a');
  return static_cast<unsigned>(-1);
}

template <typename TypeName>
size_t hex_decode(char* buf,
                  size_t len,
                  const TypeName* src,
                  const size_t srcLen) {
  size_t i;
  for (i = 0; i < len && i * 2 + 1 < srcLen; ++i) {
    unsigned a = hex2bin(src[i * 2 + 0]);
    unsigned b = hex2bin(src[i * 2 + 1]);
    if (!~a || !~b)
      return i;
    buf[i] = a * 16 + b;
  }
  
  return i;
}

TSEnd

static String private_path(FilePath::document_dir() + "private_pem.txt");
static String public_path(FilePath::document_dir() + "public_pem.txt");

void gen_openssl_gen_key(){
  RSA* rsa = RSA_generate_key(2048, RSA_F4, NULL, NULL);
  
  FILE* priv = fopen(*private_path, "w+");
  FILE* pub = fopen(*public_path, "w+");
  
  //公钥和私钥输出为 PEM 格式：
  PEM_write_RSAPrivateKey(priv, rsa, NULL, NULL, 0, NULL, NULL);
  PEM_write_RSAPublicKey(pub, rsa);
  
  fclose(priv);
  fclose(pub);
  
  RSA_free(rsa);
}

int test_openssl() {
  // 原始明文
  char plain[256]="测试测试,hello123";
  
  // 用来存放密文
  char encrypted[1024];
  
  // 用来存放解密后的明文
  char decrypted[1024];
  
  // -------------------------------------------------------
  // 利用公钥加密明文的过程
  // -------------------------------------------------------
  
  // 打开公钥文件
  FILE* pub_fp = fopen(*public_path, "r");
  if (pub_fp == NULL) {
    printf("failed to open pub_key file %s!\n", *public_path);
    return -1;
  }
  
  // 从文件中读取公钥
  RSA* rsa1 = PEM_read_RSAPublicKey(pub_fp, NULL, NULL, NULL);
  
  // PEM_read_RSAPublicKey(FILE *fp, RSA **x, pem_password_cb *cb, void *u)
  
  if (rsa1 == NULL) {
    printf("unable to read public key!\n");
    return -1;
  }
  
  if (strlen(plain) >= RSA_size(rsa1) - 41) {
    printf("failed to encrypt\n");
    return -1;
  }
  fclose(pub_fp);
  
  // 用公钥加密
  int len = RSA_public_encrypt((int)strlen(plain),
                               (const byte*)plain,
                               (byte*)encrypted, rsa1, RSA_PKCS1_PADDING);
  
//  RSA_public_encrypt(int flen, const unsigned char *from, unsigned char *to, RSA *rsa, int padding)
  
  if (len == -1){
    printf("failed to encrypt\n");
    return -1;
  }
  
  int b64_len = base64_encoded_size(len);
  Data dst(new char[b64_len + 1], b64_len);
  dst[b64_len] = 0;
  test::base64_encode(encrypted, len, *dst, b64_len);

  // 输出加密后的密文
  FileHelper::write(FilePath::document_dir() + "out.txt", dst);
  RSA_free(rsa1);
  
  // -------------------------------------------------------
  // 利用私钥解密密文的过程
  // -------------------------------------------------------
  // 打开私钥文件
  FILE* priv_fp = fopen(*private_path,"r");
  if (priv_fp == NULL) {
    printf("failed to open priv_key file %s!\n", *private_path);
    return -1;
  }
  
  // 从文件中读取私钥
  RSA* rsa2 = PEM_read_RSAPrivateKey(priv_fp, NULL, NULL, NULL);
  if(rsa2 == NULL){
    printf("unable to read private key!\n");
    return -1;
  }
  
  size_t decode_out_len = test::base64_decoded_size_fast(dst.length());
  Handle<char> decode_out = new char[decode_out_len];
  decode_out_len = test::base64_decode(*decode_out, decode_out_len, *dst, dst.length());
  
  // 用私钥解密
  len = RSA_private_decrypt(len, (const byte*)*decode_out,
                            (byte*)decrypted, rsa2, RSA_PKCS1_PADDING);
  if (len == -1) {
    printf("failed to decrypt!\n");
    return -1;
  }
  fclose(priv_fp);
  
  // 输出解密后的明文
  decrypted[len] = 0;
  printf("%s\n",decrypted);
  
  RSA_free(rsa2);
  
  return 0;
}

