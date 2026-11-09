package com.learningworks.access.vo.request;

import lombok.Data;

@Data
public class AccessSearchRequestVO {

    private String topMenuId;

    private String midMenuId;

    private String btmMenuId;

    private String actionName;
}