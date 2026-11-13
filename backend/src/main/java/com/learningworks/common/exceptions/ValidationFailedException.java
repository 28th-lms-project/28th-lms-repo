package com.learningworks.common.exceptions;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.learningworks.common.exceptions.enums.ErrorCode;
import lombok.Getter;

/**
 * @Valid로 검사할 수 없는 입력값 오류를 서비스에서 필드별 메시지로 알릴 때 사용한다.
 * (예: 메뉴 단계에 따라 필수 여부가 달라지는 필드)
 *
 * GlobalExceptionHandler가 @Valid 실패와 같은 형식(GLOBAL_INVALID_PARAMETER + validations)으로 응답한다.
 *
 * 사용 예시:
 * throw ValidationFailedException.of("menuUrl", "메뉴 URL을 입력해주세요.");
 */
@Getter
public class ValidationFailedException extends LearningworksException {
  private static final long serialVersionUID = 1L;

  /** 필드명 → 에러 메시지 목록 (ApiResponse.validations와 같은 형식) */
  private final Map<String, List<String>> validations;

  public ValidationFailedException(Map<String, List<String>> validations) {
    super(ErrorCode.GLOBAL_INVALID_PARAMETER);
    this.validations = new LinkedHashMap<>(validations);
  }

  public static ValidationFailedException of(String field, String message) {
    return new ValidationFailedException(Map.of(field, List.of(message)));
  }

}
