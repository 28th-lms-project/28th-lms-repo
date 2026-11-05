package com.learningworks.access.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.access.service.AccessService;
import com.learningworks.access.vo.request.AccessSaveRequestVO;
import com.learningworks.access.vo.request.AccessSearchRequestVO;
import com.learningworks.access.vo.response.AccessListVO;
import com.learningworks.access.vo.response.AccessMenuVO;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/access")
public class AccessController {

    private final AccessService accessService;

    // 접근 권한 목록 조회
    @GetMapping("/actions")
    public ResponseEntity<Map<String, Object>> selectAccessList(
            @RequestParam(required = false) String topMenuId,
            @RequestParam(required = false) String midMenuId,
            @RequestParam(required = false) String btmMenuId,
            @RequestParam(required = false) String actionName
    ) {

        AccessSearchRequestVO request = new AccessSearchRequestVO();

        request.setTopMenuId(topMenuId);
        request.setMidMenuId(midMenuId);
        request.setBtmMenuId(btmMenuId);
        request.setActionName(actionName);

        List<AccessListVO> result = accessService.selectAccessList(request);

        return response(result);
    }

    // 전체 메뉴 목록 조회
    @GetMapping("/menus")
    public ResponseEntity<Map<String, Object>> selectMenuList() {

        List<AccessMenuVO> result = accessService.selectMenuList();

        return response(result);
    }

    // 접근 권한 신규 등록 및 수정
    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> saveAccess(
            @RequestBody AccessSaveRequestVO request
    ) {

        accessService.saveAccess(request);

        return response(null);
    }

    private ResponseEntity<Map<String, Object>> response(Object data) {

        Map<String, Object> result = new HashMap<>();

        result.put("responseCode", "SUCCESS");
        result.put("message", "정상적으로 처리되었습니다.");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }
}