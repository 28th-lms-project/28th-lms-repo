package com.learningworks.common.utils.crypto;

import java.util.Base64;
import java.util.Properties;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;

class CryptoInitializerTest {

  // 테스트 전용 32바이트 키를 Base64 로 인코딩한 값 (application.yml 의 팀 공용 키와 무관)
  private static final String TEST_KEY_BASE64 =
      Base64.getEncoder().encodeToString(new byte[32]);

  // static 상태는 같은 JVM 의 다른 테스트와 공유되므로 테스트 전후로 비움
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
  @DisplayName("키가 null 이면 IllegalStateException")
  void nullKey() {
    // When & Then
    Assertions.assertThatThrownBy(() -> new CryptoInitializer(null))
              .isInstanceOf(IllegalStateException.class)
              .hasMessageContaining("app.crypto.aes-key");
  }

  @Test
  @DisplayName("키가 빈 문자열이면 IllegalStateException")
  void emptyKey() {
    // When & Then
    Assertions.assertThatThrownBy(() -> new CryptoInitializer(""))
              .isInstanceOf(IllegalStateException.class)
              .hasMessageContaining("app.crypto.aes-key");
  }

  @Test
  @DisplayName("키가 공백뿐이면 IllegalStateException")
  void blankKey() {
    // When & Then
    Assertions.assertThatThrownBy(() -> new CryptoInitializer("   "))
              .isInstanceOf(IllegalStateException.class)
              .hasMessageContaining("app.crypto.aes-key");
  }

  @Test
  @DisplayName("Base64 형식이 아니면 IllegalStateException (원인 예외 보존)")
  void invalidBase64Key() {
    // When & Then
    Assertions.assertThatThrownBy(() -> new CryptoInitializer("###"))
              .isInstanceOf(IllegalStateException.class)
              .hasMessageContaining("Base64")
              .hasCauseInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("디코딩 결과가 32바이트가 아니면 IllegalArgumentException (AesCipher 에서 발생)")
  void wrongLengthKey() {
    // Given
    String shortKey = Base64.getEncoder().encodeToString(new byte[16]);

    // When & Then
    Assertions.assertThatThrownBy(() -> new CryptoInitializer(shortKey))
              .isInstanceOf(IllegalArgumentException.class)
              .hasMessageContaining("32");
  }

  @Test
  @DisplayName("초기화에 실패하면 CryptoHolder 는 비어 있다")
  void holderEmptyAfterFailure() {
    // When
    Assertions.assertThatThrownBy(() -> new CryptoInitializer("###"))
              .isInstanceOf(IllegalStateException.class);

    // Then
    Assertions.assertThatThrownBy(() -> CryptoHolder.getAesCipher())
              .isInstanceOf(IllegalStateException.class);
  }

  // ===== 성공 케이스 =====

  @Test
  @DisplayName("정상 키면 CryptoHolder 가 초기화되고 암복호화가 된다")
  void validKey() {
    // When
    new CryptoInitializer(CryptoInitializerTest.TEST_KEY_BASE64);

    // Then
    AesCipher aesCipher = CryptoHolder.getAesCipher();
    Assertions.assertThat(aesCipher.decrypt(aesCipher.encrypt("홍길동"))).isEqualTo("홍길동");
  }

  @Test
  @DisplayName("앞뒤 공백/줄바꿈이 섞인 키도 정상 처리된다")
  void keyWithWhitespace() {
    // Given
    String keyWithWhitespace = "  " + CryptoInitializerTest.TEST_KEY_BASE64 + "\n";

    // When
    new CryptoInitializer(keyWithWhitespace);

    // Then
    Assertions.assertThat(CryptoHolder.getAesCipher()).isNotNull();
  }

  @Test
  @DisplayName("application.yml 의 팀 공용 키가 유효한 AES-256 키다")
  void applicationYmlKeyIsValid() {
    // Given: Spring 컨텍스트(DB 연결) 없이 application.yml 만 읽음
    YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
    yaml.setResources(new ClassPathResource("application.yml"));
    Properties properties = yaml.getObject();
    String aesKey = properties.getProperty("app.crypto.aes-key");

    // When
    new CryptoInitializer(aesKey);

    // Then
    AesCipher aesCipher = CryptoHolder.getAesCipher();
    Assertions.assertThat(aesCipher.decrypt(aesCipher.encrypt("홍길동"))).isEqualTo("홍길동");
  }
}
