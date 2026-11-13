package com.learningworks.menu.service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.access.dao.AccessDao;
import com.learningworks.common.action.dao.ActionCodeDao;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.ValidationFailedException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.menu.MenuConstants;
import com.learningworks.menu.dao.MenuDao;
import com.learningworks.menu.vo.response.MenuRoleVO;
import com.learningworks.menu.vo.response.MyMenuVO;
import com.learningworks.role.RoleConstants;
import com.learningworks.menu.vo.request.ModifyMenuOrderVO;
import com.learningworks.menu.vo.request.ModifyMenuParentVO;
import com.learningworks.menu.vo.request.ModifyMenuVO;
import com.learningworks.menu.vo.request.RegistMenuVO;
import com.learningworks.menu.vo.response.MenuListVO;
import com.learningworks.menu.vo.response.MenuVO;
import com.learningworks.menu.vo.response.MyMenuListVO;
import com.learningworks.role.dao.RoleDao;
import com.learningworks.role.vo.response.RoleVO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@AllArgsConstructor
@Service
public class MenuServiceImpl implements MenuService {

  private MenuDao menuDao;

  private RoleDao roleDao;

  /** 요청자의 현재 역할 조회. AccessChecker와 같은 기준 */
  private ActionCodeDao actionCodeDao;

  /**
   * 메뉴 이동 시 ACTION의 메뉴 컬럼 갱신 (access-design.md D-10). ACTION은 ACCESS 모듈의 테이블이므로 SQL은 AccessDaoMapper에 둔다.
   * AccessService가 아닌 AccessDao를 쓰는 이유: AccessServiceImpl이 MenuService를 쓰므로 서비스끼리 순환 의존이 된다.
   */
  private AccessDao accessDao;

  /**
   * 내 메뉴.
   * - SUPER_ADMIN: 모든 메뉴 (미사용 포함)
   * - 그 외: 자기 자신과 모든 상위 메뉴가 "사용(Y) + MENU_ROLE에 (메뉴, 내 역할) 있음"을 만족하는 메뉴
   * - guardUrls: 모든 소메뉴의 URL (미사용 · 미허용 포함)
   */
  @Override
  public MyMenuListVO readMyMenus(String userId) {
    String roleId = this.findRoleId(userId);
    boolean superAdmin = RoleConstants.SUPER_ADMIN_ROLE.equals(roleId);

    MenuTree tree = new MenuTree(this.menuDao.selectAllMenus());

    Set<String> allowedMenuIds = this.menuDao.selectAllMenuRoles().stream()
        .filter(menuRole -> roleId.equals(menuRole.getRoleId()))
        .map(MenuRoleVO::getMenuId)
        .collect(Collectors.toSet());

    List<MyMenuVO> menus = tree.sorted().stream()
        .filter(menu -> superAdmin || tree.selfAndAncestors(menu.getId()).stream()
            .allMatch(self -> MenuConstants.YES.equals(self.getUseYn())
                && allowedMenuIds.contains(self.getId())))
        .map(MenuServiceImpl::toMyMenu)
        .toList();

    List<String> guardUrls = tree.sorted().stream()
        .map(MenuVO::getMenuUrl)
        .filter(Objects::nonNull)
        .toList();

    return new MyMenuListVO(superAdmin, menus, guardUrls);
  }

  @Override
  public MenuListVO readMenuList() {
    Map<String, List<String>> roleIdsByMenuId = this.menuDao.selectAllMenuRoles().stream()
        .filter(menuRole -> !RoleConstants.SUPER_ADMIN_ROLE.equals(menuRole.getRoleId()))
        .collect(Collectors.groupingBy(MenuRoleVO::getMenuId,
            Collectors.mapping(MenuRoleVO::getRoleId, Collectors.toList())));

    List<MenuVO> menus = new MenuTree(this.menuDao.selectAllMenus()).sorted();
    menus.forEach(menu -> menu.setRoleIds(roleIdsByMenuId.getOrDefault(menu.getId(), List.of())));

    return new MenuListVO(this.roleDao.selectAllRoles(), menus);
  }

