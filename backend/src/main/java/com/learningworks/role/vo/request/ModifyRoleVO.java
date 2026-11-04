package com.learningworks.role.vo.request;

import lombok.Data;

@Data
public class ModifyRoleVO {

  private String roleDisplayName;
  private String parentRoleId;

}
