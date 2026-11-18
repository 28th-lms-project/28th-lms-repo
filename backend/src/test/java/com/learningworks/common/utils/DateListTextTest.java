package com.learningworks.common.utils;

import java.time.LocalDate;
import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DateListTextTest {

  @Test
  @DisplayName("max개 이하면 모두 적는다")
  void underMax() {
    Assertions.assertThat(DateListText.summarize(List.of("2026-11-01", "2026-11-02"), 5))
        .isEqualTo("2026-11-01, 2026-11-02");
  }

  @Test
  @DisplayName("max개를 넘으면 앞의 max개 + 외 N일")
  void overMax() {
    List<LocalDate> dates = List.of(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 2),
        LocalDate.of(2026, 11, 3));
    Assertions.assertThat(DateListText.summarize(dates, 2)).isEqualTo("2026-11-01, 2026-11-02 외 1일");
  }

  @Test
  @DisplayName("빈 목록이면 빈 문자열")
  void empty() {
    Assertions.assertThat(DateListText.summarize(List.of())).isEmpty();
  }
}
