package com.learningworks.menu.service;

import java.util.List;
import java.util.Map;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.dao.DuplicateKeyException;
import com.learningworks.access.dao.AccessDao;
import com.learningworks.common.action.dao.ActionCodeDao;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.ValidationFailedException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.menu.vo.request.MenuOrderVO;
import com.learningworks.menu.vo.request.ModifyMenuOrderVO;
import com.learningworks.menu.vo.request.ModifyMenuParentVO;
import com.learningworks.menu.vo.request.ModifyMenuVO;
import com.learningworks.menu.vo.request.RegistMenuVO;
import com.learningworks.menu.vo.response.MenuListVO;
import com.learningworks.menu.vo.response.MenuVO;
import com.learningworks.menu.vo.response.MyMenuListVO;
import com.learningworks.menu.vo.response.MyMenuVO;
import com.learningworks.role.dao.RoleDao;
import com.learningworks.role.vo.response.RoleVO;

/**
 * 메뉴 서비스 (backend/docs/design/menu-design.md). 시나리오 번호(B1 ...)는 설계 문서 8장.
 *
 * <pre>
 * 테스트 메뉴 구성 (괄호: 허용 역할)
 * T1 Main (ADMIN, TUTOR, STUDENT)
 *   M1 Home (ADMIN, TUTOR, STUDENT)
 *     B1 Dashboard "/" (ADMIN, TUTOR, STUDENT)
 * T2 System Management (ADMIN, TUTOR, STUDENT)
 *   M2 과정 관리 (ADMIN, TUTOR)                  ← STUDENT 미허용
 *     B2 과정 목록 "/admin/course/list" (ADMIN, TUTOR, STUDENT)
 *     B3 과정 등록 "/admin/course/add" (ADMIN, TUTOR)  USE_YN = N
 *   M3 시스템 관리 (ADMIN, TUTOR)
 *     B4 메뉴 관리 "/admin/system/menu" (ADMIN, TUTOR)  ← 자기 잠금 보호 대상 (B4, M3, T2)
 *     B5 역할 관리 "/admin/system/role" (ADMIN)
 * </pre>
 */
class MenuServiceImplTest {

  static final String SUPER_ADMIN = "ROLE_SUPER_ADMIN";
  static final String ADMIN = "ROLE_ADMIN";
  static final String TUTOR = "ROLE_TUTOR";
  static final String STUDENT = "ROLE_STUDENT";

  FakeMenuDao menuDao;
  RoleDao roleDao;
  ActionCodeDao actionCodeDao;
  AccessDao accessDao;
  MenuServiceImpl menuService;

  static RoleVO role(String roleId) {
    RoleVO role = new RoleVO();
    role.setRoleId(roleId);
    role.setRoleDisplayName(roleId + "_NAME");
    return role;
  }

  static ErrorCode errorCodeOf(Runnable runnable) {
    try {
      runnable.run();
    } catch (LearningworksException lwe) {
      return lwe.getErrorCode();
    }
    return null;
  }

  static List<String> idsOf(List<? extends Object> menus) {
    return menus.stream()
        .map(menu -> menu instanceof MenuVO m ? m.getId() : ((MyMenuVO) menu).getId())
        .toList();
  }

  @BeforeEach
  void setUp() {
    this.menuDao = new FakeMenuDao();
    // 저장 순서를 일부러 섞는다 (정렬 확인용)
    this.menuDao.put("B5", "M3", 2, "역할 관리", "/admin/system/role", ADMIN);
    this.menuDao.put("T2", null, 2, "System Management", null, ADMIN, TUTOR, STUDENT);
    this.menuDao.put("T1", null, 1, "Main", null, ADMIN, TUTOR, STUDENT);
    this.menuDao.put("M1", "T1", 1, "Home", null, ADMIN, TUTOR, STUDENT).setSpread("Y");
    this.menuDao.put("B1", "M1", 1, "Dashboard", "/", ADMIN, TUTOR, STUDENT);
    this.menuDao.put("M3", "T2", 2, "시스템 관리", null, ADMIN, TUTOR);
    this.menuDao.put("M2", "T2", 1, "과정 관리", null, ADMIN, TUTOR);
    this.menuDao.put("B3", "M2", 2, "과정 등록", "/admin/course/add", ADMIN, TUTOR).setUseYn("N");
    this.menuDao.put("B2", "M2", 1, "과정 목록", "/admin/course/list", ADMIN, TUTOR, STUDENT);
    this.menuDao.put("B4", "M3", 1, "메뉴 관리", "/admin/system/menu", ADMIN, TUTOR);

    this.roleDao = Mockito.mock(RoleDao.class);
    Mockito.when(this.roleDao.selectAllRoles())
        .thenReturn(List.of(role(SUPER_ADMIN), role(ADMIN), role(TUTOR), role(STUDENT)));

    this.actionCodeDao = Mockito.mock(ActionCodeDao.class);
    Mockito.when(this.actionCodeDao.selectBaseRoleByUserId("super")).thenReturn(SUPER_ADMIN);
    Mockito.when(this.actionCodeDao.selectBaseRoleByUserId("admin")).thenReturn(ADMIN);
    Mockito.when(this.actionCodeDao.selectBaseRoleByUserId("tutor")).thenReturn(TUTOR);
    Mockito.when(this.actionCodeDao.selectBaseRoleByUserId("student")).thenReturn(STUDENT);

    this.accessDao = Mockito.mock(AccessDao.class);

    this.menuService =
        new MenuServiceImpl(this.menuDao, this.roleDao, this.actionCodeDao, this.accessDao);
  }

  @Nested
  @DisplayName("GET /menus/me 내 메뉴")
  class ReadMyMenus {

    MenuServiceImpl service() {
      return MenuServiceImplTest.this.menuService;
    }

    @Test
    @DisplayName("B1. 비로그인은 401, 회원이 없거나 탈퇴했으면 403")
    void unauthenticated() {
      Assertions.assertThat(errorCodeOf(() -> this.service().readMyMenus(null)))
          .isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);
      Assertions.assertThat(errorCodeOf(() -> this.service().readMyMenus("ghost")))
          .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
    }

