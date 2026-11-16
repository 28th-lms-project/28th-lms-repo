package com.learningworks.attendance.vo.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttendanceVO {

  private String attendDate; // 수업일 (YYYY-MM-DD)

  private String attendStatus; // Y 출석 · L 지각 · N 결석(조회 시 계산), 오늘 미체크면 null

  private String lgnDt; // 출석 버튼 누른 시각 (YYYY-MM-DD HH24:MI), 기록 없으면 null
}
