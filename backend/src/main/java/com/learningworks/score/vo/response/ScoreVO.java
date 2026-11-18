package com.learningworks.score.vo.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScoreVO {
  private String testSetId;
  private String setName;
  private String testType;
  private Integer totalPoint;
  private Integer score;
  private Integer pendingCount;
  private Double averageScore;
}
