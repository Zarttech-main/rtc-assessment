import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import io from 'socket.io-client';

const socket = io('http://localhost:3004', { reconnection: true, reconnectionAttempts: 5 });

interface VideoCallProps {
  initiator: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ initiator }) => {
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);

  useEffect(() => {
    let peerInstance: any = null;

    socket.on('connect_error', (error) => {
      setError('WebSocket connection error: ' + error.message);
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      if (initiator) {
        peerInstance = new SimplePeer({ initiator: true, stream });
        peerInstance.on('signal', (data: any) => {
          socket.emit('signaling', { type: 'offer', targetUserId: '', data });
        });
      } else {
        socket.on('signaling', (message: any) => {
          if (message.type === 'offer') {
            peerInstance = new SimplePeer({ initiator: false, stream });
            peerInstance.signal(message.data);
          } else if (message.type === 'answer') {
            peerInstance.signal(message.data);
          } else if (message.type === 'iceCandidate') {
            peerInstance.signal(message.data);
          }
        });
      }

      peerInstance.on('stream', (stream: MediaStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      });

      peerInstance.on('close', () => {
      });

      peerInstance.on('error', (err: any) => {
        setError('WebRTC error: ' + err.message);
      });

      peerRef.current = peerInstance;

      return () => {
        if (peerInstance) {
          peerInstance.destroy();
        }
      };
    }).catch(err => {
      setError('getUserMedia error: ' + err.message);
    });
  }, [initiator]);

  return (
    <div>
      {error && <div>Error: {error}</div>}
      <video ref={localVideoRef} autoPlay muted></video>
      <video ref={remoteVideoRef} autoPlay></video>
    </div>
  );
};

export default VideoCall;