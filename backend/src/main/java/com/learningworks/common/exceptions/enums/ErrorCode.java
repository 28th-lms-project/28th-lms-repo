package com.learningworks.common.exceptions.enums;

import org.springframework.http.HttpStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * API 에러 응답에 사용하는 에러 코드.
 * 응답 body의 errorCode 필드에는 enum 이름(예: "USER_NOT_EXISTS")이 그대로 내려간다.
 * 클라이언트는 메시지 문자열이 아니라 errorCode로 에러 종류를 분기할 것.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

  // 400 BAD REQUEST
  GLOBAL_BAD_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."), //
  GLOBAL_INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "입력값을 확인해주세요."), //
  GLOBAL_INVALID_JSON(HttpStatus.BAD_REQUEST, "요청 본문(JSON)의 형식이 잘못되었거나 파싱할 수 없습니다."), //
  GLOBAL_TYPE_MISMATCH(HttpStatus.BAD_REQUEST, "요청 파라미터의 타입이 올바르지 않습니다."), //
  GLOBAL_MISSING_PARAMETER(HttpStatus.BAD_REQUEST, "필수 요청 파라미터가 누락되었습니다."), //
  FILES_BAD_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 파일 요청입니다."), //
  ROLE_ORDER_INVALID(HttpStatus.BAD_REQUEST, "최고 권한은 맨 위, 기본 권한은 맨 아래에 위치해야 합니다."), //
  ROLE_MOVE_SAME(HttpStatus.BAD_REQUEST, "같은 역할로는 이동할 수 없습니다."), //

  // 401 UNAUTHORIZED
  GLOBAL_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."), //
  USER_NOT_MATCHED_IDENTIFY(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 일치하지 않습니다."), //
  USER_FAILURE_LOGIN(HttpStatus.UNAUTHORIZED, "로그인을 실패했습니다. 잠시 후 다시 시도해주세요."), //

  // 403 FORBIDDEN
  GLOBAL_FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."), //
  USER_BLOCKED_LOGIN(HttpStatus.FORBIDDEN, "로그인 실패 횟수가 누적되어 계정이 차단되었습니다."), //
  COURSE_NOT_AUTHORIZED(HttpStatus.FORBIDDEN, "해당 강의에 대한 권한이 없습니다."), //
  ROLE_SELF_CHANGE(HttpStatus.FORBIDDEN, "자신의 역할은 변경할 수 없습니다."), //
  ROLE_ASSIGN_FORBIDDEN(HttpStatus.FORBIDDEN, "자신보다 낮은 역할만 지정할 수 있습니다."), //
  ROLE_TARGET_FORBIDDEN(HttpStatus.FORBIDDEN, "자신보다 높거나 같은 역할의 회원은 변경할 수 없습니다."), //

  // 404 NOT FOUND
  GLOBAL_NOT_FOUND_URL(HttpStatus.NOT_FOUND, "존재하지 않는 URL이거나 요청 주소가 잘못되었습니다."), //
  USER_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다."), //
  COURSE_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 강의입니다."), //
  FILES_NOT_FOUND_FILE(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다."), //
  ROLE_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 역할입니다."), //
  EXAM_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 문제입니다."), //

  // 405 METHOD NOT ALLOWED
  GLOBAL_METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 HTTP 메서드 요청입니다."), //

  // 409 CONFLICT
  GLOBAL_DUPLICATED(HttpStatus.CONFLICT, "이미 존재하는 데이터입니다."), //
  USER_USED(HttpStatus.CONFLICT, "이미 사용 중인 정보입니다."), //
  ROLE_ID_USED(HttpStatus.CONFLICT, "이미 사용 중인 역할 ID입니다."), //
  ROLE_IN_USE(HttpStatus.CONFLICT, "해당 역할을 사용 중인 회원이 있어 삭제할 수 없습니다. 회원의 역할을 먼저 변경해주세요."), //
  ROLE_PROTECTED(HttpStatus.CONFLICT, "시스템 기본 역할은 삭제할 수 없습니다."), //
  ROLE_ORDER_OUTDATED(HttpStatus.CONFLICT, "역할 목록이 변경되었습니다. 새로고침 후 다시 시도해주세요."), //

  // 413 CONTENT TOO LARGE
  FILES_TOO_LARGE(HttpStatus.CONTENT_TOO_LARGE, "업로드 가능한 파일 크기를 초과했습니다."), //

  // 415 UNSUPPORTED MEDIA TYPE
  GLOBAL_UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "지원하지 않는 Content-Type 요청입니다."), //

  // 500 INTERNAL SERVER ERROR
  GLOBAL_SYSTEM_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요."), //
  USER_FAILURE_EXIT(HttpStatus.INTERNAL_SERVER_ERROR, "회원 탈퇴를 실패했습니다."), //
  ROLE_FAILURE_CREATE(HttpStatus.INTERNAL_SERVER_ERROR, "역할 생성을 실패했습니다."), //
  EXAM_FAILURE_CREATE(HttpStatus.INTERNAL_SERVER_ERROR, "문제 등록에 실패했습니다."), //
  EXAM_FAILURE_UPDATE(HttpStatus.INTERNAL_SERVER_ERROR, "문제 수정에 실패했습니다."), //
  FILES_SYSTEM_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "파일 처리 중 오류가 발생했습니다."), //
  ;

  private final HttpStatus status;
  private final String message;

}
