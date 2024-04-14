import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../interfaces";

const INIT_STATE: AppState = {
  init: false,
  users: {
    onlines: [],
  },
};

const { actions, reducer } = createSlice({
  name: "app",
  initialState: INIT_STATE,
  reducers: {
    init: (state, { payload }) => {
      state.init = payload;
    },
    setOnlineUsers: (state, { payload }) => {
      state.users.onlines = payload;
    },
  },
});

export const { init, setOnlineUsers } = actions;

export default reducer;
