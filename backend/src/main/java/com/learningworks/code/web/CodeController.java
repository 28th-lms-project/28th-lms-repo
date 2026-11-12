package com.learningworks.code.web;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.code.service.CodeService;
import com.learningworks.code.vo.request.ModifyCodeVO;
import com.learningworks.code.vo.request.RegistCodeVO;
import com.learningworks.code.vo.response.CodeOptionVO;
import com.learningworks.code.vo.response.CodeVO;
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class CodeController {
	private CodeService codeService;

	/* ===== 환경 변수 관리 화면 ===== */

	/** 목록. parentId가 없으면 대분류, 있으면 그 하위 목록 (사용여부 N 포함, ORDER 순) */
	@RequireAction(domain = "CODE", action = "READ", description = "환경 변수 조회")
	@GetMapping("/admin/system/code")
	public ApiResponse<List<CodeVO>> getCodes(@RequestParam(required = false) String parentId) {
		List<CodeVO> codes = this.codeService.readCodeList(parentId);
		return ApiResponse.OK(codes);
	}

	/** 상세. 하단 입력 폼용 */
	@RequireAction(domain = "CODE", action = "READ", description = "환경 변수 조회")
	@GetMapping("/admin/system/code/{codeId}")
	public ApiResponse<CodeVO> getCode(@PathVariable String codeId) {
		CodeVO code = this.codeService.readCode(codeId);
		return ApiResponse.OK(code);
	}

	/** ID 중복 확인 */
	@RequireAction(domain = "CODE", action = "READ", description = "환경 변수 조회")
	@GetMapping("/admin/system/code/{codeId}/exists")
	public ApiResponse<Boolean> checkCodeExists(@PathVariable String codeId) {
		boolean exists = this.codeService.existsCode(codeId);
		return ApiResponse.OK(exists);
	}

	/** 추가. ID, P-ID, NAME, ORDER, 사용여부 전부 입력 (ORDER가 겹치면 기존 코드를 맨 뒤로) */
//	@RequireAction(domain = "CODE", action = "CREATE", description = "환경 변수 등록")
	@PostMapping("/admin/system/code")
	public ApiResponse<CodeVO> makeNewCode(@Valid @RequestBody RegistCodeVO registCode) {
		CodeVO code = this.codeService.createCode(registCode);
		return ApiResponse.CREATED(code);
	}

	/** 수정. P-ID, NAME, ORDER, 사용여부만 수정 (ID 불가). 같은 그룹에서 ORDER가 겹치면 맞바꿈 */
	@RequireAction(domain = "CODE", action = "UPDATE", description = "환경 변수 수정")
	@PutMapping("/admin/system/code/{codeId}")
	public ApiResponse<CodeVO> updateCode(@Valid @RequestBody ModifyCodeVO modCode, @PathVariable String codeId) {
		CodeVO code = this.codeService.updateCode(modCode, codeId);
		return ApiResponse.OK(code);
	}


	/* ===== 다른 화면에서 사용 (드롭다운 등) ===== */

	/** 특정 그룹의 하위 코드. USE_YN = 'Y'만, ORDER 순. 예: /codes/TEST_SUBJECT/children */
	@LoginRequired
	@GetMapping("/codes/{parentId}/codelist")
	public ApiResponse<List<CodeOptionVO>> getChildCodes(@PathVariable String parentId) {
		List<CodeOptionVO> codes = this.codeService.readCodesByParent(parentId);
		return ApiResponse.OK(codes);
	}
//
//	/** 여러 그룹 한 번에. 예: /codes/groups?parentIds=TEST_SUBJECT,TEST_TYPE */
//	@LoginRequired
//	@GetMapping("/codes/groups")
//	public ApiResponse<Map<String, List<CodeOptionVO>>> getCodeGroups(@RequestParam List<String> parentIds) {
//		Map<String, List<CodeOptionVO>> codeGroups = this.codeService.readUsableCodeGroups(parentIds);
//		return ApiResponse.OK(codeGroups);
//	}
}
