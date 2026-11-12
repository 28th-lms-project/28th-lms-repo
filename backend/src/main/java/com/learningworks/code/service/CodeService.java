package com.learningworks.code.service;

import java.util.List;

import com.learningworks.code.vo.request.ModifyCodeVO;
import com.learningworks.code.vo.request.RegistCodeVO;
import com.learningworks.code.vo.response.CodeOptionVO;
import com.learningworks.code.vo.response.CodeVO;

import jakarta.validation.Valid;

public interface CodeService {

	List<CodeVO> readCodeList(String parentId);

	CodeVO readCode(String codeId);

	CodeVO createCode(RegistCodeVO registCode);

	CodeVO updateCode(@Valid ModifyCodeVO modCode, String codeId);

	boolean existsCode(String codeId);

	List<CodeOptionVO> readCodesByParent(String parentId);

}
