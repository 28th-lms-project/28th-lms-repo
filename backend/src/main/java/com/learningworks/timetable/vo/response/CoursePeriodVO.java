package com.learningworks.timetable.vo.response;

import java.time.LocalDate;

/** 과정 기간 (시간표 업로드 때 날짜 검증용). 컬럼 순서대로 생성자에 매핑된다 */
public record CoursePeriodVO(
        LocalDate startDate,
        LocalDate endDate
) {

    /** date가 시작일 ~ 종료일 안이면 true (양 끝 포함) */
    public boolean contains(LocalDate date) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }
}
