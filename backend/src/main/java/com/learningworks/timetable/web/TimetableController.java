package com.learningworks.timetable.web;

import com.learningworks.common.action.RequireAction;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.timetable.service.TimetableService;
import com.learningworks.timetable.vo.request.TimetableUploadRequestVO;
import com.learningworks.timetable.vo.response.DailyScheduleResponseVO;
import com.learningworks.timetable.vo.response.TimetableResponseVO;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;

/**
 * 시간표 API
 * 프론트: frontend/src/api/admin/course/timetableApi.js
 *
 * 다른 컨트롤러와 동일하게 공통 응답(ApiResponse)을 사용한다.
 * 프론트 apiClient는 응답의 body만 꺼내서 반환한다.
 */
@RestController
@RequestMapping("/timetable")
public class TimetableController {

    private final TimetableService timetableService;

    public TimetableController(TimetableService timetableService) {
        this.timetableService = timetableService;
    }

    @RequireAction(domain = "COURSE_SCHEDULE", action = "CREATE", description = "시간표 등록")
    @PostMapping(
            value = "/{courseId}/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<TimetableResponseVO> upload(
            @PathVariable String courseId,
            @ModelAttribute TimetableUploadRequestVO request
    ) throws IOException {

        return ApiResponse.OK(
                timetableService.upload(courseId, request.getFile())
        );
    }

    @RequireAction(domain = "COURSE_SCHEDULE", action = "READ_ALL", description = "전체 시간표 조회")
    @GetMapping("/{courseId}")
    public ApiResponse<TimetableResponseVO> getTimetable(
            @PathVariable String courseId
    ) {

        return ApiResponse.OK(timetableService.getTimetable(courseId));
    }

    @RequireAction(domain = "COURSE_SCHEDULE", action = "READ_ONE", description = "날짜별 단일 시간표 조회")
    @GetMapping("/{courseId}/{date}")
    public ApiResponse<DailyScheduleResponseVO> getDailyTimetable(
            @PathVariable String courseId,
            @PathVariable LocalDate date
    ) {

        return ApiResponse.OK(
                timetableService.getDailyTimetable(courseId, date)
        );
    }

    // 잘못된 요청 (엑셀 형식 오류, 시간표 없음 등) - 서비스의 메시지를 그대로 전달
    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleBadRequest(
            IllegalArgumentException exception
    ) {

        ApiResponse<Void> result = ApiResponse.ERROR(ErrorCode.GLOBAL_BAD_REQUEST);
        result.setError(exception.getMessage());

        return result;
    }

    // 파일 처리 오류
    @ExceptionHandler(IOException.class)
    public ApiResponse<Void> handleIOException(IOException exception) {

        return ApiResponse.ERROR(ErrorCode.FILES_SYSTEM_ERROR);
    }
}