  /** 요청자의 현재 역할(DB 기준, AccessChecker와 같은 기준). 비로그인이면 401, 회원이 없거나 탈퇴했으면 403 */
  private String findRoleId(String userId) {
    if (userId == null) {
      throw new LearningworksException(ErrorCode.GLOBAL_UNAUTHORIZED);
    }
    String roleId = this.actionCodeDao.selectBaseRoleByUserId(userId);
    if (roleId == null) {
      throw new LearningworksException(ErrorCode.GLOBAL_FORBIDDEN);
    }
    return roleId;
  }

  private static MyMenuVO toMyMenu(MenuVO menu) {
    MyMenuVO myMenu = new MyMenuVO();
    myMenu.setId(menu.getId());
    myMenu.setTitle(menu.getTitle());
    myMenu.setParentId(menu.getParentId());
    myMenu.setMenuOrder(menu.getMenuOrder());
    myMenu.setUseYn(menu.getUseYn());
    myMenu.setSpread(menu.getSpread());
    myMenu.setMenuUrl(menu.getMenuUrl());
    return myMenu;
  }

  /**
   * 메뉴 등록. 같은 상위 메뉴의 맨 뒤(MAX(MENU_ORDER) + 1)에 추가하고, MENU_ROLE을 함께 저장한다.
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public MenuVO createMenu(RegistMenuVO registMenuVO) {
    String parentId = registMenuVO.getParentId();
    int level = MenuConstants.TOP_LEVEL;
    if (parentId != null) {
      MenuTree tree = new MenuTree(this.menuDao.selectAllMenus());
      if (tree.get(parentId) == null) {
        throw new LearningworksException(ErrorCode.MENU_NOT_EXISTS);
      }
      level = tree.levelOf(parentId) + 1;
      if (level > MenuConstants.BOTTOM_LEVEL) {
        throw new LearningworksException(ErrorCode.MENU_PARENT_INVALID);
      }
    }

    MenuVO menu = new MenuVO();
    menu.setParentId(parentId);
    menu.setTitle(registMenuVO.getTitle().strip());
    menu.setUseYn(registMenuVO.getUseYn());
    menu.setSpread(MenuServiceImpl.normalizeSpread(level, registMenuVO.getSpread()));
    menu.setMenuUrl(MenuServiceImpl.normalizeMenuUrl(level, registMenuVO.getMenuUrl()));
    List<String> roleIds = this.validateRoleIds(registMenuVO.getRoleIds());

    this.checkTitleUnused(parentId, menu.getTitle(), null);
    this.checkMenuUrlUnused(menu.getMenuUrl(), null);

    menu.setMenuOrder(this.menuDao.selectMaxMenuOrder(parentId) + 1);
    try {
      this.menuDao.insertMenu(menu);
    } catch (DuplicateKeyException dke) {
      // MENU에서 PK 외의 UNIQUE 제약은 UK_MENU_URL뿐이다 (검사 후 다른 요청이 먼저 등록한 경우)
      throw new LearningworksException(ErrorCode.MENU_URL_USED, dke);
    }
    roleIds.forEach(roleId -> this.menuDao.insertMenuRole(menu.getId(), roleId));

    return this.readMenu(menu.getId());
  }

  /** 메뉴 1건 + 허용 역할 (SUPER_ADMIN 제외) */
  private MenuVO readMenu(String menuId) {
    MenuVO menu = this.menuDao.selectMenuById(menuId);
    if (menu == null) {
      throw new LearningworksException(ErrorCode.MENU_NOT_EXISTS);
    }
    menu.setRoleIds(this.menuDao.selectRoleIdsByMenuId(menuId).stream()
        .filter(roleId -> !RoleConstants.SUPER_ADMIN_ROLE.equals(roleId))
        .toList());
    return menu;
  }

  /** 중메뉴만 필수(Y/N). 대 · 소메뉴는 입력을 무시하고 N */
  private static String normalizeSpread(int level, String spread) {
    if (level != MenuConstants.MID_LEVEL) {
      return MenuConstants.NO;
    }
    if (!MenuConstants.YES.equals(spread) && !MenuConstants.NO.equals(spread)) {
      throw ValidationFailedException.of("spread", "펼침 여부가 올바르지 않습니다.");
    }
    return spread;
  }

