package com.learningworks.access.vo.response;

import lombok.Data;

@Data
public class AccessListVO {

    private String actionId;

    private String actionName;

    private String topMenuId;
    private String topMenuName;

    private String midMenuId;
    private String midMenuName;

    private String btmMenuId;
    private String btmMenuName;
}