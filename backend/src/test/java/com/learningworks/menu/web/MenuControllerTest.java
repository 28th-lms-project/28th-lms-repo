package com.learningworks.menu.web;

import java.lang.reflect.Method;
import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.exceptions.ValidationFailedException;
import com.learningworks.common.exceptions.handler.GlobalExceptionHandler;
import com.learningworks.common.utils.ApiResponseStatusAdvice;
import com.learningworks.menu.service.MenuService;
import com.learningworks.menu.vo.request.ModifyMenuOrderVO;
import com.learningworks.menu.vo.request.ModifyMenuVO;
import com.learningworks.menu.vo.request.RegistMenuVO;
import com.learningworks.menu.vo.response.MenuListVO;
import com.learningworks.menu.vo.response.MenuVO;
import com.learningworks.menu.vo.response.MyMenuListVO;

class MenuControllerTest {

  MenuService menuService;
  MockMvc mockMvc;

  static final UsernamePasswordAuthenticationToken LOGIN =
      UsernamePasswordAuthenticationToken.authenticated("admin", null, List.of());

  @BeforeEach
  void setUp() {
    this.menuService = Mockito.mock(MenuService.class);
    this.mockMvc = MockMvcBuilders.standaloneSetup(new MenuController(this.menuService))
        .setControllerAdvice(new GlobalExceptionHandler(), new ApiResponseStatusAdvice())
        .build();
  }

  @Test
  @DisplayName("권한: 내 메뉴는 @LoginRequired, 메뉴 관리 API는 MENU 도메인 권한 코드")
  void permissions() throws Exception {
    Assertions.assertThat(method("getMyMenus").isAnnotationPresent(LoginRequired.class)).isTrue();

    Assertions.assertThat(action("getMenus")).isEqualTo("MENU_READ 메뉴 목록 조회");
    Assertions.assertThat(action("createMenu")).isEqualTo("MENU_CREATE 메뉴 등록");
    Assertions.assertThat(action("modifyMenu")).isEqualTo("MENU_UPDATE 메뉴 수정");
    Assertions.assertThat(action("modifyMenuOrder")).isEqualTo("MENU_UPDATE 메뉴 수정");
    Assertions.assertThat(action("deleteMenu")).isEqualTo("MENU_DELETE 메뉴 삭제");
  }

  static Method method(String name) {
    for (Method method : MenuController.class.getDeclaredMethods()) {
      if (method.getName().equals(name)) {
        return method;
      }
    }
    throw new AssertionError("메서드 없음: " + name);
  }

  static String action(String name) {
    RequireAction requireAction = method(name).getAnnotation(RequireAction.class);
    return requireAction.domain() + "_" + requireAction.action() + " " + requireAction.description();
  }

  @Test
  @DisplayName("GET /menus/me: 로그인 사용자 ID로 내 메뉴를 조회한다")
  void getMyMenus() throws Exception {
    Mockito.when(this.menuService.readMyMenus("admin"))
        .thenReturn(new MyMenuListVO(false, List.of(), List.of("/")));

    this.mockMvc.perform(MockMvcRequestBuilders.get("/menus/me").principal(LOGIN))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.body.superAdmin").value(false))
        .andExpect(MockMvcResultMatchers.jsonPath("$.body.guardUrls[0]").value("/"));
  }

  @Test
  @DisplayName("GET /menus")
  void getMenus() throws Exception {
    Mockito.when(this.menuService.readMenuList()).thenReturn(new MenuListVO(List.of(), List.of()));

    this.mockMvc.perform(MockMvcRequestBuilders.get("/menus"))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.body.menus").isArray());
  }

