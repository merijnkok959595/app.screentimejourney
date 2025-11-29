import React from 'react';
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from 'remotion';
import {Emoji} from './Emoji';

export interface MilestoneReelProps {
  firstname: string;
  currentTitle: string;
  currentEmoji: string;
  days: number;
  rank: number;
  nextTitle: string;
  nextEmoji: string;
  colorCode: string;
  nextColorCode: string;
  gender: string;
}

export const MilestoneReel: React.FC<MilestoneReelProps> = ({
  firstname,
  currentTitle,
  currentEmoji,
  days,
  rank,
  nextTitle,
  nextEmoji,
  colorCode,
  nextColorCode,
  gender,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const kingQueen = gender === 'male' ? 'King' : 'Queen';
  const kingQueenColor = 'ffd700';

  return (
    <AbsoluteFill>
      {/* Slide 1: Current Level (0-5 seconds = 0-150 frames) */}
      <Sequence from={0} durationInFrames={150}>
        <CurrentLevelSlide
          firstname={firstname}
          currentTitle={currentTitle}
          currentEmoji={currentEmoji}
          days={days}
          rank={rank}
          colorCode={colorCode}
          frame={frame}
          fps={fps}
        />
      </Sequence>

      {/* Slide 2: Next Level (5-10 seconds = 150-300 frames) */}
      <Sequence from={150} durationInFrames={150}>
        <NextLevelSlide
          nextTitle={nextTitle}
          nextEmoji={nextEmoji}
          colorCode={nextColorCode}
          frame={frame - 150}
          fps={fps}
        />
      </Sequence>

      {/* Slide 3: King/Queen Goal (10-15 seconds = 300-450 frames) */}
      <Sequence from={300} durationInFrames={150}>
        <KingQueenSlide
          kingQueen={kingQueen}
          colorCode={kingQueenColor}
          frame={frame - 300}
          fps={fps}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// Slide 1: Current Level
const CurrentLevelSlide: React.FC<{
  firstname: string;
  currentTitle: string;
  currentEmoji: string;
  days: number;
  rank: number;
  colorCode: string;
  frame: number;
  fps: number;
}> = ({firstname, currentTitle, currentEmoji, days, rank, colorCode, frame, fps}) => {
  // Animation springs
  const greetingOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const greetingY = interpolate(
    spring({frame, fps, from: 0, to: 1, durationInFrames: 20}),
    [0, 1],
    [50, 0]
  );

  const titleOpacity = spring({
    frame: frame - 20,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const titleY = interpolate(
    spring({frame: frame - 20, fps, from: 0, to: 1, durationInFrames: 20}),
    [0, 1],
    [50, 0]
  );

  const statsOpacity = spring({
    frame: frame - 40,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const statsY = interpolate(
    spring({frame: frame - 40, fps, from: 0, to: 1, durationInFrames: 20}),
    [0, 1],
    [50, 0]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${colorCode}`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {/* Greeting */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          opacity: greetingOpacity,
          transform: `translateY(${greetingY}px)`,
        }}
      >
        <h1
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Hi {firstname},
        </h1>
      </div>

      {/* Current Status */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 56,
            fontWeight: 500,
            color: 'white',
            margin: '0 0 20px 0',
          }}
        >
          Right now you are
        </p>
        <h2
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            justifyContent: 'center',
          }}
        >
          {currentTitle} <Emoji emoji={currentEmoji} size={80} />
        </h2>
      </div>

      {/* Stats */}
      <div
        style={{
          position: 'absolute',
          top: '60%',
          opacity: statsOpacity,
          transform: `translateY(${statsY}px)`,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: 'white',
            margin: '0 0 20px 0',
          }}
        >
          {days} days in focus
        </p>
        <p
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: 'white',
            margin: '0 0 30px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            justifyContent: 'center',
          }}
        >
          Top {rank}% in the world <Emoji emoji="🌍" size={60} />
        </p>
        <p
          style={{
            fontSize: 48,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0,
          }}
        >
          Reclaiming your dopamine
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Slide 2: Next Level
const NextLevelSlide: React.FC<{
  nextTitle: string;
  nextEmoji: string;
  colorCode: string;
  frame: number;
  fps: number;
}> = ({nextTitle, nextEmoji, colorCode, frame, fps}) => {
  const introOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 15,
  });

  const titleScale = spring({
    frame: frame - 15,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 30,
  });

  const titleOpacity = spring({
    frame: frame - 15,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 30,
  });

  const motivationOpacity = spring({
    frame: frame - 45,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${colorCode}`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {/* "Next up:" */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          opacity: introOpacity,
        }}
      >
        <h2
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Next up:
        </h2>
      </div>

      {/* Next milestone title */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
        }}
      >
        <h1
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            justifyContent: 'center',
          }}
        >
          {nextTitle} <Emoji emoji={nextEmoji} size={90} />
        </h1>
      </div>

      {/* Motivation */}
      <div
        style={{
          position: 'absolute',
          top: '70%',
          opacity: motivationOpacity,
        }}
      >
        <p
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: 'white',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Keep pushing forward!
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Slide 3: King/Queen Goal
const KingQueenSlide: React.FC<{
  kingQueen: string;
  colorCode: string;
  frame: number;
  fps: number;
}> = ({kingQueen, colorCode, frame, fps}) => {
  const titleOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const titleScale = spring({
    frame,
    fps,
    from: 1.2,
    to: 1,
    durationInFrames: 30,
  });

  const journeyOpacity = spring({
    frame: frame - 30,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const motivationOpacity = spring({
    frame: frame - 50,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${colorCode}`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {/* Goal Title */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
        }}
      >
        <h1
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: 'black',
            margin: 0,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            justifyContent: 'center',
          }}
        >
          Your path to {kingQueen} <Emoji emoji="👑" size={90} />
        </h1>
      </div>

      {/* Journey text */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          opacity: journeyOpacity,
        }}
      >
        <p
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: 'black',
            margin: 0,
            textAlign: 'center',
          }}
        >
          365 days of transformation
        </p>
      </div>

      {/* Motivation */}
      <div
        style={{
          position: 'absolute',
          top: '70%',
          opacity: motivationOpacity,
        }}
      >
        <p
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: 'black',
            margin: 0,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            justifyContent: 'center',
          }}
        >
          Every day counts <Emoji emoji="💪" size={70} />
        </p>
      </div>
    </AbsoluteFill>
  );
};

