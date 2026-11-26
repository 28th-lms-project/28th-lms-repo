package com.learningworks.access.web;

import java.util.List;

import com.learningworks.common.action.RequireAction;
import com.learningworks.common.action.RequireSuperAdmin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.access.service.AccessService;
import com.learningworks.access.vo.request.AccessSaveRequestVO;
import com.learningworks.access.vo.request.AccessSearchRequestVO;
import com.learningworks.access.vo.response.AccessListVO;
import com.learningworks.common.utils.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;

// 접근 권한(ACTION) 관리 화면 전용. 저장은 ROLE_SUPER_ADMIN 전용 (D-03)
// 메뉴 목록은 메뉴 모듈의 GET /menus를 사용한다 (예전 GET /access/menus는 삭제)
@Tag(name = "접근 권한", description = "접근 권한(권한 코드) 목록 · 저장")
@RestController
@RequiredArgsConstructor
@RequestMapping("/access")
public class AccessController {

    private final AccessService accessService;

    @RequireAction(domain = "ACCESS", action = "READ", description = "접근 권한 목록 조회")
    @GetMapping("/actions")
    public ApiResponse<List<AccessListVO>> selectAccessList(
            @ModelAttribute AccessSearchRequestVO request
    ) {
        return ApiResponse.OK(accessService.selectAccessList(request));
    }

    // 접근 권한 신규 등록 및 수정 (저장 후 전체 접근 권한 목록 반환)
    @RequireSuperAdmin
    @PostMapping("/save")
    public ApiResponse<List<AccessListVO>> saveAccess(
            @Valid @RequestBody AccessSaveRequestVO request
    ) {
        accessService.saveAccess(request);

        return ApiResponse.OK(
                accessService.selectAccessList(new AccessSearchRequestVO())
        );
    }
}
