package com.learningworks.attendance.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.attendance.service.AttendanceService;
import com.learningworks.attendance.vo.response.AttendanceVO;
import com.learningworks.attendance.vo.response.TodayAttendanceVO;
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.common.utils.AuthUtil;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "출석", description = "오늘 출석 체크 · 오늘 내 출결")
@RestController
@RequiredArgsConstructor
@RequestMapping("/attendances")
public class AttendanceController {
  private final AttendanceService attendanceService;

  @LoginRequired
  @PostMapping("/{courseId}")
  public ApiResponse<AttendanceVO> createTodayAttendance(@PathVariable String courseId) {
    AttendanceVO result =
        this.attendanceService.createTodayAttendance(AuthUtil.getLoginId(), courseId);
    return ApiResponse.CREATED(result);
  }

  /**
   * 오늘 내 출결 (대시보드용). 이 과정의 수강생만 (아니면 403 COURSE_NOT_AUTHORIZED)
   * 아직 안 눌렀으면 attendStatus · lgnDt가 null, 오늘이 수업일이 아니면 classDay가 false
   */
  @LoginRequired
  @GetMapping("/{courseId}/today")
  public ApiResponse<TodayAttendanceVO> readTodayAttendance(@PathVariable String courseId) {
    return ApiResponse.OK(
        this.attendanceService.readTodayAttendance(AuthUtil.getLoginId(), courseId));
  }
}