  @Test
  @DisplayName("POST /menus: 201. 필수값이 없으면 GLOBAL_INVALID_PARAMETER와 필드별 메시지")
  void createMenu() throws Exception {
    MenuVO created = new MenuVO();
    created.setId("MN-20261111-000001");
    Mockito.when(this.menuService.createMenu(ArgumentMatchers.any(RegistMenuVO.class)))
        .thenReturn(created);

    this.mockMvc.perform(MockMvcRequestBuilders.post("/menus")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
            {"parentId": null, "title": "Main", "useYn": "Y", "spread": "N", "menuUrl": null, "roleIds": []}
            """))
        .andExpect(MockMvcResultMatchers.status().isCreated())
        .andExpect(MockMvcResultMatchers.jsonPath("$.body.id").value("MN-20261111-000001"));

    this.mockMvc.perform(MockMvcRequestBuilders.post("/menus")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
            {"title": " ", "useYn": "X"}
            """))
        .andExpect(MockMvcResultMatchers.status().isBadRequest())
        .andExpect(MockMvcResultMatchers.jsonPath("$.errorCode").value("GLOBAL_INVALID_PARAMETER"))
        .andExpect(MockMvcResultMatchers.jsonPath("$.validations.title[0]").value("메뉴 이름을 입력해주세요."))
        .andExpect(MockMvcResultMatchers.jsonPath("$.validations.useYn[0]").value("사용 여부가 올바르지 않습니다."))
        .andExpect(MockMvcResultMatchers.jsonPath("$.validations.roleIds[0]").value("역할 목록을 입력해주세요."));
  }

  @Test
  @DisplayName("서비스의 단계별 입력값 오류도 같은 형식(validations)으로 응답한다")
  void serviceValidationError() throws Exception {
    Mockito.when(this.menuService.createMenu(ArgumentMatchers.any(RegistMenuVO.class)))
        .thenThrow(ValidationFailedException.of("menuUrl", "메뉴 URL을 입력해주세요."));

    this.mockMvc.perform(MockMvcRequestBuilders.post("/menus")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
            {"parentId": "MN-1", "title": "A", "useYn": "Y", "roleIds": []}
            """))
        .andExpect(MockMvcResultMatchers.status().isBadRequest())
        .andExpect(MockMvcResultMatchers.jsonPath("$.errorCode").value("GLOBAL_INVALID_PARAMETER"))
        .andExpect(MockMvcResultMatchers.jsonPath("$.validations.menuUrl[0]").value("메뉴 URL을 입력해주세요."));
  }

  @Test
  @DisplayName("PUT /menus/order는 PUT /menus/{menuId}보다 먼저 매칭된다")
  void orderPathTakesPrecedence() throws Exception {
    Mockito.when(this.menuService.updateMenuOrder(ArgumentMatchers.any(ModifyMenuOrderVO.class)))
        .thenReturn(new MenuListVO(List.of(), List.of()));

    this.mockMvc.perform(MockMvcRequestBuilders.put("/menus/order")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
            {"parentId": null, "menuIds": ["MN-1", "MN-2"]}
            """))
        .andExpect(MockMvcResultMatchers.status().isOk());

    Mockito.verify(this.menuService).updateMenuOrder(ArgumentMatchers.any());
    Mockito.verify(this.menuService, Mockito.never())
        .updateMenu(ArgumentMatchers.any(), ArgumentMatchers.any(), ArgumentMatchers.any());
  }

  @Test
  @DisplayName("PUT /menus/{menuId}, DELETE /menus/{menuId}: 요청자 ID와 메뉴 ID를 넘긴다")
  void modifyAndDelete() throws Exception {
    MenuVO menu = new MenuVO();
    menu.setId("MN-1");
    Mockito.when(this.menuService.updateMenu(ArgumentMatchers.eq("admin"), ArgumentMatchers.eq("MN-1"),
        ArgumentMatchers.any(ModifyMenuVO.class))).thenReturn(menu);
    Mockito.when(this.menuService.deleteMenu("admin", "MN-1")).thenReturn(menu);

    this.mockMvc.perform(MockMvcRequestBuilders.put("/menus/MN-1").principal(LOGIN)
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
            {"title": "A", "useYn": "Y", "roleIds": [], "mdfyDt": null}
            """))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.body.id").value("MN-1"));

    this.mockMvc.perform(MockMvcRequestBuilders.delete("/menus/MN-1").principal(LOGIN))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.body.id").value("MN-1"));
  }

}
