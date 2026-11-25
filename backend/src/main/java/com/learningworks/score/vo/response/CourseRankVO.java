package com.learningworks.score.vo.response;

import lombok.Getter;
import lombok.Setter;

/**
 * 과정 전체 석차 (채점 끝난 응시 시험의 100점 환산 평균 기준, 동점자 같은 석차)
 */
@Getter
@Setter
public class CourseRankVO {

  /** 로그인 ID (학생 응답에서는 내려주지 않음) */
  private String userId;

  /** 100점 환산 평균 */
  private Double averagePercent;

  /** 평균에 반영된 시험 수 */
  private Integer testCount;

  private Integer rankNo;

  /** 석차 산정 인원 */
  private Integer rankTotal;

}