    @Test
    @DisplayName("B2. SUPER_ADMIN은 미사용을 포함한 모든 메뉴를 (단계, 상위 메뉴, 순서)로 정렬해 받는다")
    void superAdminGetsAllMenus() {
      MyMenuListVO result = this.service().readMyMenus("super");

      Assertions.assertThat(result.isSuperAdmin()).isTrue();
      Assertions.assertThat(idsOf(result.getMenus()))
          .containsExactly("T1", "T2", "M1", "M2", "M3", "B1", "B2", "B3", "B4", "B5");
      MyMenuVO unused = result.getMenus().stream()
          .filter(menu -> menu.getId().equals("B3")).findFirst().orElseThrow();
      Assertions.assertThat(unused.getUseYn()).isEqualTo("N");
    }

    @Test
    @DisplayName("B3. 상위 메뉴가 허용되지 않으면 하위 메뉴는 허용되어 있어도 보이지 않는다")
    void parentNotAllowedHidesChildren() {
      MyMenuListVO result = this.service().readMyMenus("student");

      Assertions.assertThat(result.isSuperAdmin()).isFalse();
      Assertions.assertThat(idsOf(result.getMenus())).containsExactly("T1", "T2", "M1", "B1");
    }

    @Test
    @DisplayName("B4. 미사용 메뉴는 menus에 없고 guardUrls에는 있다")
    void unusedMenuOnlyInGuardUrls() {
      MyMenuListVO result = this.service().readMyMenus("tutor");

      Assertions.assertThat(idsOf(result.getMenus()))
          .containsExactly("T1", "T2", "M1", "M2", "M3", "B1", "B2", "B4");
      Assertions.assertThat(result.getMenus()).allMatch(menu -> menu.getUseYn().equals("Y"));
      Assertions.assertThat(result.getGuardUrls()).containsExactlyInAnyOrder("/",
          "/admin/course/list", "/admin/course/add", "/admin/system/menu", "/admin/system/role");
    }

