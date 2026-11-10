import { createSlice } from "@reduxjs/toolkit";

export const surveySliceStore = createSlice({
  name: "surveySliceStore",
  initialState: {
    count: 0,
    surveyList: [],
  },

  reducers: {
    load(state, action) {
      state.count = action.payload.count;
      state.surveyList = action.payload.surveyList;
    },
  },
});

export const surveyActions = surveySliceStore.actions;
