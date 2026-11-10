package com.learningworks.common.action.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import com.learningworks.common.action.AccessChecker;
import com.learningworks.common.action.ActionCodeRegistry;
import com.learningworks.common.action.ActionDefinition;
import com.learningworks.common.action.dao.ActionCodeDao;
import com.learningworks.common.action.vo.response.ActionCodeListVO;
import com.learningworks.common.action.vo.response.ActionCodeVO;
import com.learningworks.common.action.vo.response.ActionDomainVO;
import com.learningworks.common.action.vo.response.MyActionCodeVO;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.role.RoleConstants;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ActionCodeServiceImpl implements ActionCodeService {

  private ActionCodeRegistry actionCodeRegistry;
  private ActionCodeDao actionCodeDao;
  private AccessChecker accessChecker;

  @Override
  public MyActionCodeVO readMyActionCodes(String userId) {
    if (userId == null) {
      throw new LearningworksException(ErrorCode.GLOBAL_UNAUTHORIZED);
    }

    MyActionCodeVO myActionCode = this.actionCodeDao.selectMyRoleByUserId(userId);
    if (myActionCode == null) {
      throw new LearningworksException(ErrorCode.GLOBAL_FORBIDDEN);
    }

    // SUPER_ADMIN은 모든 권한이 허용되므로 목록을 나열하지 않는다 (프론트는 superAdmin으로 판단)
    if (RoleConstants.SUPER_ADMIN_ROLE.equals(myActionCode.getRoleId())) {
      myActionCode.setSuperAdmin(true);
      myActionCode.setActionCodes(List.of());
      return myActionCode;
    }

    myActionCode.setActionCodes(
        this.accessChecker.getAllowedActionCodes(myActionCode.getRoleId()).stream()
            .sorted()
            .toList());
    return myActionCode;
  }

  @Override
  public ActionCodeListVO readActionCodeList() {
    Set<String> registeredCodes = new HashSet<>(this.actionCodeDao.selectRegisteredActionCodes());

    // 도메인 이름순. 등록부가 권한 코드 이름순이므로 도메인 안의 행위도 이름순
    Map<String, List<ActionCodeVO>> grouped = new TreeMap<>();
    for (ActionDefinition definition : this.actionCodeRegistry.getDefinitions()) {
      grouped.computeIfAbsent(definition.domain(), domain -> new ArrayList<>())
          .add(new ActionCodeVO(definition.actionCode(), definition.action(),
              definition.description(), registeredCodes.contains(definition.actionCode())));
    }

    List<ActionDomainVO> domainList = grouped.entrySet().stream()
        .map(entry -> new ActionDomainVO(entry.getKey(), entry.getValue()))
        .toList();

    return new ActionCodeListVO(this.actionCodeRegistry.getDefinitions().size(), domainList);
  }

}
