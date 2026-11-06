package com.learningworks.common.action.vo.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

/** GET /action-codes 응답 */
@Data
@AllArgsConstructor
public class ActionCodeListVO {

  /** 전체 권한 코드 수 */
  private long actionCodeCount;

  /** 도메인 목록 (도메인 이름순) */
  private List<ActionDomainVO> domainList;

}
