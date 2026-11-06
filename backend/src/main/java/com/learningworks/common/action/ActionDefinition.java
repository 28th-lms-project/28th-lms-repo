package com.learningworks.common.action;

/**
 * @RequireAction 하나에서 읽은 권한 코드 정의.
 *
 * @param domain 기능 단위 이름 (예: ROLE)
 * @param action 행위 (예: DELETE)
 * @param actionCode 권한 코드 (예: ROLE_DELETE)
 * @param description 설명 (예: "역할 삭제")
 * @param source 처음 정의된 위치 (예: "RoleController#deleteRole(String)"). 오류 메시지용
 */
public record ActionDefinition(String domain, String action, String actionCode,
    String description, String source) {

}
