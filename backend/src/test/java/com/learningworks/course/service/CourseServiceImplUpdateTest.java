package com.learningworks.course.service;

import java.util.List;
import java.util.Map;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import com.learningworks.common.action.AccessChecker;
import com.learningworks.common.exceptions.ValidationFailedException;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.request.ModifyCourseVO;

/** 과정 수정 (CourseServiceImpl.updateCourse)의 새 기간 밖 시간표 검사 */
class CourseServiceImplUpdateTest {

  private static final String COURSE_ID = "C1";

  private CourseDao courseDao;
  private final AccessChecker accessChecker = Mockito.mock(AccessChecker.class);
  private CourseServiceImpl service;

  @BeforeEach
  void setUp() {
    this.courseDao = Mockito.mock(CourseDao.class);
    this.service = new CourseServiceImpl(this.courseDao, new CourseAccessChecker(this.courseDao, this.accessChecker));
    Mockito.when(this.courseDao.updateCourse(Mockito.any())).thenReturn(1);
  }

  private static ModifyCourseVO request(String startDate, String endDated) {
    ModifyCourseVO vo = new ModifyCourseVO();
    vo.setNo("28");
    vo.setCourseName("풀스택");
    vo.setStartDate(startDate);
    vo.setEndDated(endDated);
    return vo;
  }

  private void givenOutside(String start, String end, List<String> dates) {
    Mockito.when(this.courseDao.selectTimetableDatesOutside(COURSE_ID, start, end)).thenReturn(dates);
  }

  private static Map<String, List<String>> validationsOf(Throwable thrown) {
    return ((ValidationFailedException) thrown).getValidations();
  }

  @Test
  @DisplayName("새 기간 밖에 시간표가 없으면 수정한다")
  void noTimetableOutside() {
    givenOutside("2026-11-02", "2026-11-20", List.of());

    String result = this.service.updateCourse(COURSE_ID, request("2026-11-02", "2026-11-20"));

    Assertions.assertThat(result).isEqualTo(COURSE_ID);
    Mockito.verify(this.courseDao).updateCourse(Mockito.any());
  }

  @Test
  @DisplayName("종료일을 당겨 시간표가 밀려나면 종료일 칸에 날짜를 적고 수정하지 않는다")
  void endDateShortened() {
    givenOutside("2026-11-02", "2026-11-18", List.of("2026-11-19", "2026-11-20"));

    Throwable thrown = Assertions.catchThrowable(
        () -> this.service.updateCourse(COURSE_ID, request("2026-11-02", "2026-11-18")));

    Assertions.assertThat(thrown).isInstanceOf(ValidationFailedException.class);
    Map<String, List<String>> validations = validationsOf(thrown);
    Assertions.assertThat(validations).containsOnlyKeys("endDated");
    Assertions.assertThat(validations.get("endDated").get(0))
        .contains("종료일보다 뒤에 시간표가 있습니다: 2026-11-19, 2026-11-20");
    Mockito.verify(this.courseDao, Mockito.never()).updateCourse(Mockito.any());
  }

  @Test
  @DisplayName("시작일을 미뤄 앞쪽 시간표가 밀려나면 시작일 칸, 양쪽이면 두 칸 모두")
  void bothSides() {
    givenOutside("2026-11-05", "2026-11-18", List.of("2026-11-03", "2026-11-04", "2026-11-20"));

    Throwable thrown = Assertions.catchThrowable(
        () -> this.service.updateCourse(COURSE_ID, request("2026-11-05", "2026-11-18")));

    Map<String, List<String>> validations = validationsOf(thrown);
    Assertions.assertThat(validations).containsOnlyKeys("startDate", "endDated");
    Assertions.assertThat(validations.get("startDate").get(0)).contains("2026-11-03, 2026-11-04");
    Assertions.assertThat(validations.get("endDated").get(0)).contains("2026-11-20");
    Mockito.verify(this.courseDao, Mockito.never()).updateCourse(Mockito.any());
  }
}
