package com.learningworks.access.vo.response;

import lombok.Data;

@Data
public class AccessMenuVO {

    private String id;

    private String title;

    private String parentId;

    private Integer order;
}