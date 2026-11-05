package com.learningworks.role.service;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.role.dao.RoleDao;
import com.learningworks.role.vo.request.ModifyRoleVO;
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
    int insertedRow;
    try {
      insertedRow = this.roleDao.insertNewRole(registRoleVO);
    } catch (DuplicateKeyException dke) {
      // ROLE_ID(PK) 중복 - Oracle ORA-00001을 Spring이 DuplicateKeyException으로 변환해준다.
      throw new LearningworksException(ErrorCode.ROLE_ID_USED, dke);
    }
    if (insertedRow == 0) {
      throw new LearningworksException(ErrorCode.ROLE_FAILURE_CREATE);
    }
    RoleVO result = this.roleDao.selectRoleByRoleId(registRoleVO.getRoleId());

    // TODO USER_ROLE 테이블 갱신 필요할까?

    return result;
  }

  @Override
  public RoleVO updateRole(String roleId, ModifyRoleVO modifyRoleVO) {
    int updatedRow = this.roleDao.updateRoleDisplayName(roleId, modifyRoleVO);

    // PK 조건 UPDATE가 0건 = 해당 roleId가 존재하지 않음 (DB 에러가 아니라 정상 실행 결과)
    if (updatedRow == 0) {
      throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);
    }

    RoleVO result = this.roleDao.selectRoleByRoleId(roleId);

    return result;
  }

}
