package com.learningworks.timetable.vo.response;

public record TimeSlotResponseVO(
        int slotIndex,
        String label,
        String time,
        boolean breakTime
) {
}
