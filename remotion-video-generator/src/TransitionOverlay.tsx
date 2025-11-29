import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const TransitionOverlay: React.FC<{ fromFrame: number; duration: number }> = ({
  fromFrame,
  duration,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - fromFrame;

  const opacity = interpolate(localFrame, [0, duration * 0.3, duration], [0, 1, 0], {
    extrapolateRight: 'clamp',
  });

  const translateX = interpolate(localFrame, [0, duration], [-1000, 1000], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(120deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
        mixBlendMode: 'overlay',
        opacity,
        transform: `translateX(${translateX}px)`,
        pointerEvents: 'none',
      }}
    />
  );
};








