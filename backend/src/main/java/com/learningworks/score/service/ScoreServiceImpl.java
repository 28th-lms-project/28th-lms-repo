package com.learningworks.score.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.course.service.CourseAccessChecker;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.score.dao.ScoreDao;
import com.learningworks.score.vo.response.CourseRankVO;
import com.learningworks.score.vo.response.ScoreDetailVO;
import com.learningworks.score.vo.response.ScoreVO;
import com.learningworks.score.vo.response.StudentScoreVO;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScoreServiceImpl implements ScoreService {

  private final ScoreDao scoreDao;

  /** 모든 과정 성적 조회 판단 (COURSE_ALL_READ) */
  private final CourseAccessChecker courseAccess;

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

    List<StudentScoreVO> students = this.scoreDao.selectCourseScoreList(courseId);
    // 과정 전체 석차를 수강생별로 붙인다 (로그인 ID 기준)
    List<CourseRankVO> ranks = this.scoreDao.selectCourseRankList(courseId);
    for (StudentScoreVO student : students) {
      for (CourseRankVO rank : ranks) {
        if (rank.getUserId().equals(student.getUserId())) {
          student.setCourseRank(rank);
        }
      }
    }
    return students;
  }

  @Transactional(readOnly = true)
  @Override
  public CourseRankVO readMyCourseRank(String loginId, String courseId) {
    if (this.scoreDao.selectCourseStudentId(courseId, loginId) == null) {
      throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
    }
    // 학생에게는 본인 석차 · 평균 · 인원만 (다른 학생 정보 · 로그인 ID 는 내려주지 않음)
    for (CourseRankVO rank : this.scoreDao.selectCourseRankList(courseId)) {
      if (rank.getUserId().equals(loginId)) {
        rank.setUserId(null);
        return rank;
      }
    }
    return null;
  }

  @Transactional(readOnly = true)
  @Override
  public ScoreDetailVO readStudentScoreDetail(String loginId, String courseId, String courseStudentId,
      String testSetId) {
    this.checkCourseScoreAccess(loginId, courseId);

    // 수강생이 이 과정 소속인지 확인 (다른 과정 학생 ID 로 조회 차단). 답안은 로그인 ID 로 저장되어 있다
    String userId = this.scoreDao.selectCourseStudentUserId(courseId, courseStudentId);
    if (userId == null) {
      throw new LearningworksException(ErrorCode.STUDENT_NOT_IN_COURSE);
    }

    return this.readScoreDetail(courseId, testSetId, userId);
  }

  @Transactional(readOnly = true)
  @Override
  public ScoreDetailVO readMyScoreDetail(String loginId, String courseId, String testSetId) {
    // 이 과정 수강생만, 본인 답안만 (조회 대상은 로그인 ID 로 고정)
    if (this.scoreDao.selectCourseStudentId(courseId, loginId) == null) {
      throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
    }
    ScoreDetailVO detail = this.scoreDao.selectScoreDetail(courseId, testSetId, loginId);
    if (detail == null) {
      throw new LearningworksException(ErrorCode.TEST_SET_NOT_EXISTS);
    }

    // 결과 공개 정책: 응시했고, 본인 답안의 채점이 모두 끝났고(채점 중 R 없음), 시험이 마감(SHOW_YN=N)된 뒤에만.
    // 응시 중인 시험의 정답이 아직 안 본 학생에게 퍼지지 않도록 마감 전에는 막는다
    boolean submitted = detail.getSubmittedAt() != null;
    boolean graded = detail.getPendingCount() != null && detail.getPendingCount() == 0;
    boolean closed = "N".equals(detail.getShowYn());
    if (!submitted || !graded || !closed) {
      throw new LearningworksException(ErrorCode.SCORE_RESULT_NOT_OPEN);
    }
    // 공개 조건을 통과한 뒤에만 문항(정답 포함)을 조회
    detail.setItems(this.scoreDao.selectScoreDetailItems(testSetId, loginId));
    return detail;
  }

  @Transactional(readOnly = true)
  @Override
  public List<ScoreVO> readStudentScoreList(String loginId, String courseId, String courseStudentId) {
    String userId = this.requireCourseStudentUser(loginId, courseId, courseStudentId);
    // 학생 본인 조회(readMyScoreList)와 같은 쿼리: 학생이 보는 화면 그대로
    return this.scoreDao.selectMyScoreList(courseId, userId);
  }

  @Transactional(readOnly = true)
  @Override
  public CourseRankVO readStudentCourseRank(String loginId, String courseId, String courseStudentId) {
    String userId = this.requireCourseStudentUser(loginId, courseId, courseStudentId);
    for (CourseRankVO rank : this.scoreDao.selectCourseRankList(courseId)) {
      if (rank.getUserId().equals(userId)) {
        rank.setUserId(null);
        return rank;
      }
    }
    return null;
  }

  /** 과정 성적 조회 권한 확인 후 이 과정 수강생 ID(CT-) → 로그인 ID. 다른 과정 학생이면 거부 */
  private String requireCourseStudentUser(String loginId, String courseId, String courseStudentId) {
    this.checkCourseScoreAccess(loginId, courseId);
    String userId = this.scoreDao.selectCourseStudentUserId(courseId, courseStudentId);
    if (userId == null) {
      throw new LearningworksException(ErrorCode.STUDENT_NOT_IN_COURSE);
    }
    return userId;
  }

  /** 시험이 이 과정 것인지 확인한 뒤 머리글 + 문항별 결과 조회 */
  private ScoreDetailVO readScoreDetail(String courseId, String testSetId, String userId) {
    ScoreDetailVO detail = this.scoreDao.selectScoreDetail(courseId, testSetId, userId);
    if (detail == null) {
      throw new LearningworksException(ErrorCode.TEST_SET_NOT_EXISTS);
    }
    detail.setItems(this.scoreDao.selectScoreDetailItems(testSetId, userId));

    return detail;
  }

  /**
   * 과정 성적 조회 권한 검사. 모든 과정 조회 권한(COURSE_ALL_READ, 관리자 · 조회 전용 등)이면 모든 과정,
   * 그 외에는 COURSE_TUTOR 에 등록된 담당 과정만 (강사 · 조교). 아니면 403
   */
  private void checkCourseScoreAccess(String loginId, String courseId) {
    if (this.courseAccess.canReadAll(loginId)) {
      return;
    }
    if (this.scoreDao.selectCourseTutorCount(courseId, loginId) == 0) {
      throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
    }
  }
}
