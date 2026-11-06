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
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

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

    // 필수값 검증은 AccessVO의 @Valid 검증에서 처리
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveAccess(AccessSaveRequestVO request) {

        List<AccessVO> addedList = request.getAddedList();
        List<AccessVO> modifiedList = request.getModifiedList();

        // 신규 데이터 등록
        if (addedList != null) {
            for (AccessVO access : addedList) {

                int result = accessDao.insertAccess(access);

                if (result != 1) {
                    throw new LearningworksException(
                            ErrorCode.ACTION_FAILURE_SAVE
                    );
                }
            }
        }

        // 기존 데이터 수정
        if (modifiedList != null) {
            for (AccessVO access : modifiedList) {

                if (!StringUtils.hasText(access.getActionId())) {
                    throw new LearningworksException(
                            ErrorCode.GLOBAL_BAD_REQUEST
                    );
                }

                int result = accessDao.updateAccess(access);

                // 수정된 행이 없으면 대상 ACTION이 없는 것
                if (result == 0) {
                    throw new LearningworksException(
                            ErrorCode.ACTION_NOT_EXISTS
                    );
                }
            }
        }
    }
}
