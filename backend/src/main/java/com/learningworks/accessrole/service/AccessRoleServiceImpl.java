package com.learningworks.accessrole.service;

import com.learningworks.accessrole.dao.AccessRoleDao;
import com.learningworks.accessrole.vo.request.AccessRoleSaveRequestVO;
import com.learningworks.accessrole.vo.request.AccessRoleSaveRequestVO;
import com.learningworks.accessrole.vo.response.AccessRolePermissionVO;
import com.learningworks.accessrole.vo.response.AccessRoleVO;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccessRoleServiceImpl implements AccessRoleService {

    private final AccessRoleDao accessRoleDao;

    // 역할 목록 조회
    @Override
    public List<AccessRoleVO> getRoleList() {
        return accessRoleDao.selectRoleList();
    }

    // 허용 권한 목록 조회
    @Override
    public List<AccessRolePermissionVO> getAllowedPermissionList(
            String roleId
    ) {
        validateRole(roleId);

        return accessRoleDao.selectAllowedPermissionList(roleId);
    }

    // 미허용 권한 목록 조회
    @Override
    public List<AccessRolePermissionVO> getDeniedPermissionList(
            String roleId
    ) {
        validateRole(roleId);

        return accessRoleDao.selectDeniedPermissionList(roleId);
    }

    // 역할별 권한 저장
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveRolePermission(AccessRoleSaveRequestVO request) {

        if (request == null || request.getRoleId() == null
                || request.getRoleId().isBlank()) {
            throw new IllegalArgumentException("역할 정보가 없습니다.");
        }

        String roleId = request.getRoleId();

        List<String> actionIds = request.getActionIds() == null
                ? Collections.emptyList()
                : request.getActionIds();

        validateRole(roleId);

        // 중복 권한 제거
        actionIds = actionIds.stream()
                .distinct()
                .toList();

        // 전달받은 권한 ID가 실제 ACTION에 존재하는지 확인
        if (!actionIds.isEmpty()) {

            int actionCount = accessRoleDao.selectActionCount(
                    actionIds
            );

            if (actionCount != actionIds.size()) {
                throw new IllegalArgumentException(
                        "존재하지 않는 접근 권한이 포함되어 있습니다."
                );
            }
        }

        // 기존 권한 삭제
        accessRoleDao.deleteRolePermission(roleId);

        // 선택된 권한 등록
        if (!actionIds.isEmpty()) {
            accessRoleDao.insertRolePermission(
                    roleId,
                    actionIds
            );
        }
    }

    // 역할 존재 여부 확인
    private void validateRole(String roleId) {

        if (roleId == null || roleId.isBlank()) {
            throw new IllegalArgumentException("역할 ID가 없습니다.");
        }

        int count = accessRoleDao.selectRoleCount(roleId);

        if (count == 0) {
            throw new IllegalArgumentException(
                    "존재하지 않는 역할입니다."
            );
        }
    }
}