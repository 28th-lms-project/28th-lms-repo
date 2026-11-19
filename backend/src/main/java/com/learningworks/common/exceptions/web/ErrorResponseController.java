package com.learningworks.common.exceptions.web;

import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.action.PublicApi;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.ApiResponse;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Hidden;

/**
 * GlobalExceptionHandler가 처리하지 못한 에러의 최종 폴백.
 * - 존재하지 않는 URL(404)
 * - 필터(Spring Security, JWT 등)에서 발생한 예외 / sendError(401, 403 ...)
 * - Spring이 DefaultHandlerExceptionResolver로 처리한 checked 예외
 *
 * 주의
 * - Security 설정에서 인증을 강화할 때 "/error"는 반드시 permitAll 해야 한다.
 * - 권한 검사 인터셉터는 에러 포워딩(/error)에도 실행되므로 @PublicApi가 필요하다.
 *   없으면 권한 어노테이션이 없는 API로 취급되어(기본값: SUPER_ADMIN 전용) 모든 에러 응답이 401/403으로 바뀐다.
 */
@Slf4j
@Hidden // 스프링 오류 처리용 (/error) 이라 API 명세에서 제외
@RestController
public class ErrorResponseController implements ErrorController {

  // GET, POST, PUT 등 모든 메서드의 에러 포워딩 처리
  @PublicApi
  @RequestMapping("/error")
  public ApiResponse<Void> sendErrorPage(HttpServletRequest request) {

    HttpStatus httpStatus = resolveStatus(request);

    // 필터 등에서 발생한 5xx 예외는 GlobalExceptionHandler를 거치지 않으므로 여기서 로그를 남긴다.
    if (httpStatus.is5xxServerError()) {
      Object exception = request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);
      Object uri = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
      if (exception instanceof Throwable throwable) {
        log.error("처리되지 않은 서버 오류 발생 URI: {}", uri, throwable);
      } else {
        log.error("처리되지 않은 서버 오류 발생 URI: {}, status: {}", uri, httpStatus.value());
      }
    }

    return ApiResponse.ERROR(toErrorCode(httpStatus));
  }

  /** 서블릿 컨테이너가 전달한 실제 에러 상태 코드. 없거나 알 수 없으면 500 */
  private HttpStatus resolveStatus(HttpServletRequest request) {
    Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
    if (status == null) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    HttpStatus httpStatus = HttpStatus.resolve(Integer.parseInt(status.toString()));
    return httpStatus != null ? httpStatus : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /** 상태 코드 → ErrorCode. 정의되지 않은 4xx는 400, 그 외는 500으로 응답한다. */
  private ErrorCode toErrorCode(HttpStatus httpStatus) {
    return switch (httpStatus) {
      case BAD_REQUEST -> ErrorCode.GLOBAL_BAD_REQUEST;
      case UNAUTHORIZED -> ErrorCode.GLOBAL_UNAUTHORIZED;
      case FORBIDDEN -> ErrorCode.GLOBAL_FORBIDDEN;
      case NOT_FOUND -> ErrorCode.GLOBAL_NOT_FOUND_URL;
      case METHOD_NOT_ALLOWED -> ErrorCode.GLOBAL_METHOD_NOT_ALLOWED;
      case CONTENT_TOO_LARGE -> ErrorCode.FILES_TOO_LARGE;
      case UNSUPPORTED_MEDIA_TYPE -> ErrorCode.GLOBAL_UNSUPPORTED_MEDIA_TYPE;
      default -> httpStatus.is4xxClientError()
          ? ErrorCode.GLOBAL_BAD_REQUEST
          : ErrorCode.GLOBAL_SYSTEM_ERROR;
    };
  }
}
