package com.learningworks.common.utils.crypto;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.learningworks.common.exceptions.CryptoException;

class AesCipherTest {

  // 테스트 전용 32바이트 키 (실제 키는 환경변수로만 주입)
  private static final byte[] TEST_KEY =
      "0123456789abcdef0123456789abcdef".getBytes(StandardCharsets.UTF_8);
  private static final byte[] OTHER_KEY =
      "fedcba9876543210fedcba9876543210".getBytes(StandardCharsets.UTF_8);

  private AesCipher aesCipher;

  @BeforeEach
  void setUp() {
    this.aesCipher = new AesCipher(AesCipherTest.TEST_KEY);
  }

  // ===== 실패 케이스 =====

  @Test
  @DisplayName("키가 null 이면 IllegalArgumentException")
  void constructorWithNullKey() {
    // Given
    byte[] nullKey = null;

    // When & Then
    Assertions.assertThatThrownBy(() -> new AesCipher(nullKey))
        .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("AES 키는 32 바이트여야 합니다.");
  }

  @Test
  @DisplayName("키가 32바이트가 아니면 IllegalArgumentException")
  void constructorWithShortKey() {
    // Given
    byte[] shortKey = new byte[16];

    // When & Then
    Assertions.assertThatThrownBy(() -> new AesCipher(shortKey))
        .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("AES 키는 32 바이트여야 합니다.");
  }

  @Test
  @DisplayName("암호화할 값이 null 이면 IllegalArgumentException")
  void encryptNull() {
    // When & Then
    Assertions.assertThatThrownBy(() -> this.aesCipher.encrypt(null))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("복호화할 값이 null 이면 IllegalArgumentException")
  void decryptNull() {
    // When & Then
    Assertions.assertThatThrownBy(() -> this.aesCipher.decrypt(null))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("v1: 접두어가 없으면 CryptoException")
  void decryptWithoutPrefix() {
    // Given
    String noPrefix = "홍길동";

    // When & Then
    Assertions.assertThatThrownBy(() -> this.aesCipher.decrypt(noPrefix))
        .isInstanceOf(CryptoException.class).hasMessageContaining("형식");
  }

  @Test
  @DisplayName("Base64 형식이 아니면 CryptoException")
  void decryptInvalidBase64() {
    // Given
    String invalidBase64 = "v1:###";

    // When & Then
    Assertions.assertThatThrownBy(() -> this.aesCipher.decrypt(invalidBase64))
        .isInstanceOf(CryptoException.class).hasMessageContaining("인코딩")
        .hasCauseInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("IV + 태그 길이(28바이트)보다 짧으면 CryptoException")
  void decryptTooShort() {
    // Given
    String tooShort = "v1:" + Base64.getEncoder().encodeToString(new byte[27]);

    // When & Then
    Assertions.assertThatThrownBy(() -> this.aesCipher.decrypt(tooShort))
        .isInstanceOf(CryptoException.class).hasMessageContaining("길이");
  }

  @Test
  @DisplayName("암호문이 변조되면 CryptoException")
  void decryptTampered() {
    // Given
    String encrypted = this.aesCipher.encrypt("홍길동");
    byte[] combined = Base64.getDecoder().decode(encrypted.substring(3));
    combined[combined.length - 1] ^= 1; // 마지막 바이트(인증 태그)의 1비트만 뒤집음
    String tampered = "v1:" + Base64.getEncoder().encodeToString(combined);

    // When & Then
    Assertions.assertThatThrownBy(() -> this.aesCipher.decrypt(tampered))
        .isInstanceOf(CryptoException.class).hasMessageContaining("복호화에 실패");
  }

  @Test
  @DisplayName("다른 키로 복호화하면 CryptoException")
  void decryptWithOtherKey() {
    // Given
    String encrypted = this.aesCipher.encrypt("홍길동");
    AesCipher otherCipher = new AesCipher(AesCipherTest.OTHER_KEY);

    // When & Then
    Assertions.assertThatThrownBy(() -> otherCipher.decrypt(encrypted))
        .isInstanceOf(CryptoException.class).hasMessageContaining("복호화에 실패");
  }

  // ===== 성공 케이스 =====

  @Test
  @DisplayName("암호화 후 복호화하면 원문(한글)이 복원된다")
  void roundTrip() {
    // Given
    String plainText = "홍길동";

    // When
    String encrypted = this.aesCipher.encrypt(plainText);
    String decrypted = this.aesCipher.decrypt(encrypted);

    // Then
    Assertions.assertThat(decrypted).isEqualTo(plainText);
  }

  @Test
  @DisplayName("빈 문자열도 암복호화된다")
  void roundTripEmpty() {
    // When
    String decrypted = this.aesCipher.decrypt(this.aesCipher.encrypt(""));

    // Then
    Assertions.assertThat(decrypted).isEmpty();
  }

  @Test
  @DisplayName("같은 평문도 암호화할 때마다 결과가 다르다 (랜덤 IV)")
  void differentCipherTextEachTime() {
    // Given
    String plainText = "홍길동";

    // When
    String first = this.aesCipher.encrypt(plainText);
    String second = this.aesCipher.encrypt(plainText);

    // Then
    Assertions.assertThat(first).isNotEqualTo(second);
    Assertions.assertThat(this.aesCipher.decrypt(first)).isEqualTo(plainText);
    Assertions.assertThat(this.aesCipher.decrypt(second)).isEqualTo(plainText);
  }

  @Test
  @DisplayName("암호문은 v1: 로 시작하고 평문을 포함하지 않는다")
  void cipherTextFormat() {
    // Given
    String plainText = "홍길동";

    // When
    String encrypted = this.aesCipher.encrypt(plainText);

    // Then
    Assertions.assertThat(encrypted).startsWith("v1:").doesNotContain(plainText);
  }
}
