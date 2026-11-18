package com.learningworks.score.vo.response;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentScoreVO {

  private String courseStudentId;

  private String userId;

  private String userName;

  private List<ScoreVO> scoreList;

}
