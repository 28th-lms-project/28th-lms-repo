package com.learningworks.score.vo.response;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 수강생 1명의 시험 1건 상세 성적 (시험 정보 + 총점 · 획득 점수 + 문항별 결과)
 */
@Getter
@Setter
public class ScoreDetailVO {

  private String testSetId;

  private String setName;

  private String testType;

  /** 시험 공개 여부 (Y: 응시 중, N: 마감) */
  private String showYn;

  private String userName;

  /** 응시일 (첫 답안 저장 시각, 미응시면 null) */
  private String submittedAt;

  /** 총점 (삭제되지 않은 문항 배점 합) */
  private Integer totalPoint;

  /** 획득 점수 (미응시면 null) */
  private Integer score;

  /** 채점 중 (R) 문항 수 */
  private Integer pendingCount;

  private List<ScoreDetailItemVO> items;

}
