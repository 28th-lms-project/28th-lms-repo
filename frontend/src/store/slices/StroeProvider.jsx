import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { testSliceStore } from "./testSliceStore";
import { questionSliceStore } from "./questionSliceStore";

const toolkitStore = configureStore({
  reducer: {
    test: testSliceStore.reducer,
    modTest: questionSliceStore.reducer,
  },
});

export default function StoreProvider({ children }) {
  return <Provider store={toolkitStore}>{children}</Provider>;
}