  /**
   * 소메뉴만 필수: '/'로 시작, 공백 없음, 100자 이하. 대 · 중메뉴는 입력을 무시하고 null.
   * 백엔드는 프론트 라우트를 알 수 없으므로 형식만 검사한다.
   */
  private static String normalizeMenuUrl(int level, String menuUrl) {
    if (level != MenuConstants.BOTTOM_LEVEL) {
      return null;
    }
    if (menuUrl == null || menuUrl.isBlank()) {
      throw ValidationFailedException.of("menuUrl", "메뉴 URL을 입력해주세요.");
    }
    if (!menuUrl.startsWith("/")) {
      throw ValidationFailedException.of("menuUrl", "메뉴 URL은 '/'로 시작해야 합니다.");
    }
    if (menuUrl.chars().anyMatch(Character::isWhitespace)) {
      throw ValidationFailedException.of("menuUrl", "메뉴 URL에는 공백을 넣을 수 없습니다.");
    }
    if (menuUrl.length() > MenuConstants.MENU_URL_MAX_LENGTH) {
      throw ValidationFailedException.of("menuUrl", "메뉴 URL은 100자 이하로 입력해주세요.");
    }
    return menuUrl;
  }

  /**
   * 저장할 역할 ID. 없는 역할이 있으면 MENU_ROLE_INVALID.
   * SUPER_ADMIN은 MENU_ROLE과 관계없이 모든 메뉴를 보므로 저장하지 않는다. 중복은 하나만 남긴다.
   */
  private List<String> validateRoleIds(List<String> roleIds) {
    Set<String> existingRoleIds = this.roleDao.selectAllRoles().stream()
        .map(RoleVO::getRoleId)
        .collect(Collectors.toSet());
    if (!existingRoleIds.containsAll(roleIds)) {
      throw new LearningworksException(ErrorCode.MENU_ROLE_INVALID);
    }
    return roleIds.stream()
        .filter(roleId -> !RoleConstants.SUPER_ADMIN_ROLE.equals(roleId))
        .distinct()
        .toList();
  }

  /** 같은 상위 메뉴 안에서 이름 중복 불가. excludeMenuId(자기 자신)는 제외 */
  private void checkTitleUnused(String parentId, String title, String excludeMenuId) {
    if (this.menuDao.selectTitleCount(parentId, title, excludeMenuId) > 0) {
      throw new LearningworksException(ErrorCode.MENU_TITLE_USED);
    }
  }

  /** MENU_URL은 전체 메뉴에서 중복 불가 (UK_MENU_URL). excludeMenuId(자기 자신)는 제외 */
  private void checkMenuUrlUnused(String menuUrl, String excludeMenuId) {
    if (menuUrl != null && this.menuDao.selectMenuUrlCount(menuUrl, excludeMenuId) > 0) {
      throw new LearningworksException(ErrorCode.MENU_URL_USED);
    }
  }

