package com.learningworks.common.utils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.vo.PaginationVO;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 수업 중 진행한 Articles에서 ApiResponseV2 코드
 * PaginationVO와 검색 VO를 넣는 Object가 분리되어 있음!
 * ==> 검색VO는 PaginationVO를 extend할 필요 없다!
 *
 * 실제 HTTP 응답 상태 코드는 ApiResponseStatusAdvice가 httpStatusCode 값으로 자동 설정한다.
 * 따라서 컨트롤러/핸들러에서는 HttpServletResponse.setStatus()를 호출할 필요가 없다.
 *
 * 객체 생성은 반드시 정적 팩토리 메서드(OK, CREATED, ERROR, BAD_REQUEST)로만 한다.
 *
 * @param <T> Response Body에 담길 객체
 */
@Data
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(Include.NON_NULL)
public class ApiResponse<T> {

  /** 필드명을 특정할 수 없는 검증 오류(클래스 레벨 제약 등)를 담는 키 */
  public static final String GLOBAL_VALIDATION_KEY = "global";

  /** 숫자/날짜 등 타입 변환 실패 시 내부 예외 메시지 대신 내려줄 메시지 */
  private static final String BINDING_FAILURE_MESSAGE = "올바른 형식의 값이 아닙니다.";

  private int httpStatusCode;
  private String httpStatusMessage;

  private T body;

  /** 에러 종류 식별 코드 (ErrorCode enum 이름) */
  private String errorCode;
  private String error;

  private PaginationVO paginate;
  /**
   * 검색 기능에서, 검색어에 해당하는 VO를 넣음
   * 예> SearchMemberVO, SearchArticleVO, ...
   * response에서 검색어를 확인할 수 있다.
   */
  private Object search;

  private Map<String, List<String>> validations;

  public static <T> ApiResponse<T> OK(T t) {
    return success(HttpStatus.OK, t);
  }

  /**
   * 페이징 목록 응답.
   *
   * @param t 목록 데이터
   * @param paginate calculatePageCount()까지 호출된 PaginationVO
   */
  public static <T> ApiResponse<T> OK(T t, PaginationVO paginate) {
    return OK(t, paginate, null);
  }

  /**
   * 검색 + 페이징 목록 응답.
   *
   * @param t 목록 데이터
   * @param paginate calculatePageCount()까지 호출된 PaginationVO
   * @param search 요청에 사용된 검색 조건 VO (응답에서 검색어를 확인할 수 있다)
   */
  public static <T> ApiResponse<T> OK(T t, PaginationVO paginate, Object search) {
    ApiResponse<T> result = success(HttpStatus.OK, t);
    result.setPaginate(paginate);
    result.setSearch(search);

    return result;
  }

  public static <T> ApiResponse<T> CREATED(T t) {
    return success(HttpStatus.CREATED, t);
  }

  /**
   * Validation 실패 응답. 필드명별로 에러 메시지 목록을 담는다.
   *
   * @param errors BindingResult 또는 HandlerMethodValidationException의 에러 목록
   */
  public static <T> ApiResponse<T> BAD_REQUEST(List<? extends MessageSourceResolvable> errors) {
    Map<String, List<String>> validations = new LinkedHashMap<>();
    errors.forEach(error -> validations
        .computeIfAbsent(resolveFieldName(error), key -> new ArrayList<>())
        .add(resolveMessage(error)));

    return BAD_REQUEST(validations);
  }

  /**
   * Validation 실패 응답. 이미 "필드명 → 메시지 목록"으로 정리된 결과를 그대로 담는다.
   *
   * @param validations 필드명별 에러 메시지 목록
   */
  public static <T> ApiResponse<T> BAD_REQUEST(Map<String, List<String>> validations) {
    ApiResponse<T> result = ERROR(ErrorCode.GLOBAL_INVALID_PARAMETER);
    result.setValidations(validations);

    return result;
  }

  /**
   * ErrorCode에 정의된 상태 코드와 메시지로 에러 응답을 생성한다.
   * Validation 실패를 제외한 모든 에러는 이 메서드로 공통 처리!
   */
  public static <T> ApiResponse<T> ERROR(ErrorCode errorCode) {
    HttpStatus status = errorCode.getStatus();

    ApiResponse<T> result = new ApiResponse<>();
    result.setHttpStatusCode(status.value());
    result.setHttpStatusMessage(status.getReasonPhrase());
    result.setErrorCode(errorCode.name());
    result.setError(errorCode.getMessage());

    return result;
  }

  private static <T> ApiResponse<T> success(HttpStatus status, T t) {
    ApiResponse<T> result = new ApiResponse<>();
    result.setHttpStatusCode(status.value());
    result.setHttpStatusMessage(status.getReasonPhrase());
    result.setBody(t);

    return result;
  }

  /**
   * 검증 오류에서 응답의 key로 사용할 이름을 추출한다.
   * - FieldError: 필드명 (예: roleId)
   * - ObjectError: 클래스 레벨 제약 → 객체명 (예: registRoleVO)
   * - 메서드 파라미터 제약(@NotBlank @RequestParam 등): arguments[0]에 담긴 파라미터명
   * 위 어느 것도 아니면 "global"
   */
  private static String resolveFieldName(MessageSourceResolvable error) {
    if (error instanceof FieldError fieldError) {
      return fieldError.getField();
    }
    if (error instanceof ObjectError objectError) {
      return objectError.getObjectName();
    }

    Object[] arguments = error.getArguments();
    if (arguments != null && arguments.length > 0
        && arguments[0] instanceof MessageSourceResolvable param
        && param.getDefaultMessage() != null) {
      return param.getDefaultMessage();
    }
    return GLOBAL_VALIDATION_KEY;
  }

  /**
   * 검증 오류 메시지를 추출한다.
   * 타입 변환 실패(예: long 필드에 "abc")는 기본 메시지에 Java 타입 정보가 노출되므로 공통 문구로 대체한다.
   */
  private static String resolveMessage(MessageSourceResolvable error) {
    if (error instanceof FieldError fieldError && fieldError.isBindingFailure()) {
      return BINDING_FAILURE_MESSAGE;
    }
    return error.getDefaultMessage();
  }

}
