package com.learningworks.accessrole.service;

import com.learningworks.accessrole.vo.request.AccessRoleSaveRequestVO;
import com.learningworks.accessrole.vo.response.AccessRolePermissionVO;

import java.util.List;

public interface AccessRoleService {

    // 허용 권한 목록 조회
    List<AccessRolePermissionVO> getAllowedPermissionList(
            String roleId
    );

    // 미허용 권한 목록 조회
    List<AccessRolePermissionVO> getDeniedPermissionList(
            String roleId
    );

    // 역할별 권한 저장
    void saveRolePermission(AccessRoleSaveRequestVO request);
}
