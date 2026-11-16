package com.learningworks.menu.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.learningworks.menu.vo.response.MenuRoleVO;
import com.learningworks.menu.vo.response.MenuVO;

/**
 * MENU, MENU_ROLE 테이블. 조회한 MenuVO의 roleIds는 비어 있다 (서비스가 MENU_ROLE로 채움).
 */
@Mapper
public interface MenuDao {

  /** 전체 메뉴 */
  List<MenuVO> selectAllMenus();

  /** 메뉴 1건. 없으면 null */
  MenuVO selectMenuById(String menuId);

  /** 메뉴 1건을 잠그고 조회 (SELECT ... FOR UPDATE). 없으면 null */
  MenuVO selectMenuByIdForUpdate(String menuId);

  /** parentId의 하위 메뉴 ID (MENU_ORDER 순). parentId가 null이면 대메뉴 */
  List<String> selectChildMenuIds(@Param("parentId") String parentId);

  /** parentId의 하위 메뉴 중 MENU_ORDER 최댓값. 하위 메뉴가 없으면 0. parentId가 null이면 대메뉴 */
  int selectMaxMenuOrder(@Param("parentId") String parentId);

  /** 같은 상위 메뉴 안에서 같은 이름의 메뉴 수. excludeMenuId(자기 자신)는 제외, null이면 제외 없음 */
  long selectTitleCount(@Param("parentId") String parentId, @Param("title") String title,
      @Param("excludeMenuId") String excludeMenuId);

  /** 같은 MENU_URL을 쓰는 메뉴 수. excludeMenuId(자기 자신)는 제외, null이면 제외 없음 */
  long selectMenuUrlCount(@Param("menuUrl") String menuUrl,
      @Param("excludeMenuId") String excludeMenuId);

  /** ACTION의 TOP_MENU_ID · MID_MENU_ID · BTM_MENU_ID 중 하나라도 menuId를 참조하는 행 수 */
  long selectActionCountByMenuId(String menuId);

  /** 메뉴 등록. selectKey로 menu.id를 채운다. CRT_DT = SYSDATE, MDFY_DT = null */
  int insertMenu(MenuVO menu);

  /** 이름 · 사용 여부 · 펼침 · URL 수정. MDFY_DT = SYSDATE */
  int updateMenu(MenuVO menu);

  /** menuIds 순서대로 MENU_ORDER를 1부터 다시 매긴다. MDFY_DT는 바꾸지 않는다 */
  int updateMenuOrders(@Param("menuIds") List<String> menuIds);

  /** 상위 메뉴 변경. 새 상위 메뉴 안의 순서(menuOrder)와 함께 저장하고 MDFY_DT = SYSDATE */
  int updateMenuParent(@Param("menuId") String menuId, @Param("parentId") String parentId,
      @Param("menuOrder") int menuOrder);

  int deleteMenu(String menuId);

  /** MENU_ROLE 전체 */
  List<MenuRoleVO> selectAllMenuRoles();

  /** 메뉴에 허용된 역할 ID */
  List<String> selectRoleIdsByMenuId(String menuId);

  /** MENU_ROLE 1행 등록. ID는 selectKey로 생성 */
  int insertMenuRole(@Param("menuId") String menuId, @Param("roleId") String roleId);

  int deleteMenuRolesByMenuId(String menuId);

}
