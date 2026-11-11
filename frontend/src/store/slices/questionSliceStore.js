import { createSlice } from "@reduxjs/toolkit";

// 서버에서 null/undefined로 온 값을 빈 문자열로 바꿔 input value에 안전하게 넣기 위한 함수
const toText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return value;
};

export const questionSliceStore = createSlice({
  name: "questionSliceStore",
  initialState: {
    id: "",
    answerType: "",
    answers: [],
    answerCount: 0,
    correctAnswer: 0,
    pointAlloc: 0,
    question: "",
    subQuestion: "",
  },
  reducers: {
    setViewQuestion(state, action) {
      const q = action.payload;
      state.id = q.id;
      state.answerType = toText(q.answerType);
      state.answerCount = toText(q.answerCount);
      state.correctAnswer = toText(q.correctAnswer);
      state.pointAlloc = toText(q.pointAlloc);
      state.question = toText(q.question);
      state.subQuestion = toText(q.subQuestion);
      state.answers = [
        toText(q.answerSheet1),
        toText(q.answerSheet2),
        toText(q.answerSheet3),
        toText(q.answerSheet4),
        toText(q.answerSheet5),
      ];
    },

    updateValue(state, action) {
      state.answerCount = action.payload.answerCount;
      state.question = action.payload.question;
      state.correctAnswer = action.payload.correctAnswer;
      state.pointAlloc = action.payload.pointAlloc;
    },

    updateAnswer(state, action) {
      const { index, value } = action.payload;
      state.answers[index] = value;
    },
    clearViewQuestion() {
      return questionSliceStore.getInitialState();
    },
  },
});

export const questActions = questionSliceStore.actions;
