package com.learningworks.common.utils;

import java.util.List;
import java.util.stream.Collectors;

/** 오류 메시지에 날짜 목록을 짧게 적는다 ("2026-11-21, 2026-11-24 외 3일") */
public final class DateListText {

  /** 메시지에 그대로 적을 최대 날짜 수 (나머지는 "외 N일") */
  public static final int DEFAULT_MAX = 5;

  private DateListText() {}

  /** 앞에서 max개만 ", "로 잇고, 남으면 " 외 N일"을 붙인다. 날짜는 toString() 그대로 */
  public static String summarize(List<?> dates, int max) {
    String shown = dates.stream()
        .limit(max)
        .map(String::valueOf)
        .collect(Collectors.joining(", "));
    int rest = dates.size() - max;
    return rest > 0 ? shown + " 외 " + rest + "일" : shown;
  }

  public static String summarize(List<?> dates) {
    return DateListText.summarize(dates, DEFAULT_MAX);
  }
}
