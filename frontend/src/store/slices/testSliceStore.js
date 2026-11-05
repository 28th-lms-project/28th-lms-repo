import { createSlice } from "@reduxjs/toolkit";

export const testSliceStore = createSlice({
  name: "testSliceStore",
  initialState: {
    subjectId: "",
    questionCount: 0,
    questions: [],
  },
  reducers: {
    setTestList(state, action) {
      console.log(action.payload);
      state.questionCount = action.payload.questionCount;

      state.questions = action.payload.examList.map((q) => ({
        ...q,
        answers: [
          q.answerSheet1,
          q.answerSheet2,
          q.answerSheet3,
          q.answerSheet4,
          q.answerSheet5,
        ]
          .map((text, i) => ({ no: String(i + 1), text }))
          .filter((answer) => answer.text),
      }));
    },
    deleteTestQuestion(state, action) {
      state.questions = state.questions.filter(
        (question) => question.id != action.payload,
      );
    },
  },
});

export const testActions = testSliceStore.actions;
export const toRequest = (question) => {
  const { answers, ...rest } = question;
  const body = { ...rest };
  const nums = [1, 2, 3, 4, 5];
  nums.forEach((n) => {
    const found = answers.find((a) => a.no === String(n));
    // ▼ 해당 번호의 보기가 없으면 빈 문자열
    if (found) {
      body[`answerSheet${n}`] = found.text;
    } else {
      body[`answerSheet${n}`] = "";
    }
  });
  return body;
};
