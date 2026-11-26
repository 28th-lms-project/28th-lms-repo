import { createSlice } from "@reduxjs/toolkit";

export const courseSlice = createSlice({
  name: "course slice",
  initialState: {
    isLoading: true,
    courseList: [],
    showCourse: undefined,
    addSelectTutor: undefined,
    selectStudents: [],
    showStudents: [],
    homeworks: [],
    homeworkReplies: [],
    showHomework: undefined,
    // 과정 진행률 · 출석률 요약 (GET /{courseId}/attendance/summary 결과). 불러오기 전이면 null
    // { totalClassDays, passedClassDays, progressRate, averageAttendanceRate, averageWarning,
    //   students: [{ userId, name, presentCount, lateCount, absentCount, attendanceRate, warning }] }
    attendanceSummary: null,
    // 출석률 요약 불러오기 상태: "idle" | "loading" | "success" | "error"
    attendanceSummaryStatus: "idle",
  },
  reducers: {
    load(state, action) {
      state.courseList = [...(action.payload ?? [])];
    },
    startLoading(state) {
      state.isLoading = true;
    },
    finishLoading(state) {
      state.isLoading = false;
    },
    loadShowCourse(state, action) {
      state.showCourse = action.payload;
    },
    selectStudents(state, action) {
      state.selectStudents = [...action.payload];
    },
    addSelectTutor(state, action) {
      state.addSelectTutor = action.payload;
    },
    showStudents(state, action) {
      state.showStudents = [...(action.payload ?? [])];
    },
    loadhomeworks(state, action) {
      state.homeworks = [...(action.payload ?? [])];
    },
    showHomework(state, action) {
      state.showHomework = action.payload;
    },
    loadHomeworkReplies(state, action) {
      state.homeworkReplies = [...(action.payload ?? [])];
    },
    // payload: 출석률 요약 객체 (지울 때는 null)
    loadAttendanceSummary(state, action) {
      state.attendanceSummary = action.payload ?? null;
    },
    // payload: "idle" | "loading" | "success" | "error"
    setAttendanceSummaryStatus(state, action) {
      state.attendanceSummaryStatus = action.payload;
    },
  },
});

export const courseActions = courseSlice.actions;
