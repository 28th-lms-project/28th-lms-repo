import { createSlice } from "@reduxjs/toolkit";

export const courseSlice = createSlice({
  name: "course slice",
  initialState: { isLoading: true, courseList: [], showCourse: undefined },
  reducers: {
    load(state, action) {
      console.log(action.payload);
      state.courseList = [...action.payload];
      console.log(state.courseList);
    },
    startLoading(state) {
      state.isLoading = true;
    },
    finishLoading(state) {
      state.isLoading = false;
      console.log(state.isLoading);
    },
    loadShowCourse(state, action) {
      state.showCourse = action.payload;
      // console.log(state.showCourse);
    },
  },
});

export const courseActions = courseSlice.actions;
