package com.learningworks.counsel.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.counsel.vo.request.CapabilityRequestVO;
import com.learningworks.counsel.vo.request.ConsultDataRequestVO;
import com.learningworks.counsel.vo.request.CounselRequestVO;
import com.learningworks.counsel.vo.request.OpinionRequestVO;
import com.learningworks.counsel.vo.response.CapabilityResponseVO;
import com.learningworks.counsel.vo.response.ConsultDataResponseVO;
import com.learningworks.counsel.vo.response.CounselDetailResponseVO;
import com.learningworks.counsel.vo.response.CounselListResponseVO;
import com.learningworks.counsel.vo.response.ScoreResponseVO;

@Mapper
public interface CounselDao {

	List<CounselListResponseVO> selectCounselList(String courseId);

	int countCourseStudent(@Param("courseId") String courseId,
	                       @Param("courseStudentId") String courseStudentId);

	int countCounsel(String courseStudentId);

	CounselDetailResponseVO selectCounselDetail(String courseStudentId);

	int insertCounsel(CounselRequestVO counselRequestVO);

	CapabilityResponseVO selectCapability(String courseStudentId);

	int updateCapability(CapabilityRequestVO capabilityRequestVO);

	List<ScoreResponseVO> selectScoreList(String courseStudentId);

	Double selectAverageScore(String courseStudentId);

	List<ConsultDataResponseVO> selectConsultDataList(String courseStudentId);

	int insertConsultData(ConsultDataRequestVO consultDataRequestVO);

	String selectOpinion(String courseStudentId);

	int updateOpinion(OpinionRequestVO opinionRequestVO);
}
