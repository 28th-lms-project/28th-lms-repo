package com.learningworks.counsel.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.AuthUtil;
import com.learningworks.course.service.CourseAccessChecker;
import com.learningworks.counsel.dao.CounselDao;
import com.learningworks.counsel.vo.request.CapabilityRequestVO;
import com.learningworks.counsel.vo.request.ConsultDataRequestVO;
import com.learningworks.counsel.vo.request.CounselRequestVO;
import com.learningworks.counsel.vo.request.OpinionRequestVO;
import com.learningworks.counsel.vo.response.CapabilityResponseVO;
import com.learningworks.counsel.vo.response.ConsultDataResponseVO;
import com.learningworks.counsel.vo.response.CounselDetailResponseVO;
import com.learningworks.counsel.vo.response.CounselListResponseVO;
import com.learningworks.counsel.vo.response.ScoreResponseVO;

@Service
public class CounselServiceImpl implements CounselService {

	private final CounselDao counselDao;

	/** 과정 단위 권한 확인: 상담은 관리자 또는 이 과정의 강사만 */
	private final CourseAccessChecker courseAccess;

	public CounselServiceImpl(CounselDao counselDao, CourseAccessChecker courseAccess) {
		this.counselDao = counselDao;
		this.courseAccess = courseAccess;
	}

	@Override
	@Transactional(readOnly = true)
	public List<CounselListResponseVO> getCounselList(String courseId) {
		validateRequired(courseId);
		checkTutorOrAdmin(courseId);
		return this.counselDao.selectCounselList(courseId);
	}

	@Override
	@Transactional(readOnly = true)
	public CounselDetailResponseVO getCounselDetail(String courseId, String courseStudentId) {
		validateCourseStudent(courseId, courseStudentId);
		return this.counselDao.selectCounselDetail(courseStudentId);
	}

	@Override
	@Transactional
	public void createCounsel(String courseId, String courseStudentId, CounselRequestVO counselRequestVO) {
		validateCourseStudent(courseId, courseStudentId);

		// COURSE_STUDENT_ID 가 PK 이므로 수강생당 하나만 생성
		if (this.counselDao.countCounsel(courseStudentId) > 0) {
			throw new LearningworksException(ErrorCode.GLOBAL_DUPLICATED);
		}

		counselRequestVO.setCourseStudentId(courseStudentId);
		counselRequestVO.setContact(counselRequestVO.getContact().trim());

		if (this.counselDao.insertCounsel(counselRequestVO) != 1) {
			throw new LearningworksException(ErrorCode.COUNSEL_FAILURE_CREATE);
		}
	}

	@Override
	@Transactional(readOnly = true)
	public CapabilityResponseVO getCapability(String courseId, String courseStudentId) {
		validateCourseStudent(courseId, courseStudentId);
		return this.counselDao.selectCapability(courseStudentId);
	}

	@Override
	@Transactional
	public void updateCapability(String courseId, String courseStudentId, CapabilityRequestVO capabilityRequestVO) {
		validateCounselExists(courseId, courseStudentId);

		capabilityRequestVO.setCourseStudentId(courseStudentId);

		if (this.counselDao.updateCapability(capabilityRequestVO) != 1) {
			throw new LearningworksException(ErrorCode.COUNSEL_FAILURE_UPDATE);
		}
	}

	@Override
	@Transactional(readOnly = true)
	public List<ScoreResponseVO> getScoreList(String courseId, String courseStudentId) {
		validateCourseStudent(courseId, courseStudentId);
		return this.counselDao.selectScoreList(courseStudentId);
	}

	@Override
	@Transactional(readOnly = true)
	public Double getAverageScore(String courseId, String courseStudentId) {
		validateCourseStudent(courseId, courseStudentId);
		return this.counselDao.selectAverageScore(courseStudentId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<ConsultDataResponseVO> getConsultDataList(String courseId, String courseStudentId) {
		validateCourseStudent(courseId, courseStudentId);
		return this.counselDao.selectConsultDataList(courseStudentId);
	}

	@Override
	@Transactional
	public String createConsultData(String courseId, String courseStudentId, ConsultDataRequestVO consultDataRequestVO) {
		validateCourseStudent(courseId, courseStudentId);

		// 공백만 입력한 경우는 @NotBlank 에서 차단
		consultDataRequestVO.setConsultDesc(consultDataRequestVO.getConsultDesc().trim());
		consultDataRequestVO.setCourseStudentId(courseStudentId);
		consultDataRequestVO.setConsultUser(AuthUtil.getLoginId());

		// ID 는 Mapper 의 selectKey 로 생성 (CC-YYYYMMDD-NNNNNN)
		if (this.counselDao.insertConsultData(consultDataRequestVO) != 1) {
			throw new LearningworksException(ErrorCode.COUNSEL_FAILURE_CREATE);
		}

		return consultDataRequestVO.getId();
	}

	@Override
	@Transactional(readOnly = true)
	public String getOpinion(String courseId, String courseStudentId) {
		validateCourseStudent(courseId, courseStudentId);
		return this.counselDao.selectOpinion(courseStudentId);
	}

	@Override
	@Transactional
	public void updateOpinion(String courseId, String courseStudentId, OpinionRequestVO opinionRequestVO) {
		validateCounselExists(courseId, courseStudentId);

		opinionRequestVO.setCourseStudentId(courseStudentId);

		if (this.counselDao.updateOpinion(opinionRequestVO) != 1) {
			throw new LearningworksException(ErrorCode.COUNSEL_FAILURE_UPDATE);
		}
	}

	/**
	 * 역량 진단, 종합의견은 COURSE_CONSULT 행이 있어야 수정할 수 있다.
	 * GENDER, CONTACT 가 NOT NULL 이라 성별, 연락처 없이 새 행을 만들 수 없기 때문.
	 */
	private void validateCounselExists(String courseId, String courseStudentId) {
		validateCourseStudent(courseId, courseStudentId);

		if (this.counselDao.countCounsel(courseStudentId) == 0) {
			throw new LearningworksException(ErrorCode.COUNSEL_NOT_EXISTS);
		}
	}

	// 요청한 수강생이 실제로 해당 과정에 참여 중인지 서버에서 검증
	private void validateCourseStudent(String courseId, String courseStudentId) {
		validateRequired(courseId);
		validateRequired(courseStudentId);
		checkTutorOrAdmin(courseId);

		if (this.counselDao.countCourseStudent(courseId, courseStudentId) == 0) {
			throw new LearningworksException(ErrorCode.COUNSEL_STUDENT_NOT_IN_COURSE);
		}
	}

	/**
	 * 상담(연락처 · 역량 진단 · 성적 · 상담 기록 · 의견)은 수강생 개인 정보라 관리자 또는 이 과정의 강사만 다룬다.
	 * 상담 권한(@RequireAction)이 있어도 다른 과정이거나 이 과정의 수강생이면 403 COURSE_NOT_AUTHORIZED.
	 */
	private void checkTutorOrAdmin(String courseId) {
		this.courseAccess.requireTutorOrAdmin(courseId);
	}

	private void validateRequired(String value) {
		if (value == null || value.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_MISSING_PARAMETER);
		}
	}
}
