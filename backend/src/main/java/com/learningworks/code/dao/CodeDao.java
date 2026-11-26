package com.learningworks.code.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.code.vo.request.ModifyCodeVO;
import com.learningworks.code.vo.request.RegistCodeVO;
import com.learningworks.code.vo.response.CodeOptionVO;
import com.learningworks.code.vo.response.CodeVO;

@Mapper
public interface CodeDao {

	List<CodeVO> searchCodeList(String parentId);

	CodeVO searchOneCode(String codeId);

	int insertCode(
			@Param("registCode")RegistCodeVO registCode);

	int countCodeById(String codeId);

	int updateCode(@Param("modCode")ModifyCodeVO modCode, @Param("codeId") String codeId);

	int searchMaxOrder(String parentId);

	CodeVO searchCodeByParentAndOrder(@Param("parentId") String parentId, @Param("order") Integer order, @Param("codeId") String codeId);

	int updateCodeOrder(@Param("id") String id, @Param("lastOrder") int lastOrder);

	List<CodeOptionVO> searchCodeByParentId(String parentId);

	/** 이 코드를 쓰고 있는 데이터 수 (그룹 parentId 마다 확인하는 테이블이 다름) */
	int countCodeInUse(@Param("codeId") String codeId, @Param("parentId") String parentId);

}
