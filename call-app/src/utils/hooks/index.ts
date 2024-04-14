import { useEffect } from "react";
import { useSocket as useBaseSocket } from "socket.io-react-hook";
import { useRootMemoSelector } from "use-redux-states";
import { User } from "../../Call";
import { Socket } from "socket.io-client";

const { VITE_APP_SOCKET_URL } = import.meta.env;

let socket: Socket;

export const useSocket = (options?: any) => {
  const user: User = useRootMemoSelector("auth.user");
  const returnSocket = useBaseSocket(VITE_APP_SOCKET_URL, {
    enabled: !!user?.id,
    query: { user: JSON.stringify({ id: user?.id, name: user?.name }) },
    ...options,
  });

  socket = returnSocket.socket;

  return returnSocket;
};

export type UseListenersCallback = (...payloads) => any;

export interface UseListenersCallbacks {
  [key: string]: UseListenersCallback;
}

interface SocketProp {
  listeners?: {} | undefined;
  removeListeners?: {} | undefined;
  options?: any;
}

export const useSocketListeners = ({
  listeners = {},
  removeListeners = {},
  options,
}: SocketProp) => {
  const { socket } = useSocket(options);

  useEffect(() => {
    if (socket.connected) {
      const names = Object.keys(listeners);

      if (names?.length) {
        const callbacks = {};

        names.map((name) => {
          const callback = (...payloads) => {
            const listener = listeners[name];
            return listener && listener(...payloads);
          };

          socket.on(name, callback);
          return (callbacks[name] = callback);
        });

        return () =>
          names.map((name) => {
            socket.removeListener(name, callbacks[name]);
            return removeListeners[name] && removeListeners[name]();
          });
      }
    }

    return () => {};
  }, [socket.connected, listeners]);

  return socket;
};

export { socket };
