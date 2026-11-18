
package com.learningworks.timetable.service;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.DateListText;
import com.learningworks.timetable.dao.TimetableDao;
import com.learningworks.timetable.vo.response.CoursePeriodVO;
import com.learningworks.timetable.vo.response.DailyScheduleResponseVO;
import com.learningworks.timetable.vo.response.LessonResponseVO;
import com.learningworks.timetable.vo.response.TimeSlotResponseVO;
import com.learningworks.timetable.vo.response.TimetableDataResponseVO;
import com.learningworks.timetable.vo.response.TimetableResponseVO;

import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TimetableServiceImpl implements TimetableService {

    private final TimetableDao timetableDao;

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");


    private static final List<TimeSlotResponseVO> TIME_SLOTS = List.of(
            new TimeSlotResponseVO(1, "1교시", "09:00 ~ 10:00", false),
            new TimeSlotResponseVO(2, "2교시", "10:00 ~ 11:00", false),
            new TimeSlotResponseVO(3, "3교시", "11:00 ~ 12:00", false),
            new TimeSlotResponseVO(4, "점심시간", "12:00 ~ 13:00", true),
            new TimeSlotResponseVO(5, "4교시", "13:00 ~ 14:00", false),
            new TimeSlotResponseVO(6, "5교시", "14:00 ~ 15:00", false),
            new TimeSlotResponseVO(7, "6교시", "15:00 ~ 16:00", false),
            new TimeSlotResponseVO(8, "7교시", "16:00 ~ 17:00", false),
            new TimeSlotResponseVO(9, "8교시", "17:00 ~ 18:00", false)
    );

    public TimetableServiceImpl(TimetableDao timetableDao) {
        this.timetableDao = timetableDao;
    }

    private record ExcelLesson(
            LocalDate date,
            int time,
            String agenda,
            String subject
    ) {}

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TimetableResponseVO upload(
            String courseId,
            MultipartFile file
    ) throws IOException {

        validateCourseId(courseId);
        validateFile(file);

        // 1. DB를 수정하기 전에 엑셀 전체 파싱
        List<ExcelLesson> lessons = parseExcel(file);

        if (lessons.isEmpty()) {
            throw new IllegalArgumentException(
                    "엑셀에서 저장할 시간표 데이터가 없습니다."
            );
        }

        // 2. 과정 기간 밖 날짜가 있으면 저장하지 않음 (수업일 = 과정 기간 안 시간표가 있는 날이라,
        //    기간 밖 시간표는 출석 · 진행률에 쓰이지 않고 화면만 헷갈리게 한다). 기존 시간표는 그대로 둔다
        validateLessonDates(courseId, lessons);

        // 3. 기존 과정 시간표 삭제
        timetableDao.deleteTimetable(courseId);

        // 4. 신규 시간표 저장
        for (ExcelLesson lesson : lessons) {

            timetableDao.insertTimetable(
                    courseId,
                    lesson.date(),
                    lesson.agenda(),
                    lesson.subject(),
                    lesson.time()
            );
        }

        // 5. 실제 DB 저장 결과 반환
        return getTimetable(courseId);
    }

    @Override
    @Transactional(readOnly = true)
    public TimetableResponseVO getTimetable(String courseId) {

        validateCourseId(courseId);

        List<TimetableDataResponseVO> rows =
                timetableDao.selectTimetable(courseId);

        // 등록된 시간표가 없으면 오류 대신 빈 목록 반환 (프론트에서 안내 문구 표시)
        if (rows == null || rows.isEmpty()) {
            return new TimetableResponseVO(
                    courseId,
                    TIME_SLOTS,
                    List.of()
            );
        }

        Map<LocalDate, Map<Integer, LessonResponseVO>> grouped =
                new LinkedHashMap<>();

        for (TimetableDataResponseVO row : rows) {

            if (row.date() == null || row.time() == null) {
                continue;
            }

            grouped.computeIfAbsent(
                    row.date(),
                    key -> new LinkedHashMap<>()
            ).put(
                    row.time(),
                    new LessonResponseVO(
                            row.time(),
                            nullToEmpty(row.agenda()),
                            nullToEmpty(row.subject())
                    )
            );
        }

        List<DailyScheduleResponseVO> schedules =
                grouped.entrySet().stream()
                        .map(entry -> new DailyScheduleResponseVO(
                                entry.getKey(),
                                entry.getValue().values().stream()
                                        .sorted(Comparator.comparingInt(
                                                LessonResponseVO::slotIndex
                                        ))
                                        .toList()
                        ))
                        .toList();

        return new TimetableResponseVO(
                courseId,
                TIME_SLOTS,
                schedules
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DailyScheduleResponseVO getDailyTimetable(
            String courseId,
            LocalDate date
    ) {

        validateCourseId(courseId);

        if (date == null) {
            throw new IllegalArgumentException("조회 날짜가 없습니다.");
        }

        List<TimetableDataResponseVO> rows =
                timetableDao.selectDailyTimetable(courseId, date);

        if (rows == null || rows.isEmpty()) {
            throw new IllegalArgumentException(
                    "해당 날짜의 시간표가 없습니다."
            );
        }

        List<LessonResponseVO> lessons = rows.stream()
                .filter(row -> row.time() != null)
                .map(row -> new LessonResponseVO(
                        row.time(),
                        nullToEmpty(row.agenda()),
                        nullToEmpty(row.subject())
                ))
                .toList();

        return new DailyScheduleResponseVO(date, lessons, TIME_SLOTS);
    }

    private List<ExcelLesson> parseExcel(
            MultipartFile file
    ) throws IOException {

        List<ExcelLesson> result = new ArrayList<>();

        try (Workbook workbook =
                     WorkbookFactory.create(file.getInputStream())) {

            if (workbook.getNumberOfSheets() == 0) {
                throw new IllegalArgumentException(
                        "엑셀 시트가 존재하지 않습니다."
                );
            }

            Sheet sheet = workbook.getSheetAt(0);

            DataFormatter formatter = new DataFormatter();

            FormulaEvaluator evaluator =
                    workbook.getCreationHelper().createFormulaEvaluator();

            Row headerRow = sheet.getRow(0);
            Row timeRow = sheet.getRow(1);

            if (headerRow == null || timeRow == null) {
                throw new IllegalArgumentException(
                        "엑셀의 첫 번째와 두 번째 행에 교시 정보가 필요합니다."
                );
            }

            // 실제 엑셀 열 번호와 DB 교시 번호 매핑
            Map<Integer, Integer> columnTimeMap = new LinkedHashMap<>();

            int lastColumn = Math.max(
                    headerRow.getLastCellNum(),
                    timeRow.getLastCellNum()
            );

            for (int col = 2; col < lastColumn; col++) {

                String label = getText(
                        headerRow.getCell(col),
                        formatter,
                        evaluator
                );

                if (label.contains("점심")) {
                    continue;
                }

                Matcher matcher = Pattern.compile("(\\d+)\\s*교시")
                        .matcher(label);

                if (!matcher.find()) {
                    continue;
                }

                int time = Integer.parseInt(matcher.group(1));

                if (time < 1 || time > 8) {
                    continue;
                }

                // 실제 DB TIME 번호를 저장
                int dbTime = time <= 3 ? time : time + 1;

                columnTimeMap.put(col, dbTime);
            }

            if (columnTimeMap.isEmpty()) {
                throw new IllegalArgumentException(
                        "엑셀에서 교시 정보를 찾을 수 없습니다."
                );
            }

            LocalDate currentDate = null;

            for (int rowIndex = 2;
                 rowIndex <= sheet.getLastRowNum();
                 rowIndex++) {

                Row subjectRow = sheet.getRow(rowIndex);

                if (subjectRow == null) {
                    continue;
                }

                LocalDate parsedDate = readDate(
                        subjectRow.getCell(0),
                        formatter,
                        evaluator
                );

                if (parsedDate != null) {
                    currentDate = parsedDate;
                }

                String rowType = getText(
                        subjectRow.getCell(1),
                        formatter,
                        evaluator
                );

                if (!"과목명".equals(rowType)
                        || currentDate == null) {
                    continue;
                }

                Row contentRow = sheet.getRow(rowIndex + 1);

                for (Map.Entry<Integer, Integer> entry
                        : columnTimeMap.entrySet()) {

                    int excelColumn = entry.getKey();
                    int dbTime = entry.getValue();

                    String agenda = getText(
                            subjectRow.getCell(excelColumn),
                            formatter,
                            evaluator
                    );

                    String subject = contentRow == null
                            ? ""
                            : getText(
                            contentRow.getCell(excelColumn),
                            formatter,
                            evaluator
                    );

                    if (agenda.isBlank() && subject.isBlank()) {
                        continue;
                    }

                    result.add(new ExcelLesson(
                            currentDate,
                            dbTime,
                            agenda,
                            subject
                    ));
                }

                // 과목명 행과 내용 행은 한 쌍
                rowIndex++;
            }
        }

        return result;
    }

    private LocalDate readDate(
            Cell cell,
            DataFormatter formatter,
            FormulaEvaluator evaluator
    ) {

        if (cell == null) {
            return null;
        }

        if (cell.getCellType() == CellType.NUMERIC
                && DateUtil.isCellDateFormatted(cell)) {

            return DateUtil.getJavaDate(
                            cell.getNumericCellValue()
                    ).toInstant()
                    .atZone(ZONE)
                    .toLocalDate();
        }

        String value = getText(cell, formatter, evaluator)
                .replace("/", "-")
                .replace(".", "-")
                .trim();

        if (value.isBlank()) {
            return null;
        }

        try {
            if (value.length() >= 10) {
                value = value.substring(0, 10);
            }

            return LocalDate.parse(
                    value,
                    DateTimeFormatter.ofPattern("yyyy-M-d")
            );

        } catch (RuntimeException exception) {
            throw new IllegalArgumentException(
                    "엑셀 날짜 형식을 확인해 주세요: " + value
            );
        }
    }

    private String getText(
            Cell cell,
            DataFormatter formatter,
            FormulaEvaluator evaluator
    ) {
        return cell == null
                ? ""
                : formatter.formatCellValue(cell, evaluator).trim();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    /**
     * 시간표 날짜가 모두 과정 기간(시작일 ~ 종료일) 안인지 검사한다. 주말이어도 기간 안이면 허용(보강).
     * 삭제됐거나 없는 과정이면 COURSE_NOT_EXISTS, 기간 밖 날짜가 있으면 400 (날짜를 메시지에 적음)
     */
    private void validateLessonDates(String courseId, List<ExcelLesson> lessons) {

        CoursePeriodVO period = timetableDao.selectCoursePeriod(courseId);

        if (period == null) {
            throw new LearningworksException(ErrorCode.COURSE_NOT_EXISTS);
        }

        List<LocalDate> outOfPeriod = lessons.stream()
                .map(ExcelLesson::date)
                .filter(date -> !period.contains(date))
                .distinct()
                .sorted()
                .toList();

        if (outOfPeriod.isEmpty()) {
            return;
        }

        throw new IllegalArgumentException(
                "과정 기간(" + period.startDate() + " ~ " + period.endDate()
                        + ") 밖의 날짜가 있습니다: " + DateListText.summarize(outOfPeriod)
                        + ". 엑셀의 날짜를 확인해 주세요."
        );
    }

    private void validateCourseId(String courseId) {

        if (courseId == null || courseId.isBlank()) {
            throw new IllegalArgumentException(
                    "과정 ID가 없습니다."
            );
        }
    }

    private void validateFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "업로드할 엑셀 파일을 선택해 주세요."
            );
        }

        String filename = file.getOriginalFilename();

        if (filename == null
                || !(filename.toLowerCase().endsWith(".xlsx")
                || filename.toLowerCase().endsWith(".xls"))) {

            throw new IllegalArgumentException(
                    "엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다."
            );
        }
    }
}
