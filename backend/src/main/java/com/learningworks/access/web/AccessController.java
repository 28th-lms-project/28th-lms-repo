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
import com.learningworks.access.vo.response.AccessMenuVO;
import com.learningworks.common.utils.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

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

    @GetMapping("/menus")
    public ApiResponse<List<AccessMenuVO>> selectMenuList() {
        return ApiResponse.OK(accessService.selectMenuList());
    }

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
