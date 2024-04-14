import axios from "axios";
import Qs from "qs";
import { toast } from "react-toastify";
import { emitter } from "use-event-listeners";

const { VITE_APP_API_URL } = import.meta.env;

export const baseUrl = VITE_APP_API_URL;
const request = axios.create({ baseURL: baseUrl });

request.interceptors.request.use(
  (config) => {
    config.paramsSerializer = (params) =>
      Qs.stringify(params, {
        arrayFormat: "brackets",
        encode: false,
      });
    return config;
  },
  (err) => {
    console.log("interceptors request err: ", err);
  }
);

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // handle 401
    } else if (
      error.response?.status === 500 ||
      error.response?.status === 405
    ) {
      console.log(error.response.data);
    } else if (error?.response?.status === 403) {
      toast.error(error.response.data.message);
    } else if (
      error?.response?.status === 401 &&
      window.location.pathname !== "/auth/login"
    ) {
      emitter.emit("log-out");
    }

    return Promise.reject(error);
  }
);

export default request;
