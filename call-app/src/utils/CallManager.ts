import {
  setIsCalling,
  setIsIncoming,
  setIsOutgoing,
  setOtherUserId,
} from "../store/call";
import store from "../store";
import { RootState } from "../interfaces";
import { socket } from "./hooks";

type PeerCallMedia = HTMLMediaElement;
interface CallMedia {
  remoteMedia?: PeerCallMedia;
  localMedia?: PeerCallMedia;
}

export type MediaType = "video" | "audio";

interface Streams {
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

interface CallParams {
  iceServers: RTCIceServer[];
}
interface InitPeerOptions extends CallParams {}

interface Tracks {
  localVideoTrack?: MediaStreamTrack;
}

interface IceCandidates {
  localICECandidates: RTCIceCandidate[];
}

interface Data {
  response: CallParams;
  offer: RTCSessionDescriptionInit;
  from: string | number;
  to: string | number;
}

export default class CallManager {
  private static connected = false;
  private static getCalled = false;
  private static media: CallMedia = {
    remoteMedia: undefined,
    localMedia: undefined,
  };
  private static peerConnection?: RTCPeerConnection;
  private static iceCandidates: IceCandidates = {
    localICECandidates: [],
  };
  private static data?: Data;
  private static streams: Streams = {
    localStream: undefined,
    remoteStream: undefined,
  };
  private static tracks: Tracks = {
    localVideoTrack: undefined,
  };

  static get isCalling() {
    return !!this.otherUserId;
  }

  static get otherUserId() {
    return (store?.getState() as RootState)?.call?.otherUserId;
  }

  static get userId() {
    return (store?.getState() as RootState)?.auth?.user?.id;
  }

  static get remoteMedia() {
    return this.media.remoteMedia;
  }

  static get localMedia() {
    return this.media.localMedia;
  }

  static createLocalMedia = (media: HTMLMediaElement) =>
    (this.media.localMedia = media);

  static createRemoteMedia = (media: HTMLMediaElement) =>
    (this.media.remoteMedia = media);

  static addStreamToLocalMediaSource = (stream?: MediaStream) => {
    if (this.localMedia) {
      // @ts-expect-error No idea
      this.media.localMedia.srcObject = stream;
      // @ts-expect-error No idea
      this.media.localMedia.volume = 0;
    }
  };

  static addStreamToRemoteMediaSource = (stream?: MediaStream) => {
    if (this.remoteMedia) {
      // @ts-expect-error No idea
      this.media.remoteMedia.srcObject = stream;
    }
  };

  static callUser = async (id) => store.dispatch(setOtherUserId(id));

  static startCall = async (media: HTMLMediaElement) => {
    this.createLocalMedia(media);
    await this.initMedia();

    // get iceServers
    if (this.getCalled) {
      if (this.data?.response.iceServers) {
        await this.initPeerConnection(this.data?.response);
      }

      await this.sendAnswer();
    } else {
      socket.emit("call-data", undefined, async (exchangeData) => {
        this.initPeerConnection(exchangeData);
        this.sendOffer(exchangeData);
      });
    }
  };

  static initMedia = async () => {
    const stream = await this.getLocalStream();

    this.addStreamToLocalMediaSource(stream);

    return stream;
  };

  static getLocalStream = async () => {
    if (this.streams?.localStream) return this.streams.localStream;

    const stream = await this.getMediaStream();
    this.streams.localStream = stream;

    return stream;
  };

  static getMediaStream = () =>
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

  static endCall = () => {
    this.stopLocalMediaTracks();
    this.clearLocalStream();

    this.dispatchOtherUserId(undefined);

    socket.emit("end-call", {
      to: this.data?.from || this.otherUserId,
      from: this.userId,
    });

    this.dispatchIsIncoming(false);
    this.dispatchOutgoing(false);
    this.dispatchIsCalling(false);

    // stopSound();

    this.data = undefined;
    this.streams.remoteStream = undefined;
    this.iceCandidates.localICECandidates = [];
    this.tracks.localVideoTrack = undefined;
    this.connected = false;
    this.getCalled = false;
  };

  static sendOffer = async (response: InitPeerOptions) => {
    const offer = await this.peerConnection?.createOffer({
      offerToReceiveVideo: true,
    });

    await this.peerConnection?.setLocalDescription(offer);

    socket.emit("outgoing-call", {
      response,
      offer,
      to: this.otherUserId,
      from: this.userId,
    });
  };

