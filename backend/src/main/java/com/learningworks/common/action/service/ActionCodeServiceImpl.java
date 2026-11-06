package com.learningworks.common.action.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import com.learningworks.common.action.ActionCodeRegistry;
import com.learningworks.common.action.ActionDefinition;
import com.learningworks.common.action.dao.ActionCodeDao;
import com.learningworks.common.action.vo.response.ActionCodeListVO;
import com.learningworks.common.action.vo.response.ActionCodeVO;
import com.learningworks.common.action.vo.response.ActionDomainVO;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ActionCodeServiceImpl implements ActionCodeService {

  private ActionCodeRegistry actionCodeRegistry;
  private ActionCodeDao actionCodeDao;

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
