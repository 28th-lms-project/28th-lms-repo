package com.learningworks.role.service;

import org.springframework.stereotype.Service;
import com.learningworks.role.dao.RoleDao;
import com.learningworks.role.vo.response.RoleListVO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@AllArgsConstructor
@Service
public class RoleServiceImpl implements RoleService {

  RoleDao roleDao;

  @Override
  public RoleListVO readRoleList() {

    RoleListVO result = new RoleListVO();
    result.setRoleCount(this.roleDao.selectRoleCount());
    result.setRoleList(this.roleDao.selectAllRoles());

    return result;
  }

}
