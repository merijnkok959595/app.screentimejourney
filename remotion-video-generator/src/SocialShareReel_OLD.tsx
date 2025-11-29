import React from 'react';
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  Img,
} from 'remotion';
import {Emoji} from './Emoji';

export interface SocialShareReelProps {
  firstname: string;
  rank: number;
  currentTitle: string;
  currentEmoji: string;
  days: number;
  currentColorCode: string;
  nextTitle: string;
  nextEmoji: string;
  daysToNext: number;
  nextColorCode: string;
  description: string;
  gender: string;
  kingColorCode: string;
}

const BRAND_PURPLE = '#2E0456';
const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0866/6749/3623/files/stj_favi_inverted_yellow_extra.png?v=1757864432';

export const SocialShareReel: React.FC<SocialShareReelProps> = ({
  firstname,
  rank,
  currentTitle,
  currentEmoji,
  days,
  currentColorCode,
  nextTitle,
  nextEmoji,
  daysToNext,
  nextColorCode,
  description,
  gender,
  kingColorCode,
}) => {
  const kingQueen = gender === 'male' ? 'King' : 'Queen';
  const kingQueenEmoji = gender === 'male' ? '👑' : '👑';

  return (
    <AbsoluteFill>
      {/* Slide 1: Greeting & Top % (0-3 seconds = 0-90 frames) */}
      <Sequence from={0} durationInFrames={90}>
        <GreetingSlide
          firstname={firstname}
          rank={rank}
        />
      </Sequence>

      {/* Slide 2: Current Level (3-6 seconds = 90-180 frames) */}
      <Sequence from={90} durationInFrames={90}>
        <CurrentLevelSlide
          currentTitle={currentTitle}
          currentEmoji={currentEmoji}
          days={days}
          currentColorCode={currentColorCode}
          description={description}
        />
      </Sequence>

      {/* Slide 3: Next Level (6-9 seconds = 180-270 frames) */}
      <Sequence from={180} durationInFrames={90}>
        <NextLevelSlide
          nextTitle={nextTitle}
          nextEmoji={nextEmoji}
          daysToNext={daysToNext}
          nextColorCode={nextColorCode}
        />
      </Sequence>

      {/* Slide 4: King/Queen Goal (9-12 seconds = 270-360 frames) */}
      <Sequence from={270} durationInFrames={90}>
        <KingQueenSlide
          kingQueen={kingQueen}
          kingQueenEmoji={kingQueenEmoji}
          kingColorCode={kingColorCode}
        />
      </Sequence>

      {/* Slide 5: Brand Outro (12-15 seconds = 360-450 frames) */}
      <Sequence from={360} durationInFrames={90}>
        <BrandOutroSlide />
      </Sequence>
    </AbsoluteFill>
  );
};

// Slide 1: Greeting & Top %
const GreetingSlide: React.FC<{
  firstname: string;
  rank: number;
}> = ({firstname, rank}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 15,
  });

  const greetingOpacity = spring({
    frame: frame - 10,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const rankOpacity = spring({
    frame: frame - 35,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_PURPLE,
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 60,
      }}
    >
      {/* Logo at top */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: logoOpacity,
        }}
      >
        <Img
          src={LOGO_URL}
          style={{
            width: 120,
            height: 120,
          }}
        />
      </div>

      {/* Greeting text */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: greetingOpacity,
        }}
      >
        <TypewriterText
          text={`Hi ${firstname},`}
          frame={frame - 10}
          fps={fps}
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: 'white',
            margin: 0,
          }}
        />
      </div>

      {/* Rank text */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: rankOpacity,
        }}
      >
        <TypewriterText
          text={`You are among the top ${rank}%`}
          frame={frame - 35}
          fps={fps}
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: 'white',
            margin: '0 0 20px 0',
          }}
        />
        <div style={{marginTop: 20}}>
          <TypewriterText
            text="in the world 🌍"
            frame={frame - 50}
            fps={fps}
            style={{
              fontSize: 56,
              fontWeight: 600,
              color: 'white',
              margin: 0,
            }}
          />
        </div>
      </div>

      {/* Website URL */}
      <Footer />
    </AbsoluteFill>
  );
};

