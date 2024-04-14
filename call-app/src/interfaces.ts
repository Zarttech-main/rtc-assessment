import { User } from "./Call";

export interface RootState {
  call: CallState;
  auth: AuthState;
  app: AppState;
}

export interface CallState {
  otherUserId?: number | string;
  isIncoming: boolean;
  isCalling: boolean;
  getCalled: boolean;
  isOutgoing: boolean;
}

export interface AuthState {
  user?: User;
  token?: string;
}

export interface AppState {
  init: boolean;
  users: {
    onlines: User[];
  };
}
