package com.learningworks.timetable.vo.response;

import java.util.List;

public record TimetableResponseVO(
        String courseId,
        List<TimeSlotResponseVO> timeSlots,
        List<DailyScheduleResponseVO> schedules
) {
}
