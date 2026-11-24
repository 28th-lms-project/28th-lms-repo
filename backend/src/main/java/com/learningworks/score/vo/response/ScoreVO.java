package com.learningworks.score.vo.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScoreVO {
  private String testSetId;
  private String setName;
  private String testType;
  /** 시험 공개 여부 (N: 마감 → 채점이 끝났으면 학생이 결과를 볼 수 있음) */
  private String showYn;
  private Integer totalPoint;
  private Integer score;
  private Integer pendingCount;
  private Double averageScore;
  /** 내 석차 (학생 본인 조회만. 미응시 · 채점 중 답안이 남은 시험은 null) */
  private Integer rankNo;
  /** 석차 산정 인원 (응시자 수) */
  private Integer rankTotal;
}
