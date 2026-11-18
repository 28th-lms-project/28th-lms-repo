package com.learningworks.score.service;

import java.util.List;
import com.learningworks.score.vo.response.ScoreVO;
import com.learningworks.score.vo.response.StudentScoreVO;

public interface ScoreService {
  List<ScoreVO> readMyScoreList(String loginId, String courseId);

  List<StudentScoreVO> readCourseScoreList(String loginId, String courseId);
}
