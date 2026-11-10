package com.learningworks.timetable.vo.response;

import java.time.LocalDate;
import java.util.List;

public record DailyScheduleResponseVO(
        LocalDate date,
        List<LessonResponseVO> lessons
) {
}
