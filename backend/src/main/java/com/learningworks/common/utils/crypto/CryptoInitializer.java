package com.learningworks.common.utils.crypto;

import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CryptoInitializer {
  public CryptoInitializer(@Value("${app.crypto.aes-key:}") String aesKey) {
    byte[] keyBytes = CryptoInitializer.decodeKey(aesKey);
    CryptoHolder.initialize(new AesCipher(keyBytes));
  }

  private static byte[] decodeKey(String aesKey) {
    if (aesKey == null || aesKey.isBlank()) {
      throw new IllegalStateException(
          "app.crypto.aes-key 가 설정되지 않았습니다. 환경변수 APP_CRYPTO_AESKEY 를 확인하세요.");
    }
    try {
      return Base64.getDecoder().decode(aesKey.trim());
    } catch (IllegalArgumentException e) {
      throw new IllegalStateException("app.crypto.aes-key 가 Base64 형식이 아닙니다.", e);
    }
  }

}
