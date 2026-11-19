package com.learningworks.dashboard.vo.response;

import java.util.List;
import lombok.Data;

/**
 * 슈퍼관리자 시스템 점검 (GET /dashboard/system). 권한 코드 등록 상태.
 */
@Data
public class SystemCheckVO {

	/** 코드(@RequireAction · 선언)에는 있지만 ACTION 에 등록되지 않은 권한 코드. SUPER_ADMIN 말고는 아무도 쓸 수 없음 */
	private List<UnregisteredActionCodeVO> unregisteredCodes;

	/** ACTION 에는 있지만 코드에서 쓰지 않는 권한 코드 (다른 브랜치에서 쓰는 코드일 수 있음) */
	private List<String> unusedCodes;

	/** ACTION 에 등록됐지만 어떤 역할에도 허용되지 않은 권한 코드 */
	private List<String> ungrantedCodes;

	/** 미등록 권한 코드 한 건 */
	@Data
	public static class UnregisteredActionCodeVO {
		private String actionCode;
		private String description;
		/** 처음 정의된 위치 (예: CourseController#deleteCourse(String), CourseAccessChecker (선언)) */
		private String source;
	}
}
