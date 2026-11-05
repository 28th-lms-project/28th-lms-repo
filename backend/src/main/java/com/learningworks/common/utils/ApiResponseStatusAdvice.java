package com.learningworks.common.utils;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * ApiResponse를 반환하는 모든 핸들러(@RestController, @ExceptionHandler, /error)의
 * 실제 HTTP 상태 코드를 ApiResponse.httpStatusCode 값과 일치시킨다.
 *
 * 예> return ApiResponse.CREATED(vo); → HTTP 201
 *     return ApiResponse.ERROR(ErrorCode.USER_NOT_EXISTS); → HTTP 404
 *
 * ResponseEntity를 직접 반환하는 메서드는 대상이 아니다(그쪽에서 지정한 상태가 그대로 사용됨).
 */
@RestControllerAdvice
public class ApiResponseStatusAdvice implements ResponseBodyAdvice<Object> {

  @Override
  public boolean supports(MethodParameter returnType,
      Class<? extends HttpMessageConverter<?>> converterType) {
    return ApiResponse.class.isAssignableFrom(returnType.getParameterType());
  }

  @Override
  public Object beforeBodyWrite(Object body, MethodParameter returnType,
      MediaType selectedContentType, Class<? extends HttpMessageConverter<?>> selectedConverterType,
      ServerHttpRequest request, ServerHttpResponse response) {

    // httpStatusCode가 설정되지 않은(0) ApiResponse는 기존 상태를 유지한다.
    if (body instanceof ApiResponse<?> apiResponse && apiResponse.getHttpStatusCode() >= 100) {
      response.setStatusCode(HttpStatusCode.valueOf(apiResponse.getHttpStatusCode()));
    }
    return body;
  }

}
