package com.learningworks.member.service;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.member.dao.MemberDao;
import com.learningworks.member.vo.request.MemberCreateVO;
import com.learningworks.role.service.RoleAssignPolicy;

/** 관리자 회원 등록 (MemberServiceImpl.createMember) */
class MemberServiceImplCreateTest {

  private static final String ACTOR_ID = "admin";
  private static final String NEW_ID = "tutor01";
  private static final String RAW_PASSWORD = "password1234";

  private RoleAssignPolicy roleAssignPolicy;
  private MemberDao memberDao;
  private MemberServiceImpl memberService;

  @BeforeEach
  void setUp() {
    this.roleAssignPolicy = Mockito.mock(RoleAssignPolicy.class);
    this.memberDao = Mockito.mock(MemberDao.class);
    this.memberService = new MemberServiceImpl(this.roleAssignPolicy, this.memberDao);
  }

  private MemberCreateVO createVO() {
    MemberCreateVO vo = new MemberCreateVO();
    vo.setId(MemberServiceImplCreateTest.NEW_ID);
    vo.setPassword(MemberServiceImplCreateTest.RAW_PASSWORD);
    vo.setName("강사");
    vo.setBaseRole("ROLE_TUTOR");
    return vo;
  }

  @Test
  @DisplayName("등록 권한이 없으면 예외가 발생하고 DB 에 쓰지 않는다")
  void forbiddenRoleDoesNotInsert() {
    // Given
    MemberCreateVO vo = this.createVO();
    Mockito.doThrow(new LearningworksException(ErrorCode.ROLE_ASSIGN_FORBIDDEN))
        .when(this.roleAssignPolicy)
        .checkCreatable(MemberServiceImplCreateTest.ACTOR_ID, "ROLE_TUTOR");

    // When
    // Then
    Assertions
        .assertThatThrownBy(
            () -> this.memberService.createMember(MemberServiceImplCreateTest.ACTOR_ID, vo))
        .isInstanceOf(LearningworksException.class).extracting("errorCode")
        .isEqualTo(ErrorCode.ROLE_ASSIGN_FORBIDDEN);

    // Verify
    Mockito.verifyNoInteractions(this.memberDao);
  }

  @Test
  @DisplayName("이미 사용 중인 아이디면 예외가 발생하고 DB 에 쓰지 않는다")
  void duplicatedIdDoesNotInsert() {
    // Given
    MemberCreateVO vo = this.createVO();
    Mockito.when(this.memberDao.selectIdCount(MemberServiceImplCreateTest.NEW_ID)).thenReturn(1);

    // When
    // Then
    Assertions
        .assertThatThrownBy(
            () -> this.memberService.createMember(MemberServiceImplCreateTest.ACTOR_ID, vo))
        .isInstanceOf(LearningworksException.class).extracting("errorCode")
        .isEqualTo(ErrorCode.USER_USED);

    // Verify
    Mockito.verify(this.memberDao, Mockito.never()).insertUser(ArgumentMatchers.any(),
        ArgumentMatchers.anyString());
    Mockito.verify(this.memberDao, Mockito.never()).insertSalt(ArgumentMatchers.anyString(),
        ArgumentMatchers.anyString(), ArgumentMatchers.anyString());
  }

  @Test
  @DisplayName("USER insert 가 실패하면 예외가 발생하고 SALT 는 저장하지 않는다")
  void userInsertFailureDoesNotInsertSalt() {
    // Given
    MemberCreateVO vo = this.createVO();
    Mockito.when(this.memberDao.selectIdCount(MemberServiceImplCreateTest.NEW_ID)).thenReturn(0);
    Mockito.when(this.memberDao.insertUser(ArgumentMatchers.eq(vo), ArgumentMatchers.anyString()))
        .thenReturn(0);

    // When
    // Then
    Assertions
        .assertThatThrownBy(
            () -> this.memberService.createMember(MemberServiceImplCreateTest.ACTOR_ID, vo))
        .isInstanceOf(LearningworksException.class).extracting("errorCode")
        .isEqualTo(ErrorCode.GLOBAL_SYSTEM_ERROR);

    // Verify
    Mockito.verify(this.memberDao, Mockito.never()).insertSalt(ArgumentMatchers.anyString(),
        ArgumentMatchers.anyString(), ArgumentMatchers.anyString());
  }

  @Test
  @DisplayName("SALT insert 가 실패하면 예외가 발생한다 (트랜잭션 롤백 대상)")
  void saltInsertFailureThrows() {
    // Given
    MemberCreateVO vo = this.createVO();
    Mockito.when(this.memberDao.selectIdCount(MemberServiceImplCreateTest.NEW_ID)).thenReturn(0);
    Mockito.when(this.memberDao.insertUser(ArgumentMatchers.eq(vo), ArgumentMatchers.anyString()))
        .thenReturn(1);
    Mockito.when(this.memberDao.insertSalt(ArgumentMatchers.eq(MemberServiceImplCreateTest.NEW_ID),
        ArgumentMatchers.anyString(), ArgumentMatchers.anyString())).thenReturn(0);

    // When
    // Then
    Assertions
        .assertThatThrownBy(
            () -> this.memberService.createMember(MemberServiceImplCreateTest.ACTOR_ID, vo))
        .isInstanceOf(LearningworksException.class).extracting("errorCode")
        .isEqualTo(ErrorCode.GLOBAL_SYSTEM_ERROR);
  }

  @Test
  @DisplayName("정상 등록 시 해시된 비밀번호와 salt 를 저장하고 생성된 아이디를 반환한다")
  void createsMember() {
    // Given
    MemberCreateVO vo = this.createVO();
    Mockito.when(this.memberDao.selectIdCount(MemberServiceImplCreateTest.NEW_ID)).thenReturn(0);
    Mockito.when(this.memberDao.insertUser(ArgumentMatchers.eq(vo), ArgumentMatchers.anyString()))
        .thenReturn(1);
    Mockito.when(this.memberDao.insertSalt(ArgumentMatchers.eq(MemberServiceImplCreateTest.NEW_ID),
        ArgumentMatchers.anyString(), ArgumentMatchers.anyString())).thenReturn(1);

    // When
    String createdId = this.memberService.createMember(MemberServiceImplCreateTest.ACTOR_ID, vo);

    // Then
    Assertions.assertThat(createdId).isEqualTo(MemberServiceImplCreateTest.NEW_ID);

    // Verify
    ArgumentCaptor<String> passwordCaptor = ArgumentCaptor.forClass(String.class);
    ArgumentCaptor<String> saltCaptor = ArgumentCaptor.forClass(String.class);
    Mockito.verify(this.roleAssignPolicy).checkCreatable(MemberServiceImplCreateTest.ACTOR_ID,
        "ROLE_TUTOR");
    Mockito.verify(this.memberDao).insertUser(ArgumentMatchers.eq(vo), passwordCaptor.capture());
    // 등록자(CRTR_ID)로 요청한 관리자 ID 가 저장된다
    Mockito.verify(this.memberDao).insertSalt(ArgumentMatchers.eq(MemberServiceImplCreateTest.NEW_ID),
        saltCaptor.capture(), ArgumentMatchers.eq(MemberServiceImplCreateTest.ACTOR_ID));

    // 평문이 아닌 해시값이 저장된다 (SHA-256 hex 64자 = PWD 컬럼 길이)
    Assertions.assertThat(passwordCaptor.getValue())
        .isNotEqualTo(MemberServiceImplCreateTest.RAW_PASSWORD).hasSize(64);
    Assertions.assertThat(saltCaptor.getValue()).isNotBlank();
  }

}
