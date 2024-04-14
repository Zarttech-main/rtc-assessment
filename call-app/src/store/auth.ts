import { createSlice } from "@reduxjs/toolkit";
import { AuthState } from "../interfaces";
import request from "../apis";

const INIT_STATE: AuthState = {
  user: undefined,
  token: undefined,
};

const { actions, reducer } = createSlice({
  name: "auth",
  initialState: INIT_STATE,
  reducers: {
    setToken: (state, { payload: token }) => {
      request.defaults.headers["Accept"] = "application/json";
      request.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      state.token = token;
    },

    logoutUser: (state) => {
      request.defaults.headers.common["Authorization"] = ``;
      state.user = undefined;
      state.token = undefined;
    },

    setUser: (state, { payload }) => {
      state.user = payload;
    },
  },
});

export const { setUser, logoutUser, setToken } = actions;

export default reducer;
