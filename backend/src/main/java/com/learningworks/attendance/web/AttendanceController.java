package com.learningworks.attendance.web;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.attendance.service.AttendanceService;
import com.learningworks.attendance.vo.response.AttendanceVO;
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.common.utils.AuthUtil;
import lombok.RequiredArgsConstructor;

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
}
