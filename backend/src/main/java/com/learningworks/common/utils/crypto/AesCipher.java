package com.learningworks.common.utils.crypto;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import com.learningworks.common.exceptions.CryptoException;

public class AesCipher {

  private static final String ALGORITHM = "AES";
  /**
   * 암호화 알고리즘 / 운용모드(GCM 은 암호화와 함께 인증 태그를 만들어 변조를 탐지) / 패딩 필요없음
   */
  private static final String TRANSFORMATION = "AES/GCM/NoPadding";
  private static final int KEY_LENGTH_BYTE = 32;
  private static final int IV_LENGTH_BYTE = 12;
  private static final int TAG_LENGTH_BIT = 128;
  // Key 의 교체가 필요할 때 구분하기 위해 붙이는 표식
  private static final String VERSION_PREFIX = "v1:";

  private final SecretKey secretKey;
  private final SecureRandom secureRandom;

  public AesCipher(byte[] keyBytes) {
    if (keyBytes == null || keyBytes.length != AesCipher.KEY_LENGTH_BYTE) {
      throw new IllegalArgumentException("AES 키는 " + AesCipher.KEY_LENGTH_BYTE + " 바이트여야 합니다.");
    }
    this.secretKey = new SecretKeySpec(keyBytes, AesCipher.ALGORITHM);
    this.secureRandom = new SecureRandom();
  }

  public String encrypt(String plainText) {
    if (plainText == null) {
      throw new IllegalArgumentException("암호화 할 값이 null 입니다.");
    }

    // IV(Initialization Vector, 초기화 벡터): 같은 키로 같은 평문을 암호화해도 매번 다른 암호문이 나오게 만드는 랜덤 값.
    byte[] iv = new byte[AesCipher.IV_LENGTH_BYTE];
    this.secureRandom.nextBytes(iv);

    try {
      // AES/GCM/NoPadding 방식으로 작동하는 Cipher 객체 생성
      Cipher cipher = Cipher.getInstance(AesCipher.TRANSFORMATION);
      /**
       * Cipher.ENCRYPT_MODE : 암호화 모드 사용 this.secretKey : AES 키
       * GCMParameterSpec(AesCipher.TAG_LENGTH_BIT, iv)) : CGM 설정(128비트)
       */
      cipher.init(Cipher.ENCRYPT_MODE, this.secretKey,
          new GCMParameterSpec(AesCipher.TAG_LENGTH_BIT, iv));
      byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

      byte[] combined =
          ByteBuffer.allocate(iv.length + encrypted.length).put(iv).put(encrypted).array();

      return AesCipher.VERSION_PREFIX + Base64.getEncoder().encodeToString(combined);
    } catch (GeneralSecurityException e) {
      throw new CryptoException("암호화에 실패했습니다.", e);
    }
  }

  public String decrypt(String storedText) {
    if (storedText == null) {
      throw new IllegalArgumentException("복호화 할 값이 null 입니다.");
    }
    if (!storedText.startsWith(AesCipher.VERSION_PREFIX)) {
      throw new CryptoException("지원하지 않는 암호문 형식입니다.");
    }

    byte[] combined;
    try {
      combined =
          Base64.getDecoder().decode(storedText.substring(AesCipher.VERSION_PREFIX.length()));
    } catch (IllegalArgumentException e) {
      throw new CryptoException("암호문 인코딩이 올바르지 않습니다.", e);
    }

    /**
     * 최소 길이 = IV 12바이트 + 인증 태그 16바이트(128비트 / 8) = 28바이트
     */
    if (combined.length < AesCipher.IV_LENGTH_BYTE + AesCipher.TAG_LENGTH_BIT / 8) {
      throw new CryptoException("암호문 길이가 올바르지 않습니다.");
    }

    byte[] iv = Arrays.copyOfRange(combined, 0, AesCipher.IV_LENGTH_BYTE);
    byte[] encrypted = Arrays.copyOfRange(combined, AesCipher.IV_LENGTH_BYTE, combined.length);

    try {
      Cipher cipher = Cipher.getInstance(AesCipher.TRANSFORMATION);
      cipher.init(Cipher.DECRYPT_MODE, this.secretKey,
          new GCMParameterSpec(AesCipher.TAG_LENGTH_BIT, iv));
      byte[] decrypted = cipher.doFinal(encrypted);
      return new String(decrypted, StandardCharsets.UTF_8);

    } catch (GeneralSecurityException e) {
      throw new CryptoException("복호화에 실패했습니다. 키가 다르거나 암호문이 변조되었습니다.", e);
    }

  }
}
