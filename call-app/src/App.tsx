import "./App.css";
import Call from "./Call";
import Login from "./Login";
import { useRootMemoSelector } from "use-redux-states";
import { Provider } from "react-redux";
import store from "./store";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { IoProvider } from "socket.io-react-hook";
import { useSocket } from "./utils/hooks";

function App() {
  const user = useRootMemoSelector("auth.user");
  useSocket();

  return <div>{user ? <Call /> : <Login />}</div>;
}

const Root = () => (
  <Provider store={store}>
    <IoProvider>
      <App />
      <ToastContainer />
    </IoProvider>
  </Provider>
);
export default Root;
