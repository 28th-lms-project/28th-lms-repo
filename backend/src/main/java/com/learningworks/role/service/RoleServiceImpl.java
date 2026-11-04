package com.learningworks.role.service;

import org.springframework.stereotype.Service;
import com.learningworks.role.dao.RoleDao;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleListVO;
import com.learningworks.role.vo.response.RoleVO;
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

  @Override
  public RoleVO createRole(RegistRoleVO registRoleVO) {
    int insertedRow = this.roleDao.insertNewRole(registRoleVO);
    if (insertedRow == 0) {
      // throw 예외
    }
    RoleVO result = this.roleDao.selectRoleByRoleId(registRoleVO.getRoleId());

    // TODO USER_ROLE 테이블 갱신 필요할까?

    return result;
  }

}
