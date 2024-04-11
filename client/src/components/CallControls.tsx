import React from 'react';

interface CallControlsProps {
  onCallStart: () => void;
  onCallEnd: () => void;
}

const CallControls: React.FC<CallControlsProps> = ({ onCallStart, onCallEnd }) => {
  return (
    <div>
      <button id='start-call' onClick={onCallStart}>Start Call</button>
      <button id='end-call' onClick={onCallEnd}>End Call</button>
    </div>
  );
};

export default CallControls;