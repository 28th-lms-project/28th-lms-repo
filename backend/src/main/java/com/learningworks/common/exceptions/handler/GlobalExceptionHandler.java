package com.learningworks.common.exceptions.handler;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.ValidationFailedException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import lombok.extern.slf4j.Slf4j;

/**
 * 컨트롤러에서 발생한 예외를 ApiResponse 형식으로 변환한다.
 * HTTP 상태 코드는 ApiResponseStatusAdvice가 ApiResponse.httpStatusCode로 자동 설정하므로
 * 여기서 HttpServletResponse.setStatus()를 호출할 필요가 없다.
 *
 * 참고: Spring은 메서드 선언 순서가 아니라 "예외 타입이 가장 가까운" 핸들러를 선택한다.
 *
 * 필터(Spring Security, JWT 등)에서 발생한 예외는 여기까지 오지 않고
 * ErrorResponseController(/error)에서 처리된다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  // LearningworksException이 throw 되면 아래 메소드가 실행된다.
  @ExceptionHandler(LearningworksException.class)
  public ApiResponse<Void> sendLearningworksExceptionMessage(LearningworksException lwe) {
    ErrorCode errorCode = lwe.getErrorCode();

    if (errorCode.getStatus().is5xxServerError()) {
      log.error("서버 오류 발생 [{}]: ", errorCode.name(), lwe);
    } else {
      log.debug("비즈니스 예외 발생 [{}]: {}", errorCode.name(), lwe.getMessage());
    }

    return ApiResponse.ERROR(errorCode);
  }

  // 서비스에서 검사한 입력값 오류. @Valid 실패와 같은 형식(validations)으로 응답한다.
  // LearningworksException의 하위 타입이므로 위 핸들러가 아니라 이 핸들러가 선택된다.
  @ExceptionHandler(ValidationFailedException.class)
  public ApiResponse<Void> handleValidationFailedException(ValidationFailedException vfe) {
    return ApiResponse.BAD_REQUEST(vfe.getValidations());
  }

  // 파라미터 Validation 예외 처리 (@NotBlank @RequestParam 등 파라미터에 직접 제약이 붙은 경우)
  @ExceptionHandler(HandlerMethodValidationException.class)
  public ApiResponse<Void> sendValidationExceptionMessage(HandlerMethodValidationException hmve) {
    return ApiResponse.BAD_REQUEST(hmve.getAllErrors());
  }

  // VO @Valid 예외 처리
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ApiResponse<Void> handleMethodArgumentNotValid(MethodArgumentNotValidException mane) {
    return ApiResponse.BAD_REQUEST(mane.getBindingResult().getAllErrors());
  }

  // @Validated(클래스 레벨)가 붙은 Controller/Service의 메서드 검증 실패
  // 처리하지 않으면 RuntimeException 핸들러로 넘어가 500이 된다.
  @ExceptionHandler(ConstraintViolationException.class)
  public ApiResponse<Void> handleConstraintViolationException(ConstraintViolationException cve) {
    Map<String, List<String>> validations = new LinkedHashMap<>();
    cve.getConstraintViolations().forEach(violation -> validations
        .computeIfAbsent(resolveLeafName(violation.getPropertyPath()), key -> new ArrayList<>())
        .add(violation.getMessage()));

    return ApiResponse.BAD_REQUEST(validations);
  }

  // 잘못된 JSON 바디 요청 예외 처리
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ApiResponse<Void> handleHttpMessageNotReadableException(
      HttpMessageNotReadableException e) {
    log.warn("잘못된 JSON 파싱 요청: {}", e.getMessage());
    return ApiResponse.ERROR(ErrorCode.GLOBAL_INVALID_JSON);
  }

  // URL 파라미터 타입 불일치
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ApiResponse<Void> handleMethodArgumentTypeMismatchException(
      MethodArgumentTypeMismatchException e) {
    log.warn("파라미터 타입 불일치: {}", e.getMessage());
    return ApiResponse.ERROR(ErrorCode.GLOBAL_TYPE_MISMATCH);
  }

  // 필수 @RequestParam 누락
  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ApiResponse<Void> handleMissingServletRequestParameterException(
      MissingServletRequestParameterException e) {
    log.warn("필수 파라미터 누락: {}", e.getMessage());
    return ApiResponse.ERROR(ErrorCode.GLOBAL_MISSING_PARAMETER);
  }

  // 지원하지 않는 HTTP Method
  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ApiResponse<Void> handleHttpRequestMethodNotSupportedException(
      HttpRequestMethodNotSupportedException e) {
    log.warn("지원하지 않는 HTTP 메서드 요청 발생: {}", e.getMessage());
    return ApiResponse.ERROR(ErrorCode.GLOBAL_METHOD_NOT_ALLOWED);
  }

  // 지원하지 않는 Content-Type
  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ApiResponse<Void> handleHttpMediaTypeNotSupportedException(
      HttpMediaTypeNotSupportedException e) {
    log.warn("지원하지 않는 Content-Type 요청: {}", e.getMessage());
    return ApiResponse.ERROR(ErrorCode.GLOBAL_UNSUPPORTED_MEDIA_TYPE);
  }

  // 업로드 파일 크기 초과 (RuntimeException이라 처리하지 않으면 500으로 응답됨)
  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ApiResponse<Void> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e) {
    log.warn("업로드 파일 크기 초과: {}", e.getMessage());
    return ApiResponse.ERROR(ErrorCode.FILES_TOO_LARGE);
  }

  // DB PK/UNIQUE 제약 위반 (Oracle ORA-00001)
  // 서비스에서 도메인별 ErrorCode로 변환하지 않은 경우의 공통 처리
  @ExceptionHandler(DuplicateKeyException.class)
  public ApiResponse<Void> handleDuplicateKeyException(DuplicateKeyException e) {
    log.warn("중복 키 제약 위반: {}", e.getMostSpecificCause().getMessage());
    return ApiResponse.ERROR(ErrorCode.GLOBAL_DUPLICATED);
  }

  // 스프링 시큐리티 권한 예외
  @ExceptionHandler(AuthorizationDeniedException.class)
  public ApiResponse<String> sendAuthorizationDeniedExceptionMessage(
      AuthorizationDeniedException ade, HttpServletRequest request) {

    String methodName = request.getMethod(); // get, post, put, delete
    String url = request.getRequestURI(); // 사용자가 요청한 Endpoint

    log.warn("접근 거부: {} {}", methodName, url);

    return ApiResponse.ERROR(ErrorCode.GLOBAL_FORBIDDEN);
  }

  // 위에서 처리되지 않은 모든 RuntimeException
  @ExceptionHandler(RuntimeException.class)
  public ApiResponse<Void> sendRuntimeExceptionMessage(RuntimeException re) {
    log.error("기타 예외 상황 발생: ", re);
    return ApiResponse.ERROR(ErrorCode.GLOBAL_SYSTEM_ERROR);
  }

  /**
   * ConstraintViolation의 propertyPath에서 마지막 이름을 추출한다.
   * 예> "createRole.registRoleVO.roleId" → "roleId", "readRole.roleId" → "roleId"
   */
  private String resolveLeafName(Path propertyPath) {
    String leafName = null;
    for (Path.Node node : propertyPath) {
      if (node.getName() != null) {
        leafName = node.getName();
      }
    }
    return leafName != null ? leafName : ApiResponse.GLOBAL_VALIDATION_KEY;
  }

}
