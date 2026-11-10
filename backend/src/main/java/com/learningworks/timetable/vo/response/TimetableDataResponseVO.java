package com.learningworks.timetable.vo.response;

import java.time.LocalDate;

public record TimetableDataResponseVO(
        LocalDate date,
        Integer time,
        String agenda,
        String subject
) {
}