  static initPeerConnection = ({ iceServers }: InitPeerOptions) => {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers,
      });
    } catch (error) {
      console.error(error);
      alert("Error initializing connection");
      throw error;
    }

    if (!this.peerConnection) throw Error("Peer Connection not set");

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        if (this.connected) {
          socket.emit("candidate", {
            candidate: event.candidate,
            to: this.otherUserId,
            from: this.userId,
          });
        } else {
          this.iceCandidates.localICECandidates.push(event.candidate);
        }
      }
    };

    this.streams.localStream &&
      // @ts-expect-error err
      this.peerConnection?.addStream(this.streams.localStream);

    this.peerConnection.onconnectionstatechange = async () => {
      const connection = this.peerConnection;
      switch (connection?.connectionState) {
        case "connected":
          this.connected = true;
          this.tracks.localVideoTrack =
            this.streams.localStream?.getVideoTracks()[0];

          if (this.tracks.localVideoTrack) {
            this.streams.localStream?.addTrack(this.tracks.localVideoTrack);

            const sender = this.peerConnection
              ?.getSenders()
              .find((s) => s.track?.kind === this.tracks.localVideoTrack?.kind);

            sender?.replaceTrack(this.tracks.localVideoTrack);
          }

          this.iceCandidates.localICECandidates.forEach((candidate) => {
            socket.emit("candidate", {
              candidate,
              to: this.otherUserId,
              from: this.userId,
            });
          });
          this.iceCandidates.localICECandidates = [];
          break;
        case "failed":
          const offer = await connection.createOffer({
            iceRestart: true,
            offerToReceiveVideo: true,
          });

          connection.setLocalDescription(new RTCSessionDescription(offer));
          break;
        default:
          break;
      }
    };

    // @ts-expect-error nan
    this.peerConnection.onaddstream = ({ stream }) => {
      if (this.remoteMedia && stream && this.streams.remoteStream !== stream) {
        this.streams.remoteStream = stream;
        this.addStreamToRemoteMediaSource(stream);
      }
    };

    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      if (this.remoteMedia) {
        this.addStreamToRemoteMediaSource(stream);
      }
    };
  };

  static clearLocalStream = () => {
    this.streams.localStream?.getTracks().forEach((track) => track.stop());
    this.streams.localStream = undefined;
  };

  static clearMediaSource = () => {
    if (this.localMedia) {
      this.addStreamToLocalMediaSource(undefined);
    }
    if (this.remoteMedia) {
      this.addStreamToRemoteMediaSource(undefined);
    }

    this.media.localMedia = undefined;
    this.media.remoteMedia = undefined;
  };

  static cleanup = () => this.endCall();

  static getLocalMediaSource = () =>
    this.media?.localMedia?.srcObject || this.media?.localMedia?.srcObject;

  static stopLocalMediaTracks = () => {
    const source = this.getLocalMediaSource();

    if (source) {
      // @ts-expect-error unkown
      const tracks = source.getTracks();
      tracks.forEach((track) => track.stop());
      this.clearMediaSource();
    }
  };

  static answerIncoming = async (isIncoming = false) => {
    // stopSound();
    const data = this.data;

    if (!data) throw Error("Data not initialized");

    this.connected = true;
    this.getCalled = true;

    if (isIncoming) {
      this.dispatchOtherUserId(data.to);
      this.dispatchIsIncoming(false);
      this.dispatchIsCalling(true);
    } else {
      this.dispatchIsCalling(true);
    }
  };

  static sendAnswer = async () => {
    const data = this.data;

    if (!data) throw Error("Data not initialized");

    await this.peerConnection?.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
    const answer = await this.peerConnection?.createAnswer();
    await this.peerConnection?.setLocalDescription(answer);

    socket.emit("answer-incoming-call", {
      answer,
      to: data.from,
      from: data.to,
    });
  };

  static rejectIncoming = () => {
    socket.emit("reject-incoming", {
      to: this.data?.from,
      from: this.userId,
    });
    this.cleanup();
  };

  static dispatchIsIncoming = (val) => store.dispatch(setIsIncoming(val));
  static dispatchIsCalling = (val) => store.dispatch(setIsCalling(val));
  static dispatchOutgoing = (val) => store.dispatch(setIsOutgoing(val));
  static dispatchOtherUserId = (val) => store.dispatch(setOtherUserId(val));

  static onIncoming = async (data) => {
    this.data = data;

    if (!this.getCalled) {
      // playSound(callignSound, (sound) => (sound.loop = true));
      this.dispatchIsIncoming(true);
      return;
    }

    this.answerIncoming();
  };

  static onAnswered = async (data) => {
    await this.peerConnection?.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );

    this.data = data;
    this.connected = true;

    this.iceCandidates.localICECandidates.forEach((candidate) => {
      socket.emit("candidate", {
        candidate,
        to: this.data?.from,
        from: this.userId,
      });
    });
    this.iceCandidates.localICECandidates = [];

    if (!this.isCalling) {
      this.dispatchIsIncoming(false);
      this.dispatchIsCalling(true);
    } else {
      this.dispatchOutgoing(false);
    }
  };

  static onReject = () => this.cleanup();

  static onEnded = () => this.cleanup();

  static onCandidate = ({ candidate }) =>
    candidate &&
    this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));

  static listeners = {
    "incoming-call": this.onIncoming,
    "outgoing-answered": this.onAnswered,
    "outgoing-rejected": this.onReject,
    "call-ended": this.onEnded,
    candidate: this.onCandidate,
  };
}