  /**
   * 메뉴 수정. 상위 메뉴 · 순서는 바꾸지 않는다.
   * - 메뉴 행을 잠근(SELECT ... FOR UPDATE) 뒤 요청의 mdfyDt와 DB의 MDFY_DT를 비교한다 (둘 다 null이면 같음).
   *   다르면 MENU_OUTDATED. 이 검사가 없으면 나중에 저장한 쪽이 먼저 저장한 변경을 말없이 덮어쓴다.
   * - MENU_ROLE은 해당 메뉴 행을 모두 지우고 roleIds로 다시 넣는다.
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public MenuVO updateMenu(String actorId, String menuId, ModifyMenuVO modifyMenuVO) {
    String actorRoleId = this.findRoleId(actorId);

    MenuVO current = this.menuDao.selectMenuByIdForUpdate(menuId);
    if (current == null) {
      throw new LearningworksException(ErrorCode.MENU_NOT_EXISTS);
    }
    MenuTree tree = new MenuTree(this.menuDao.selectAllMenus());
    int level = tree.levelOf(menuId);

    MenuVO menu = new MenuVO();
    menu.setId(menuId);
    menu.setTitle(modifyMenuVO.getTitle().strip());
    menu.setUseYn(modifyMenuVO.getUseYn());
    menu.setSpread(MenuServiceImpl.normalizeSpread(level, modifyMenuVO.getSpread()));
    menu.setMenuUrl(MenuServiceImpl.normalizeMenuUrl(level, modifyMenuVO.getMenuUrl()));
    List<String> roleIds = this.validateRoleIds(modifyMenuVO.getRoleIds());

    if (MenuServiceImpl.isSelfLockTarget(actorRoleId, tree, menuId)) {
      boolean ownRoleRemoved = !roleIds.contains(actorRoleId);
      boolean unused = MenuConstants.NO.equals(menu.getUseYn());
      boolean managementUrlChanged = MenuConstants.MENU_MANAGEMENT_URL.equals(current.getMenuUrl())
          && !MenuConstants.MENU_MANAGEMENT_URL.equals(menu.getMenuUrl());
      if (ownRoleRemoved || unused || managementUrlChanged) {
        throw new LearningworksException(ErrorCode.MENU_SELF_LOCK);
      }
    }

    if (!Objects.equals(modifyMenuVO.getMdfyDt(), current.getMdfyDt())) {
      throw new LearningworksException(ErrorCode.MENU_OUTDATED);
    }

    this.checkTitleUnused(current.getParentId(), menu.getTitle(), menuId);
    this.checkMenuUrlUnused(menu.getMenuUrl(), menuId);

    try {
      this.menuDao.updateMenu(menu);
    } catch (DuplicateKeyException dke) {
      throw new LearningworksException(ErrorCode.MENU_URL_USED, dke);
    }
    this.menuDao.deleteMenuRolesByMenuId(menuId);
    roleIds.forEach(roleId -> this.menuDao.insertMenuRole(menuId, roleId));

    return this.readMenu(menuId);
  }

  /**
   * 자기 잠금 검사(MENU_SELF_LOCK) 대상인지.
   * 요청자가 SUPER_ADMIN이 아니고, 대상 메뉴가 메뉴 관리 소메뉴(MENU_MANAGEMENT_URL)이거나 그 상위 메뉴일 때.
   * 메뉴 관리 메뉴가 아직 없으면 보호 대상도 없다 (그때는 SUPER_ADMIN만 메뉴 관리 화면에 들어갈 수 있다).
   */
  private static boolean isSelfLockTarget(String actorRoleId, MenuTree tree, String menuId) {
    if (RoleConstants.SUPER_ADMIN_ROLE.equals(actorRoleId)) {
      return false;
    }
    MenuVO managementMenu = tree.findByMenuUrl(MenuConstants.MENU_MANAGEMENT_URL);
    if (managementMenu == null) {
      return false;
    }
    return tree.selfAndAncestors(managementMenu.getId()).stream()
        .anyMatch(menu -> menu.getId().equals(menuId));
  }

