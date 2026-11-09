import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { loginSlice } from "./slices/loginSliceStore";
import { courseSlice } from "./slices/courseSliceStore";
import { permissionSlice } from "./slices/permissionSliceStore";

const toolkitStore = configureStore({
  reducer: {
    login: loginSlice.reducer,
    courses: courseSlice.reducer,
    permission: permissionSlice.reducer,
  },
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children}</Provider>;
}
