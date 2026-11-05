package com.learningworks.role.vo.response;

import java.util.List;
import lombok.Data;

@Data
public class RoleListVO {

  private long roleCount;
  private List<RoleVO> roleList;

}
