package com.learningworks.counsel.service;

import java.util.List;

import com.learningworks.counsel.vo.request.CapabilityRequestVO;
import com.learningworks.counsel.vo.request.ConsultDataRequestVO;
import com.learningworks.counsel.vo.request.CounselRequestVO;
import com.learningworks.counsel.vo.request.OpinionRequestVO;
import com.learningworks.counsel.vo.response.CapabilityResponseVO;
import com.learningworks.counsel.vo.response.ConsultDataResponseVO;
import com.learningworks.counsel.vo.response.CounselDetailResponseVO;
import com.learningworks.counsel.vo.response.CounselListResponseVO;
import com.learningworks.counsel.vo.response.ScoreResponseVO;

public interface CounselService {

	/** 과정의 수강생-종합의견 목록 조회 */
	List<CounselListResponseVO> getCounselList(String courseId);

	/** 교육생 기본 정보 조회 */
	CounselDetailResponseVO getCounselDetail(String courseId, String courseStudentId);

	/** 상담 기본 정보(성별, 연락처) 등록. 수강생당 하나만 생성 */
	void createCounsel(String courseId, String courseStudentId, CounselRequestVO counselRequestVO);

	/** 역량 수준 진단 조회. 상담 기본 정보가 없으면 null */
	CapabilityResponseVO getCapability(String courseId, String courseStudentId);

	/** 역량 수준 진단 수정 */
	void updateCapability(String courseId, String courseStudentId, CapabilityRequestVO capabilityRequestVO);

	/** 과목별 성적 조회 */
	List<ScoreResponseVO> getScoreList(String courseId, String courseStudentId);

	/** 평균 점수 조회. 성적이 없으면 null */
	Double getAverageScore(String courseId, String courseStudentId);

	/** 상담내용 목록 조회 (상담일자 오름차순) */
	List<ConsultDataResponseVO> getConsultDataList(String courseId, String courseStudentId);

	/** 상담내용 등록. 생성된 상담내용 ID 반환 */
	String createConsultData(String courseId, String courseStudentId, ConsultDataRequestVO consultDataRequestVO);

	/** 종합의견 조회 */
	String getOpinion(String courseId, String courseStudentId);

	/** 종합의견 수정 */
	void updateOpinion(String courseId, String courseStudentId, OpinionRequestVO opinionRequestVO);
}
