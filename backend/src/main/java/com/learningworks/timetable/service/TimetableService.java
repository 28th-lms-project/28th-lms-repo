package com.learningworks.timetable.service;

import com.learningworks.timetable.vo.response.DailyScheduleResponseVO;
import com.learningworks.timetable.vo.response.TimetableResponseVO;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;

public interface TimetableService {

    TimetableResponseVO upload(
            String courseId,
            MultipartFile file
    ) throws IOException;

    TimetableResponseVO getTimetable(String courseId);

    DailyScheduleResponseVO getDailyTimetable(
            String courseId,
            LocalDate date
    );
}