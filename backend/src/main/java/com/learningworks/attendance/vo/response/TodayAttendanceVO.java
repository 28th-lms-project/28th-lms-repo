package com.learningworks.attendance.vo.response;

import lombok.Getter;
import lombok.Setter;

/** 오늘 내 출결 (GET /attendances/{courseId}/today). 대시보드의 출결 표시 · [출석] 버튼용 */
@Getter
@Setter
public class TodayAttendanceVO {

  private String attendDate; // 오늘 (YYYY-MM-DD)

  /**
   * 오늘이 출석할 수 있는 수업일인지. 출석 체크(POST)와 같은 기준:
   * 오늘 시간표(COURSE_TIME_TABLE)가 있고 과정 기간 안이면 true. false면 출석 버튼을 숨긴다
   */
  private boolean classDay;

  private String attendStatus; // Y 출석 · L 지각 · N 결석, 오늘 아직 안 눌렀으면 null

  private String lgnDt; // 출석 버튼 누른 시각 (YYYY-MM-DD HH24:MI), 안 눌렀으면 null

  private String lateTime; // 이 시각(HH:mm)까지 누르면 출석, 넘으면 지각 (app.attendance.late-time)

  private String absentTime; // 이 시각(HH:mm)까지 누르면 지각, 넘으면 결석 (app.attendance.absent-time)
}
