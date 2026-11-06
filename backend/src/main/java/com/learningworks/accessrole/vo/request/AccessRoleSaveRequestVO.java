package com.learningworks.accessrole.vo.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AccessRoleSaveRequestVO {

    private String roleId;

    private List<String> actionIds;
}