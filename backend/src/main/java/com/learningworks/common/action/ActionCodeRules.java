package com.learningworks.common.action;

/**
 * 권한 코드(ACTION.ACTION_CODE) 규칙.
 */
public final class ActionCodeRules {

  /** @RequireAction의 domain, action 형식: 대문자 · 숫자, 단어 구분은 언더스코어 */
  public static final String NAME_PATTERN = "^[A-Z0-9]+(_[A-Z0-9]+)*$";

  /** ACTION.ACTION_CODE VARCHAR2(40 CHAR) */
  public static final int ACTION_CODE_MAX_LENGTH = 40;

  /** 권한 코드 = domain + "_" + action (예: ROLE_DELETE) */
  public static String toActionCode(RequireAction requireAction) {
    return requireAction.domain() + "_" + requireAction.action();
  }

  private ActionCodeRules() {}

}
