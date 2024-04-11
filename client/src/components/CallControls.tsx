import React from 'react';

interface CallControlsProps {
  onCallStart: () => void;
  onCallEnd: () => void;
}

const CallControls: React.FC<CallControlsProps> = ({ onCallStart, onCallEnd }) => {
  return (
    <div>
      <button onClick={onCallStart}>Start Call</button>
      <button onClick={onCallEnd}>End Call</button>
    </div>
  );
};

export default CallControls;