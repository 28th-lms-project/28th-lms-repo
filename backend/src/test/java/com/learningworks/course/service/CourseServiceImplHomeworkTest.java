package com.learningworks.course.service;

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
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.response.HomeworkVO;

/** 과제 목록 (CourseServiceImpl.courseHomeworkList)의 제출 여부 기준 */
class CourseServiceImplHomeworkTest {

  private static final String COURSE_ID = "C1";
  private static final String STUDENT_ID = "S1";

  private CourseDao courseDao;
  private CourseServiceImpl service;

  @BeforeEach
  void setUp() {
    this.courseDao = Mockito.mock(CourseDao.class);
    this.service = new CourseServiceImpl(this.courseDao);

    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(STUDENT_ID, null, List.of()));
    Mockito.when(this.courseDao.readUserBaseRole(STUDENT_ID)).thenReturn("ROLE_STUDENT");
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  @DisplayName("과제 목록은 로그인 사용자 ID로 조회한다 (submittedYn 기준)")
  void readsWithLoginId() {
    Mockito.when(this.courseDao.countCourseStudentOrTutor(COURSE_ID, STUDENT_ID)).thenReturn(1);
    HomeworkVO homework = new HomeworkVO();
    homework.setId("H1");
    homework.setSubmittedYn("Y");
    Mockito.when(this.courseDao.readHomeworkList(COURSE_ID, STUDENT_ID)).thenReturn(List.of(homework));

    List<HomeworkVO> result = this.service.courseHomeworkList(COURSE_ID);

    Assertions.assertThat(result).extracting(HomeworkVO::getSubmittedYn).containsExactly("Y");
    Mockito.verify(this.courseDao).readHomeworkList(COURSE_ID, STUDENT_ID);
  }

  @Test
  @DisplayName("이 과정의 수강생 · 강사가 아니면 목록을 조회하지 않고 403")
  void notCourseMember() {
    Mockito.when(this.courseDao.countCourseStudentOrTutor(COURSE_ID, STUDENT_ID)).thenReturn(0);

    Assertions.assertThatThrownBy(() -> this.service.courseHomeworkList(COURSE_ID))
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.COURSE_NOT_AUTHORIZED);
    Mockito.verify(this.courseDao, Mockito.never())
        .readHomeworkList(Mockito.anyString(), Mockito.anyString());
  }
}
