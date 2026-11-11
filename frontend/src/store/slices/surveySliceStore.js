import { createSlice } from "@reduxjs/toolkit";

export const surveySliceStore = createSlice({
  name: "surveySliceStore",
  initialState: {
    count: 0,
    surveyList: [],
    /**
     * surveyList.group : 그룹 ex:) JAVA의 사전 설문 => JAVA_pre
     * surveyList.id : 설문문항의 아이디
     * surveyList.subject : 설문 문항 질문
     * surveyList.type : 설문 문항 타입 => 단일 선택/ 다중 선택/ 직접 입력
     * surveyList.surveyDataList : 설문 문항 답변 리스트
     */
  },

  reducers: {
    load(state, action) {
      console.log(action.payload);

      state.count = action.payload.count;
      state.surveyList = action.payload.surveyList;
    },
    addSurvey(state, action) {
      state.count += 1;
      state.surveyList.unshift({
        ...action.payload,
        surveyDataList: action.payload.surveyDataList || [],
      });
    },
    updateSurvey(state, action) {
      const { id, ...changes } = action.payload;
      console.log(action.payload);

      const survey = state.surveyList.find((s) => s.id === id);
      if (survey && changes.subject !== undefined) {
        survey.subject = changes.subject;
      }

      if (changes.type !== undefined) {
        survey.type = changes.type;
        if (changes.type === "text") {
          survey.surveyDataList = [];
        }
      }
    },
    deleteSurvey(state, action) {
      const { surveyId } = action.payload;

      state.surveyList = state.surveyList.filter((s) => s.id !== surveyId);
      state.count -= 1;
    },
    addSurveyData(state, action) {
      const survey = state.surveyList.find(
        (s) => s.id === action.payload.surveyId,
      );
      survey.surveyDataList.push(action.payload);
    },
    updateSurveyData(state, action) {
      const { surveyId, dataId, data } = action.payload;
      const survey = state.surveyList.find((s) => s.id === surveyId);
      if (!survey) {
        return;
      }
      const target = survey.surveyDataList.find((d) => d.id === dataId);
      if (!target) {
        return;
      }

      target.data = data;
    },
    deleteSurveyData(state, action) {
      const { surveyId, dataId } = action.payload;

      const survey = state.surveyList.find((s) => s.id === surveyId);

      survey.surveyDataList = survey.surveyDataList.filter(
        (d) => d.id !== dataId,
      );
    },
  },
});

export const surveyActions = surveySliceStore.actions;
