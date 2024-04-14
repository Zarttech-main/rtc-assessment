import { useRootMemoSelector } from "use-redux-states";
import { User } from "./Call";
import CallManager from "./utils/CallManager";

export default function Calling() {
  const otherUserId = useRootMemoSelector("call.otherUserId");
  const otherUser = useRootMemoSelector("app.users.onlines", (users: User[]) =>
    users.find(({ id }) => id === otherUserId)
  );
  const onEndCall = () => CallManager.endCall();

  const onRef = (video: HTMLVideoElement) => {
    video && CallManager.startCall(video);
  };

  const onRemoteRef = (video: HTMLVideoElement) =>
    video && CallManager.createRemoteMedia(video);

  return (
    <div className="relative">
      <div>
        Calling {otherUser?.name}({otherUser.email}) with id: {otherUserId}
      </div>
      <div>
        <video
          ref={onRef}
          className="w-full max-w-sm max-h-full"
          autoPlay
          playsInline
          muted
        />
        <video
          ref={onRemoteRef}
          className="absolute bottom-0 left-0 w-32 h-32"
          autoPlay
          playsInline
          muted
        />
        <button
          onClick={onEndCall}
          className="absolute top-4 right-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          End Call
        </button>
      </div>
    </div>
  );
}
