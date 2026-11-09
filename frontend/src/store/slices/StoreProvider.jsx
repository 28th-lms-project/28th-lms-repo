import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { loginSlice } from "./loginSliceStore";
import { courseSlice } from "./courseSliceStore";

const toolkitStore = configureStore({
  reducer: { login: loginSlice.reducer, courses: courseSlice.reducer },
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children}</Provider>;
}
