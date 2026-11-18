package com.learningworks.timetable.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.timetable.dao.TimetableDao;
import com.learningworks.timetable.vo.response.CoursePeriodVO;

/** 시간표 업로드 (TimetableServiceImpl.upload)의 과정 기간 검사 */
class TimetableServiceImplUploadTest {

  private static final String COURSE_ID = "C1";

  private TimetableDao timetableDao;
  private TimetableServiceImpl service;

  @BeforeEach
  void setUp() {
    this.timetableDao = Mockito.mock(TimetableDao.class);
    this.service = new TimetableServiceImpl(this.timetableDao);
    // 과정 기간 2026-11-02(월) ~ 2026-11-20(금)
    Mockito.when(this.timetableDao.selectCoursePeriod(COURSE_ID))
        .thenReturn(new CoursePeriodVO(LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 20)));
    Mockito.when(this.timetableDao.selectTimetable(COURSE_ID)).thenReturn(List.of());
  }

  /** 업로드 양식: 1행 교시 · 2행 시각 · 날짜마다 [날짜, "과목명", 과목] + [ , "내용", 내용] 두 줄 */
  private static MockMultipartFile excel(String... dates) throws IOException {
    try (XSSFWorkbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("시간표");
      sheet.createRow(0).createCell(2).setCellValue("1교시");
      sheet.createRow(1).createCell(2).setCellValue("09:00 ~ 10:00");
      int rowIndex = 2;
      for (String date : dates) {
        Row subjectRow = sheet.createRow(rowIndex++);
        subjectRow.createCell(0).setCellValue(date);
        subjectRow.createCell(1).setCellValue("과목명");
        subjectRow.createCell(2).setCellValue("Java 프로그래밍");
        Row contentRow = sheet.createRow(rowIndex++);
        contentRow.createCell(1).setCellValue("내용");
        contentRow.createCell(2).setCellValue("클래스와 객체");
      }
      workbook.write(out);
      return new MockMultipartFile("file", "timetable.xlsx",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());
    }
  }

  @Test
  @DisplayName("모든 날짜가 과정 기간 안이면 기존 시간표를 지우고 저장한다 (양 끝 날짜 포함)")
  void allInPeriod() throws IOException {
    this.service.upload(COURSE_ID, excel("2026-11-02", "2026-11-10", "2026-11-20"));

    Mockito.verify(this.timetableDao).deleteTimetable(COURSE_ID);
    Mockito.verify(this.timetableDao, Mockito.times(3)).insertTimetable(Mockito.anyString(),
        Mockito.eq(COURSE_ID), Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.eq(1));
  }

  @Test
  @DisplayName("주말이어도 과정 기간 안이면 저장한다 (보강)")
  void weekendInPeriod() throws IOException {
    this.service.upload(COURSE_ID, excel("2026-11-14"));

    Mockito.verify(this.timetableDao).deleteTimetable(COURSE_ID);
  }

  @Test
  @DisplayName("기간 밖 날짜가 하나라도 있으면 400, 기존 시간표는 지우지 않는다")
  void outOfPeriodRejected() {
    Assertions.assertThatThrownBy(
            () -> this.service.upload(COURSE_ID, excel("2026-11-01", "2026-11-10", "2026-11-23")))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("과정 기간(2026-11-02 ~ 2026-11-20)")
        .hasMessageContaining("2026-11-01, 2026-11-23");

    Mockito.verify(this.timetableDao, Mockito.never()).deleteTimetable(Mockito.anyString());
    Mockito.verify(this.timetableDao, Mockito.never()).insertTimetable(Mockito.anyString(),
        Mockito.anyString(), Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyInt());
  }

  @Test
  @DisplayName("기간 밖 날짜가 많으면 앞의 5일만 적고 나머지는 '외 N일'")
  void manyOutOfPeriodDates() {
    Assertions.assertThatThrownBy(() -> this.service.upload(COURSE_ID, excel(
            "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26",
            "2026-11-27")))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("2026-11-21, 2026-11-22, 2026-11-23, 2026-11-24, 2026-11-25 외 2일");
  }

  @Test
  @DisplayName("없거나 삭제된 과정이면 COURSE_NOT_EXISTS, 기존 시간표는 지우지 않는다")
  void courseNotExists() {
    Mockito.when(this.timetableDao.selectCoursePeriod(COURSE_ID)).thenReturn(null);

    Assertions.assertThatThrownBy(() -> this.service.upload(COURSE_ID, excel("2026-11-10")))
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.COURSE_NOT_EXISTS);
    Mockito.verify(this.timetableDao, Mockito.never()).deleteTimetable(Mockito.anyString());
  }
}
