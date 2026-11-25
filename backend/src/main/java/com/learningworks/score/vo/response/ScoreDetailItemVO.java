package com.learningworks.score.vo.response;

import lombok.Getter;
import lombok.Setter;

/**
 * 상세 성적의 문항 1개. 채점 결과(isCorrect): Y 정답, N 오답, H 부분정답, R 채점 중, null 미제출
 */
@Getter
@Setter
public class ScoreDetailItemVO {

  private String testId;

  private String question;

  private String subQuestion;

  private String answerType;

  private String answerSheet1;

  private String answerSheet2;

  private String answerSheet3;

  private String answerSheet4;

  private String answerSheet5;

  /** 배점 */
  private Integer pointAlloc;

  /** 정답 (주관식 · 코드는 저장되지 않아 null) */
  private String correctAnswer;

  /** 학생 제출 답안 */
  private String answer;

  private String isCorrect;

  /** 획득 점수 (성적 계산과 같은 규칙: Y 배점, H min(2, 배점), 그 외 0) */
  private Integer earnedPoint;

}
