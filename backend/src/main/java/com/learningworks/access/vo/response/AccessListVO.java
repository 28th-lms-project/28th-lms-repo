package com.learningworks.access.vo.response;

import lombok.Data;

@Data
public class AccessListVO {

    private String actionId;

    private String actionCode;

    // 권한 코드가 등록부(@RequireAction)에 있는지. false면 화면에 "미사용" 표시
    private boolean actionCodeInUse;

    private String actionName;

    private String topMenuId;
    private String topMenuName;

    private String midMenuId;
    private String midMenuName;

    private String btmMenuId;
    private String btmMenuName;
}