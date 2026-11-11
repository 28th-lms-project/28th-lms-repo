package com.learningworks.common.exceptions.handler;

import java.util.List;
import java.util.Map;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.learningworks.common.exceptions.ValidationFailedException;
import com.learningworks.common.utils.ApiResponse;

class GlobalExceptionHandlerTest {

  @Test
  @DisplayName("ValidationFailedException은 @Valid 실패와 같은 형식(GLOBAL_INVALID_PARAMETER + validations)으로 응답한다")
  void validationFailedException() {
    ApiResponse<Void> response = new GlobalExceptionHandler()
        .handleValidationFailedException(ValidationFailedException.of("menuUrl", "메뉴 URL을 입력해주세요."));

    Assertions.assertThat(response.getHttpStatusCode()).isEqualTo(400);
    Assertions.assertThat(response.getErrorCode()).isEqualTo("GLOBAL_INVALID_PARAMETER");
    Assertions.assertThat(response.getValidations())
        .isEqualTo(Map.of("menuUrl", List.of("메뉴 URL을 입력해주세요.")));
  }

}
