import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { testSliceStore } from "./testSliceStore";
import { questionSliceStore } from "./questionSliceStore";
import { loginSlice } from "./loginSliceStore";
import { courseSlice } from "./courseSliceStore";

const toolkitStore = configureStore({
  reducer: {
    login: loginSlice.reducer,
    courses: courseSlice.reducer,
    test: testSliceStore.reducer,
    modTest: questionSliceStore.reducer,
  },
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children}</Provider>;
}
