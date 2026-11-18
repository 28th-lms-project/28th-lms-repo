package com.learningworks.interview.service;

import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.interview.dao.InterviewDao;
import com.learningworks.interview.vo.request.InterviewRequestVO;

/** 면접 일정 (InterviewServiceImpl): 과정 소속 확인과 수강생 본인 것만 보기 */
class InterviewServiceImplAccessTest {

  private static final String COURSE_ID = "C1";

  private InterviewDao interviewDao;
  private InterviewServiceImpl service;

  @BeforeEach
  void setUp() {
    this.interviewDao = Mockito.mock(InterviewDao.class);
    this.service = new InterviewServiceImpl(this.interviewDao);
    Mockito.when(this.interviewDao.selectInterviewList(Mockito.anyString(), Mockito.any()))
        .thenReturn(List.of());
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  /** 로그인 + 이 과정에서의 위치 (tutor · student 등록 여부, 역할) */
  private void login(String userId, boolean tutor, boolean student, String baseRole) {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(userId, null, List.of()));
    Mockito.when(this.interviewDao.countCourseTutor(COURSE_ID, userId)).thenReturn(tutor ? 1 : 0);
    Mockito.when(this.interviewDao.countCourseStudentByUser(COURSE_ID, userId)).thenReturn(student ? 1 : 0);
    Mockito.when(this.interviewDao.selectUserBaseRole(userId)).thenReturn(baseRole);
  }

  private static void assertForbidden(Runnable call) {
    Assertions.assertThatThrownBy(call::run)
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.COURSE_NOT_AUTHORIZED);
  }

  @Test
  @DisplayName("이 과정의 강사는 과정 전체 면접 일정")
  void tutorSeesAll() {
    login("T1", true, false, "ROLE_TUTOR");

    this.service.getInterviewList(COURSE_ID);

    Mockito.verify(this.interviewDao).selectInterviewList(COURSE_ID, null);
  }

  @Test
  @DisplayName("이 과정의 수강생은 본인 면접 일정만")
  void studentSeesOwnOnly() {
    login("S1", false, true, "ROLE_STUDENT");

    this.service.getInterviewList(COURSE_ID);

    Mockito.verify(this.interviewDao).selectInterviewList(COURSE_ID, "S1");
  }

  @Test
  @DisplayName("관리자는 과정에 등록되지 않아도 과정 전체")
  void adminSeesAll() {
    login("A1", false, false, "ROLE_ADMIN");

    this.service.getInterviewList(COURSE_ID);

    Mockito.verify(this.interviewDao).selectInterviewList(COURSE_ID, null);
  }

  @Test
  @DisplayName("이 과정과 관계없는 사용자는 403 (다른 과정의 강사 · 수강생 포함)")
  void outsiderForbidden() {
    login("T2", false, false, "ROLE_TUTOR");

    assertForbidden(() -> this.service.getInterviewList(COURSE_ID));
    Mockito.verify(this.interviewDao, Mockito.never())
        .selectInterviewList(Mockito.anyString(), Mockito.any());
  }

  @Test
  @DisplayName("수강생은 등록용 수강생 목록 조회 · 면접 등록을 할 수 없다")
  void studentCannotManage() {
    login("S1", false, true, "ROLE_STUDENT");

    assertForbidden(() -> this.service.getCourseStudentList(COURSE_ID));
    InterviewRequestVO request = new InterviewRequestVO();
    request.setInterviewCompany("회사");
    request.setCourseStudentId("CS1");
    assertForbidden(() -> this.service.createInterview(COURSE_ID, request));
    Mockito.verify(this.interviewDao, Mockito.never()).insertInterview(Mockito.any());
  }

  @Test
  @DisplayName("다른 과정의 강사는 이 과정에 면접을 등록할 수 없다")
  void otherTutorCannotCreate() {
    login("T2", false, false, "ROLE_TUTOR");
    InterviewRequestVO request = new InterviewRequestVO();
    request.setInterviewCompany("회사");
    request.setCourseStudentId("CS1");

    assertForbidden(() -> this.service.createInterview(COURSE_ID, request));
    Mockito.verify(this.interviewDao, Mockito.never()).insertInterview(Mockito.any());
  }
}