  /**
   * 메뉴 순서 변경 (같은 상위 메뉴 안). 받은 순서대로 MENU_ORDER를 1부터 다시 매긴다.
   * - menuIds는 해당 상위 메뉴의 현재 하위 메뉴 전체여야 한다. 그 사이 추가 · 삭제되었으면 MENU_ORDER_OUTDATED
   * - MDFY_DT는 바꾸지 않는다 (열어 둔 다른 화면의 수정이 MENU_OUTDATED로 거부되지 않게)
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public MenuListVO updateMenuOrder(ModifyMenuOrderVO modifyMenuOrderVO) {
    List<String> menuIds = modifyMenuOrderVO.getMenuIds();
    if (menuIds == null || menuIds.isEmpty() || menuIds.stream().anyMatch(Objects::isNull)
        || new HashSet<>(menuIds).size() != menuIds.size()) {
      throw new LearningworksException(ErrorCode.MENU_ORDER_INVALID);
    }

    String parentId = modifyMenuOrderVO.getParentId();
    if (parentId != null && this.menuDao.selectMenuById(parentId) == null) {
      throw new LearningworksException(ErrorCode.MENU_NOT_EXISTS);
    }

    Set<String> currentChildIds = new HashSet<>(this.menuDao.selectChildMenuIds(parentId));
    if (!currentChildIds.equals(new HashSet<>(menuIds))) {
      throw new LearningworksException(ErrorCode.MENU_ORDER_OUTDATED);
    }

    this.menuDao.updateMenuOrders(menuIds);

    return this.readMenuList();
  }

  /**
   * 상위 메뉴 변경 (메뉴 옮기기, 설계 4-7). 검사 순서는 수정과 같다: 잠금 → 입력값 → 자기 잠금 → mdfyDt → 이름 중복.
   * - 소메뉴는 다른 중메뉴로, 중메뉴는 다른 대메뉴로만 옮긴다. 대메뉴 · 단계가 다른 상위 메뉴 · 지금과 같은 상위 메뉴는 MENU_MOVE_INVALID
   * - 옮긴 메뉴는 새 상위 메뉴의 맨 뒤에 붙고 MDFY_DT가 바뀐다. 원래 상위 메뉴의 순서는 1부터 다시 매긴다. MENU_ROLE은 그대로
   * - 이 메뉴를 가리키는 ACTION의 메뉴 컬럼을 같은 트랜잭션에서 고친다 (D-10)
   * - 옮길 메뉴 행을 잠근다. 중메뉴면 하위 소메뉴 행도 잠근다: ACTION 저장(checkAndLockMenuPath)이 소메뉴 행을 잠그고 경로를 확인하므로,
   *   동시에 일어나도 ACTION에 옛 대메뉴가 남지 않는다
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public MenuListVO moveMenu(String actorId, String menuId, ModifyMenuParentVO modifyMenuParentVO) {
    String actorRoleId = this.findRoleId(actorId);

    MenuVO current = this.menuDao.selectMenuByIdForUpdate(menuId);
    if (current == null) {
      throw new LearningworksException(ErrorCode.MENU_NOT_EXISTS);
    }
    MenuTree tree = new MenuTree(this.menuDao.selectAllMenus());
    int level = tree.levelOf(menuId);

    String parentId = modifyMenuParentVO.getParentId();
    if (level == MenuConstants.TOP_LEVEL || parentId == null
        || parentId.equals(current.getParentId())) {
      throw new LearningworksException(ErrorCode.MENU_MOVE_INVALID);
    }
    if (tree.get(parentId) == null) {
      throw new LearningworksException(ErrorCode.MENU_NOT_EXISTS);
    }
    if (tree.levelOf(parentId) != level - 1) {
      throw new LearningworksException(ErrorCode.MENU_MOVE_INVALID);
    }

    List<String> childIds = this.menuDao.selectChildMenuIds(menuId);
    childIds.forEach(this.menuDao::selectMenuByIdForUpdate);

    if (MenuServiceImpl.isSelfLockTarget(actorRoleId, tree, menuId)
        && !this.isAccessible(actorRoleId, tree, parentId)) {
      throw new LearningworksException(ErrorCode.MENU_SELF_LOCK);
    }

    if (!Objects.equals(modifyMenuParentVO.getMdfyDt(), current.getMdfyDt())) {
      throw new LearningworksException(ErrorCode.MENU_OUTDATED);
    }

    this.checkTitleUnused(parentId, current.getTitle(), menuId);

    this.menuDao.updateMenuParent(menuId, parentId, this.menuDao.selectMaxMenuOrder(parentId) + 1);
    List<String> oldSiblingIds = this.menuDao.selectChildMenuIds(current.getParentId());
    if (!oldSiblingIds.isEmpty()) {
      this.menuDao.updateMenuOrders(oldSiblingIds);
    }

    if (level == MenuConstants.BOTTOM_LEVEL) {
      this.accessDao.updateActionMenusByBtmMenuId(menuId, parentId, tree.get(parentId).getParentId());
    } else {
      this.accessDao.updateActionTopMenuByMidMenuId(menuId, parentId);
    }

    return this.readMenuList();
  }

  /** 요청자의 역할로 이 메뉴(와 모든 상위 메뉴)에 들어갈 수 있는지: 모두 사용(Y)이고 MENU_ROLE에 역할이 있음 (내 메뉴와 같은 기준) */
  private boolean isAccessible(String roleId, MenuTree tree, String menuId) {
    Set<String> allowedMenuIds = this.menuDao.selectAllMenuRoles().stream()
        .filter(menuRole -> roleId.equals(menuRole.getRoleId()))
        .map(MenuRoleVO::getMenuId)
        .collect(Collectors.toSet());
    return tree.selfAndAncestors(menuId).stream()
        .allMatch(menu -> MenuConstants.YES.equals(menu.getUseYn())
            && allowedMenuIds.contains(menu.getId()));
  }

