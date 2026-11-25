package com.learningworks.score.service;

import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import com.learningworks.common.action.AccessChecker;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.service.CourseAccessChecker;
import com.learningworks.course.service.CourseAccessTestSupport;
import com.learningworks.score.dao.ScoreDao;
import com.learningworks.score.vo.response.CourseRankVO;
import com.learningworks.score.vo.response.ScoreDetailVO;

/** 강사의 학생 상세 성적 조회 (ScoreServiceImpl.readStudentScoreDetail) */
class ScoreServiceImplDetailTest {

  private static final String COURSE_ID = "C1";

  private ScoreDao scoreDao;
  private final AccessChecker accessChecker = Mockito.mock(AccessChecker.class);
  private ScoreServiceImpl service;

  @BeforeEach
  void setUp() {
    this.scoreDao = Mockito.mock(ScoreDao.class);
    this.service = new ScoreServiceImpl(this.scoreDao,
        new CourseAccessChecker(Mockito.mock(CourseDao.class), this.accessChecker));
    Mockito.when(this.scoreDao.selectCourseStudentUserId(COURSE_ID, "CT-1")).thenReturn("stu1");
    Mockito.when(this.scoreDao.selectScoreDetail(COURSE_ID, "TS-1", "stu1")).thenReturn(new ScoreDetailVO());
    Mockito.when(this.scoreDao.selectScoreDetailItems("TS-1", "stu1")).thenReturn(List.of());
  }

  private static void assertError(Runnable call, ErrorCode code) {
    Assertions.assertThatThrownBy(call::run)
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(code);
  }

  @Test
  @DisplayName("담당 강사는 이 과정 학생의 상세 성적을 본다 (답안은 로그인 ID 로 조회)")
  void tutorOfCourse() {
    Mockito.when(this.scoreDao.selectCourseTutorCount(COURSE_ID, "T1")).thenReturn(1);
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, "T1", "ROLE_TUTOR");

    ScoreDetailVO detail = this.service.readStudentScoreDetail("T1", COURSE_ID, "CT-1", "TS-1");

