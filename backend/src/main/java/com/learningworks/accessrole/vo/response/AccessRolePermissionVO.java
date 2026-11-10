package com.learningworks.accessrole.vo.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccessRolePermissionVO {

    private String roleId;
    private String roleDisplayName;

    private String actionId;
    private String actionName;

    private String lvl1;
    private String lvl2;
    private String lvl3;
}