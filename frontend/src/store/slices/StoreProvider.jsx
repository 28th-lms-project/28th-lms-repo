import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import loginReducer from "./loginSliceStore";

const toolkitStore = configureStore({
  reducer: { login: loginReducer },
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children}</Provider>;
}
