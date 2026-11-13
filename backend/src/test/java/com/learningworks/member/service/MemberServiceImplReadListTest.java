package com.learningworks.member.service;

import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import com.learningworks.member.dao.MemberDao;
import com.learningworks.member.vo.request.MemberSearchVO;
import com.learningworks.member.vo.response.MemberListVO;
import com.learningworks.role.service.RoleAssignPolicy;

/** 회원 목록 조회 (MemberServiceImpl.readMemberList) */
class MemberServiceImplReadListTest {

  private static final String ACTOR_ID = "admin";

  private MemberDao memberDao;
  private MemberServiceImpl memberService;

  @BeforeEach
  void setUp() {
    RoleAssignPolicy roleAssignPolicy = Mockito.mock(RoleAssignPolicy.class);
    this.memberDao = Mockito.mock(MemberDao.class);
    this.memberService = new MemberServiceImpl(roleAssignPolicy, this.memberDao);
  }

  private MemberListVO member(String id) {
    MemberListVO vo = new MemberListVO();
    vo.setId(id);
    return vo;
  }

  @Test
  @DisplayName("조회 결과가 0건이면 빈 목록을 반환하고 목록 쿼리는 실행하지 않는다")
  void emptyResultSkipsListQuery() {
    // Given
    MemberSearchVO searchVO = new MemberSearchVO();
    Mockito.when(this.memberDao.selectMemberCount(searchVO)).thenReturn(0L);

    // When
    List<MemberListVO> result =
        this.memberService.readMemberList(MemberServiceImplReadListTest.ACTOR_ID, searchVO);

    // Then
    Assertions.assertThat(result).isEmpty();
    Assertions.assertThat(searchVO.getPageCount()).isZero();

    // Verify
    Mockito.verify(this.memberDao, Mockito.never()).selectMemberList(ArgumentMatchers.any());
  }

  @Test
  @DisplayName("조회 결과가 있으면 페이지 정보를 계산하고 목록을 반환한다")
  void returnsListWithPageInfo() {
    // Given
    MemberSearchVO searchVO = new MemberSearchVO();
    searchVO.setPageNo(1);
    searchVO.setListSize(10);
    List<MemberListVO> page = List.of(this.member("tutor11"), this.member("tutor12"));
    Mockito.when(this.memberDao.selectMemberCount(searchVO)).thenReturn(25L);
    Mockito.when(this.memberDao.selectMemberList(searchVO)).thenReturn(page);

    // When
    List<MemberListVO> result =
        this.memberService.readMemberList(MemberServiceImplReadListTest.ACTOR_ID, searchVO);

    // Then
    Assertions.assertThat(result).isSameAs(page);
    // 25건 / 10건씩 = 3페이지 (Controller 가 같은 searchVO 를 paginate 로 내려준다)
    Assertions.assertThat(searchVO.getPageCount()).isEqualTo(3);

    // Verify: count 와 목록 쿼리에 같은 검색 조건이 전달된다
    Mockito.verify(this.memberDao).selectMemberCount(searchVO);
    Mockito.verify(this.memberDao).selectMemberList(searchVO);
  }

  @Test
  @DisplayName("검색 조건(roleId, keyword)이 그대로 DAO 에 전달된다")
  void passesSearchCondition() {
    // Given
    MemberSearchVO searchVO = new MemberSearchVO();
    searchVO.setRoleId("ROLE_TUTOR");
    searchVO.setKeyword("kim");
    Mockito.when(this.memberDao.selectMemberCount(searchVO)).thenReturn(1L);
    Mockito.when(this.memberDao.selectMemberList(searchVO))
        .thenReturn(List.of(this.member("kim01")));

    // When
    this.memberService.readMemberList(MemberServiceImplReadListTest.ACTOR_ID, searchVO);

    // Then
    // Verify
    Mockito.verify(this.memberDao)
        .selectMemberList(ArgumentMatchers.argThat(vo -> "ROLE_TUTOR".equals(vo.getRoleId())
            && "kim".equals(vo.getKeyword())));
  }

}
