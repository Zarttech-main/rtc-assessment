import { mergeReducers } from "use-redux-states";
import app from "./app";
import auth from "./auth";
import call from "./call";

const reducers = mergeReducers({ app, auth, call });

export default reducers;