    Assertions.assertThat(detail.getItems()).isEmpty();
    Mockito.verify(this.scoreDao).selectScoreDetailItems("TS-1", "stu1");
  }

  @Test
  @DisplayName("담당 과정이 아닌 강사는 403")
  void otherTutor() {
    Mockito.when(this.scoreDao.selectCourseTutorCount(COURSE_ID, "T2")).thenReturn(0);
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, "T2", "ROLE_TUTOR");

    assertError(() -> this.service.readStudentScoreDetail("T2", COURSE_ID, "CT-1", "TS-1"),
        ErrorCode.COURSE_NOT_AUTHORIZED);
  }

  @Test
  @DisplayName("다른 과정 학생 ID · 다른 과정 시험 ID 는 거부")
  void otherCourseIds() {
    Mockito.when(this.scoreDao.selectCourseTutorCount(COURSE_ID, "T1")).thenReturn(1);
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, "T1", "ROLE_TUTOR");

    assertError(() -> this.service.readStudentScoreDetail("T1", COURSE_ID, "CT-OTHER", "TS-1"),
        ErrorCode.STUDENT_NOT_IN_COURSE);
    assertError(() -> this.service.readStudentScoreDetail("T1", COURSE_ID, "CT-1", "TS-OTHER"),
        ErrorCode.TEST_SET_NOT_EXISTS);
  }
  private ScoreDetailVO myDetail(String submittedAt, Integer pending, String showYn) {
    ScoreDetailVO detail = new ScoreDetailVO();
    detail.setSubmittedAt(submittedAt);
    detail.setPendingCount(pending);
    detail.setShowYn(showYn);
    return detail;
  }

  @Test
  @DisplayName("학생 결과: 응시했고 강사가 채점 완료(C)를 확정했으면 본인 결과를 본다")
  void studentResultOpen() {
    Mockito.when(this.scoreDao.selectCourseStudentId(COURSE_ID, "stu1")).thenReturn("CT-1");
    Mockito.when(this.scoreDao.selectScoreDetail(COURSE_ID, "TS-2", "stu1")).thenReturn(myDetail("2026-11-20 10:00", 0, "C"));

    this.service.readMyScoreDetail("stu1", COURSE_ID, "TS-2");

    Mockito.verify(this.scoreDao).selectScoreDetailItems("TS-2", "stu1");
  }

  @Test
  @DisplayName("학생 결과: 응시 중(Y) · 마감만 됨(N, 채점 완료 전) · 미응시 · 수강생 아님이면 막는다")
  void studentResultClosed() {
    Mockito.when(this.scoreDao.selectCourseStudentId(COURSE_ID, "stu1")).thenReturn("CT-1");
    Mockito.when(this.scoreDao.selectScoreDetail(COURSE_ID, "OPEN", "stu1")).thenReturn(myDetail("2026-11-20 10:00", 0, "Y"));
    Mockito.when(this.scoreDao.selectScoreDetail(COURSE_ID, "PENDING", "stu1")).thenReturn(myDetail("2026-11-20 10:00", 1, "N"));
    Mockito.when(this.scoreDao.selectScoreDetail(COURSE_ID, "NOT_TAKEN", "stu1")).thenReturn(myDetail(null, null, "C"));

    assertError(() -> this.service.readMyScoreDetail("stu1", COURSE_ID, "OPEN"), ErrorCode.SCORE_RESULT_NOT_OPEN);
    assertError(() -> this.service.readMyScoreDetail("stu1", COURSE_ID, "PENDING"), ErrorCode.SCORE_RESULT_NOT_OPEN);
    assertError(() -> this.service.readMyScoreDetail("stu1", COURSE_ID, "NOT_TAKEN"), ErrorCode.SCORE_RESULT_NOT_OPEN);
    assertError(() -> this.service.readMyScoreDetail("outsider", COURSE_ID, "OPEN"), ErrorCode.COURSE_NOT_AUTHORIZED);
    Mockito.verify(this.scoreDao, Mockito.never()).selectScoreDetailItems(Mockito.eq("OPEN"), Mockito.any());
  }

  @Test
  @DisplayName("강사: 학생이 보는 성적 목록 · 석차를 학생 로그인 ID 기준으로 본다. 다른 과정 강사 · 학생은 거부")
  void tutorViewsStudentPage() {
    Mockito.when(this.scoreDao.selectCourseTutorCount(COURSE_ID, "T1")).thenReturn(1);
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, "T1", "ROLE_TUTOR");
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, "T2", "ROLE_TUTOR");
    CourseRankVO rank = new CourseRankVO();
    rank.setUserId("stu1");
    rank.setRankNo(2);
    Mockito.when(this.scoreDao.selectCourseRankList(COURSE_ID)).thenReturn(List.of(rank));

    this.service.readStudentScoreList("T1", COURSE_ID, "CT-1");
    Mockito.verify(this.scoreDao).selectMyScoreList(COURSE_ID, "stu1");
    CourseRankVO result = this.service.readStudentCourseRank("T1", COURSE_ID, "CT-1");
    Assertions.assertThat(result.getRankNo()).isEqualTo(2);

    assertError(() -> this.service.readStudentScoreList("T2", COURSE_ID, "CT-1"), ErrorCode.COURSE_NOT_AUTHORIZED);
    assertError(() -> this.service.readStudentScoreList("T1", COURSE_ID, "CT-OTHER"), ErrorCode.STUDENT_NOT_IN_COURSE);
  }

  @Test
  @DisplayName("과정 석차: 학생에게는 본인 것만, 로그인 ID 는 빼고 준다")
  void myCourseRank() {
    CourseRankVO mine = new CourseRankVO();
    mine.setUserId("stu1");
    mine.setRankNo(3);
    CourseRankVO other = new CourseRankVO();
    other.setUserId("stu2");
    other.setRankNo(1);
    Mockito.when(this.scoreDao.selectCourseStudentId(COURSE_ID, "stu1")).thenReturn("CT-1");
    Mockito.when(this.scoreDao.selectCourseRankList(COURSE_ID)).thenReturn(List.of(other, mine));

    CourseRankVO result = this.service.readMyCourseRank("stu1", COURSE_ID);

    Assertions.assertThat(result.getRankNo()).isEqualTo(3);
    Assertions.assertThat(result.getUserId()).isNull();
    assertError(() -> this.service.readMyCourseRank("outsider", COURSE_ID), ErrorCode.COURSE_NOT_AUTHORIZED);
  }
}
