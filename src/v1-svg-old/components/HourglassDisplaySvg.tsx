
import React from 'react';
import { TimerStatus } from '../types'; // Assuming TimerStatus is in types.ts

interface HourglassDisplayProps {
  progress: number; // 0 to 1
  timerStatus: TimerStatus;
}

// SVG Constants
const SVG_VIEWBOX_WIDTH = 200;
const SVG_VIEWBOX_HEIGHT = 380;
const HOURGLASS_CENTER_X = SVG_VIEWBOX_WIDTH / 2;

const GLASS_TOP_Y = 20;
const BULB_HEIGHT = 150;
const NECK_HEIGHT = 20;
const HOURGLASS_MAX_WIDTH = 100; // Actual max width of the glass part at its widest
const NECK_WIDTH = 10;
// Controls how "curvy" or "bulgy" the hourglass is.
const BULB_CONTROL_POINT_X_OFFSET = (HOURGLASS_MAX_WIDTH / 2) + 30; // e.g., 50 + 30 = 80 from center

const TOP_BULB_TOP_Y = GLASS_TOP_Y;
const TOP_BULB_BOTTOM_Y = TOP_BULB_TOP_Y + BULB_HEIGHT;
const NECK_BOTTOM_Y = TOP_BULB_BOTTOM_Y + NECK_HEIGHT;
const BOTTOM_BULB_BOTTOM_Y = NECK_BOTTOM_Y + BULB_HEIGHT;

// Sand piling curvature factor (0 = flat, higher = more curved)
const SAND_PILE_CURVATURE_FACTOR = 0.25;

// Define key points for glass shape clarity
const p_top_left = { x: HOURGLASS_CENTER_X - HOURGLASS_MAX_WIDTH / 2, y: TOP_BULB_TOP_Y };
const p_top_right = { x: HOURGLASS_CENTER_X + HOURGLASS_MAX_WIDTH / 2, y: TOP_BULB_TOP_Y };
const p_neck_top_left = { x: HOURGLASS_CENTER_X - NECK_WIDTH / 2, y: TOP_BULB_BOTTOM_Y };
const p_neck_top_right = { x: HOURGLASS_CENTER_X + NECK_WIDTH / 2, y: TOP_BULB_BOTTOM_Y };
const p_neck_bottom_left = { x: HOURGLASS_CENTER_X - NECK_WIDTH / 2, y: NECK_BOTTOM_Y };
const p_neck_bottom_right = { x: HOURGLASS_CENTER_X + NECK_WIDTH / 2, y: NECK_BOTTOM_Y };
const p_bottom_left = { x: HOURGLASS_CENTER_X - HOURGLASS_MAX_WIDTH / 2, y: BOTTOM_BULB_BOTTOM_Y };
const p_bottom_right = { x: HOURGLASS_CENTER_X + HOURGLASS_MAX_WIDTH / 2, y: BOTTOM_BULB_BOTTOM_Y };

// Control points for the quadratic Bezier curves for the glass
const cp_top_bulb_right_x = HOURGLASS_CENTER_X + BULB_CONTROL_POINT_X_OFFSET;
const cp_top_bulb_left_x = HOURGLASS_CENTER_X - BULB_CONTROL_POINT_X_OFFSET;
const cp_top_bulb_y = TOP_BULB_TOP_Y + BULB_HEIGHT / 2;

const cp_bottom_bulb_right_x = HOURGLASS_CENTER_X + BULB_CONTROL_POINT_X_OFFSET;
const cp_bottom_bulb_left_x = HOURGLASS_CENTER_X - BULB_CONTROL_POINT_X_OFFSET;
const cp_bottom_bulb_y = NECK_BOTTOM_Y + BULB_HEIGHT / 2;

const glassPath = `
  M ${p_top_left.x} ${p_top_left.y}
  L ${p_top_right.x} ${p_top_right.y}
  Q ${cp_top_bulb_right_x} ${cp_top_bulb_y}, ${p_neck_top_right.x} ${p_neck_top_right.y}
  L ${p_neck_bottom_right.x} ${p_neck_bottom_right.y}
  Q ${cp_bottom_bulb_right_x} ${cp_bottom_bulb_y}, ${p_bottom_right.x} ${p_bottom_right.y}
  L ${p_bottom_left.x} ${p_bottom_left.y}
  Q ${cp_bottom_bulb_left_x} ${cp_bottom_bulb_y}, ${p_neck_bottom_left.x} ${p_neck_bottom_left.y}
  L ${p_neck_top_left.x} ${p_neck_top_left.y}
  Q ${cp_top_bulb_left_x} ${cp_top_bulb_y}, ${p_top_left.x} ${p_top_left.y}
  Z
`;


