package com.learningworks.exam.service;

import java.util.List;

import javax.management.RuntimeErrorException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.exam.dao.ExamDao;
import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.response.ExamQuestionListVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import com.learningworks.exam.vo.response.ExamSetVO;

import lombok.AllArgsConstructor;


@AllArgsConstructor
@Service
public class ExamServiceImpl implements ExamService {
	
	private ExamDao examDao;

	@Override
	public List<ExamSetVO> readAllExamSet() {
		List<ExamSetVO> examSet = this.examDao.selectAllExamSet();
		System.out.println("시험 세트 수" + examSet.size());

		return examSet;
	}

	@Transactional
	@Override
	public ExamQuestionVO createNewExam(RegistExamQuestionVO registExamQuestionVO) {
		int insertCount = this.examDao.insertNewExam(registExamQuestionVO);
		
		if(insertCount > 0) { 
			System.out.println("문제가 등록되었습니다.");
			return this.examDao.selectQuestionById(registExamQuestionVO.getId());
		}
		throw new RuntimeException("문제 등록에 실패했습니다.");
	}

	@Transactional
	@Override
	public String deleteExamQuestion(String examId) {
		int deletedRows = this.examDao.deleteExamQuestion(examId);
		if(deletedRows == 0) {
			System.out.println("시험 문제를 삭제하는데 실패했습니다.");
			throw new RuntimeException("존재하지 않는 문제입니다.");
		}
		
		return examId;
	}

	@Transactional
	@Override
	public ExamQuestionVO updateExamQuestion(String examId, ModifyExamQuestionVO modifyExamQuestionVO) {
		ExamQuestionVO examQuestionVO = this.examDao.selectQuestionById(examId);
		
		if(examQuestionVO == null) {
			throw new RuntimeException("존재하지 않는 문제입니다.");
		}
		
		int updatedRows = this.examDao.updateExamQuestion(examId, modifyExamQuestionVO);
		if(updatedRows == 0) {
			throw new RuntimeException("문제 수정에 실패했습니다.");
		}
		
		return this.examDao.selectQuestionById(examId);
	}


	


	
//	@Override
//	public ExamSetVO readExamSetByCourseName(String courseName) {
//		String testSetId = this.examDao.getTestSetIdByCourseName(courseName);
//		return null;
//	}
	
	

}
