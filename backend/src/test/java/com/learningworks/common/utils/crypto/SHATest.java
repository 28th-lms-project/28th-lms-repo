package com.learningworks.common.utils.crypto;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashSet;
import java.util.Set;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SHATest {

  private static final String PASSWORD = "password1234";
  private static final String SALT = "a1b2c3d4e5f60718";

  // .NET SHA256 으로 별도 계산한 값: SHA-256(UTF-8("password1234" + "a1b2c3d4e5f60718"))
  private static final String EXPECTED_HASH =
      "edec3ce51528492b895df0162b4304e29f87919e9262fe2e6c25720dfcef9ab5";

  // SHA-256("") 표준 값 (원본, salt 모두 빈 문자열)
  private static final String EMPTY_HASH =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  private static final String HEX_64 = "^[0-9a-f]{64}$";
  private static final String HEX_16 = "^[0-9a-f]{16}$";

  // ===== 실패 케이스 =====

  @Test
  @DisplayName("원본이 null 이면 IllegalArgumentException")
  void getEncryptWithNullSource() {
    // When & Then
    Assertions.assertThatThrownBy(() -> SHA.getEncrypt(null, SHATest.SALT))
              .isInstanceOf(IllegalArgumentException.class)
              .hasMessageContaining("null");
  }

  @Test
  @DisplayName("salt 가 null 이면 IllegalArgumentException")
  void getEncryptWithNullSalt() {
    // When & Then
    Assertions.assertThatThrownBy(() -> SHA.getEncrypt(SHATest.PASSWORD, null))
              .isInstanceOf(IllegalArgumentException.class)
              .hasMessageContaining("salt");
  }

  @Test
  @DisplayName("matches: 입력 비밀번호가 null 이면 IllegalArgumentException")
  void matchesWithNullPassword() {
    // When & Then
    Assertions.assertThatThrownBy(() -> SHA.matches(null, SHATest.SALT, SHATest.EXPECTED_HASH))
              .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("matches: salt 가 null 이면 IllegalArgumentException")
  void matchesWithNullSalt() {
    // When & Then
    Assertions.assertThatThrownBy(() -> SHA.matches(SHATest.PASSWORD, null, SHATest.EXPECTED_HASH))
              .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("matches: 저장된 해시가 null 이면 IllegalArgumentException")
  void matchesWithNullStoredHash() {
    // When & Then
    Assertions.assertThatThrownBy(() -> SHA.matches(SHATest.PASSWORD, SHATest.SALT, null))
              .isInstanceOf(IllegalArgumentException.class)
              .hasMessageContaining("해시");
  }

  @Test
  @DisplayName("matches: 비밀번호가 다르면 false")
  void matchesWithWrongPassword() {
    // When
    boolean result = SHA.matches("password1235", SHATest.SALT, SHATest.EXPECTED_HASH);

    // Then
    Assertions.assertThat(result).isFalse();
  }

  @Test
  @DisplayName("matches: salt 가 다르면 false")
  void matchesWithWrongSalt() {
    // When
    boolean result = SHA.matches(SHATest.PASSWORD, "0000000000000000", SHATest.EXPECTED_HASH);

    // Then
    Assertions.assertThat(result).isFalse();
  }

  @Test
  @DisplayName("matches: 대문자 hex 로 저장된 해시는 일치하지 않는다 (소문자만 허용)")
  void matchesWithUpperCaseHash() {
    // When
    boolean result =
        SHA.matches(SHATest.PASSWORD, SHATest.SALT, SHATest.EXPECTED_HASH.toUpperCase());

    // Then
    Assertions.assertThat(result).isFalse();
  }

  // ===== 성공 케이스 =====

  @Test
  @DisplayName("외부 도구로 계산한 SHA-256 기대값과 일치한다")
  void getEncryptMatchesKnownVector() {
    // When
    String hash = SHA.getEncrypt(SHATest.PASSWORD, SHATest.SALT);

    // Then
    Assertions.assertThat(hash).isEqualTo(SHATest.EXPECTED_HASH);
  }

  @Test
  @DisplayName("빈 원본 + 빈 salt 는 SHA-256 표준 빈 문자열 해시와 같다")
  void getEncryptEmpty() {
    // When
    String hash = SHA.getEncrypt("", "");

    // Then
    Assertions.assertThat(hash).isEqualTo(SHATest.EMPTY_HASH);
  }

  @Test
  @DisplayName("수업 코드(원본 SHA.java) 로직과 결과가 같다 (한글/특수문자/생성 salt 포함)")
  void getEncryptCompatibleWithLegacy() {
    // Given
    String[] sources = {"password1234", "비밀번호123!", "P@ss w0rd~", "", "가"};

    for (String source : sources) {
      String salt = SHA.generateSalt();

      // When
      String hash = SHA.getEncrypt(source, salt);

      // Then
      Assertions.assertThat(hash)
                .as("source=%s, salt=%s", source, salt)
                .isEqualTo(SHATest.legacyGetEncrypt(source, salt));
    }
  }

  @Test
  @DisplayName("같은 입력은 항상 같은 해시를 만든다")
  void getEncryptDeterministic() {
    // When
    String first = SHA.getEncrypt(SHATest.PASSWORD, SHATest.SALT);
    String second = SHA.getEncrypt(SHATest.PASSWORD, SHATest.SALT);

    // Then
    Assertions.assertThat(first).isEqualTo(second);
  }

  @Test
  @DisplayName("salt 가 다르면 해시도 다르다")
  void getEncryptDifferentSalt() {
    // When
    String first = SHA.getEncrypt(SHATest.PASSWORD, SHATest.SALT);
    String second = SHA.getEncrypt(SHATest.PASSWORD, "0000000000000000");

    // Then
    Assertions.assertThat(first).isNotEqualTo(second);
  }

  @Test
  @DisplayName("해시는 소문자 hex 64자다")
  void getEncryptFormat() {
    // When
    String hash = SHA.getEncrypt("비밀번호123!", SHA.generateSalt());

    // Then
    Assertions.assertThat(hash).matches(SHATest.HEX_64);
  }

  @Test
  @DisplayName("salt 는 소문자 hex 16자다")
  void generateSaltFormat() {
    // When
    String salt = SHA.generateSalt();

    // Then
    Assertions.assertThat(salt).matches(SHATest.HEX_16);
  }

  @Test
  @DisplayName("salt 는 호출할 때마다 다르다 (100회 중복 없음)")
  void generateSaltRandom() {
    // Given
    Set<String> salts = new HashSet<>();

    // When
    for (int i = 0; i < 100; i++) {
      salts.add(SHA.generateSalt());
    }

    // Then
    Assertions.assertThat(salts).hasSize(100);
  }

  @Test
  @DisplayName("matches: 올바른 비밀번호와 salt 면 true")
  void matchesWithCorrectPassword() {
    // When
    boolean result = SHA.matches(SHATest.PASSWORD, SHATest.SALT, SHATest.EXPECTED_HASH);

    // Then
    Assertions.assertThat(result).isTrue();
  }

  @Test
  @DisplayName("matches: generateSalt + getEncrypt 로 저장한 값을 검증할 수 있다 (가입 → 로그인 흐름)")
  void matchesSignUpThenLogin() {
    // Given: 회원가입 시 저장
    String salt = SHA.generateSalt();
    String storedHash = SHA.getEncrypt("비밀번호123!", salt);

    // When: 로그인 시 비교
    boolean correct = SHA.matches("비밀번호123!", salt, storedHash);
    boolean wrong = SHA.matches("비밀번호124!", salt, storedHash);

    // Then
    Assertions.assertThat(correct).isTrue();
    Assertions.assertThat(wrong).isFalse();
  }

  /**
   * 수업 코드(SHA.java) 원본 로직을 그대로 옮긴 것. 호환성 비교 전용.
   * (원본은 getBytes() 기본 charset 사용 — Java 18+ 기본값은 UTF-8)
   */
  private static String legacyGetEncrypt(String source, String saltText) {
    byte[] salt = saltText.getBytes();
    byte[] a = source.getBytes();
    byte[] bytes = new byte[a.length + salt.length];

    System.arraycopy(a, 0, bytes, 0, a.length);
    System.arraycopy(salt, 0, bytes, a.length, salt.length);

    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      md.update(bytes);
      byte[] byteData = md.digest();

      StringBuffer sb = new StringBuffer();
      for (int i = 0; i < byteData.length; i++) {
        sb.append(Integer.toString((byteData[i] & 0xFF) + 256, 16).substring(1));
      }
      return sb.toString();
    } catch (NoSuchAlgorithmException e) {
      throw new RuntimeException(e.getMessage(), e);
    }
  }
}
