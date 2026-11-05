import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { testSliceStore } from "./testSliceStore";

const toolkitStore = configureStore({
  reducer: {
    test: testSliceStore.reducer,
  },
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children}</Provider>;
}
