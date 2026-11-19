package com.learningworks.dashboard.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import com.learningworks.dashboard.vo.response.AdminCourseVO;
import com.learningworks.dashboard.vo.response.AdminDashboardVO;
import com.learningworks.dashboard.vo.response.DataCheckVO;
import com.learningworks.dashboard.vo.response.RoleMemberCountVO;

@Mapper
public interface DashboardDao {

	/** 과정 수(진행 중 · 시작 전 · 종료)와 진행 중 과정의 수강생 · 강사 수만 채운다 */
	AdminDashboardVO selectCourseCounts();

	/** 진행 중 과정 (강사 이름 · 수강생 수 · 채점 대기), 끝나는 날 순 */
	List<AdminCourseVO> selectActiveCourses();

	/** 손볼 데이터 (DataCheckVO 의 checkType 참고) */
	List<DataCheckVO> selectDataChecks();

	/** 역할별 회원 수 (역할 순위 순) */
	List<RoleMemberCountVO> selectRoleMemberCounts();

	/** 로그인이 잠긴 회원 수 */
	int selectLockedMemberCount();

	/** ACTION 에 등록됐지만 어떤 역할에도 허용되지 않은 권한 코드 (이름순) */
	List<String> selectUngrantedActionCodes();
}
