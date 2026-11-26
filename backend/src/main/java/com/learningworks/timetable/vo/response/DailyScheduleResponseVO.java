package com.learningworks.timetable.vo.response;

import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 하루 시간표.
 * timeSlots(교시 → 시각표)는 일별 조회(GET /timetable/{courseId}/{date})에서만 채운다.
 * 전체 시간표(TimetableResponseVO.schedules)의 날짜별 항목에서는 null이라 JSON에 나오지 않는다 (바깥 timeSlots를 씀).
 */
public record DailyScheduleResponseVO(
        LocalDate date,
        List<LessonResponseVO> lessons,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        List<TimeSlotResponseVO> timeSlots
) {

    /** 전체 시간표의 날짜별 항목용 (timeSlots 없음) */
    public DailyScheduleResponseVO(LocalDate date, List<LessonResponseVO> lessons) {
        this(date, lessons, null);
    }
}
