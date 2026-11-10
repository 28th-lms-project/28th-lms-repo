package com.learningworks.common.action.vo.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

/** 권한 코드 목록의 도메인 하나 (1번 드롭다운 선택지) */
@Data
@AllArgsConstructor
public class ActionDomainVO {

  /** 기능 단위 이름. 화면에 영문 그대로 표시 (예: ROLE, COURSE_NOTICE) */
  private String domain;

  /** 이 도메인의 행위 목록 (권한 코드 이름순) */
  private List<ActionCodeVO> actionList;

}
