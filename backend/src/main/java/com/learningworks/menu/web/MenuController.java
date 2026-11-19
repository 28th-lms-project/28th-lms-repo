package com.learningworks.menu.web;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.menu.service.MenuService;
import com.learningworks.menu.vo.request.ModifyMenuOrderVO;
import com.learningworks.menu.vo.request.ModifyMenuParentVO;
import com.learningworks.menu.vo.request.ModifyMenuVO;
import com.learningworks.menu.vo.request.RegistMenuVO;
import com.learningworks.menu.vo.response.MenuListVO;
import com.learningworks.menu.vo.response.MenuVO;
import com.learningworks.menu.vo.response.MyMenuListVO;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 메뉴 · 메뉴 접근 권한. 설계: backend/docs/design/menu-design.md
 *
 * MENU_ROLE은 사이드바 표시와 URL 접근(프론트 가드)만 정한다. API 권한은 ROLE_ACTION이 정한다.
 */
@AllArgsConstructor
@Tag(name = "메뉴", description = "메뉴 · 메뉴별 역할 (사이드바, 화면 접근)")
@RestController
@RequestMapping("/menus")
public class MenuController {

  private MenuService menuService;

  /** 내 메뉴: 사이드바와 프론트 메뉴 가드용. 로그인 사용자 누구나 */
  @LoginRequired
  @GetMapping("/me")
  public ApiResponse<MyMenuListVO> getMyMenus(
      // JWT 인증 필터가 principal에 회원 ID(String)를 넣는다. 비로그인(익명)이면 null
      Authentication authentication) {
    MyMenuListVO result = this.menuService.readMyMenus(MenuController.userIdOf(authentication));

    return ApiResponse.OK(result);
  }

  /** 메뉴 관리 화면용 전체 역할 · 전체 메뉴. ACCESS 모듈의 메뉴 필터도 사용한다 */
  @RequireAction(domain = "MENU", action = "READ", description = "메뉴 목록 조회")
  @GetMapping
  public ApiResponse<MenuListVO> getMenus() {
    MenuListVO result = this.menuService.readMenuList();

    return ApiResponse.OK(result);
  }

  @RequireAction(domain = "MENU", action = "CREATE", description = "메뉴 등록")
  @PostMapping
  public ApiResponse<MenuVO> createMenu(@Valid @RequestBody RegistMenuVO registMenuVO) {
    MenuVO result = this.menuService.createMenu(registMenuVO);

    return ApiResponse.CREATED(result);
  }

  // 고정 경로(/order)가 /{menuId}보다 먼저 매칭된다 (RoleController와 같은 구조)
  @RequireAction(domain = "MENU", action = "UPDATE", description = "메뉴 수정")
  @PutMapping("/order")
  public ApiResponse<MenuListVO> modifyMenuOrder(@RequestBody ModifyMenuOrderVO modifyMenuOrderVO) {
    MenuListVO result = this.menuService.updateMenuOrder(modifyMenuOrderVO);

    return ApiResponse.OK(result);
  }

  @RequireAction(domain = "MENU", action = "UPDATE", description = "메뉴 수정")
  @PutMapping("/{menuId}")
  public ApiResponse<MenuVO> modifyMenu(Authentication authentication,
      @PathVariable String menuId, @Valid @RequestBody ModifyMenuVO modifyMenuVO) {
    MenuVO result = this.menuService.updateMenu(MenuController.userIdOf(authentication), menuId,
        modifyMenuVO);

    return ApiResponse.OK(result);
  }

  // 상위 메뉴 변경 (메뉴 옮기기). 수정 API와 따로 둔다 (menu-design.md 4-7). 권한은 수정과 같은 MENU_UPDATE (D-10)
  @RequireAction(domain = "MENU", action = "UPDATE", description = "메뉴 수정")
  @PutMapping("/{menuId}/parent")
  public ApiResponse<MenuListVO> moveMenu(Authentication authentication,
      @PathVariable String menuId, @RequestBody ModifyMenuParentVO modifyMenuParentVO) {
    MenuListVO result = this.menuService.moveMenu(MenuController.userIdOf(authentication), menuId,
        modifyMenuParentVO);

    return ApiResponse.OK(result);
  }

  @RequireAction(domain = "MENU", action = "DELETE", description = "메뉴 삭제")
  @DeleteMapping("/{menuId}")
  public ApiResponse<MenuVO> deleteMenu(Authentication authentication,
      @PathVariable String menuId) {
    MenuVO result = this.menuService.deleteMenu(MenuController.userIdOf(authentication), menuId);

    return ApiResponse.OK(result);
  }

  private static String userIdOf(Authentication authentication) {
    return authentication == null ? null : authentication.getName();
  }

}
