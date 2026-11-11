import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { loginSlice } from "./slices/loginSliceStore";
import { courseSlice } from "./slices/courseSliceStore";
import { permissionSlice } from "./slices/permissionSliceStore";
import { testSliceStore } from "./slices/testSliceStore";
import { questionSliceStore } from "./slices/questionSliceStore";
import { surveySliceStore } from "./slices/surveySliceStore";

const toolkitStore = configureStore({
  reducer: {
    login: loginSlice.reducer,
    courses: courseSlice.reducer,
    permission: permissionSlice.reducer,
    test: testSliceStore.reducer,
    question: questionSliceStore.reducer,
    survey: surveySliceStore.reducer,
  },
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children}</Provider>;
}
