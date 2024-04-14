import { useDispatch } from "react-redux";
import useState from "use-react-state";
import { logoutUser } from "./store/auth";
import { useRootMemoSelector } from "use-redux-states";
import Calling from "./Calling";
import { useEffect } from "react";
import { setOnlineUsers } from "./store/app";
import CallManager from "./utils/CallManager";
import { useSocketListeners } from "./utils/hooks";

export interface User {
  name: string;
  email: string;
  password: string;
  id: number | string;
}

export default function Call() {
  const dispatch = useDispatch();
  const onLogout = () => dispatch(logoutUser());
  const user = useRootMemoSelector("auth.user");
  const callOtherUserId = useRootMemoSelector("call.otherUserId");
  const isIncoming = useRootMemoSelector("call.isIncoming");

  useSocketListeners({ listeners: CallManager.listeners });

  return (
    <div>
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold mb-4">Welcome, {user?.name}</h1>
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={onLogout}
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
        {callOtherUserId ? <Calling /> : <OnlineUsers />}
        {isIncoming && <IncomingCallModal />}
      </div>
    </div>
  );
}

const OnlineUsers = () => {
  const dispatch = useDispatch();
  const users: User[] = useRootMemoSelector("app.users.onlines");

  const socket = useSocketListeners({
    listeners: {
      ["online.joined"]: ({ members }) =>
        dispatch(setOnlineUsers(members || [])),
      ["online.left"]: ({ members }) => dispatch(setOnlineUsers(members || [])),
    },
  });

  useEffect(() => {
    socket.connected &&
      socket.emit("request.onlines", (members) =>
        dispatch(setOnlineUsers(members || []))
      );
  }, [socket.connected]);

  const onCallUser = (id) => CallManager.callUser(id);

  return (
    <div>
      Online Users
      {users?.map(({ name, id }, index) => (
        <div
          key={index}
          className="flex items-center justify-between border-b py-2"
        >
          <p>{name}</p>
          <span className="bg-green-500 rounded-full h-2 w-2 block mx-2"></span>
          <button
            onClick={() => onCallUser(id)}
            className="bg-blue-500 ml-8 text-white py-1 px-3 rounded-md hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Call
          </button>
        </div>
      ))}
    </div>
  );
};

function IncomingCallModal() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 w-80 bg-blue-800">
        <h2 className="text-xl font-bold mb-4 text-dark-400">Incoming Call</h2>
        <p className="text-lg mb-4 text-dark-400">Someone is calling...</p>
        <div className="flex justify-between">
          <button
            onClick={() => CallManager.answerIncoming(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg mr-2"
          >
            Accept
          </button>
          <button
            onClick={() => CallManager.rejectIncoming()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
