import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import io from 'socket.io-client';

const socket = io('http://localhost:3004');

interface VideoCallProps {
  initiator: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ initiator }) => {
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  let peer: any = null;

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      if (initiator) {
        peer = new SimplePeer({ initiator: true, stream });
        peer.on('signal', (data: any) => {
          socket.emit('signaling', { type: 'offer', targetUserId: '', data });
        });
      } else {
        socket.on('signaling', (message: any) => {
          if (message.type === 'offer') {
            peer = new SimplePeer({ initiator: false, stream });
            peer.signal(message.data);
          } else if (message.type === 'answer') {
            peer.signal(message.data);
          } else if (message.type === 'iceCandidate') {
            peer.signal(message.data);
          }
        });
      }

      peer.on('stream', (stream: MediaStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      });

      peer.on('close', () => {
      });

      peer.on('error', (err: any) => {
        setError('WebRTC error: ' + err.message);
      });

      return () => {
        if (peer) {
          peer.destroy();
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