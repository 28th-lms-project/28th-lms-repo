import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

const toolkitStore = configureStore({
  reducer: {},
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children}</Provider>;
}