  /**
   * 메뉴 물리 삭제. 한 트랜잭션에서 MENU_ROLE 삭제 → MENU 삭제 → 같은 상위 메뉴의 순서를 1부터 다시 매긴다.
   * - 자기 잠금 검사(MENU_SELF_LOCK)를 하위 메뉴 검사보다 먼저 한다
   * - 하위 메뉴가 있으면 MENU_HAS_CHILDREN, ACTION이 참조하면 MENU_IN_USE (FK가 없으므로 서비스에서 검사)
   * - 메뉴 행을 잠근 뒤 검사한다. ACTION 저장(checkAndLockMenuPath)도 같은 행을 잠그므로,
   *   검사와 삭제 사이에 이 메뉴를 쓰는 ACTION이 저장되지 않는다.
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public MenuVO deleteMenu(String actorId, String menuId) {
    String actorRoleId = this.findRoleId(actorId);

    if (this.menuDao.selectMenuByIdForUpdate(menuId) == null) {
      throw new LearningworksException(ErrorCode.MENU_NOT_EXISTS);
    }
    MenuVO menu = this.readMenu(menuId);
    MenuTree tree = new MenuTree(this.menuDao.selectAllMenus());

    if (MenuServiceImpl.isSelfLockTarget(actorRoleId, tree, menuId)) {
      throw new LearningworksException(ErrorCode.MENU_SELF_LOCK);
    }
    if (!this.menuDao.selectChildMenuIds(menuId).isEmpty()) {
      throw new LearningworksException(ErrorCode.MENU_HAS_CHILDREN);
    }
    if (this.menuDao.selectActionCountByMenuId(menuId) > 0) {
      throw new LearningworksException(ErrorCode.MENU_IN_USE);
    }

    this.menuDao.deleteMenuRolesByMenuId(menuId);
    // 조회와 삭제 사이에 다른 요청이 먼저 삭제한 경우
    if (this.menuDao.deleteMenu(menuId) == 0) {
      throw new LearningworksException(ErrorCode.MENU_NOT_EXISTS);
    }

    List<String> siblingIds = this.menuDao.selectChildMenuIds(menu.getParentId());
    if (!siblingIds.isEmpty()) {
      this.menuDao.updateMenuOrders(siblingIds);
    }

    return menu;
  }

  /**
   * ACTION 저장용 메뉴 경로 확인. 소메뉴 행만 잠근다.
   * 경로가 맞으면 중 · 대메뉴는 소메뉴의 상위이므로 하위 메뉴가 있어 삭제되지 않는다 (MENU_HAS_CHILDREN).
   */
  @Override
  public boolean checkAndLockMenuPath(String topMenuId, String midMenuId, String btmMenuId) {
    if (topMenuId == null || midMenuId == null || btmMenuId == null) {
      return false;
    }

    MenuVO btmMenu = this.menuDao.selectMenuByIdForUpdate(btmMenuId);
    if (btmMenu == null || !midMenuId.equals(btmMenu.getParentId())) {
      return false;
    }

    MenuVO midMenu = this.menuDao.selectMenuById(midMenuId);
    if (midMenu == null || !topMenuId.equals(midMenu.getParentId())) {
      return false;
    }

    MenuVO topMenu = this.menuDao.selectMenuById(topMenuId);
    return topMenu != null && topMenu.getParentId() == null;
  }

}
