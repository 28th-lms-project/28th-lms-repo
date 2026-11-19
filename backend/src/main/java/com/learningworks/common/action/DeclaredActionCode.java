package com.learningworks.common.action;

/**
 * API(@RequireAction)에 붙지 않는 권한 코드 하나. ActionCodeDeclarer가 선언한다.
 * 예: "과정에 등록되지 않아도 모든 과정을 관리"처럼 서비스 안에서 AccessChecker.hasAction으로 묻는 권한.
 *
 * 권한 코드 = domain + "_" + action (예: COURSE_ALL_MANAGE). 이름 규칙 · 길이 · description은 @RequireAction과 같다.
 *
 * @param domain 기능 단위 이름 (예: COURSE)
 * @param action 행위 (예: ALL_MANAGE)
 * @param description 설명 (예: "모든 과정 관리"). 권한 관리 화면에 그대로 보인다
 */
public record DeclaredActionCode(String domain, String action, String description) {

  /** 권한 코드 (domain + "_" + action) */
  public String actionCode() {
    return this.domain + "_" + this.action;
  }
}
