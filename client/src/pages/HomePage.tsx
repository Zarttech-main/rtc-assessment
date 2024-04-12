import React, { useState } from 'react';
import CallControls from '../components/CallControls';
import VideoCall from '../components/VideoCall';

const HomePage: React.FC = () => {
  const [callStarted, setCallStarted] = useState(false);

  const handleCallStart = () => {
    setCallStarted(true);
  };

  const handleCallEnd = () => {
    setCallStarted(false);
  };

  return (
    <div className='home-container'>
      {callStarted ? (
        <VideoCall initiator={true} />
      ) : (
        <CallControls onCallStart={handleCallStart} onCallEnd={handleCallEnd} />
      )}
    </div>
  );
};

export default HomePage;