package com.learningworks.accessrole.service;

import com.learningworks.accessrole.dao.AccessRoleDao;
import com.learningworks.accessrole.vo.request.AccessRoleSaveRequestVO;
import com.learningworks.accessrole.vo.response.AccessRolePermissionVO;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccessRoleServiceImpl implements AccessRoleService {

    private final AccessRoleDao accessRoleDao;

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

    // 역할별 권한 저장 (roleId, actionIds 필수값 검증은 @Valid에서 처리)
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveRolePermission(AccessRoleSaveRequestVO request) {

        String roleId = request.getRoleId();

        validateRole(roleId);

        // 중복 권한 제거
        List<String> actionIds = request.getActionIds().stream()
                .distinct()
                .toList();

        // 전달받은 권한 ID가 실제 ACTION에 존재하는지 확인
        if (!actionIds.isEmpty()) {

            int actionCount = accessRoleDao.selectActionCount(
                    actionIds
            );

            if (actionCount != actionIds.size()) {
                throw new LearningworksException(
                        ErrorCode.ACTION_NOT_EXISTS
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

        int count = accessRoleDao.selectRoleCount(roleId);

        if (count == 0) {
            throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);
        }
    }
}
