package com.learningworks.common.utils.crypto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

public final class SHA {
  private static final String ALGORITHM = "SHA-256";
  private static final int SALT_LENGTH_BYTE = 10;
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();
  private static final HexFormat HEX = HexFormat.of();

  private SHA() {}

  /**
   * SHA-256 해시를 만든다.
   *
   * @param source 원본 (비밀번호)
   * @param salt generateSalt() 로 만든 salt 문자열
   * @return 소문자 hex 64자
   */
  public static String getEncrypt(String source, String salt) {
    if (source == null) {
      throw new IllegalArgumentException("암호화할 값이 null 입니다.");
    }
    if (salt == null) {
      throw new IllegalArgumentException("salt 가 null 입니다.");
    }
    return SHA.getEncrypt(source, salt.getBytes(StandardCharsets.UTF_8));
  }

  private static String getEncrypt(String source, byte[] salt) {
    byte[] sourceBytes = source.getBytes(StandardCharsets.UTF_8);
    byte[] bytes = new byte[sourceBytes.length + salt.length];

    System.arraycopy(sourceBytes, 0, bytes, 0, sourceBytes.length);
    System.arraycopy(salt, 0, bytes, sourceBytes.length, salt.length);

    try {
      MessageDigest md = MessageDigest.getInstance(SHA.ALGORITHM);
      byte[] digest = md.digest(bytes);
      return SHA.HEX.formatHex(digest);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", e);
    }
  }

  /**
   * 10바이트 랜덤 salt 를 만든다.
   *
   * @return 소문자 hex 20자
   */
  public static String generateSalt() {
    byte[] salt = new byte[SHA.SALT_LENGTH_BYTE];
    SHA.SECURE_RANDOM.nextBytes(salt);
    return SHA.HEX.formatHex(salt);
  }

  /**
   * 입력 비밀번호가 저장된 해시와 일치하는지 비교한다. (타이밍 공격 방지를 위해 MessageDigest.isEqual 사용)
   *
   * @param rawPassword 사용자가 입력한 비밀번호
   * @param salt DB 에 저장된 salt
   * @param storedHash DB 에 저장된 해시
   * @return 일치 여부
   */
  public static boolean matches(String rawPassword, String salt, String storedHash) {
    if (storedHash == null) {
      throw new IllegalArgumentException("저장된 해시가 null 입니다.");
    }
    String inputHash = SHA.getEncrypt(rawPassword, salt);
    return MessageDigest.isEqual(inputHash.getBytes(StandardCharsets.UTF_8),
        storedHash.getBytes(StandardCharsets.UTF_8));
  }
}
