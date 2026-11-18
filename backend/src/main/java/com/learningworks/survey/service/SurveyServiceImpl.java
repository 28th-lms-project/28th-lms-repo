package com.learningworks.survey.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.survey.dao.SurveyDao;
import com.learningworks.survey.vo.request.ModifySurveyDataVO;
import com.learningworks.survey.vo.request.ModifySurveyVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyAnswerListVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyAnswerVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyVO;
import com.learningworks.survey.vo.request.RegistSurveyDataVO;
import com.learningworks.survey.vo.request.RegistSurveyVO;
import com.learningworks.survey.vo.response.CourseSurveyQuestionVO;
import com.learningworks.survey.vo.response.CourseSurveyResultVO;
import com.learningworks.survey.vo.response.CourseSurveyStatisticsVO;
import com.learningworks.survey.vo.response.SurveyStudentAnswerVO;
import com.learningworks.survey.vo.response.CourseSurveyVO;
import com.learningworks.survey.vo.response.SurveyCountVO;
import com.learningworks.survey.vo.response.SurveyDataVO;
import com.learningworks.survey.vo.response.SurveyListVO;
import com.learningworks.survey.vo.response.SurveyOptionStatVO;
import com.learningworks.survey.vo.response.SurveyQuestionStatVO;
import com.learningworks.survey.vo.response.SurveyVO;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class SurveyServiceImpl implements SurveyService {
	private SurveyDao surveyDao;

	@Override
	@Transactional
	public SurveyVO createSurvey(@Valid RegistSurveyVO registSurvey) {
		if (registSurvey == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		int insertCount = this.surveyDao.insertNewSurvey(registSurvey);

		if (insertCount > 0) {
			System.out.println("설문이 등록되었습니다.");
			SurveyVO survey = this.surveyDao.selectSurveyById(registSurvey.getId());
			if (survey == null) {
				throw new LearningworksException(ErrorCode.SURVEY_FAILURE_CREATE);
			}
			return survey;
		}
		throw new LearningworksException(ErrorCode.SURVEY_FAILURE_CREATE);
	}

	@Override
	@Transactional
	public SurveyVO updateSurvey(ModifySurveyVO modifySurvey, String surveyId) {
		if (surveyId == null || surveyId.isBlank() || modifySurvey == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		SurveyVO survey = this.surveyDao.selectSurveyById(surveyId);

		if (survey == null) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}

		int updateRows = this.surveyDao.updateSurvey(surveyId, modifySurvey);
		if (updateRows != 1) {
			throw new LearningworksException(ErrorCode.SURVEY_FAILURE_UPDATE);
		}

		if ("text".equals(modifySurvey.getType())) {
			this.surveyDao.deleteSurveyDatas(surveyId);
		}

		SurveyVO updateSurvey = this.surveyDao.selectSurveyById(surveyId);
		if (updateSurvey == null) {
			throw new LearningworksException(ErrorCode.SURVEY_FAILURE_UPDATE);
		}
		return updateSurvey;
	}

	@Override
	@Transactional
	public SurveyDataVO createSurveyData(@Valid RegistSurveyDataVO registSurveyDataVO, String surveyId) {

		if (registSurveyDataVO == null || surveyId == null || surveyId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}

		// 없는 문항에는 보기를 등록하지 않음 (SURVEY_DATA.SURVEY_ID 에 FK 가 없어 DB 가 막지 않음)
		SurveyVO survey = this.surveyDao.selectSurveyById(surveyId);
		if (survey == null) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}

		int insertCount = this.surveyDao.insertNewSurveyData(surveyId, registSurveyDataVO);

		if (insertCount > 0) {
			SurveyDataVO surveyData = this.surveyDao.selectSurveyDataById(registSurveyDataVO.getId());
			if (surveyData == null) {
				throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_CREATE);
			}
			return surveyData;
		}
		throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_CREATE);
	}

	@Override
	@Transactional
	public SurveyDataVO updateSurveyData(@Valid ModifySurveyDataVO modifySurveyData, String surveyId,
			String surveyDataId) {
		if (surveyDataId == null || surveyDataId.isBlank() || surveyId == null || surveyId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		SurveyDataVO surveyData = this.surveyDao.selectSurveyDataById(surveyDataId);

		// 보기가 없거나, 주소의 문항(surveyId)에 속한 보기가 아니면 수정하지 않음
		if (surveyData == null || !surveyId.equals(surveyData.getSurveyId())) {
			throw new LearningworksException(ErrorCode.SURVEY_DATA_NOT_EXISTS);
		}

		int updateRows = this.surveyDao.updateSurveyData(surveyDataId, modifySurveyData);
		if (updateRows != 1) {
			throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_UPDATE);
		}
		SurveyDataVO updateSurveyData = this.surveyDao.selectSurveyDataById(surveyDataId);
		if (updateSurveyData == null) {
			throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_UPDATE);
		}
		return updateSurveyData;
	}

	@Override
	public SurveyListVO readAllSurveyByGroup(String group) {
		List<SurveyVO> surveies = this.surveyDao.selectAllSurveyByGroup(group);
		long surveyCount = this.surveyDao.selectSurveyCount(group);

		SurveyListVO surveyList = new SurveyListVO();
		surveyList.setSurveyList(surveies);
		surveyList.setCount(surveyCount);
		return surveyList;
	}

	@Override
	@Transactional
	public String deleteSurvey(String surveyId) {
		this.surveyDao.deleteSurveyDatas(surveyId);
		int deletedRows = this.surveyDao.deleteOneSurvey(surveyId);
		if (deletedRows == 0) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}

		return surveyId;
	}

	@Override
	@Transactional
	public String deleteSurveyData(String surveyId, String surveyDataId) {
		int deleteRow = this.surveyDao.deleteOneSurveyData(surveyId, surveyDataId);
		// 0건: 없는 보기이거나 이 문항의 보기가 아님
		if (deleteRow == 0) {
			throw new LearningworksException(ErrorCode.SURVEY_DATA_NOT_EXISTS);
		}

		return surveyDataId;
	}

	@Override
	public List<CourseSurveyVO> readAllCourseSurvey(String courseId) {
		return this.surveyDao.selectAllCourseSurvey(courseId);
	}

	@Override
	@Transactional
	public CourseSurveyVO createCourseSurvey(@Valid RegistCourseSurveyVO registCourseSurvey, String courseId) {
		if (registCourseSurvey == null || courseId == null || courseId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		registCourseSurvey.setCourseId(courseId);

		int insertCount = this.surveyDao.insertNewCourseSurvey(registCourseSurvey);
		if (insertCount != 1) {
			throw new LearningworksException(ErrorCode.SURVEY_FAILURE_CREATE);
		}
		CourseSurveyVO courseSurvey = this.surveyDao.selectCourseSurvey(registCourseSurvey.getId());
		if (courseSurvey == null) {
			throw new LearningworksException(ErrorCode.SURVEY_FAILURE_CREATE);
		}

		return courseSurvey;
	}

	@Override
	@Transactional
	public String deleteCourseSurvey(String courseId, String courseSurveyId) {
		// 답변 상세 → 답변 → 설문 순서로 삭제
		this.surveyDao.deleteCourseSurveyAnswerDatas(courseSurveyId);
		this.surveyDao.deleteCourseSurveyAnswers(courseSurveyId);

		int deletedRows = this.surveyDao.deleteOneCourseSurvey(courseId, courseSurveyId);
		if (deletedRows == 0) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}
		return courseSurveyId;
	}

	@Override
	@Transactional
	public void createCourseSurveyAnswers(String courseId, String courseSurveyId, String userId,
			@Valid RegistCourseSurveyAnswerListVO answer) {

		if (courseId == null || courseId.isBlank() || courseSurveyId == null || courseSurveyId.isBlank()
				|| userId == null || answer == null || answer.getAnswers() == null || answer.getAnswers().isEmpty()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}

		CourseSurveyVO courseSurvey = this.findCourseSurvey(courseId, courseSurveyId);


		String courseStudentId = this.surveyDao.selectCourseStudentId(courseId, userId);
		if (courseStudentId == null) {
			throw new LearningworksException(ErrorCode.STUDENT_NOT_IN_COURSE);
		}

		int answerCount = this.surveyDao.selectCourseSurveyAnswerCount(courseSurveyId, courseStudentId);
		if (answerCount > 0) {
			throw new LearningworksException(ErrorCode.SURVEY_DUPLICATED);
		}

		List<SurveyVO> questions = this.surveyDao.selectAllSurveyByGroup(courseSurvey.getSurveyGroup());

		for (RegistCourseSurveyAnswerVO ans : answer.getAnswers()) {

			SurveyVO question = null;
			for (SurveyVO q : questions) {
				if (q.getId().equals(ans.getQuestionId())) {
					question = q;
					break;
				}
			}
			if (question == null) {
				throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
			}

			int insertCount = this.surveyDao.insertNewCourseSurveyAnswer(courseSurveyId, courseStudentId, ans);
			if (insertCount != 1) {
				throw new LearningworksException(ErrorCode.SURVEY_ANSWER_FAILURE_CREATE);
			}

			if ("text".equals(question.getType())) {
				String text = ans.getTextAnswer();
				if (text == null || text.isBlank()) {
					throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
				}
				this.surveyDao.insertNewCourseSurveyAnswerData(ans.getId(), null, text);
			} else {
				List<String> optionIds = ans.getOptionIds();
				if (optionIds == null || optionIds.isEmpty()) {
					throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
				}
				if (!"checkBox".equals(question.getType()) && optionIds.size() != 1) {
					throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
				}

				for (String optionId : optionIds) {
					boolean validOption = false;
					for (SurveyDataVO data : question.getSurveyDataList()) {
						if (data.getId().equals(optionId)) {
							validOption = true;
							break;
						}
					}
					if (!validOption) {
						throw new LearningworksException(ErrorCode.SURVEY_DATA_NOT_EXISTS);
					}
					this.surveyDao.insertNewCourseSurveyAnswerData(ans.getId(), optionId, null);
				}

			}

		}
	}
	
	@Override
	public boolean isAnswered(String courseId, String courseSurveyId, String userId) {
		// 없는 설문 · 다른 과정의 설문이면 SURVEY_NOT_EXISTS
		this.findCourseSurvey(courseId, courseSurveyId);

		String courseStudentId = this.surveyDao.selectCourseStudentId(courseId, userId);
		if (courseStudentId == null) {
			throw new LearningworksException(ErrorCode.STUDENT_NOT_IN_COURSE);
		}
		int count = this.surveyDao.selectCourseSurveyAnswerCount(courseSurveyId, courseStudentId);
		if (count > 0) {
			return true;
		}
		return false;
	}

	@Override
	public CourseSurveyQuestionVO readCourseSurveyQuestions(String courseId, String courseSurveyId, String userId) {
		if (courseId == null || courseId.isBlank() || courseSurveyId == null || courseSurveyId.isBlank()
				|| userId == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}

		// 이 과정의 수강생만 조회 가능
		String courseStudentId = this.surveyDao.selectCourseStudentId(courseId, userId);
		if (courseStudentId == null) {
			throw new LearningworksException(ErrorCode.STUDENT_NOT_IN_COURSE);
		}

		// 과정 설문이 있고, 요청한 과정의 설문인지 확인
		CourseSurveyVO courseSurvey = this.surveyDao.selectCourseSurvey(courseSurveyId);
		if (courseSurvey == null || !courseId.equals(courseSurvey.getCourseId())) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}

		CourseSurveyQuestionVO result = new CourseSurveyQuestionVO();
		result.setCourseSurvey(courseSurvey);
		result.setSurveyList(this.surveyDao.selectAllSurveyByGroup(courseSurvey.getSurveyGroup()));
		return result;
	}

	@Override
	public CourseSurveyResultVO readCourseSurveyResult(String courseId, String courseSurveyId) {
		CourseSurveyVO courseSurvey = this.findCourseSurvey(courseId, courseSurveyId);

		CourseSurveyResultVO result = new CourseSurveyResultVO();
		result.setCourseSurvey(courseSurvey);
		result.setSurveyList(this.surveyDao.selectAllSurveyByGroup(courseSurvey.getSurveyGroup()));
		result.setRespondents(this.surveyDao.selectCourseSurveyRespondents(courseSurveyId));
		return result;
	}

	@Override
	public List<SurveyStudentAnswerVO> readCourseSurveyStudentAnswers(String courseId, String courseSurveyId,
			String courseStudentId) {
		if (courseStudentId == null || courseStudentId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		this.findCourseSurvey(courseId, courseSurveyId);
		return this.surveyDao.selectCourseSurveyStudentAnswers(courseSurveyId, courseStudentId);
	}

	/** 과정 설문이 있고, 요청한 과정의 설문인지 확인 */
	private CourseSurveyVO findCourseSurvey(String courseId, String courseSurveyId) {
		
		
		if (courseId == null || courseId.isBlank() || courseSurveyId == null || courseSurveyId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		CourseSurveyVO courseSurvey = this.surveyDao.selectCourseSurvey(courseSurveyId);
		if (courseSurvey == null || !courseId.equals(courseSurvey.getCourseId())) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}
		return courseSurvey;
	}
	
	@Override
	public CourseSurveyStatisticsVO readCourseSurveyStatistics(String courseId, String courseSurveyId) {
		CourseSurveyVO courseSurvey = this.findCourseSurvey(courseId, courseSurveyId);
		List<SurveyVO> questions = this.surveyDao.selectAllSurveyByGroup(courseSurvey.getSurveyGroup());
		List<SurveyCountVO> optionCounts = this.surveyDao.selectCourseSurveyOptionsCounts(courseSurveyId);
		List<SurveyCountVO> questionCounts = this.surveyDao.selectCourseSurveyQuestionCount(courseSurveyId);
		List<SurveyStudentAnswerVO> textAnswers = this.surveyDao.selectCourseSurveyTextAnswers(courseSurveyId);
		
		List<SurveyQuestionStatVO> questionStats = new ArrayList<>();
		
		for(SurveyVO question : questions) {
			SurveyQuestionStatVO stat = new SurveyQuestionStatVO();
			stat.setId(question.getId());
			stat.setSubject(question.getSubject());
			stat.setType(question.getType());
			
			int answerCount = 0;
			for(SurveyCountVO qc : questionCounts) {
				if(question.getId().equals(qc.getSurveyId())) {
					answerCount = qc.getCount();
					break;
				}
			}
			stat.setAnswerCount(answerCount);
			
			List<SurveyOptionStatVO> options = new ArrayList<>();
			if(question.getSurveyDataList() != null) {
				for(SurveyDataVO data: question.getSurveyDataList()) {
					if(data.getId() == null) {
						continue;
					}
					SurveyOptionStatVO option = new SurveyOptionStatVO();
					option.setId(data.getId());
					option.setData(data.getData());
					int count = 0;
					for(SurveyCountVO sc : optionCounts){
						if(data.getId().equals(sc.getDataId())) {
							count= sc.getCount();
							break;
						}
					}
					option.setCount(count);
					options.add(option);
				}
			}
			stat.setOptions(options);
			
			List<String> texts = new ArrayList<>();
			for(SurveyStudentAnswerVO ta : textAnswers) {
				if(question.getId().equals(ta.getSurveyId())) {
					texts.add(ta.getTextAnswer());
				}
			}
			stat.setTextAnswers(texts);
			
			questionStats.add(stat);
		}
		
		CourseSurveyStatisticsVO result = new CourseSurveyStatisticsVO();
		result.setCourseSurvey(courseSurvey);
		result.setResponseCount(this.surveyDao.selectCourseSurveyResponseCount(courseSurveyId));
		result.setStudentCount(this.surveyDao.selectCourseStudentCount(courseId));
		result.setQuestions(questionStats);
		
		return result;
	}

}
