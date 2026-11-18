package com.learningworks.score.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.role.RoleConstants;
import com.learningworks.score.dao.ScoreDao;
import com.learningworks.score.vo.response.ScoreVO;
import com.learningworks.score.vo.response.StudentScoreVO;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScoreServiceImpl implements ScoreService {

  /** 담당 과정이 아니어도 모든 과정 성적을 조회할 수 있는 역할 */
  private static final List<String> SCORE_READ_ALL_ROLES =
      List.of(RoleConstants.SUPER_ADMIN_ROLE, "ROLE_ADMIN", "ROLE_READONLY");

  private final ScoreDao scoreDao;

  @Transactional(readOnly = true)
  @Override
  public List<ScoreVO> readMyScoreList(String loginId, String courseId) {
    // 이 과정의 수강생인지만 확인 (답안은 로그인 ID 로 저장되어 있어 조회는 로그인 ID 로 한다)
    String courseStudentId = this.scoreDao.selectCourseStudentId(courseId, loginId);
    if (courseStudentId == null) {
      throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
    }

    return this.scoreDao.selectMyScoreList(courseId, loginId);
  }

  @Transactional(readOnly = true)
  @Override
  public List<StudentScoreVO> readCourseScoreList(String loginId, String courseId) {
    this.checkCourseScoreAccess(loginId, courseId);

    return this.scoreDao.selectCourseScoreList(courseId);
  }

  /**
   * 과정 성적 조회 권한 검사. 관리자(SUPER_ADMIN, ADMIN, READONLY): 모든 과정 그 외: COURSE_TUTOR 에 등록된 담당 과정만 (강사 · 조교). 아니면
   * 403
   */
  private void checkCourseScoreAccess(String loginId, String courseId) {
    String baseRole = this.scoreDao.selectUserBaseRole(loginId);
    if (baseRole != null && SCORE_READ_ALL_ROLES.contains(baseRole)) {
      return;
    }
    if (this.scoreDao.selectCourseTutorCount(courseId, loginId) == 0) {
      throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
    }
  }
}
