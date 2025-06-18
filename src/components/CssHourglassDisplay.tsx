import React from 'react';
import { TimerStatus } from '../types';
import './CssHourglassDisplay.css';

interface CssHourglassDisplayProps {
  progress: number; // 0 to 1
  timerStatus: TimerStatus;
}

const CssHourglassDisplay: React.FC<CssHourglassDisplayProps> = ({ progress, timerStatus }) => {
  const topSandFill = 1 - progress; // 1 when full, 0 when empty
  const bottomSandFill = progress; // 0 when empty, 1 when full

  // Stream is visible when timer is running and not at the very start/end
  const streamVisible = timerStatus === TimerStatus.Running && progress > 0.001 && progress < 0.999;

  // CSS custom properties to be used by CssHourglassDisplay.css
  const hourglassStyle: React.CSSProperties = {
    '--top-sand-fill-factor': topSandFill,
    '--bottom-sand-fill-factor': bottomSandFill,
    '--stream-opacity': streamVisible ? 1 : 0,
  } as React.CSSProperties;

  return (
    <div className="chd-container" style={hourglassStyle} role="img" aria-label="CSS Hourglass Animation">
      <div className="chd-bulb chd-top-bulb">
        <div className="chd-sand chd-top-sand" aria-hidden="true"></div>
      </div>
      <div className="chd-neck">
        <div className="chd-sand-stream" aria-hidden="true"></div>
      </div>
      <div className="chd-bulb chd-bottom-bulb">
        <div className="chd-sand chd-bottom-sand" aria-hidden="true"></div>
      </div>
    </div>
  );
};

export default CssHourglassDisplay;
