import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { courseSlice } from "./slice/courseSliceStore";

const toolkitStore = configureStore({
  reducer: { courses: courseSlice.reducer },
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children} </Provider>;
}
