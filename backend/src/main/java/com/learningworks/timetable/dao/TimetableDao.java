package com.learningworks.timetable.dao;

import com.learningworks.timetable.vo.response.CoursePeriodVO;
import com.learningworks.timetable.vo.response.LessonResponseVO;
import com.learningworks.timetable.vo.response.TimetableDataResponseVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface TimetableDao {

    /** 삭제되지 않은 과정의 기간 (시작일 · 종료일). 없으면 null */
    CoursePeriodVO selectCoursePeriod(
            @Param("courseId") String courseId
    );

    int deleteTimetable(
            @Param("courseId") String courseId
    );

    int insertTimetable(
            @Param("id") String id,
            @Param("courseId") String courseId,
            @Param("date") LocalDate date,
            @Param("agenda") String agenda,
            @Param("subject") String subject,
            @Param("time") int time
    );

    List<TimetableDataResponseVO> selectTimetable(
            @Param("courseId") String courseId
    );

    List<TimetableDataResponseVO> selectDailyTimetable(
            @Param("courseId") String courseId,
            @Param("date") LocalDate date
    );
}