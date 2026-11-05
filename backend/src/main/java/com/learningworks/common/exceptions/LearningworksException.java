package com.learningworks.common.exceptions;

import com.learningworks.common.exceptions.enums.ErrorCode;
import lombok.Getter;

@Getter
public class LearningworksException extends RuntimeException {
  private static final long serialVersionUID = 1L;

  private final ErrorCode errorCode;

  /**
   * 사용 예시:
   * throw new LearningworksException(ErrorCode.USER_USED);
   *
   * @param errorCode
   */
  public LearningworksException(ErrorCode errorCode) {
    super(errorCode.getMessage());
    this.errorCode = errorCode;
  }

  /**
   * 다른 예외(DB, 파일 등)를 감싸서 던질 때 사용. 원인 예외의 스택트레이스가 보존된다.
   * 사용 예시:
   * catch (DuplicateKeyException e) {
   *   throw new LearningworksException(ErrorCode.ROLE_ID_USED, e);
   * }
   *
   * @param errorCode
   * @param cause 원인 예외
   */
  public LearningworksException(ErrorCode errorCode, Throwable cause) {
    super(errorCode.getMessage(), cause);
    this.errorCode = errorCode;
  }

}
