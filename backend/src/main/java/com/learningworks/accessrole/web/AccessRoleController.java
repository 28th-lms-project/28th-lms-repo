package com.learningworks.accessrole.web;

import com.learningworks.accessrole.service.AccessRoleService;
import com.learningworks.accessrole.vo.request.AccessRoleSaveRequestVO;
import com.learningworks.accessrole.vo.response.AccessRolePermissionVO;
import com.learningworks.accessrole.vo.response.AccessRoleVO;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/access-role")
public class AccessRoleController {

    private final AccessRoleService accessRoleService;

    // 역할 목록 조회
    @GetMapping("/roles")
    public ResponseEntity<Map<String, Object>> getRoleList() {

        List<AccessRoleVO> result = accessRoleService.getRoleList();

        return success(result, "역할 목록 조회 성공");
    }

    // 역할별 허용 권한 조회
    @GetMapping("/allowed")
    public ResponseEntity<Map<String, Object>> getAllowedPermissionList(
            @RequestParam String roleId
    ) {

        List<AccessRolePermissionVO> result =
                accessRoleService.getAllowedPermissionList(roleId);

        return success(result, "허용 권한 조회 성공");
    }

    // 역할별 미허용 권한 조회
    @GetMapping("/denied")
    public ResponseEntity<Map<String, Object>> getDeniedPermissionList(
            @RequestParam String roleId
    ) {

        List<AccessRolePermissionVO> result =
                accessRoleService.getDeniedPermissionList(roleId);

        return success(result, "미허용 권한 조회 성공");
    }

    // 역할별 권한 저장
    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> saveRolePermission(
            @RequestBody AccessRoleSaveRequestVO request
    ) {

        accessRoleService.saveRolePermission(request);

        return success(null, "권한이 저장되었습니다.");
    }

    // 성공 응답
    private ResponseEntity<Map<String, Object>> success(
            Object data,
            String message
    ) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("responseCode", "SUCCESS");
        response.put("message", message);
        response.put("data", data);

        return ResponseEntity.ok(response);
    }

    // 실패 응답
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            IllegalArgumentException e
    ) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("responseCode", "FAIL");
        response.put("message", e.getMessage());
        response.put("data", null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(response);
    }
}