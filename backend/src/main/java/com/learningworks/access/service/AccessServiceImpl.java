package com.learningworks.access.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.learningworks.access.dao.AccessDao;
import com.learningworks.access.vo.request.AccessSaveRequestVO;
import com.learningworks.access.vo.request.AccessSearchRequestVO;
import com.learningworks.access.vo.response.AccessListVO;
import com.learningworks.access.vo.response.AccessMenuVO;
import com.learningworks.access.vo.response.AccessVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccessServiceImpl implements AccessService {

    private final AccessDao accessDao;

    @Override
    public List<AccessListVO> selectAccessList(
            AccessSearchRequestVO request
    ) {
        return accessDao.selectAccessList(request);
    }

    @Override
    public List<AccessMenuVO> selectMenuList() {
        return accessDao.selectMenuList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveAccess(AccessSaveRequestVO request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "저장할 데이터가 없습니다."
            );
        }

        List<AccessVO> addedList = request.getAddedList();
        List<AccessVO> modifiedList = request.getModifiedList();

        // 신규 데이터 등록
        if (addedList != null) {
            for (AccessVO access : addedList) {

                validateAccess(access);

                int result = accessDao.insertAccess(access);

                if (result != 1) {
                    throw new IllegalStateException(
                            "접근 권한 등록에 실패했습니다."
                    );
                }
            }
        }

        // 기존 데이터 수정
        if (modifiedList != null) {
            for (AccessVO access : modifiedList) {

                validateAccess(access);

                if (!StringUtils.hasText(access.getActionId())) {
                    throw new IllegalArgumentException(
                            "수정할 접근 권한 ID가 없습니다."
                    );
                }

                int result = accessDao.updateAccess(access);

                if (result != 1) {
                    throw new IllegalStateException(
                            "접근 권한 수정에 실패했습니다."
                    );
                }
            }
        }
    }

    private void validateAccess(AccessVO access) {

        if (access == null
                || !StringUtils.hasText(access.getActionName())
                || !StringUtils.hasText(access.getTopMenuId())
                || !StringUtils.hasText(access.getMidMenuId())
                || !StringUtils.hasText(access.getBtmMenuId())) {

            throw new IllegalArgumentException(
                    "접근 권한명과 대·중·소 메뉴를 모두 입력해주세요."
            );
        }
    }
}