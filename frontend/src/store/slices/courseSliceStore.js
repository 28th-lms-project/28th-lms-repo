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
  },
});

export const courseActions = courseSlice.actions;
