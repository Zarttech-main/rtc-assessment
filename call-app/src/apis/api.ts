import store from "../store";
import request from ".";
import { setToken, setUser } from "../store/auth";
import { toast } from "react-toastify";

export type Method = "get" | "post" | "put" | "delete" | "patch";

const { VITE_APP_API_URL } = import.meta.env;

const api = async (
  route: string,
  data = {},
  method: Method = "get",
  config = {}
) => {
  try {
    const defaultConfig = { baseURL: VITE_APP_API_URL };
    const hasData = ["post", "put", "delete"].includes(method);

    const params = hasData
      ? method === "delete"
        ? { data }
        : data
      : { params: data, ...defaultConfig, ...config };

    console.log(data);
    const res = await request[method](route, params, {
      ...defaultConfig,
      ...config,
    });

    if (res.data?.access_token) {
      request.defaults.headers.common.Authorization = `Bearer ${res.data.access_token}`;
      store.dispatch(setToken(res.data?.access_token));
    }

    // console.log(res);
    return res.data;
  } catch (e) {
    console.log({ e });
    // @ts-expect-error nnn
    const responseMessage = e.response?.data?.message;
    // @ts-expect-error nnn
    if (e?.response?.status === 401) {
      store.dispatch(setUser(undefined));
      responseMessage && toast(responseMessage, { type: "error" });
      // @ts-expect-error nnn
    } else if (e?.response?.status === 422) {
      toast(responseMessage, { type: "error" });
    }
    return Promise.reject(e);
  }
};

export default api;
