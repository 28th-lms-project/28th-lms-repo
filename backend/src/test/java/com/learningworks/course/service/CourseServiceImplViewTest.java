package com.learningworks.course.service;

import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.learningworks.common.action.AccessChecker;
import com.learningworks.course.dao.CourseDao;

/** 과정 목록 (CourseServiceImpl.viewCourse): 조회 범위(userId)와 관계 기준(loginId) */
class CourseServiceImplViewTest {

  private CourseDao courseDao;
  private final AccessChecker accessChecker = Mockito.mock(AccessChecker.class);
  private CourseServiceImpl service;

  @BeforeEach
  void setUp() {
    this.courseDao = Mockito.mock(CourseDao.class);
    this.service = new CourseServiceImpl(this.courseDao, new CourseAccessChecker(this.courseDao, this.accessChecker));
    Mockito.when(this.courseDao.viewCourse(Mockito.any(), Mockito.any())).thenReturn(List.of());
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private static void login(String userId) {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(userId, null, List.of()));
  }

  @Test
  @DisplayName("수강생 · 강사는 자기 과정만 (userId = loginId), 관계도 자기 기준")
  void member() {
    login("S1");
    Mockito.when(this.courseDao.readUserBaseRole("S1")).thenReturn("ROLE_STUDENT");
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, "S1", "ROLE_STUDENT");

    this.service.viewCourse();

    Mockito.verify(this.courseDao).viewCourse("S1", "S1");
  }

  @Test
  @DisplayName("관리자는 전체 과정 (userId = null), 관계는 관리자 자신 기준")
  void admin() {
    login("A1");
    Mockito.when(this.courseDao.readUserBaseRole("A1")).thenReturn("ROLE_ADMIN");
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, "A1", "ROLE_ADMIN");

    this.service.viewCourse();

    Mockito.verify(this.courseDao).viewCourse(null, "A1");
  }
}