// Slide 2: Current Level
const CurrentLevelSlide: React.FC<{
  currentTitle: string;
  currentEmoji: string;
  days: number;
  currentColorCode: string;
  description: string;
}> = ({currentTitle, currentEmoji, days, currentColorCode, description}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 10,
  });

  const titleOpacity = spring({
    frame: frame - 5,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const descOpacity = spring({
    frame: frame - 40,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${currentColorCode}`,
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 60,
      }}
    >
      {/* Logo at top */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: logoOpacity,
        }}
      >
        <Img
          src={LOGO_URL}
          style={{
            width: 120,
            height: 120,
          }}
        />
      </div>

      {/* Current level info */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          padding: '0 80px',
        }}
      >
        <TypewriterText
          text="Right now, you are"
          frame={frame - 5}
          fps={fps}
          style={{
            fontSize: 50,
            fontWeight: 500,
            color: 'white',
            margin: '0 0 30px 0',
          }}
        />
        <div style={{marginTop: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20}}>
          <TypewriterText
            text={`${currentTitle}`}
            frame={frame - 25}
            fps={fps}
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: 'white',
              margin: 0,
            }}
          />
          <Emoji emoji={currentEmoji} size={80} />
        </div>
        <div style={{marginTop: 30}}>
          <TypewriterText
            text={`with ${days} days in focus`}
            frame={frame - 35}
            fps={fps}
            style={{
              fontSize: 48,
              fontWeight: 600,
              color: 'white',
              margin: 0,
            }}
          />
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          position: 'absolute',
          top: '65%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: descOpacity,
          padding: '0 100px',
        }}
      >
        <TypewriterText
          text={description}
          frame={frame - 40}
          fps={fps}
          style={{
            fontSize: 38,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0,
            lineHeight: 1.4,
          }}
        />
      </div>

      {/* Website URL */}
      <Footer />
    </AbsoluteFill>
  );
};

// Slide 3: Next Level
const NextLevelSlide: React.FC<{
  nextTitle: string;
  nextEmoji: string;
  daysToNext: number;
  nextColorCode: string;
}> = ({nextTitle, nextEmoji, daysToNext, nextColorCode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 10,
  });

  const titleOpacity = spring({
    frame: frame - 10,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${nextColorCode}`,
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 60,
      }}
    >
      {/* Logo at top */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: logoOpacity,
        }}
      >
        <Img
          src={LOGO_URL}
          style={{
            width: 120,
            height: 120,
          }}
        />
      </div>

      {/* Next level info */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          padding: '0 80px',
        }}
      >
        <TypewriterText
          text="Next up:"
          frame={frame - 10}
          fps={fps}
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: 'white',
            margin: '0 0 40px 0',
          }}
        />
        <div style={{marginTop: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20}}>
          <TypewriterText
            text={nextTitle}
            frame={frame - 25}
            fps={fps}
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: 'white',
              margin: 0,
            }}
          />
          <Emoji emoji={nextEmoji} size={90} />
        </div>
        <div style={{marginTop: 40}}>
          <TypewriterText
            text={`in ${daysToNext} days`}
            frame={frame - 45}
            fps={fps}
            style={{
              fontSize: 52,
              fontWeight: 600,
              color: 'white',
              margin: 0,
            }}
          />
        </div>
      </div>

      {/* Website URL */}
      <Footer />
    </AbsoluteFill>
  );
};

// Slide 4: King/Queen Goal
const KingQueenSlide: React.FC<{
  kingQueen: string;
  kingQueenEmoji: string;
  kingColorCode: string;
}> = ({kingQueen, kingQueenEmoji, kingColorCode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 10,
  });

  const titleOpacity = spring({
    frame: frame - 10,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${kingColorCode}`,
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 60,
      }}
    >
      {/* Logo at top */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: logoOpacity,
        }}
      >
        <Img
          src={LOGO_URL}
          style={{
            width: 120,
            height: 120,
          }}
        />
      </div>

      {/* King/Queen goal */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          padding: '0 80px',
        }}
      >
        <TypewriterText
          text="You're on your path to"
          frame={frame - 10}
          fps={fps}
          style={{
            fontSize: 52,
            fontWeight: 600,
            color: 'black',
            margin: '0 0 40px 0',
          }}
        />
        <div style={{marginTop: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20}}>
          <TypewriterText
            text={kingQueen}
            frame={frame - 30}
            fps={fps}
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: 'black',
              margin: 0,
            }}
          />
          <Emoji emoji={kingQueenEmoji} size={95} />
        </div>
        <div style={{marginTop: 40}}>
          <TypewriterText
            text="in 365 days"
            frame={frame - 50}
            fps={fps}
            style={{
              fontSize: 56,
              fontWeight: 600,
              color: 'black',
              margin: 0,
            }}
          />
        </div>
      </div>

      {/* Website URL */}
      <Footer darkMode />
    </AbsoluteFill>
  );
};

// Slide 5: Brand Outro
const BrandOutroSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    from: 0.5,
    to: 1,
    durationInFrames: 20,
  });

  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const textOpacity = spring({
    frame: frame - 20,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {/* Large logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 60,
        }}
      >
        <Img
          src={LOGO_URL}
          style={{
            width: 200,
            height: 200,
          }}
        />
      </div>

      {/* Website name */}
      <div
        style={{
          opacity: textOpacity,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            textAlign: 'center',
            letterSpacing: 2,
          }}
        >
          SCREENTIMEJOURNEY
        </h1>
        <p
          style={{
            fontSize: 48,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '30px 0 0 0',
            textAlign: 'center',
          }}
        >
          screentimejourney.com
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Typewriter effect component
const TypewriterText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  style: React.CSSProperties;
}> = ({text, frame, fps, style}) => {
  const charsToShow = Math.floor(
    interpolate(
      frame,
      [0, 30],
      [0, text.length],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    )
  );

  const visibleText = text.substring(0, charsToShow);

  return <div style={style}>{visibleText}</div>;
};

// Footer component
const Footer: React.FC<{darkMode?: boolean}> = ({darkMode = false}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: 32,
          fontWeight: 500,
          color: darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
          margin: 0,
        }}
      >
        screentimejourney.com
      </p>
    </div>
  );
};

