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

}
