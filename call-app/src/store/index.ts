import { configureStore } from "@reduxjs/toolkit";
import { setConfig } from "use-redux-states";
import reducer from "./reducers";

const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

setConfig({ cleanup: false });

export default store;
