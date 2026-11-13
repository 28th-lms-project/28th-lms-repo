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
  ROLE_MOVE_TO_SUPER_ADMIN(HttpStatus.BAD_REQUEST, "최고 관리자 역할로는 회원을 이동할 수 없습니다."), //
  ACTION_CODE_NOT_EXISTS(HttpStatus.BAD_REQUEST, "등록되지 않은 권한 코드입니다."), //
  ACTION_MENU_INVALID(HttpStatus.BAD_REQUEST, "메뉴 정보가 올바르지 않습니다. 새로고침 후 다시 선택해주세요."), //
  INTERVIEW_STUDENT_NOT_IN_COURSE(HttpStatus.BAD_REQUEST, "해당 과정에 참여 중인 수강생이 아닙니다."), //
  FILES_NOT_ALLOWED_EXTENSION(HttpStatus.BAD_REQUEST, "업로드할 수 없는 파일 형식입니다."), //
  FILES_INVALID_CONTENT(HttpStatus.BAD_REQUEST, "파일 확장자와 실제 파일 형식이 일치하지 않습니다."), //
  COURSE_DATA_EMPTY_CONTENT(HttpStatus.BAD_REQUEST, "교육 자료 내용을 입력해주세요."), //
  LINK_PREVIEW_INVALID_URL(HttpStatus.BAD_REQUEST, "미리보기를 만들 수 없는 URL입니다. http:// 또는 https:// 로 시작하는 공개 주소만 사용할 수 있습니다."), //
  CODE_PARENT_INVALID(HttpStatus.BAD_REQUEST, "상위 변수로 지정할 수 없는 값입니다."), //
  MENU_PARENT_INVALID(HttpStatus.BAD_REQUEST, "소메뉴 아래에는 메뉴를 추가할 수 없습니다."), //
  MENU_ORDER_INVALID(HttpStatus.BAD_REQUEST, "메뉴 순서 정보가 올바르지 않습니다."), //
  MENU_ROLE_INVALID(HttpStatus.BAD_REQUEST, "존재하지 않는 역할이 포함되어 있습니다."), //

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
  HOMEWORK_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 과제입니다."), //
  FILES_NOT_FOUND_FILE(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다."), //
  ROLE_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 역할입니다."), //
  SURVEY_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 설문입니다."), //
  SURVEY_DATA_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 설문 답변입니다."), //
  EXAM_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 문제입니다."), //
  ACTION_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 접근 권한입니다."), //
  COURSE_DATA_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 교육 자료입니다."), //
  CODE_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 환경 변수입니다."), //
  MENU_NOT_EXISTS(HttpStatus.NOT_FOUND, "메뉴가 존재하지 않습니다."), //

  // 405 METHOD NOT ALLOWED
  GLOBAL_METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 HTTP 메서드 요청입니다."), //

  // 409 CONFLICT
  GLOBAL_DUPLICATED(HttpStatus.CONFLICT, "이미 존재하는 데이터입니다."), //
  USER_USED(HttpStatus.CONFLICT, "이미 사용 중인 정보입니다."), //
  ROLE_ID_USED(HttpStatus.CONFLICT, "이미 사용 중인 역할 ID입니다."), //
  ROLE_IN_USE(HttpStatus.CONFLICT, "해당 역할을 사용 중인 회원이 있어 삭제할 수 없습니다. 회원의 역할을 먼저 변경해주세요."), //
  ROLE_PROTECTED(HttpStatus.CONFLICT, "시스템 기본 역할은 삭제할 수 없습니다."), //
  ROLE_ORDER_OUTDATED(HttpStatus.CONFLICT, "역할 목록이 변경되었습니다. 새로고침 후 다시 시도해주세요."), //
  ACTION_CODE_USED(HttpStatus.CONFLICT, "이미 등록된 권한 코드입니다."), //
  ACTION_ROLE_PROTECTED(HttpStatus.CONFLICT, "최고 관리자 역할의 권한은 변경할 수 없습니다."), //
  FILES_IN_USE(HttpStatus.CONFLICT, "등록된 교육 자료에서 사용 중인 파일은 삭제할 수 없습니다."), //
  CODE_ID_USED(HttpStatus.CONFLICT, "이미 사용 중인 환경 변수 ID입니다."), //
  MENU_URL_USED(HttpStatus.CONFLICT, "이미 다른 메뉴에서 사용 중인 URL입니다."), //
  MENU_HAS_CHILDREN(HttpStatus.CONFLICT, "하위 메뉴가 있어 삭제할 수 없습니다. 하위 메뉴를 먼저 삭제해주세요."), //
  MENU_IN_USE(HttpStatus.CONFLICT, "이 메뉴를 사용하는 접근 권한(ACTION)이 있어 삭제할 수 없습니다. 접근 관리에서 먼저 변경해주세요."), //
  MENU_ORDER_OUTDATED(HttpStatus.CONFLICT, "메뉴 목록이 변경되었습니다. 새로고침 후 다시 시도해주세요."), //
  MENU_TITLE_USED(HttpStatus.CONFLICT, "같은 상위 메뉴에 이미 같은 이름의 메뉴가 있습니다."), //
  MENU_OUTDATED(HttpStatus.CONFLICT, "다른 사용자가 먼저 수정했습니다. 새로고침 후 다시 시도해주세요."), //
  MENU_SELF_LOCK(HttpStatus.CONFLICT, "저장하면 본인이 메뉴 관리 화면에 들어올 수 없게 됩니다. 본인 역할 해제 · 미사용 · URL 변경 · 삭제는 다른 관리자나 최고 관리자에게 요청해주세요."), //

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
  ACTION_FAILURE_SAVE(HttpStatus.INTERNAL_SERVER_ERROR, "접근 권한 저장을 실패했습니다."), //
  HOMEWORK_FAILURE_CREATE(HttpStatus.INTERNAL_SERVER_ERROR, "과제 등록을 실패했습니다."), //
  HOMEWORK_REPLY_FAILURE_CREATE(HttpStatus.INTERNAL_SERVER_ERROR, "댓글 등록을 실패했습니다."), //
  FILES_SYSTEM_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "파일 처리 중 오류가 발생했습니다."), //
  SURVEY_FAILURE_CREATE(HttpStatus.INTERNAL_SERVER_ERROR, "설문 생성을 실패했습니다."), //
  SURVEY_FAILURE_UPDATE(HttpStatus.INTERNAL_SERVER_ERROR, "설문 수정을 실패했습니다."), //
  SURVEY_DATA_FAILURE_CREATE(HttpStatus.INTERNAL_SERVER_ERROR, "설문 답변 생성을 실패했습니다."), //
  SURVEY_DATA_FAILURE_UPDATE(HttpStatus.INTERNAL_SERVER_ERROR, "설문 답변 수정을 실패했습니다."), //
  INTERVIEW_FAILURE_CREATE(HttpStatus.INTERNAL_SERVER_ERROR, "면접 일정 등록에 실패했습니다."), //
  COURSE_DATA_FAILURE_CREATE(HttpStatus.INTERNAL_SERVER_ERROR, "교육 자료 등록에 실패했습니다."), //
  COURSE_DATA_FAILURE_UPDATE(HttpStatus.INTERNAL_SERVER_ERROR, "교육 자료 수정에 실패했습니다."), //
  COURSE_DATA_FAILURE_DELETE(HttpStatus.INTERNAL_SERVER_ERROR, "교육 자료 삭제에 실패했습니다."), //
  CODE_FAILURE_CREATE(HttpStatus.INTERNAL_SERVER_ERROR, "환경 변수 생성에 실패했습니다."), //
  CODE_FAILURE_UPDATE(HttpStatus.INTERNAL_SERVER_ERROR, "환경 변수 수정에 실패했습니다."), //

  // 502 BAD GATEWAY
  LINK_PREVIEW_FAILURE(HttpStatus.BAD_GATEWAY, "링크 미리보기 정보를 가져올 수 없습니다."), //
  ;

  private final HttpStatus status;
  private final String message;

}
