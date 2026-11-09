import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { loginSlice } from "./slices/loginSliceStore";
import { courseSlice } from "./slices/courseSliceStore";

const toolkitStore = configureStore({
  reducer: { login: loginSlice.reducer, courses: courseSlice.reducer },
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children}</Provider>;
}
