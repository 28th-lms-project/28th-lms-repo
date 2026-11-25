package com.learningworks.survey.service;

import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.learningworks.common.action.AccessChecker;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.service.CourseAccessChecker;
import com.learningworks.course.service.CourseAccessTestSupport;
import com.learningworks.survey.dao.SurveyDao;
import com.learningworks.survey.vo.response.CourseSurveyResultVO;
import com.learningworks.survey.vo.response.CourseSurveyVO;
import com.learningworks.survey.vo.response.SurveyRespondentVO;

/** 설문 결과 익명 처리: 강사에게는 학생 이름 · 수강생 ID 를 내려주지 않는다 */
class SurveyServiceImplAnonymousTest {

  private static final String COURSE_ID = "C1";
  private static final String SURVEY_ID = "CS1";

  private SurveyDao surveyDao;
  private CourseDao courseDao;
  private final AccessChecker accessChecker = Mockito.mock(AccessChecker.class);
  private SurveyServiceImpl service;

  @BeforeEach
  void setUp() {
    this.surveyDao = Mockito.mock(SurveyDao.class);
    this.courseDao = Mockito.mock(CourseDao.class);
    this.service = new SurveyServiceImpl(this.surveyDao, new CourseAccessChecker(this.courseDao, this.accessChecker));

    CourseSurveyVO survey = new CourseSurveyVO();
    survey.setCourseId(COURSE_ID);
    survey.setSurveyGroup("G1");
    Mockito.when(this.surveyDao.selectCourseSurvey(SURVEY_ID)).thenReturn(survey);
    Mockito.when(this.surveyDao.selectAllSurveyByGroup("G1")).thenReturn(List.of());
    Mockito.when(this.surveyDao.selectCourseSurveyRespondents(SURVEY_ID))
        .thenReturn(List.of(respondent("CT-1", "홍길동", "CA-1"), respondent("CT-2", "김철수", "CA-5")));
    Mockito.when(this.surveyDao.selectRespondentCourseStudentId(SURVEY_ID, "CA-1")).thenReturn("CT-1");
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private static SurveyRespondentVO respondent(String courseStudentId, String name, String respondentId) {
    SurveyRespondentVO vo = new SurveyRespondentVO();
    vo.setCourseStudentId(courseStudentId);
    vo.setName(name);
    vo.setRespondentId(respondentId);
    return vo;
  }

  /** relation: TUTOR · ADMIN · STUDENT */
  private void login(String userId, String relation) {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(userId, null, List.of()));
    boolean tutor = "TUTOR".equals(relation);
    boolean student = "STUDENT".equals(relation);
    Mockito.when(this.courseDao.countCourseTutor(COURSE_ID, userId)).thenReturn(tutor ? 1 : 0);
    Mockito.when(this.courseDao.countCourseStudentOrTutor(COURSE_ID, userId)).thenReturn(tutor || student ? 1 : 0);
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, userId,
        "ADMIN".equals(relation) ? "ROLE_ADMIN" : "ROLE_TUTOR");
  }

  @Test
  @DisplayName("강사: 응답자 목록에 이름 · 수강생 ID 가 없고 '응답자 N' + 응답자 ID 만 있다")
  void tutorGetsAnonymousRespondents() {
    login("T1", "TUTOR");

    CourseSurveyResultVO result = this.service.readCourseSurveyResult(COURSE_ID, SURVEY_ID, "T1");

    Assertions.assertThat(result.isAnonymous()).isTrue();
    Assertions.assertThat(result.getRespondents()).hasSize(2);
    Assertions.assertThat(result.getRespondents()).allSatisfy(r -> {
      Assertions.assertThat(r.getCourseStudentId()).isNull();
      Assertions.assertThat(r.getName()).startsWith("응답자 ");
      Assertions.assertThat(r.getRespondentId()).isIn("CA-1", "CA-5");
    });
    Assertions.assertThat(result.getRespondents()).extracting(SurveyRespondentVO::getName)
        .doesNotContain("홍길동", "김철수");
  }

  @Test
  @DisplayName("관리자도 익명: 이름 · 수강생 ID 가 없고, 수강생 ID 로 조회하면 403")
  void adminAlsoAnonymous() {
    login("A1", "ADMIN");

    CourseSurveyResultVO result = this.service.readCourseSurveyResult(COURSE_ID, SURVEY_ID, "A1");

    Assertions.assertThat(result.isAnonymous()).isTrue();
    Assertions.assertThat(result.getRespondents()).extracting(SurveyRespondentVO::getName)
        .doesNotContain("홍길동", "김철수");
    Assertions.assertThat(result.getRespondents()).extracting(SurveyRespondentVO::getCourseStudentId)
        .containsOnlyNulls();
    Assertions.assertThatThrownBy(() -> this.service.readCourseSurveyStudentAnswers(COURSE_ID, SURVEY_ID, "CT-1", "A1"))
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
  }

  @Test
  @DisplayName("강사: 응답자 ID 로는 답변을 볼 수 있다")
  void tutorReadsByRespondentId() {
    login("T1", "TUTOR");

    this.service.readCourseSurveyStudentAnswers(COURSE_ID, SURVEY_ID, "CA-1", "T1");

    Mockito.verify(this.surveyDao).selectCourseSurveyStudentAnswers(SURVEY_ID, "CT-1");
  }

  @Test
  @DisplayName("강사: 수강생 ID 로 특정 학생 답변을 조회하면 403")
  void tutorCannotReadByCourseStudentId() {
    login("T1", "TUTOR");

    Assertions.assertThatThrownBy(() -> this.service.readCourseSurveyStudentAnswers(COURSE_ID, SURVEY_ID, "CT-1", "T1"))
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
    Mockito.verify(this.surveyDao, Mockito.never()).selectCourseSurveyStudentAnswers(Mockito.any(), Mockito.any());
  }

  @Test
  @DisplayName("수강생: 응답자 ID 로 본인 답변은 보고, 다른 학생 것은 403")
  void studentOnlyOwn() {
    login("S1", "STUDENT");
    Mockito.when(this.surveyDao.selectCourseStudentId(COURSE_ID, "S1")).thenReturn("CT-1");
    Mockito.when(this.surveyDao.selectRespondentCourseStudentId(SURVEY_ID, "CA-5")).thenReturn("CT-2");

    this.service.readCourseSurveyStudentAnswers(COURSE_ID, SURVEY_ID, "CA-1", "S1");
    Mockito.verify(this.surveyDao).selectCourseSurveyStudentAnswers(SURVEY_ID, "CT-1");

    Assertions.assertThatThrownBy(() -> this.service.readCourseSurveyStudentAnswers(COURSE_ID, SURVEY_ID, "CA-5", "S1"))
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
  }
}