const HourglassDisplaySvg: React.FC<HourglassDisplayProps> = ({ progress, timerStatus }) => {
  const topSandProgress = Math.max(0, 1 - progress);
  const bottomSandProgress = Math.min(1, progress);

  const topSandHeightRatio = Math.sqrt(topSandProgress);
  const bottomSandHeightRatio = Math.sqrt(bottomSandProgress);

  const topSandHeight = BULB_HEIGHT * topSandHeightRatio;
  const bottomSandHeight = BULB_HEIGHT * bottomSandHeightRatio;

  const topSandSurfaceY = TOP_BULB_BOTTOM_Y - topSandHeight;

  // Interpolate width between NECK_WIDTH and HOURGLASS_MAX_WIDTH based on sqrt height ratio
  const topSandSurfaceWidth = NECK_WIDTH + (HOURGLASS_MAX_WIDTH - NECK_WIDTH) * topSandHeightRatio;

  const bottomSandSurfaceY = NECK_BOTTOM_Y + bottomSandHeight;
  const bottomSandSurfaceWidth = NECK_WIDTH + (HOURGLASS_MAX_WIDTH - NECK_WIDTH) * bottomSandHeightRatio;

  // Calculate dip/peak for sand surfaces
  const topSandDipAmount = topSandHeightRatio * (1 - topSandHeightRatio) * BULB_HEIGHT * SAND_PILE_CURVATURE_FACTOR * 4;
  const bottomSandPeakAmount = bottomSandHeightRatio * (1 - bottomSandHeightRatio) * BULB_HEIGHT * SAND_PILE_CURVATURE_FACTOR * 4;

  let topSandPoints = `M ${HOURGLASS_CENTER_X - NECK_WIDTH / 2},${TOP_BULB_BOTTOM_Y} L ${HOURGLASS_CENTER_X + NECK_WIDTH / 2},${TOP_BULB_BOTTOM_Y} Z`;
  if (topSandHeight > 0.01 * BULB_HEIGHT) { // Check against a small fraction of bulb height
    topSandPoints = `
      M ${HOURGLASS_CENTER_X - topSandSurfaceWidth / 2},${topSandSurfaceY}
      Q ${HOURGLASS_CENTER_X},${topSandSurfaceY + topSandDipAmount} 
        ${HOURGLASS_CENTER_X + topSandSurfaceWidth / 2},${topSandSurfaceY}
      L ${HOURGLASS_CENTER_X + NECK_WIDTH / 2},${TOP_BULB_BOTTOM_Y}
      L ${HOURGLASS_CENTER_X - NECK_WIDTH / 2},${TOP_BULB_BOTTOM_Y}
      Z
    `;
  } else if (progress < 0.999 && timerStatus === TimerStatus.Running) {
    topSandPoints = `
      M ${HOURGLASS_CENTER_X - NECK_WIDTH / 2},${TOP_BULB_BOTTOM_Y - 1}
      L ${HOURGLASS_CENTER_X + NECK_WIDTH / 2},${TOP_BULB_BOTTOM_Y - 1}
      L ${HOURGLASS_CENTER_X + NECK_WIDTH / 2},${TOP_BULB_BOTTOM_Y}
      L ${HOURGLASS_CENTER_X - NECK_WIDTH / 2},${TOP_BULB_BOTTOM_Y}
      Z
    `;
  }

  let bottomSandPoints = `M ${p_neck_bottom_left.x},${p_neck_bottom_left.y} L ${p_neck_bottom_right.x},${p_neck_bottom_right.y} Z`;
  if (bottomSandHeight > 0.01 * BULB_HEIGHT) { // Check against a small fraction of bulb height
    bottomSandPoints = `
      M ${HOURGLASS_CENTER_X - NECK_WIDTH / 2},${NECK_BOTTOM_Y}
      L ${HOURGLASS_CENTER_X + NECK_WIDTH / 2},${NECK_BOTTOM_Y}
      L ${HOURGLASS_CENTER_X + bottomSandSurfaceWidth / 2},${bottomSandSurfaceY}
      Q ${HOURGLASS_CENTER_X},${bottomSandSurfaceY - bottomSandPeakAmount} 
        ${HOURGLASS_CENTER_X - bottomSandSurfaceWidth / 2},${bottomSandSurfaceY}
      Z
    `;
  }

  const streamVisible = timerStatus === TimerStatus.Running && progress > 0.001 && progress < 0.999;

  return (
      <svg
          viewBox={`0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`}
          className="w-64 h-96 md:w-80 md:h-[480px]"
          aria-label="Hourglass animation"
          role="img"
      >
        <defs>
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: 'rgba(173, 216, 230, 0.15)'}} />
            <stop offset="50%" style={{stopColor: 'rgba(173, 216, 230, 0.35)'}} />
            <stop offset="100%" style={{stopColor: 'rgba(173, 216, 230, 0.15)'}} />
          </linearGradient>
        </defs>

        {/* Glass Structure */}
        <path
            d={glassPath}
            fill="url(#glassGradient)"
            className="stroke-sky-400"
            strokeWidth="3"
        />

        {/* Top Sand */}
        <path
            d={topSandPoints}
            className="fill-amber-400"
        />

        {/* Bottom Sand */}
        <path
            d={bottomSandPoints}
            className="fill-amber-400"
        />

        {/* Falling Stream of Sand */}
        {streamVisible && (
            <rect
                x={HOURGLASS_CENTER_X - 2} // Centered, 4px wide
                y={TOP_BULB_BOTTOM_Y}
                width="4"
                height={NECK_HEIGHT}
                className="fill-amber-400"
            />
        )}
      </svg>
  );
};

export default HourglassDisplaySvg;