package com.learningworks.common.utils;

/**
 * 전화번호 하이픈 형식 맞추기 (국내 번호). 숫자만 남긴 뒤 자릿수로 나눈다. 프론트 utils/phoneFormat.js 와 같은 규칙.
 * - 02 지역번호: 02-123-4567 (9자리) · 02-1234-5678 (10자리)
 * - 대표번호(15xx ~ 19xx) 8자리: 1588-1234
 * - 그 외 0으로 시작(010 · 031 · 070 ...): 031-123-4567 (10자리) · 010-1234-5678 (11자리)
 */
public final class PhoneNumberFormat {

  private PhoneNumberFormat() {}

  private static String digits(String value) {
    return value == null ? "" : value.replaceAll("[^0-9]", "");
  }

  /** 위 규칙의 번호인지 */
  public static boolean isValid(String value) {
    String d = digits(value);
    int n = d.length();
    if (d.startsWith("02")) {
      return n == 9 || n == 10;
    }
    if (d.matches("^1[5-9].*")) {
      return n == 8;
    }
    return d.startsWith("0") && (n == 10 || n == 11);
  }

  /** 하이픈 형식으로. 규칙에 맞지 않으면 숫자만 */
  public static String format(String value) {
    if (value == null) {
      return null;
    }
    String d = digits(value);
    if (!isValid(d)) {
      return d;
    }
    int n = d.length();
    if (n == 8) {
      return d.substring(0, 4) + "-" + d.substring(4);
    }
    int area = d.startsWith("02") ? 2 : 3;
    return d.substring(0, area) + "-" + d.substring(area, n - 4) + "-" + d.substring(n - 4);
  }
}
