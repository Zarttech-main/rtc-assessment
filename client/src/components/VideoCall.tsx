import React, { useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';

interface VideoCallProps {
  initiator: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ initiator }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      if (initiator) {
        peerRef.current = new SimplePeer({ initiator: true, stream });
        peerRef.current.on('signal', (data: any) => {
        });
      } else {
        // Code to handle receiving signal data and creating peer connection
      }

      peerRef.current.on('stream', (stream: MediaStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      });

      peerRef.current.on('close', () => {
      });

      peerRef.current.on('error', (err: any) => {
        console.error('WebRTC error:', err);
      });

      return () => {
        if (peerRef.current) {
          peerRef.current.destroy();
        }
      };
    }).catch(err => console.error('getUserMedia error:', err));
  }, [initiator]);

  return (
    <div>
      <video ref={localVideoRef} autoPlay muted></video>
      <video ref={remoteVideoRef} autoPlay></video>
    </div>
  );
};

export default VideoCall;