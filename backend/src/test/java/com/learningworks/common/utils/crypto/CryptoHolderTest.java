package com.learningworks.common.utils.crypto;

import java.nio.charset.StandardCharsets;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CryptoHolderTest {

  // 테스트 전용 32바이트 키 (application.yml 의 팀 공용 키와 무관)
  private static final byte[] TEST_KEY =
      "0123456789abcdef0123456789abcdef".getBytes(StandardCharsets.UTF_8);

  // static 상태는 같은 JVM 의 다른 테스트(@SpringBootTest 등)와 공유되므로 테스트 전후로 비움
  @BeforeEach
  void setUp() {
    CryptoHolder.clear();
  }

  @AfterEach
  void tearDown() {
    CryptoHolder.clear();
  }

  // ===== 실패 케이스 =====

  @Test
  @DisplayName("초기화 전에 getAesCipher() 를 호출하면 IllegalStateException")
  void getAesCipherBeforeInitialize() {
    // When & Then
    Assertions.assertThatThrownBy(() -> CryptoHolder.getAesCipher())
              .isInstanceOf(IllegalStateException.class)
              .hasMessageContaining("초기화");
  }

  @Test
  @DisplayName("null 로 초기화하면 IllegalArgumentException")
  void initializeWithNull() {
    // When & Then
    Assertions.assertThatThrownBy(() -> CryptoHolder.initialize(null))
              .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("clear() 후에는 다시 초기화 전 상태가 된다")
  void getAesCipherAfterClear() {
    // Given
    CryptoHolder.initialize(new AesCipher(CryptoHolderTest.TEST_KEY));

    // When
    CryptoHolder.clear();

    // Then
    Assertions.assertThatThrownBy(() -> CryptoHolder.getAesCipher())
              .isInstanceOf(IllegalStateException.class);
  }

  // ===== 성공 케이스 =====

  @Test
  @DisplayName("초기화 후 getAesCipher() 는 같은 인스턴스를 반환한다")
  void getAesCipherAfterInitialize() {
    // Given
    AesCipher aesCipher = new AesCipher(CryptoHolderTest.TEST_KEY);

    // When
    CryptoHolder.initialize(aesCipher);

    // Then
    Assertions.assertThat(CryptoHolder.getAesCipher()).isSameAs(aesCipher);
  }

  @Test
  @DisplayName("다시 초기화하면 새 인스턴스로 교체된다")
  void reinitialize() {
    // Given
    AesCipher first = new AesCipher(CryptoHolderTest.TEST_KEY);
    AesCipher second = new AesCipher(CryptoHolderTest.TEST_KEY);
    CryptoHolder.initialize(first);

    // When
    CryptoHolder.initialize(second);

    // Then
    Assertions.assertThat(CryptoHolder.getAesCipher()).isSameAs(second);
  }
}
