package com.learningworks.common.utils;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 전화번호 하이픈 형식 */
class PhoneNumberFormatTest {

  @Test
  @DisplayName("숫자만 넣어도 · 하이픈을 넣어도 같은 형식으로 맞춘다")
  void format() {
    Assertions.assertThat(PhoneNumberFormat.format("01012345678")).isEqualTo("010-1234-5678");
    Assertions.assertThat(PhoneNumberFormat.format("010-1234-5678")).isEqualTo("010-1234-5678");
    Assertions.assertThat(PhoneNumberFormat.format("0311234567")).isEqualTo("031-123-4567");
    Assertions.assertThat(PhoneNumberFormat.format("021234567")).isEqualTo("02-123-4567");
    Assertions.assertThat(PhoneNumberFormat.format("0212345678")).isEqualTo("02-1234-5678");
    Assertions.assertThat(PhoneNumberFormat.format("15881234")).isEqualTo("1588-1234");
  }

  @Test
  @DisplayName("자릿수가 맞지 않는 번호는 저장하지 않는다")
  void invalid() {
    Assertions.assertThat(PhoneNumberFormat.isValid("0101234")).isFalse();
    Assertions.assertThat(PhoneNumberFormat.isValid("010123456789")).isFalse();
    Assertions.assertThat(PhoneNumberFormat.isValid("02123456789")).isFalse();
    Assertions.assertThat(PhoneNumberFormat.isValid("12345678901")).isFalse();
    Assertions.assertThat(PhoneNumberFormat.isValid(null)).isFalse();
  }
}
