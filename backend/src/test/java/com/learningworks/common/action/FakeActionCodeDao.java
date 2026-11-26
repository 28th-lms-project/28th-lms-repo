package com.learningworks.common.action;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.learningworks.common.action.dao.ActionCodeDao;
import com.learningworks.common.action.vo.response.MyActionCodeVO;

/** 테스트용 ActionCodeDao. 조회 횟수를 센다. */
class FakeActionCodeDao implements ActionCodeDao {

  final Map<String, String> baseRoles = new HashMap<>();
  final Map<String, List<String>> allowedActionCodes = new HashMap<>();
  final List<String> registeredActionCodes = new ArrayList<>();
  int allowedQueryCount = 0;

  @Override
  public String selectBaseRoleByUserId(String userId) {
    return this.baseRoles.get(userId);
  }

  @Override
  public MyActionCodeVO selectMyRoleByUserId(String userId) {
    String roleId = this.baseRoles.get(userId);
    if (roleId == null) {
      return null;
    }
    MyActionCodeVO myActionCode = new MyActionCodeVO();
    myActionCode.setRoleId(roleId);
    myActionCode.setRoleDisplayName(roleId + "_NAME");
    return myActionCode;
  }

  @Override
  public List<String> selectAllowedActionCodesByRoleId(String roleId) {
    this.allowedQueryCount++;
    return this.allowedActionCodes.getOrDefault(roleId, List.of());
  }

  @Override
  public List<String> selectRegisteredActionCodes() {
    return this.registeredActionCodes;
  }

}
