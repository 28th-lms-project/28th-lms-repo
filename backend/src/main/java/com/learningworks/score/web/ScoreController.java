package com.learningworks.score.web;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.common.utils.AuthUtil;
import com.learningworks.score.service.ScoreService;
import com.learningworks.score.vo.response.CourseRankVO;
import com.learningworks.score.vo.response.ScoreDetailVO;
import com.learningworks.score.vo.response.ScoreVO;
import com.learningworks.score.vo.response.StudentScoreVO;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "성적", description = "과정 성적 · 내 성적")
@RestController
@RequiredArgsConstructor
@RequestMapping("/scores")
public class ScoreController {

  private final ScoreService scoreService;

  @LoginRequired
  @GetMapping("/{courseId}/me")
  public ApiResponse<List<ScoreVO>> getMyScoreList(@PathVariable String courseId) {
    String loginId = AuthUtil.getLoginId();
    List<ScoreVO> result = this.scoreService.readMyScoreList(loginId, courseId);

    return ApiResponse.OK(result);
  }

  @RequireAction(domain = "SCORE", action = "READ_COURSE", description = "과정 성적 조회")
  @GetMapping("/{courseId}")
  public ApiResponse<List<StudentScoreVO>> getCourseScoreList(@PathVariable String courseId) {
    String loginId = AuthUtil.getLoginId();
    List<StudentScoreVO> result = this.scoreService.readCourseScoreList(loginId, courseId);

    return ApiResponse.OK(result);
  }

  /** 내 과정 전체 석차 (채점 끝난 응시 시험의 100점 환산 평균 기준. 없으면 null) */
  @LoginRequired
  @GetMapping("/{courseId}/me/rank")
  public ApiResponse<CourseRankVO> getMyCourseRank(@PathVariable String courseId) {
    return ApiResponse.OK(this.scoreService.readMyCourseRank(AuthUtil.getLoginId(), courseId));
  }

  /** 내 시험 상세 결과 (채점 완료 + 시험 마감 뒤에만. 아니면 403 SCORE_RESULT_NOT_OPEN) */
  @LoginRequired
  @GetMapping("/{courseId}/me/tests/{testSetId}")
  public ApiResponse<ScoreDetailVO> getMyScoreDetail(@PathVariable String courseId, @PathVariable String testSetId) {
    String loginId = AuthUtil.getLoginId();
    ScoreDetailVO result = this.scoreService.readMyScoreDetail(loginId, courseId, testSetId);

    return ApiResponse.OK(result);
  }

  /** 강사 · 관리자: 수강생 1명이 보는 내 성적 목록 (학생 화면 그대로 보기) */
  @RequireAction(domain = "SCORE", action = "READ_COURSE", description = "과정 성적 조회")
  @GetMapping("/{courseId}/students/{courseStudentId}")
  public ApiResponse<List<ScoreVO>> getStudentScoreList(@PathVariable String courseId,
      @PathVariable String courseStudentId) {
    return ApiResponse.OK(
        this.scoreService.readStudentScoreList(AuthUtil.getLoginId(), courseId, courseStudentId));
  }

  /** 강사 · 관리자: 수강생 1명의 과정 전체 석차 (없으면 null) */
  @RequireAction(domain = "SCORE", action = "READ_COURSE", description = "과정 성적 조회")
  @GetMapping("/{courseId}/students/{courseStudentId}/rank")
  public ApiResponse<CourseRankVO> getStudentCourseRank(@PathVariable String courseId,
      @PathVariable String courseStudentId) {
    return ApiResponse.OK(
        this.scoreService.readStudentCourseRank(AuthUtil.getLoginId(), courseId, courseStudentId));
  }

  @RequireAction(domain = "SCORE", action = "READ_COURSE", description = "과정 성적 조회")
  @GetMapping("/{courseId}/students/{courseStudentId}/tests/{testSetId}")
  public ApiResponse<ScoreDetailVO> getStudentScoreDetail(@PathVariable String courseId,
      @PathVariable String courseStudentId, @PathVariable String testSetId) {
    String loginId = AuthUtil.getLoginId();
    ScoreDetailVO result = this.scoreService.readStudentScoreDetail(loginId, courseId, courseStudentId, testSetId);

    return ApiResponse.OK(result);
  }

}
