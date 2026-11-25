package com.learningworks.exam.service;

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
import com.learningworks.course.service.CourseAccessTestSupport;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.service.CourseAccessChecker;
import com.learningworks.exam.dao.ExamDao;
import com.learningworks.exam.vo.request.RegistTestAnswersListVO;
import com.learningworks.exam.vo.request.RegistTestAnswersVO;
import com.learningworks.exam.vo.request.RegistTestSetVO;

/** 시험 (ExamServiceImpl): 세트 · 채점은 이 과정의 강사 또는 관리자, 응시는 이 과정의 수강생 */
class ExamServiceImplAccessTest {

  private static final String COURSE_ID = "C1";
  private static final String SET_ID = "TS1";

  private ExamDao examDao;
  private CourseDao courseDao;
  private final AccessChecker accessChecker = Mockito.mock(AccessChecker.class);
  private ExamServiceImpl service;

  @BeforeEach
  void setUp() {
    this.examDao = Mockito.mock(ExamDao.class);
    this.courseDao = Mockito.mock(CourseDao.class);
    this.service = new ExamServiceImpl(this.examDao, new CourseAccessChecker(this.courseDao, this.accessChecker));

    RegistTestSetVO set = new RegistTestSetVO();
    set.setId(SET_ID);
    set.setCourseId(COURSE_ID);
    set.setShowYn("Y");
    Mockito.when(this.examDao.selectExamsetById(SET_ID)).thenReturn(set);
    Mockito.when(this.examDao.selectCourseIdByAnswerId("A1")).thenReturn(COURSE_ID);
    Mockito.when(this.examDao.updateTestSetShowYn(SET_ID, "N")).thenReturn(1);
    Mockito.when(this.examDao.viewTestSetQuestionsForTake(SET_ID)).thenReturn(List.of());
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private void login(String userId, boolean tutor, boolean student, String baseRole) {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(userId, null, List.of()));
    Mockito.when(this.courseDao.countCourseTutor(COURSE_ID, userId)).thenReturn(tutor ? 1 : 0);
    Mockito.when(this.courseDao.countCourseStudentOrTutor(COURSE_ID, userId))
        .thenReturn((tutor ? 1 : 0) + (student ? 1 : 0));
    Mockito.when(this.courseDao.readUserBaseRole(userId)).thenReturn(baseRole);
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, userId, baseRole);
  }

  private static void assertForbidden(Runnable call) {
    Assertions.assertThatThrownBy(call::run)
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.COURSE_NOT_AUTHORIZED);
  }

  private RegistTestSetVO gradeDoneSet() {
    RegistTestSetVO done = new RegistTestSetVO();
    done.setId("TS-DONE");
    done.setCourseId(COURSE_ID);
    done.setShowYn("C");
    Mockito.when(this.examDao.selectExamsetById("TS-DONE")).thenReturn(done);
    return done;
  }

  private static void assertError(Runnable call, ErrorCode code) {
    Assertions.assertThatThrownBy(call::run)
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(code);
  }

  @Test
  @DisplayName("채점 완료: 채점 중 답안이 없으면 확정(C), 남아 있으면 거부")
  void completeGrading() {
    login("T1", true, false, "ROLE_TUTOR");

    Mockito.when(this.examDao.countPendingAnswers(SET_ID)).thenReturn(2);
    assertError(() -> this.service.completeGrading(SET_ID), ErrorCode.EXAM_GRADE_PENDING);
    Mockito.verify(this.examDao, Mockito.never()).updateTestSetShowYn(SET_ID, "C");

    Mockito.when(this.examDao.countPendingAnswers(SET_ID)).thenReturn(0);
    this.service.completeGrading(SET_ID);
    Mockito.verify(this.examDao).updateTestSetShowYn(SET_ID, "C");
  }

  @Test
  @DisplayName("채점 완료된 시험: 강사는 채점 수정 · 공개 여부 변경 · 완료 취소를 할 수 없다")
  void gradeDoneLocksTutor() {
    login("T1", true, false, "ROLE_TUTOR");
    gradeDoneSet();
    Mockito.when(this.examDao.selectShowYnByAnswerId("A1")).thenReturn("C");

    assertError(() -> this.service.updateAnswerGrade("A1", "Y"), ErrorCode.EXAM_GRADE_DONE);
    assertError(() -> this.service.updateTestSetShowYn("TS-DONE", "Y"), ErrorCode.EXAM_GRADE_DONE);
    assertError(() -> this.service.cancelGradeDone("TS-DONE"), ErrorCode.COURSE_NOT_AUTHORIZED);
    Mockito.verify(this.examDao, Mockito.never()).updateAnswerGrade(Mockito.any(), Mockito.any());
  }

  @Test
  @DisplayName("채점 완료 취소: 관리자만, 마감(N)으로 되돌린다")
  void adminCancelsGradeDone() {
    login("A1", false, false, "ROLE_ADMIN");
    gradeDoneSet();

    this.service.cancelGradeDone("TS-DONE");

    Mockito.verify(this.examDao).updateTestSetShowYn("TS-DONE", "N");
    assertError(() -> this.service.cancelGradeDone(SET_ID), ErrorCode.EXAM_GRADE_NOT_DONE);
  }

  @Test
  @DisplayName("이 과정의 강사는 시험 공개 전환을 할 수 있다")
  void tutorOfCourse() {
    login("T1", true, false, "ROLE_TUTOR");

    this.service.updateTestSetShowYn(SET_ID, "N");

    Mockito.verify(this.examDao).updateTestSetShowYn(SET_ID, "N");
  }

  @Test
  @DisplayName("다른 과정의 강사는 시험 세트 등록 · 공개 전환 · 삭제 · 문제 보기 · 답안 조회 · 채점 모두 403")
  void otherCourseTutor() {
    login("T2", false, false, "ROLE_TUTOR");

    assertForbidden(() -> this.service.makeNewTestSet(COURSE_ID, new RegistTestSetVO()));
    assertForbidden(() -> this.service.updateTestSetShowYn(SET_ID, "N"));
    assertForbidden(() -> this.service.deleteTestSet(SET_ID));
    assertForbidden(() -> this.service.viewTestSetQuestions(SET_ID));
    assertForbidden(() -> this.service.isCorrectSetByUserId(SET_ID, "S1"));
    assertForbidden(() -> this.service.updateAnswerGrade("A1", "Y"));
    Mockito.verify(this.examDao, Mockito.never()).makeNewTestSet(Mockito.any(), Mockito.any());
    Mockito.verify(this.examDao, Mockito.never()).updateTestSetShowYn(Mockito.any(), Mockito.any());
    Mockito.verify(this.examDao, Mockito.never()).deleteTestSet(Mockito.any());
    Mockito.verify(this.examDao, Mockito.never()).updateAnswerGrade(Mockito.any(), Mockito.any());
  }

  @Test
  @DisplayName("강사 역할이어도 이 과정의 수강생이면 채점 403")
  void tutorRoleStudentOfCourse() {
    login("T3", false, true, "ROLE_TUTOR");

    assertForbidden(() -> this.service.updateAnswerGrade("A1", "Y"));
  }

  @Test
  @DisplayName("이 과정의 수강생은 응시 문제를 볼 수 있다")
  void studentOfCourseTakes() {
    login("S1", false, true, "ROLE_STUDENT");

    this.service.viewTestSetQuestionsForTake(SET_ID, "S1");

    Mockito.verify(this.examDao).viewTestSetQuestionsForTake(SET_ID);
  }

  @Test
  @DisplayName("다른 과정의 수강생은 공개된 시험이라도 문제 보기 · 답안 제출 403")
  void otherCourseStudent() {
    login("S2", false, false, "ROLE_STUDENT");
    RegistTestAnswersVO answer = new RegistTestAnswersVO();
    answer.setTestId("Q1");
    answer.setAnswer("1");
    RegistTestAnswersListVO answers = new RegistTestAnswersListVO();
    answers.setAnswersList(List.of(answer));

    assertForbidden(() -> this.service.viewTestSetQuestionsForTake(SET_ID, "S2"));
    assertForbidden(() -> this.service.createTestAnswerByTestSetId(SET_ID, "S2", answers));
    Mockito.verify(this.examDao, Mockito.never()).insertTestAnswer(Mockito.any());
  }

  @Test
  @DisplayName("이 과정의 강사 · 수강생 · 관리자는 시험 세트 목록을 볼 수 있고, 외부인은 403")
  void setList() {
    login("S1", false, true, "ROLE_STUDENT");
    this.service.readAllExamInExamSet(COURSE_ID, "S1");

    login("X1", false, false, "ROLE_STUDENT");
    assertForbidden(() -> this.service.readAllExamInExamSet(COURSE_ID, "X1"));
  }
}
