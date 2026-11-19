package com.learningworks.counsel.service;

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
import com.learningworks.counsel.dao.CounselDao;
import com.learningworks.counsel.vo.request.OpinionRequestVO;

/** 상담 (CounselServiceImpl): 관리자 또는 이 과정의 강사만 */
class CounselServiceImplAccessTest {

  private static final String COURSE_ID = "C1";
  private static final String COURSE_STUDENT_ID = "CS1";

  private CounselDao counselDao;
  private CounselServiceImpl service;

  @BeforeEach
  void setUp() {
    this.counselDao = Mockito.mock(CounselDao.class);
    this.service = new CounselServiceImpl(this.counselDao);
    Mockito.when(this.counselDao.selectCounselList(COURSE_ID)).thenReturn(List.of());
    Mockito.when(this.counselDao.countCourseStudent(COURSE_ID, COURSE_STUDENT_ID)).thenReturn(1);
    Mockito.when(this.counselDao.countCounsel(COURSE_STUDENT_ID)).thenReturn(1);
    Mockito.when(this.counselDao.updateOpinion(Mockito.any())).thenReturn(1);
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private void login(String userId, boolean tutorOfCourse, String baseRole) {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(userId, null, List.of()));
    Mockito.when(this.counselDao.countCourseTutor(COURSE_ID, userId)).thenReturn(tutorOfCourse ? 1 : 0);
    Mockito.when(this.counselDao.selectUserBaseRole(userId)).thenReturn(baseRole);
  }

  private static void assertForbidden(Runnable call) {
    Assertions.assertThatThrownBy(call::run)
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.COURSE_NOT_AUTHORIZED);
  }

  @Test
  @DisplayName("이 과정의 강사는 상담 목록 · 상세 · 의견 수정을 할 수 있다")
  void tutorOfCourse() {
    login("T1", true, "ROLE_TUTOR");

    this.service.getCounselList(COURSE_ID);
    this.service.getCounselDetail(COURSE_ID, COURSE_STUDENT_ID);
    this.service.updateOpinion(COURSE_ID, COURSE_STUDENT_ID, new OpinionRequestVO());

    Mockito.verify(this.counselDao).selectCounselList(COURSE_ID);
    Mockito.verify(this.counselDao).selectCounselDetail(COURSE_STUDENT_ID);
    Mockito.verify(this.counselDao).updateOpinion(Mockito.any());
  }

  @Test
  @DisplayName("관리자는 과정 강사가 아니어도 된다")
  void admin() {
    login("A1", false, "ROLE_ADMIN");

    this.service.getCounselList(COURSE_ID);

    Mockito.verify(this.counselDao).selectCounselList(COURSE_ID);
  }

  @Test
  @DisplayName("다른 과정의 강사는 목록 · 상세 · 수정 모두 403, 조회 · 수정 쿼리를 부르지 않는다")
  void otherCourseTutor() {
    login("T2", false, "ROLE_TUTOR");

    assertForbidden(() -> this.service.getCounselList(COURSE_ID));
    assertForbidden(() -> this.service.getCounselDetail(COURSE_ID, COURSE_STUDENT_ID));
    assertForbidden(
        () -> this.service.updateOpinion(COURSE_ID, COURSE_STUDENT_ID, new OpinionRequestVO()));
    Mockito.verify(this.counselDao, Mockito.never()).selectCounselList(Mockito.anyString());
    Mockito.verify(this.counselDao, Mockito.never()).selectCounselDetail(Mockito.anyString());
    Mockito.verify(this.counselDao, Mockito.never()).updateOpinion(Mockito.any());
  }

  @Test
  @DisplayName("수강생 · 조회 전용 역할도 과정 강사가 아니면 403")
  void studentAndReadonly() {
    login("S1", false, "ROLE_STUDENT");
    assertForbidden(() -> this.service.getCounselList(COURSE_ID));

    login("R1", false, "ROLE_READONLY");
    assertForbidden(() -> this.service.getCounselList(COURSE_ID));
  }
}
