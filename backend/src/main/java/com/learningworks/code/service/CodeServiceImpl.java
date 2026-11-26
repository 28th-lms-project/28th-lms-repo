package com.learningworks.code.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.code.dao.CodeDao;
import com.learningworks.code.vo.request.ModifyCodeVO;
import com.learningworks.code.vo.request.RegistCodeVO;
import com.learningworks.code.vo.response.CodeOptionVO;
import com.learningworks.code.vo.response.CodeVO;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CodeServiceImpl implements CodeService{
	private CodeDao codeDao;

	@Override
	public List<CodeVO> readCodeList(String parentId) {
		List<CodeVO> codeList = this.codeDao.searchCodeList(parentId);
		return codeList;
	}

	@Override
	public CodeVO readCode(String codeId) {
		CodeVO code = this.codeDao.searchOneCode(codeId);
		if (code == null) {
			throw new LearningworksException(ErrorCode.CODE_NOT_EXISTS);
		}
		return code;
	}

	@Override
	@Transactional
	public CodeVO createCode(RegistCodeVO registCode) {
		if (registCode.getParentId() != null && registCode.getParentId().isBlank()) {
			registCode.setParentId(null);
		}
		validateParent(registCode.getParentId(), registCode.getId());
		
		if(this.existsCode(registCode.getId())) {
			throw new LearningworksException(ErrorCode.CODE_ID_USED);
		}
		CodeVO codeConfl = this.codeDao.searchCodeByParentAndOrder(registCode.getParentId(), registCode.getOrder(), null);
		if (codeConfl != null) {
			int lastOrder = this.codeDao.searchMaxOrder(registCode.getParentId()) + 1;
			this.changeOrder(codeConfl.getId(), lastOrder);
		}

		int insertRows = this.codeDao.insertCode(registCode);
		if( insertRows == 0) {
			throw new LearningworksException(ErrorCode.CODE_FAILURE_CREATE);
		}
		CodeVO code = this.codeDao .searchOneCode(registCode.getId());
		return code;
	}

	@Override
	@Transactional
	public CodeVO updateCode(ModifyCodeVO modCode, String codeId) {
		if (modCode.getParentId() != null && modCode.getParentId().isBlank()) {
			modCode.setParentId(null);
		}
		
		CodeVO existCode = this.readCode(codeId);   // 없으면 CODE_NOT_EXISTS
		validateParent(modCode.getParentId(), codeId);

		// 쓰는 곳이 있는 코드를 끄거나 다른 그룹으로 옮기면 그 화면에서 사라지므로 막음
		boolean turningOff = "Y".equals(existCode.getUseYn()) && "N".equals(modCode.getUseYn());
		boolean leavingGroup = !Objects.equals(existCode.getParentId(), modCode.getParentId());
		if (turningOff || leavingGroup) {
			if (this.codeDao.countCodeInUse(codeId, existCode.getParentId()) > 0) {
				throw new LearningworksException(ErrorCode.CODE_IN_USE);
			}
		}

		// 바꾸려는 순서를 이미 쓰고 있는 코드 (자기 자신 제외)
		CodeVO conflict = this.codeDao.searchCodeByParentAndOrder(
				modCode.getParentId(), modCode.getOrder(), codeId);

		if (conflict != null) {
			int newOrder;
			if (Objects.equals(existCode.getParentId(),modCode.getParentId())) {
				// 같은 그룹: 겹친 코드가 내 원래 순서를 가져감 (맞바꾸기)
				newOrder = existCode.getOrder();
			} else {
				// 다른 그룹으로 이동: 겹친 코드를 그 그룹의 맨 뒤로
				newOrder = this.codeDao.searchMaxOrder(modCode.getParentId()) + 1;
			}
			this.changeOrder(conflict.getId(), newOrder);
		}

		int updateRows = this.codeDao.updateCode(modCode, codeId);
		if (updateRows == 0) {
			throw new LearningworksException(ErrorCode.CODE_FAILURE_UPDATE);
		}
		
		CodeVO code = this.codeDao.searchOneCode(codeId);
		return code;
	}
	
	@Override
	public boolean existsCode(String codeId) {

		if(this.codeDao.countCodeById(codeId) > 0) {
			return true;
		}
		return false;
	}
	
	/** 상위 변수 검사: 대분류(null 또는 빈 값)는 통과, 자기 자신이나 없는 ID는 불가 */
	private void validateParent(String parentId, String codeId) {
		if (parentId == null) {   // 대분류는 부모가 없으므로 검사하지 않음
			return;
		}
		if (parentId.equals(codeId)) {
			throw new LearningworksException(ErrorCode.CODE_PARENT_INVALID);
		}
		if (!this.existsCode(parentId)) {
			throw new LearningworksException(ErrorCode.CODE_NOT_EXISTS);
		}
	}
	
	/** 순서만 변경 (맞바꾸기, 맨 뒤로 보내기) */
	private void changeOrder(String codeId, int order) {
		int orderRows = this.codeDao.updateCodeOrder(codeId, order);
		if (orderRows == 0) {
			throw new LearningworksException(ErrorCode.CODE_FAILURE_UPDATE);
		}
	}

	@Override
	public List<CodeOptionVO> readCodesByParent(String parentId) {
		List<CodeOptionVO> codeOptions = this.codeDao.searchCodeByParentId(parentId);
		return codeOptions;
	}
}
