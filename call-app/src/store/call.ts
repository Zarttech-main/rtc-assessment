import { createSlice } from "@reduxjs/toolkit";
import { CallState } from "../interfaces";

const INIT_STATE: CallState = {
  otherUserId: undefined,
  isIncoming: false,
  isOutgoing: false,
  isCalling: false,
  getCalled: false,
};

const { actions, reducer } = createSlice({
  name: "call",
  initialState: INIT_STATE,
  reducers: {
    setOtherUserId: (state, { payload }) => {
      state.otherUserId = payload;
    },
    setIsIncoming: (state, { payload }) => {
      state.isIncoming = payload;
    },
    setIsCalling: (state, { payload }) => {
      state.isCalling = payload;
    },
    setGetCalled: (state, { payload }) => {
      state.getCalled = payload;
    },
    setIsOutgoing: (state, { payload }) => {
      state.getCalled = payload;
    },
  },
});

export const {
  setOtherUserId,
  setIsIncoming,
  setIsCalling,
  setGetCalled,
  setIsOutgoing,
} = actions;

export default reducer;