    @Test
    @DisplayName("미사용 상위 메뉴 아래의 메뉴도 보이지 않는다")
    void unusedParentHidesChildren() {
      MenuServiceImplTest.this.menuDao.menus.get("M3").setUseYn("N");

      MyMenuListVO result = this.service().readMyMenus("admin");

      Assertions.assertThat(idsOf(result.getMenus()))
          .containsExactly("T1", "T2", "M1", "M2", "B1", "B2");
    }
  }

  @Nested
  @DisplayName("GET /menus 메뉴 목록")
  class ReadMenuList {

    @Test
    @DisplayName("전체 역할과, 역할 ID가 채워진 전체 메뉴를 정렬해 준다. SUPER_ADMIN은 roleIds에 넣지 않는다")
    void readsRolesAndMenus() {
      // 규칙상 저장하지 않지만, 혹시 있는 행도 응답에서는 뺀다
      MenuServiceImplTest.this.menuDao.menuRoles
          .add(new com.learningworks.menu.vo.response.MenuRoleVO("B5", SUPER_ADMIN));

      MenuListVO result = MenuServiceImplTest.this.menuService.readMenuList();

      Assertions.assertThat(result.getRoles()).extracting(RoleVO::getRoleId)
          .containsExactly(SUPER_ADMIN, ADMIN, TUTOR, STUDENT);
      Assertions.assertThat(idsOf(result.getMenus()))
          .containsExactly("T1", "T2", "M1", "M2", "M3", "B1", "B2", "B3", "B4", "B5");
      MenuVO b5 = result.getMenus().get(9);
      Assertions.assertThat(b5.getRoleIds()).containsExactly(ADMIN);
      Assertions.assertThat(b5.getMenuUrl()).isEqualTo("/admin/system/role");
      Assertions.assertThat(b5.getCrtDt()).isEqualTo("2026-11-10 09:00:00");
    }
  }

  static Map<String, List<String>> validationsOf(Runnable runnable) {
    try {
      runnable.run();
    } catch (ValidationFailedException vfe) {
      return vfe.getValidations();
    }
    return null;
  }

  static RegistMenuVO regist(String parentId, String title, String spread, String menuUrl,
      String... roleIds) {
    RegistMenuVO vo = new RegistMenuVO();
    vo.setParentId(parentId);
    vo.setTitle(title);
    vo.setUseYn("Y");
    vo.setSpread(spread);
    vo.setMenuUrl(menuUrl);
    vo.setRoleIds(List.of(roleIds));
    return vo;
  }

  @Nested
  @DisplayName("POST /menus 메뉴 등록")
  class CreateMenu {

    FakeMenuDao dao() {
      return MenuServiceImplTest.this.menuDao;
    }

    MenuVO create(RegistMenuVO vo) {
      return MenuServiceImplTest.this.menuService.createMenu(vo);
    }

    @Test
    @DisplayName("대메뉴: 맨 뒤 순서로 추가되고, spread는 N · menuUrl은 null로 저장된다")
    void createsTopMenu() {
      MenuVO result = this.create(regist(null, "My Page", "Y", "/ignored", ADMIN, TUTOR));

      Assertions.assertThat(result.getId()).isNotNull();
      Assertions.assertThat(result.getParentId()).isNull();
      Assertions.assertThat(result.getMenuOrder()).isEqualTo(3);
      Assertions.assertThat(result.getSpread()).isEqualTo("N");
      Assertions.assertThat(result.getMenuUrl()).isNull();
      Assertions.assertThat(result.getRoleIds()).containsExactlyInAnyOrder(ADMIN, TUTOR);
      Assertions.assertThat(result.getCrtDt()).isNotNull();
      Assertions.assertThat(result.getMdfyDt()).isNull();
      Assertions.assertThat(this.dao().roleIdsOf(result.getId()))
          .containsExactlyInAnyOrder(ADMIN, TUTOR);
    }

    @Test
    @DisplayName("중메뉴: spread는 필수(Y/N)이고, menuUrl은 null로 저장된다")
    void createsMidMenu() {
      MenuVO result = this.create(regist("T1", "Notice", "Y", "/ignored"));

      Assertions.assertThat(result.getMenuOrder()).isEqualTo(2);
      Assertions.assertThat(result.getSpread()).isEqualTo("Y");
      Assertions.assertThat(result.getMenuUrl()).isNull();
      Assertions.assertThat(result.getRoleIds()).isEmpty();

      Assertions.assertThat(validationsOf(() -> this.create(regist("T1", "A", null, null))))
          .isEqualTo(Map.of("spread", List.of("펼침 여부가 올바르지 않습니다.")));
      Assertions.assertThat(validationsOf(() -> this.create(regist("T1", "A", "X", null))))
          .isEqualTo(Map.of("spread", List.of("펼침 여부가 올바르지 않습니다.")));
    }

    @Test
    @DisplayName("소메뉴: menuUrl은 필수이고, spread는 N으로 저장된다")
    void createsBottomMenu() {
      MenuVO result = this.create(regist("M2", "과정 수정", "Y", "/admin/course/edit", ADMIN));

      Assertions.assertThat(result.getMenuOrder()).isEqualTo(3);
      Assertions.assertThat(result.getSpread()).isEqualTo("N");
      Assertions.assertThat(result.getMenuUrl()).isEqualTo("/admin/course/edit");
    }

    @Test
    @DisplayName("소메뉴 menuUrl 형식: 필수, '/'로 시작, 공백 없음, 100자 이하")
    void validatesMenuUrl() {
      Assertions.assertThat(validationsOf(() -> this.create(regist("M2", "A", null, null))))
          .isEqualTo(Map.of("menuUrl", List.of("메뉴 URL을 입력해주세요.")));
      Assertions.assertThat(validationsOf(() -> this.create(regist("M2", "A", null, " "))))
          .isEqualTo(Map.of("menuUrl", List.of("메뉴 URL을 입력해주세요.")));
      Assertions.assertThat(validationsOf(() -> this.create(regist("M2", "A", null, "admin/x"))))
          .isEqualTo(Map.of("menuUrl", List.of("메뉴 URL은 '/'로 시작해야 합니다.")));
      Assertions.assertThat(validationsOf(() -> this.create(regist("M2", "A", null, "/admin x"))))
          .isEqualTo(Map.of("menuUrl", List.of("메뉴 URL에는 공백을 넣을 수 없습니다.")));
      Assertions
          .assertThat(validationsOf(() -> this.create(regist("M2", "A", null, "/" + "a".repeat(100)))))
          .isEqualTo(Map.of("menuUrl", List.of("메뉴 URL은 100자 이하로 입력해주세요.")));
      Assertions.assertThat(this.create(regist("M2", "B", null, "/" + "a".repeat(99))).getMenuUrl())
          .hasSize(100);
    }

    @Test
    @DisplayName("상위 메뉴가 없으면 MENU_NOT_EXISTS, B6. 소메뉴 아래에 등록하면 MENU_PARENT_INVALID")
    void validatesParent() {
      Assertions.assertThat(errorCodeOf(() -> this.create(regist("NOPE", "A", "N", null))))
          .isEqualTo(ErrorCode.MENU_NOT_EXISTS);
      Assertions.assertThat(errorCodeOf(() -> this.create(regist("B2", "A", null, "/a"))))
          .isEqualTo(ErrorCode.MENU_PARENT_INVALID);
    }

    @Test
    @DisplayName("B7. 다른 메뉴가 쓰는 URL이면 MENU_URL_USED")
    void rejectsUsedMenuUrl() {
      Assertions
          .assertThat(errorCodeOf(() -> this.create(regist("M3", "A", null, "/admin/course/list"))))
          .isEqualTo(ErrorCode.MENU_URL_USED);
    }

    @Test
    @DisplayName("동시에 같은 URL이 등록되어 UNIQUE 제약에 걸려도 MENU_URL_USED")
    void uniqueConstraintOnMenuUrl() {
      FakeMenuDao racingDao = new FakeMenuDao() {
        @Override
        public int insertMenu(MenuVO menu) {
          throw new DuplicateKeyException("UK_MENU_URL");
        }
      };
      racingDao.put("M9", "T9", 1, "그룹", null);
      racingDao.put("T9", null, 1, "섹션", null);
      MenuServiceImpl service = new MenuServiceImpl(racingDao, MenuServiceImplTest.this.roleDao,
          MenuServiceImplTest.this.actionCodeDao, MenuServiceImplTest.this.accessDao);

      Assertions.assertThat(errorCodeOf(() -> service.createMenu(regist("M9", "A", null, "/a"))))
          .isEqualTo(ErrorCode.MENU_URL_USED);
    }

    @Test
    @DisplayName("B18. 같은 상위 메뉴에 같은 이름은 MENU_TITLE_USED, 다른 상위 메뉴면 성공")
    void rejectsSameTitleInSameParent() {
      Assertions.assertThat(errorCodeOf(() -> this.create(regist("M2", "과정 목록", null, "/x"))))
          .isEqualTo(ErrorCode.MENU_TITLE_USED);
      Assertions.assertThat(this.create(regist("M3", "과정 목록", null, "/x")).getTitle())
          .isEqualTo("과정 목록");
    }

    @Test
    @DisplayName("B19. 이름은 앞뒤 공백을 제거해 저장하고, 비교한다")
    void trimsTitle() {
      Assertions.assertThat(errorCodeOf(() -> this.create(regist("M2", "  과정 목록 ", null, "/x"))))
          .isEqualTo(ErrorCode.MENU_TITLE_USED);
      Assertions.assertThat(this.create(regist("M2", "  과정 삭제 ", null, "/x")).getTitle())
          .isEqualTo("과정 삭제");
    }

    @Test
    @DisplayName("B11. roleIds의 SUPER_ADMIN과 중복은 저장하지 않는다")
    void skipsSuperAdminRole() {
      MenuVO result = this.create(regist("T1", "A", "N", null, SUPER_ADMIN, ADMIN, ADMIN));

      Assertions.assertThat(result.getRoleIds()).containsExactly(ADMIN);
      Assertions.assertThat(this.dao().roleIdsOf(result.getId())).containsExactly(ADMIN);
    }

    @Test
    @DisplayName("roleIds에 없는 역할이 있으면 MENU_ROLE_INVALID, 아무것도 저장하지 않는다")
    void rejectsUnknownRole() {
      int before = this.dao().menus.size();

      Assertions.assertThat(errorCodeOf(() -> this.create(regist("T1", "A", "N", null, "ROLE_NOPE"))))
          .isEqualTo(ErrorCode.MENU_ROLE_INVALID);
      Assertions.assertThat(this.dao().menus).hasSize(before);
    }
  }

  /** 메뉴의 현재 값으로 만든 수정 요청 (mdfyDt 포함) */
  ModifyMenuVO modifyOf(String menuId) {
    MenuVO stored = this.menuDao.menus.get(menuId);
    ModifyMenuVO vo = new ModifyMenuVO();
    vo.setTitle(stored.getTitle());
    vo.setUseYn(stored.getUseYn());
    vo.setSpread(stored.getSpread());
    vo.setMenuUrl(stored.getMenuUrl());
    vo.setRoleIds(this.menuDao.roleIdsOf(menuId));
    vo.setMdfyDt(stored.getMdfyDt());
    return vo;
  }

  static ModifyMenuVO withRoles(ModifyMenuVO vo, String... roleIds) {
    vo.setRoleIds(List.of(roleIds));
    return vo;
  }

  @Nested
  @DisplayName("PUT /menus/{menuId} 메뉴 수정")
  class UpdateMenu {

    FakeMenuDao dao() {
      return MenuServiceImplTest.this.menuDao;
    }

    MenuVO update(String actorId, String menuId, ModifyMenuVO vo) {
      return MenuServiceImplTest.this.menuService.updateMenu(actorId, menuId, vo);
    }

    ModifyMenuVO modifyOf(String menuId) {
      return MenuServiceImplTest.this.modifyOf(menuId);
    }

    @Test
    @DisplayName("이름 · 사용 여부 · 역할을 저장하고, 메뉴 행을 잠근 뒤 MDFY_DT를 갱신한다")
    void updatesMenu() {
      ModifyMenuVO vo = withRoles(this.modifyOf("B2"), TUTOR);
      vo.setTitle("  과정 전체 목록 ");
      vo.setUseYn("N");

      MenuVO result = this.update("super", "B2", vo);

      Assertions.assertThat(this.dao().lockedMenuIds).contains("B2");
      Assertions.assertThat(result.getTitle()).isEqualTo("과정 전체 목록");
      Assertions.assertThat(result.getUseYn()).isEqualTo("N");
      Assertions.assertThat(result.getRoleIds()).containsExactly(TUTOR);
      Assertions.assertThat(result.getMdfyDt()).isEqualTo(this.dao().now);
      Assertions.assertThat(result.getParentId()).isEqualTo("M2");
      Assertions.assertThat(result.getMenuOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("없는 메뉴는 MENU_NOT_EXISTS")
    void notExists() {
      Assertions.assertThat(errorCodeOf(() -> this.update("super", "NOPE", this.modifyOf("B2"))))
          .isEqualTo(ErrorCode.MENU_NOT_EXISTS);
    }

    @Test
    @DisplayName("B8. 역할을 여러 번 켰다 끄면 MENU_ROLE 행 수가 체크한 역할 수와 같다")
    void replacesMenuRoles() {
      this.update("super", "B2", withRoles(this.modifyOf("B2"), ADMIN));
      this.update("super", "B2", withRoles(this.modifyOf("B2"), ADMIN, TUTOR, STUDENT));
      this.update("super", "B2", withRoles(this.modifyOf("B2"), STUDENT, SUPER_ADMIN));

      Assertions.assertThat(this.dao().roleIdsOf("B2")).containsExactly(STUDENT);
    }

    @Test
    @DisplayName("메뉴 단계에 따라 spread · menuUrl을 검사하고 정리한다")
    void normalizesByLevel() {
      ModifyMenuVO top = this.modifyOf("T1");
      top.setSpread("Y");
      top.setMenuUrl("/ignored");
      MenuVO topResult = this.update("super", "T1", top);
      Assertions.assertThat(topResult.getSpread()).isEqualTo("N");
      Assertions.assertThat(topResult.getMenuUrl()).isNull();

      ModifyMenuVO mid = this.modifyOf("M2");
      mid.setSpread(null);
      Assertions.assertThat(validationsOf(() -> this.update("super", "M2", mid)))
          .isEqualTo(Map.of("spread", List.of("펼침 여부가 올바르지 않습니다.")));

      ModifyMenuVO bottom = this.modifyOf("B2");
      bottom.setMenuUrl("admin");
      Assertions.assertThat(validationsOf(() -> this.update("super", "B2", bottom)))
          .isEqualTo(Map.of("menuUrl", List.of("메뉴 URL은 '/'로 시작해야 합니다.")));
    }

    @Test
    @DisplayName("B16. 같은 메뉴를 두 화면에서 열고 차례로 저장하면 두 번째는 MENU_OUTDATED, 첫 번째 내용 유지")
    void rejectsOutdated() {
      ModifyMenuVO first = withRoles(this.modifyOf("B2"), ADMIN);
      ModifyMenuVO second = withRoles(this.modifyOf("B2"), TUTOR);

      this.update("super", "B2", first);

      Assertions.assertThat(errorCodeOf(() -> this.update("super", "B2", second)))
          .isEqualTo(ErrorCode.MENU_OUTDATED);
      Assertions.assertThat(this.dao().roleIdsOf("B2")).containsExactly(ADMIN);

      // 새로 받은 mdfyDt로는 저장된다
      this.dao().now = "2026-11-11 10:00:05";
      Assertions.assertThat(this.update("super", "B2", withRoles(this.modifyOf("B2"), TUTOR))
          .getMdfyDt()).isEqualTo("2026-11-11 10:00:05");
    }

    @Test
    @DisplayName("이름은 자기 자신을 빼고 같은 상위 메뉴 안에서 중복 검사한다")
    void checksTitleExceptSelf() {
      ModifyMenuVO vo = this.modifyOf("B2");
      Assertions.assertThat(this.update("super", "B2", vo).getTitle()).isEqualTo("과정 목록");

      ModifyMenuVO dup = this.modifyOf("B2");
      dup.setTitle("과정 등록");
      Assertions.assertThat(errorCodeOf(() -> this.update("super", "B2", dup)))
          .isEqualTo(ErrorCode.MENU_TITLE_USED);
    }

    @Test
    @DisplayName("URL은 자기 자신을 빼고 중복 검사한다")
    void checksMenuUrlExceptSelf() {
      ModifyMenuVO dup = this.modifyOf("B2");
      dup.setMenuUrl("/admin/course/add");
      Assertions.assertThat(errorCodeOf(() -> this.update("super", "B2", dup)))
          .isEqualTo(ErrorCode.MENU_URL_USED);
    }

    @Test
    @DisplayName("없는 역할이 있으면 MENU_ROLE_INVALID")
    void rejectsUnknownRole() {
      Assertions
          .assertThat(errorCodeOf(
              () -> this.update("super", "B2", withRoles(this.modifyOf("B2"), "ROLE_NOPE"))))
          .isEqualTo(ErrorCode.MENU_ROLE_INVALID);
    }

    @Test
    @DisplayName("B12. ADMIN이 메뉴 관리 소메뉴 · 그 중메뉴 · 대메뉴에서 ROLE_ADMIN을 해제하면 MENU_SELF_LOCK")
    void selfLockByRemovingOwnRole() {
      for (String menuId : List.of("B4", "M3", "T2")) {
        ModifyMenuVO vo = withRoles(this.modifyOf(menuId), TUTOR);
        Assertions.assertThat(errorCodeOf(() -> this.update("admin", menuId, vo)))
            .as(menuId).isEqualTo(ErrorCode.MENU_SELF_LOCK);
      }
      Assertions.assertThat(this.dao().roleIdsOf("B4")).containsExactly(ADMIN, TUTOR);
    }

    @Test
    @DisplayName("B13. ADMIN이 메뉴 관리 메뉴를 미사용으로, 메뉴 관리 소메뉴의 URL을 바꾸면 MENU_SELF_LOCK")
    void selfLockByUnusedOrUrlChange() {
      for (String menuId : List.of("B4", "M3", "T2")) {
        ModifyMenuVO unused = this.modifyOf(menuId);
        unused.setUseYn("N");
        Assertions.assertThat(errorCodeOf(() -> this.update("admin", menuId, unused)))
            .as(menuId).isEqualTo(ErrorCode.MENU_SELF_LOCK);
      }

      ModifyMenuVO urlChanged = this.modifyOf("B4");
      urlChanged.setMenuUrl("/admin/system/menus");
      Assertions.assertThat(errorCodeOf(() -> this.update("admin", "B4", urlChanged)))
          .isEqualTo(ErrorCode.MENU_SELF_LOCK);
    }

    @Test
    @DisplayName("B14. ADMIN이 메뉴 관리 소메뉴에서 다른 역할(ROLE_TUTOR)만 해제하면 성공")
    void removingOtherRoleIsAllowed() {
      MenuVO result = this.update("admin", "B4", withRoles(this.modifyOf("B4"), ADMIN));

      Assertions.assertThat(result.getRoleIds()).containsExactly(ADMIN);
    }

    @Test
    @DisplayName("B15. SUPER_ADMIN은 메뉴 관리 소메뉴에서 모든 역할을 해제해도 성공")
    void superAdminIsNotChecked() {
      MenuVO result = this.update("super", "B4", withRoles(this.modifyOf("B4")));

      Assertions.assertThat(result.getRoleIds()).isEmpty();
    }

    @Test
    @DisplayName("보호 대상이 아닌 메뉴는 본인 역할을 해제해도 성공. 메뉴 관리 메뉴가 없으면 보호 대상도 없다")
    void onlyProtectedMenusAreChecked() {
      Assertions.assertThat(this.update("admin", "B5", withRoles(this.modifyOf("B5"))).getRoleIds())
          .isEmpty();

      this.dao().menus.remove("B4");
      Assertions.assertThat(this.update("admin", "M3", withRoles(this.modifyOf("M3"))).getRoleIds())
          .isEmpty();
    }
  }

  static MenuOrderVO order(String parentId, String... menuIds) {
    MenuOrderVO vo = new MenuOrderVO();
    vo.setParentId(parentId);
    vo.setMenuIds(menuIds == null ? null : java.util.Arrays.asList(menuIds));
    return vo;
  }

  static ModifyMenuOrderVO orders(MenuOrderVO... orders) {
    ModifyMenuOrderVO vo = new ModifyMenuOrderVO();
    vo.setOrders(orders == null ? null : java.util.Arrays.asList(orders));
    return vo;
  }

  @Nested
  @DisplayName("PUT /menus/order 메뉴 순서 변경")
  class UpdateMenuOrder {

    FakeMenuDao dao() {
      return MenuServiceImplTest.this.menuDao;
    }

    MenuListVO reorder(MenuOrderVO... items) {
      return MenuServiceImplTest.this.menuService.updateMenuOrder(orders(items));
    }

    @Test
    @DisplayName("받은 순서대로 1부터 다시 매기고, 변경 후 전체 목록을 준다")
    void reorders() {
      MenuListVO result = this.reorder(order("M3", "B5", "B4"));

      Assertions.assertThat(this.dao().menus.get("B5").getMenuOrder()).isEqualTo(1);
      Assertions.assertThat(this.dao().menus.get("B4").getMenuOrder()).isEqualTo(2);
      Assertions.assertThat(idsOf(result.getMenus()))
          .containsExactly("T1", "T2", "M1", "M2", "M3", "B1", "B2", "B3", "B5", "B4");
      Assertions.assertThat(result.getRoles()).hasSize(4);
    }

    @Test
    @DisplayName("parentId가 null이면 대메뉴의 순서를 바꾼다")
    void reordersTopMenus() {
      this.reorder(order(null, "T2", "T1"));

      Assertions.assertThat(this.dao().menus.get("T2").getMenuOrder()).isEqualTo(1);
      Assertions.assertThat(this.dao().menus.get("T1").getMenuOrder()).isEqualTo(2);
    }

    @Test
    @DisplayName("빈 목록 · 중복 ID는 MENU_ORDER_INVALID")
    void rejectsInvalidOrder() {
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order("M3", (String[]) null))))
          .isEqualTo(ErrorCode.MENU_ORDER_INVALID);
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order("M3"))))
          .isEqualTo(ErrorCode.MENU_ORDER_INVALID);
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order("M3", "B4", "B4", "B5"))))
          .isEqualTo(ErrorCode.MENU_ORDER_INVALID);
    }

    @Test
    @DisplayName("없는 상위 메뉴는 MENU_NOT_EXISTS")
    void rejectsUnknownParent() {
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order("NOPE", "B4"))))
          .isEqualTo(ErrorCode.MENU_NOT_EXISTS);
    }

    @Test
    @DisplayName("B10. 현재 하위 메뉴 전체와 구성이 다르면 MENU_ORDER_OUTDATED (그 사이 추가 · 삭제)")
    void rejectsOutdatedOrder() {
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order("M3", "B4"))))
          .isEqualTo(ErrorCode.MENU_ORDER_OUTDATED);
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order("M3", "B4", "B5", "B1"))))
          .isEqualTo(ErrorCode.MENU_ORDER_OUTDATED);
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order("M3", "B4", "B2"))))
          .isEqualTo(ErrorCode.MENU_ORDER_OUTDATED);
      Assertions.assertThat(this.dao().menus.get("B4").getMenuOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("여러 상위 메뉴의 순서를 한 번에 바꾼다 (화면의 [순서 저장])")
    void reordersSeveralParents() {
      this.reorder(order("M3", "B5", "B4"), order(null, "T2", "T1"), order("M2", "B3", "B2"));

      Assertions.assertThat(this.dao().menus.get("B5").getMenuOrder()).isEqualTo(1);
      Assertions.assertThat(this.dao().menus.get("T2").getMenuOrder()).isEqualTo(1);
      Assertions.assertThat(this.dao().menus.get("B3").getMenuOrder()).isEqualTo(1);
      Assertions.assertThat(this.dao().menus.get("B2").getMenuOrder()).isEqualTo(2);
    }

    @Test
    @DisplayName("하나라도 거부되면 아무것도 바꾸지 않는다 (먼저 모두 검사한 뒤 저장)")
    void allOrNothing() {
      Assertions
          .assertThat(errorCodeOf(() -> this.reorder(order("M3", "B5", "B4"), order("M2", "B2"))))
          .isEqualTo(ErrorCode.MENU_ORDER_OUTDATED);
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order("M3", "B5", "B4"), order("NOPE", "B1"))))
          .isEqualTo(ErrorCode.MENU_NOT_EXISTS);

      Assertions.assertThat(this.dao().menus.get("B4").getMenuOrder()).isEqualTo(1);
      Assertions.assertThat(this.dao().menus.get("B5").getMenuOrder()).isEqualTo(2);
    }

    @Test
    @DisplayName("orders가 비었거나 null 항목 · 같은 상위 메뉴가 두 번이면 MENU_ORDER_INVALID")
    void rejectsInvalidOrders() {
      Assertions.assertThat(errorCodeOf(() -> MenuServiceImplTest.this.menuService
          .updateMenuOrder(orders((MenuOrderVO[]) null)))).isEqualTo(ErrorCode.MENU_ORDER_INVALID);
      Assertions.assertThat(errorCodeOf(() -> this.reorder()))
          .isEqualTo(ErrorCode.MENU_ORDER_INVALID);
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order("M3", "B5", "B4"), null)))
          .isEqualTo(ErrorCode.MENU_ORDER_INVALID);
      Assertions
          .assertThat(errorCodeOf(() -> this.reorder(order("M3", "B5", "B4"), order("M3", "B4", "B5"))))
          .isEqualTo(ErrorCode.MENU_ORDER_INVALID);
      Assertions.assertThat(errorCodeOf(() -> this.reorder(order(null, "T2", "T1"), order(null, "T1", "T2"))))
          .isEqualTo(ErrorCode.MENU_ORDER_INVALID);
    }

    @Test
    @DisplayName("B17. 순서 변경은 MDFY_DT를 바꾸지 않으므로, 미리 열어 둔 화면에서 그 메뉴를 저장할 수 있다")
    void doesNotTouchMdfyDt() {
      ModifyMenuVO openedBefore = MenuServiceImplTest.this.modifyOf("B4");

      this.reorder(order("M3", "B5", "B4"));

      Assertions.assertThat(this.dao().menus.get("B4").getMdfyDt()).isNull();
      Assertions.assertThat(
          MenuServiceImplTest.this.menuService.updateMenu("super", "B4", openedBefore).getMenuOrder())
          .isEqualTo(2);
    }
  }

  @Nested
  @DisplayName("DELETE /menus/{menuId} 메뉴 삭제")
  class DeleteMenu {

    FakeMenuDao dao() {
      return MenuServiceImplTest.this.menuDao;
    }

    MenuVO delete(String actorId, String menuId) {
      return MenuServiceImplTest.this.menuService.deleteMenu(actorId, menuId);
    }

    @Test
    @DisplayName("MENU_ROLE과 메뉴를 지우고, 같은 상위 메뉴의 순서를 1부터 다시 매긴다")
    void deletesMenu() {
      MenuVO result = this.delete("super", "B2");

      Assertions.assertThat(result.getId()).isEqualTo("B2");
      Assertions.assertThat(result.getRoleIds()).containsExactly(ADMIN, TUTOR, STUDENT);
      Assertions.assertThat(this.dao().menus).doesNotContainKey("B2");
      Assertions.assertThat(this.dao().roleIdsOf("B2")).isEmpty();
      Assertions.assertThat(this.dao().menus.get("B3").getMenuOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("없는 메뉴는 MENU_NOT_EXISTS")
    void notExists() {
      Assertions.assertThat(errorCodeOf(() -> this.delete("super", "NOPE")))
          .isEqualTo(ErrorCode.MENU_NOT_EXISTS);
    }

    @Test
    @DisplayName("B9. 하위 메뉴가 있으면 MENU_HAS_CHILDREN, ACTION이 참조하면 MENU_IN_USE")
    void rejectsReferencedMenu() {
      Assertions.assertThat(errorCodeOf(() -> this.delete("super", "M2")))
          .isEqualTo(ErrorCode.MENU_HAS_CHILDREN);

      this.dao().actionRefs.put("B2", 1L);
      Assertions.assertThat(errorCodeOf(() -> this.delete("super", "B2")))
          .isEqualTo(ErrorCode.MENU_IN_USE);
      Assertions.assertThat(this.dao().menus).containsKey("B2");
      Assertions.assertThat(this.dao().roleIdsOf("B2")).hasSize(3);
    }

    @Test
    @DisplayName("B13. ADMIN이 메뉴 관리 메뉴(소 · 중 · 대)를 삭제하면 MENU_SELF_LOCK (하위 메뉴 검사보다 먼저)")
    void selfLock() {
      for (String menuId : List.of("B4", "M3", "T2")) {
        Assertions.assertThat(errorCodeOf(() -> this.delete("admin", menuId)))
            .as(menuId).isEqualTo(ErrorCode.MENU_SELF_LOCK);
      }
      Assertions.assertThat(this.delete("admin", "B5").getId()).isEqualTo("B5");
      Assertions.assertThat(this.delete("super", "B4").getId()).isEqualTo("B4");
    }

    @Test
    @DisplayName("삭제할 메뉴 행을 잠근다 (ACTION 저장과 동시에 일어나도 참조 검사가 어긋나지 않게)")
    void locksMenuRow() {
      this.delete("super", "B2");

      Assertions.assertThat(this.dao().lockedMenuIds).containsExactly("B2");
    }
  }

  @Nested
  @DisplayName("PUT /menus/{menuId}/parent 상위 메뉴 변경 (설계 4-7)")
  class MoveMenu {

    FakeMenuDao dao() {
      return MenuServiceImplTest.this.menuDao;
    }

    AccessDao accessDao() {
      return MenuServiceImplTest.this.accessDao;
    }

    MenuListVO move(String actorId, String menuId, String parentId) {
      return this.move(actorId, menuId, parentId, this.dao().menus.containsKey(menuId)
          ? this.dao().menus.get(menuId).getMdfyDt()
          : null);
    }

    MenuListVO move(String actorId, String menuId, String parentId, String mdfyDt) {
      ModifyMenuParentVO vo = new ModifyMenuParentVO();
      vo.setParentId(parentId);
      vo.setMdfyDt(mdfyDt);
      return MenuServiceImplTest.this.menuService.moveMenu(actorId, menuId, vo);
    }

    @Test
    @DisplayName("B20. 소메뉴를 다른 중메뉴로 옮기면 맨 뒤에 붙고, 원래 그룹 순서를 다시 매기고, ACTION의 대 · 중 메뉴를 고친다")
    void movesBottomMenu() {
      MenuListVO result = this.move("super", "B2", "M1");

      MenuVO moved = this.dao().menus.get("B2");
      Assertions.assertThat(moved.getParentId()).isEqualTo("M1");
      Assertions.assertThat(moved.getMenuOrder()).isEqualTo(2);
      Assertions.assertThat(moved.getMdfyDt()).isEqualTo(this.dao().now);
      Assertions.assertThat(this.dao().menus.get("B3").getMenuOrder()).isEqualTo(1);
      Assertions.assertThat(this.dao().lockedMenuIds).containsExactly("B2");

      Mockito.verify(this.accessDao()).updateActionMenusByBtmMenuId("B2", "M1", "T1");
      Mockito.verifyNoMoreInteractions(this.accessDao());

      // 응답은 변경 후 전체 목록
      Assertions.assertThat(result.getMenus()).extracting(MenuVO::getId).contains("B2");
      Assertions.assertThat(result.getMenus().stream()
          .filter(menu -> menu.getId().equals("B2")).findFirst().orElseThrow().getParentId())
          .isEqualTo("M1");
    }

    @Test
    @DisplayName("B21. 중메뉴를 다른 대메뉴로 옮기면 하위 소메뉴 행도 잠그고, ACTION의 대메뉴를 고친다")
    void movesMidMenu() {
      this.move("super", "M2", "T1");

      MenuVO moved = this.dao().menus.get("M2");
      Assertions.assertThat(moved.getParentId()).isEqualTo("T1");
      Assertions.assertThat(moved.getMenuOrder()).isEqualTo(2);
      Assertions.assertThat(this.dao().menus.get("M3").getMenuOrder()).isEqualTo(1);
      // 하위 소메뉴는 따라가고, 수정일은 바뀌지 않는다
      Assertions.assertThat(this.dao().menus.get("B2").getParentId()).isEqualTo("M2");
      Assertions.assertThat(this.dao().menus.get("B2").getMdfyDt()).isNull();
      Assertions.assertThat(this.dao().lockedMenuIds).containsExactly("M2", "B2", "B3");

      Mockito.verify(this.accessDao()).updateActionTopMenuByMidMenuId("M2", "T1");
      Mockito.verifyNoMoreInteractions(this.accessDao());
    }

    @Test
    @DisplayName("MENU_ROLE은 그대로 둔다")
    void keepsMenuRoles() {
      this.move("super", "B2", "M1");

      Assertions.assertThat(this.dao().roleIdsOf("B2")).containsExactly(ADMIN, TUTOR, STUDENT);
    }

    @Test
    @DisplayName("B22. 대메뉴 · 단계가 맞지 않는 상위 메뉴 · 지금과 같은 상위 메뉴 · 빈 값은 MENU_MOVE_INVALID")
    void rejectsInvalidMove() {
      // 소메뉴 → 대메뉴 아래
      Assertions.assertThat(errorCodeOf(() -> this.move("super", "B2", "T1")))
          .isEqualTo(ErrorCode.MENU_MOVE_INVALID);
      // 소메뉴 → 소메뉴 아래
      Assertions.assertThat(errorCodeOf(() -> this.move("super", "B2", "B5")))
          .isEqualTo(ErrorCode.MENU_MOVE_INVALID);
      // 중메뉴 → 중메뉴 아래
      Assertions.assertThat(errorCodeOf(() -> this.move("super", "M2", "M1")))
          .isEqualTo(ErrorCode.MENU_MOVE_INVALID);
      // 같은 상위 메뉴
      Assertions.assertThat(errorCodeOf(() -> this.move("super", "B2", "M2")))
          .isEqualTo(ErrorCode.MENU_MOVE_INVALID);
      // 대메뉴는 옮길 수 없음
      Assertions.assertThat(errorCodeOf(() -> this.move("super", "T1", "T2")))
          .isEqualTo(ErrorCode.MENU_MOVE_INVALID);
      Assertions.assertThat(errorCodeOf(() -> this.move("super", "T1", null)))
          .isEqualTo(ErrorCode.MENU_MOVE_INVALID);
      // 상위 메뉴를 비움
      Assertions.assertThat(errorCodeOf(() -> this.move("super", "B2", null)))
          .isEqualTo(ErrorCode.MENU_MOVE_INVALID);

      Assertions.assertThat(this.dao().menus.get("B2").getParentId()).isEqualTo("M2");
      Mockito.verifyNoInteractions(this.accessDao());
    }

    @Test
    @DisplayName("없는 메뉴 · 없는 상위 메뉴는 MENU_NOT_EXISTS")
    void notExists() {
      Assertions.assertThat(errorCodeOf(() -> this.move("super", "NOPE", "M1")))
          .isEqualTo(ErrorCode.MENU_NOT_EXISTS);
      Assertions.assertThat(errorCodeOf(() -> this.move("super", "B2", "NOPE")))
          .isEqualTo(ErrorCode.MENU_NOT_EXISTS);
    }

    @Test
    @DisplayName("새 상위 메뉴에 같은 이름이 있으면 MENU_TITLE_USED")
    void rejectsSameTitle() {
      this.dao().put("B6", "M1", 2, "과정 목록", "/x");

      Assertions.assertThat(errorCodeOf(() -> this.move("super", "B2", "M1")))
          .isEqualTo(ErrorCode.MENU_TITLE_USED);
      Assertions.assertThat(this.dao().menus.get("B2").getParentId()).isEqualTo("M2");
      Mockito.verifyNoInteractions(this.accessDao());
    }

    @Test
    @DisplayName("mdfyDt가 서버 값과 다르면 MENU_OUTDATED")
    void rejectsOutdated() {
      this.dao().menus.get("B2").setMdfyDt("2026-11-11 09:00:00");

      Assertions.assertThat(errorCodeOf(() -> this.move("super", "B2", "M1", null)))
          .isEqualTo(ErrorCode.MENU_OUTDATED);
      Assertions.assertThat(this.dao().menus.get("B2").getParentId()).isEqualTo("M2");

      Assertions.assertThat(this.move("super", "B2", "M1", "2026-11-11 09:00:00")).isNotNull();
      Assertions.assertThat(this.dao().menus.get("B2").getParentId()).isEqualTo("M1");
    }

    @Test
    @DisplayName("B23. ADMIN이 메뉴 관리 메뉴를 ADMIN이 허용되지 않은 · 미사용 상위 메뉴로 옮기면 MENU_SELF_LOCK")
    void selfLock() {
      this.dao().put("M4", "T1", 2, "강사 전용", null, TUTOR);
      this.dao().put("M5", "T1", 3, "미사용 그룹", null, ADMIN, TUTOR).setUseYn("N");
      this.dao().put("T3", null, 3, "강사 섹션", null, TUTOR);

      Assertions.assertThat(errorCodeOf(() -> this.move("admin", "B4", "M4")))
          .isEqualTo(ErrorCode.MENU_SELF_LOCK);
      Assertions.assertThat(errorCodeOf(() -> this.move("admin", "B4", "M5")))
          .isEqualTo(ErrorCode.MENU_SELF_LOCK);
      // 메뉴 관리가 든 중메뉴를 ADMIN이 허용되지 않은 대메뉴로
      Assertions.assertThat(errorCodeOf(() -> this.move("admin", "M3", "T3")))
          .isEqualTo(ErrorCode.MENU_SELF_LOCK);
      Assertions.assertThat(this.dao().menus.get("B4").getParentId()).isEqualTo("M3");
      Assertions.assertThat(this.dao().menus.get("M3").getParentId()).isEqualTo("T2");
      Mockito.verifyNoInteractions(this.accessDao());
    }

    @Test
    @DisplayName("ADMIN이 허용된 상위 메뉴로 옮기기 · 보호 대상이 아닌 메뉴 · SUPER_ADMIN은 자기 잠금에 걸리지 않는다")
    void selfLockOnlyWhenLosingAccess() {
      this.dao().put("M4", "T1", 2, "강사 전용", null, TUTOR);

      // 메뉴 관리를 ADMIN이 허용된 다른 그룹으로
      this.move("admin", "B4", "M2");
      Assertions.assertThat(this.dao().menus.get("B4").getParentId()).isEqualTo("M2");
      // 보호 대상이 아닌 메뉴는 어디로든
      this.move("admin", "B5", "M4");
      Assertions.assertThat(this.dao().menus.get("B5").getParentId()).isEqualTo("M4");
      // SUPER_ADMIN은 검사하지 않음
      this.move("super", "B4", "M4");
      Assertions.assertThat(this.dao().menus.get("B4").getParentId()).isEqualTo("M4");
    }

    @Test
    @DisplayName("미사용 상위 메뉴로도 옮길 수 있다 (자기 잠금 대상이 아니면)")
    void movesIntoUnusedParent() {
      this.dao().put("M5", "T1", 2, "미사용 그룹", null, ADMIN).setUseYn("N");

      this.move("admin", "B5", "M5");

      Assertions.assertThat(this.dao().menus.get("B5").getParentId()).isEqualTo("M5");
    }
  }

  @Nested
  @DisplayName("ACTION 저장용 메뉴 경로 확인 (checkAndLockMenuPath)")
  class CheckAndLockMenuPath {

    boolean check(String topMenuId, String midMenuId, String btmMenuId) {
      return MenuServiceImplTest.this.menuService.checkAndLockMenuPath(topMenuId, midMenuId,
          btmMenuId);
    }

    @Test
    @DisplayName("대메뉴 > 중메뉴 > 소메뉴로 이어지면 true, 소메뉴 행을 잠근다")
    void validPath() {
      Assertions.assertThat(this.check("T2", "M2", "B2")).isTrue();
      Assertions.assertThat(MenuServiceImplTest.this.menuDao.lockedMenuIds).containsExactly("B2");
    }

    @Test
    @DisplayName("계층이 맞지 않으면 false")
    void invalidHierarchy() {
      // 소메뉴의 상위가 다른 중메뉴
      Assertions.assertThat(this.check("T2", "M3", "B2")).isFalse();
      // 중메뉴의 상위가 다른 대메뉴
      Assertions.assertThat(this.check("T1", "M2", "B2")).isFalse();
      // 대메뉴 자리에 상위가 있는 메뉴 (4단계 이상인 잘못된 데이터)
      MenuServiceImplTest.this.menuDao.put("X", "B2", 1, "잘못된 메뉴", "/x");
      Assertions.assertThat(this.check("M2", "B2", "X")).isFalse();
    }

    @Test
    @DisplayName("없는 메뉴이거나 값이 비어 있으면 false")
    void missingMenu() {
      Assertions.assertThat(this.check("T2", "M2", "NOPE")).isFalse();
      Assertions.assertThat(this.check("T2", "NOPE", "B2")).isFalse();
      Assertions.assertThat(this.check(null, "M2", "B2")).isFalse();
      Assertions.assertThat(this.check("T2", "M2", null)).isFalse();
    }
  }

}
