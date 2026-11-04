package com.learningworks.common.utils.crypto;

/**
 * MyBatis TypeHandler 가 암복호화 객체를 꺼내 쓰는 static 저장소. TypeHandler 는 MyBatis 가 직접 생성하므로 Spring 주입을 받을 수
 * 없어, CryptoInitializer(@Component)가 앱 시작 시 이곳을 채워 준다.
 */
public final class CryptoHolder {

  private static volatile AesCipher aesCipher;

  // 기본 생성자 형성 차단
  private CryptoHolder() {

  }

  public static void initialize(AesCipher aesCipher) {
    if (aesCipher == null) {
      throw new IllegalArgumentException("AesCipher 가 null 입니다.");
    }
    CryptoHolder.aesCipher = aesCipher;
  }

  public static AesCipher getAesCipher() {
    AesCipher cipher = CryptoHolder.aesCipher;
    if (cipher == null) {
      throw new IllegalStateException("CryptoHolder 가 초기화되지 않았습니다. CryptoInitializer 를 확인하세요.");
    }
    return cipher;

  }

  /**
   * 테스트 전용: static 상태를 초기화한다. (같은 패키지에서만 호출 가능)
   */
  static void clear() {
    CryptoHolder.aesCipher = null;
  }
}
