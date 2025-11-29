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

// Dynamic copy generator based on user stats
const getDynamicCopy = (rank: number, days: number, gender: string) => {
  let greetingText = "🌍 Every journey begins somewhere.";
  if (rank < 10) greetingText = "🔥 You're among the elite.";
  else if (rank < 50) greetingText = "💪 You're climbing fast.";
  
  let currentMessage = "Every warrior starts from zero.";
  if (days < 7) currentMessage = "Every warrior starts from zero.";
  else if (days < 30) currentMessage = "You're building focus from the ground up.";
  else if (days < 90) currentMessage = "Momentum is your new normal.";
  else currentMessage = "You're unstoppable now.";
  
  const outroOptions = [
    "Your mind. Your crown. Your journey.",
    "Reclaim your focus. Join the movement.",
    "Less screen. More power.",
  ];
  const outro = outroOptions[Math.floor(Math.random() * outroOptions.length)];
  
  return { greetingText, currentMessage, outro };
};

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
  const kingQueenEmoji = '👑';
  const dynamicCopy = getDynamicCopy(rank, days, gender);

  return (
    <AbsoluteFill>
      {/* Slide 1: Greeting (0-3s) */}
      <Sequence from={0} durationInFrames={90}>
        <GreetingSlide
          firstname={firstname}
          rank={rank}
          greetingText={dynamicCopy.greetingText}
        />
      </Sequence>

      {/* Slide 2: Current Level (3-6s) */}
      <Sequence from={90} durationInFrames={90}>
        <CurrentLevelSlide
          currentTitle={currentTitle}
          currentEmoji={currentEmoji}
          days={days}
          currentColorCode={currentColorCode}
          currentMessage={dynamicCopy.currentMessage}
        />
      </Sequence>

      {/* Slide 3: Next Level (6-9s) */}
      <Sequence from={180} durationInFrames={90}>
        <NextLevelSlide
          nextTitle={nextTitle}
          nextEmoji={nextEmoji}
          daysToNext={daysToNext}
          nextColorCode={nextColorCode}
        />
      </Sequence>

      {/* Slide 4: King/Queen Goal (9-12s) */}
      <Sequence from={270} durationInFrames={90}>
        <KingQueenSlide
          kingQueen={kingQueen}
          kingQueenEmoji={kingQueenEmoji}
          kingColorCode={kingColorCode}
          gender={gender}
        />
      </Sequence>

      {/* Slide 5: Brand Outro (12-15s) */}
      <Sequence from={360} durationInFrames={90}>
        <BrandOutroSlide outro={dynamicCopy.outro} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Slide 1: Greeting - Recognition moment
const GreetingSlide: React.FC<{
  firstname: string;
  rank: number;
  greetingText: string;
}> = ({firstname, rank, greetingText}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  // Zoom-in blur dissolve from black
  const bgOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
    config: { damping: 20 },
  });

  const bgScale = interpolate(
    frame,
    [0, 30],
    [1.1, 1],
    { extrapolateRight: 'clamp' }
  );

  // Logo glow effect
  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  const logoGlow = spring({
    frame: frame - 10,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  // Text animations with particle sweep
  const greetingY = interpolate(
    spring({ frame: frame - 15, fps, from: 0, to: 1, durationInFrames: 25 }),
    [0, 1],
    [50, 0]
  );

  const greetingOpacity = spring({
    frame: frame - 15,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  const rankOpacity = spring({
    frame: frame - 40,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  // Particle effect
  const particleOpacity = spring({
    frame: frame - 20,
    fps,
    from: 0,
    to: 0.3,
    durationInFrames: 30,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_PURPLE,
        fontFamily: 'Inter, Arial, sans-serif',
        opacity: bgOpacity,
        transform: `scale(${bgScale})`,
      }}
    >
      {/* Animated gradient background */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${BRAND_PURPLE} 0%, #1a0230 50%, ${BRAND_PURPLE} 100%)`,
          opacity: 0.8,
          transform: `translateX(${interpolate(frame, [0, 90], [-10, 10])}%)`,
        }}
      />

      {/* Particle layer */}
      <ParticleLayer opacity={particleOpacity} count={20} />

      {/* Logo with glow */}
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
        <div style={{ position: 'relative' }}>
          {/* Glow effect */}
          <div
            style={{
              position: 'absolute',
              width: 140,
              height: 140,
              left: -10,
              top: -10,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
              opacity: logoGlow * 0.6,
              filter: 'blur(20px)',
            }}
          />
          <Img
            src={LOGO_URL}
            style={{
              width: 120,
              height: 120,
              position: 'relative',
              zIndex: 2,
            }}
          />
        </div>
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
          transform: `translateY(${greetingY}px)`,
          padding: '0 60px',
        }}
      >
        <CinematicText
          text={`Hey ${firstname},`}
          frame={frame - 15}
          fps={fps}
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            margin: '0 0 20px 0',
            letterSpacing: 1,
          }}
        />
        <CinematicText
          text="You're stepping into the journey."
          frame={frame - 25}
          fps={fps}
          style={{
            fontSize: 44,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.9)',
            margin: 0,
          }}
        />
      </div>

      {/* Rank text */}
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: rankOpacity,
          padding: '0 60px',
        }}
      >
        <CinematicText
          text={greetingText}
          frame={frame - 40}
          fps={fps}
          style={{
            fontSize: 52,
            fontWeight: 600,
            color: 'white',
            margin: 0,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      <Footer />
    </AbsoluteFill>
  );
};

// Slide 2: Current Level - Momentum building
const CurrentLevelSlide: React.FC<{
  currentTitle: string;
  currentEmoji: string;
  days: number;
  currentColorCode: string;
  currentMessage: string;
}> = ({currentTitle, currentEmoji, days, currentColorCode, currentMessage}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Color morph + upward motion transition
  const slideY = interpolate(
    spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 }),
    [0, 1],
    [50, 0]
  );

  const slideOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 15,
  });

  // Background pulse (heartbeat)
  const pulseScale = 1 + Math.sin(frame * 0.1) * 0.02;

  // Logo
  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 15,
  });

  // Rising text from bottom
  const titleY = interpolate(
    spring({ frame: frame - 10, fps, from: 0, to: 1, durationInFrames: 30 }),
    [0, 1],
    [100, 0]
  );

  const titleOpacity = spring({
    frame: frame - 10,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  const messageOpacity = spring({
    frame: frame - 50,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${currentColorCode}`,
        fontFamily: 'Inter, Arial, sans-serif',
        opacity: slideOpacity,
        transform: `translateY(${slideY}px) scale(${pulseScale})`,
      }}
    >
      {/* Animated gradient overlay */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)`,
          transform: `translateY(${interpolate(frame, [0, 90], [0, -20])}px)`,
        }}
      />

      {/* Shimmer particles */}
      <ParticleLayer opacity={0.2} count={15} color="rgba(255,255,255,0.6)" />

      {/* Logo */}
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
        <Img src={LOGO_URL} style={{ width: 120, height: 120 }} />
      </div>

      {/* Main content */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          padding: '0 70px',
        }}
      >
        <CinematicText
          text="Right now, you're at"
          frame={frame - 10}
          fps={fps}
          style={{
            fontSize: 46,
            fontWeight: 500,
            color: 'white',
            margin: '0 0 30px 0',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 30 }}>
          <ImpactText
            text={currentTitle.toUpperCase()}
            frame={frame - 25}
            fps={fps}
            style={{
              fontSize: 76,
              fontWeight: 900,
              color: 'white',
              margin: 0,
              letterSpacing: 2,
              textShadow: '0 4px 30px rgba(0,0,0,0.7)',
            }}
          />
          <div style={{ fontSize: 80 }}>{currentEmoji}</div>
        </div>
        <CinematicText
          text={`Day ${days}: ${currentMessage}`}
          frame={frame - 40}
          fps={fps}
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.95)',
            margin: '30px 0 0 0',
          }}
        />
      </div>

      <Footer />
    </AbsoluteFill>
  );
};

// Slide 3: Next Level - Anticipation
const NextLevelSlide: React.FC<{
  nextTitle: string;
  nextEmoji: string;
  daysToNext: number;
  nextColorCode: string;
}> = ({nextTitle, nextEmoji, daysToNext, nextColorCode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Spin zoom transition (3D card flip effect)
  const rotateY = interpolate(
    spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 }),
    [0, 1],
    [90, 0]
  );

  const slideOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  // Shimmer effect (left to right)
  const shimmerX = interpolate(frame, [0, 90], [-100, 100]);

  // Logo
  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 15,
  });

  // Impact bounce for title
  const titleScale = spring({
    frame: frame - 30,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 20,
    config: { mass: 0.5, damping: 10, stiffness: 200 },
  });

  const titleOpacity = spring({
    frame: frame - 15,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  // Camera shake on emoji
  const shakeX = frame > 40 && frame < 50 ? Math.sin(frame * 2) * 3 : 0;
  const shakeY = frame > 40 && frame < 50 ? Math.cos(frame * 2) * 3 : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${nextColorCode}`,
        fontFamily: 'Inter, Arial, sans-serif',
        opacity: slideOpacity,
        transform: `perspective(1000px) rotateY(${rotateY}deg)`,
      }}
    >
      {/* Shimmer overlay */}
      <div
        style={{
          position: 'absolute',
          width: '200%',
          height: '100%',
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`,
          transform: `translateX(${shimmerX}%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Particle effects */}
      <ParticleLayer opacity={0.25} count={25} />

      {/* Logo */}
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
        <Img src={LOGO_URL} style={{ width: 120, height: 120 }} />
      </div>

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          padding: '0 70px',
        }}
      >
        <CinematicText
          text="Next up:"
          frame={frame - 15}
          fps={fps}
          style={{
            fontSize: 54,
            fontWeight: 600,
            color: 'white',
            margin: '0 0 40px 0',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 20,
            marginTop: 40,
            transform: `scale(${titleScale}) translate(${shakeX}px, ${shakeY}px)`,
          }}
        >
          <ImpactText
            text={nextTitle.toUpperCase()}
            frame={frame - 30}
            fps={fps}
            style={{
              fontSize: 84,
              fontWeight: 900,
              color: 'white',
              margin: 0,
              letterSpacing: 3,
              textShadow: '0 6px 40px rgba(0,0,0,0.8)',
            }}
          />
          <div style={{ fontSize: 90 }}>{nextEmoji}</div>
        </div>
        <CinematicText
          text={`${daysToNext} days of focus.`}
          frame={frame - 50}
          fps={fps}
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.95)',
            margin: '40px 0 0 0',
          }}
        />
      </div>

      <Footer />
    </AbsoluteFill>
  );
};

// Slide 4: King/Queen - Crowning moment
const KingQueenSlide: React.FC<{
  kingQueen: string;
  kingQueenEmoji: string;
  kingColorCode: string;
  gender: string;
}> = ({kingQueen, kingQueenEmoji, kingColorCode, gender}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Gold flare wipe from right to left
  const flareX = interpolate(
    spring({ frame, fps, from: 0, to: 1, durationInFrames: 25 }),
    [0, 1],
    [100, -100]
  );

  const slideOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  // Gold particles swirl
  const particleRotation = frame * 0.5;

  // Logo
  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 15,
  });

  // Crown shimmer
  const crownShimmer = Math.abs(Math.sin(frame * 0.1)) * 0.5 + 0.5;

  // Camera zoom out for grandeur
  const cameraScale = interpolate(
    spring({ frame: frame - 20, fps, from: 0, to: 1, durationInFrames: 40 }),
    [0, 1],
    [1.1, 1]
  );

  const titleOpacity = spring({
    frame: frame - 15,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${kingColorCode}`,
        fontFamily: 'Inter, Arial, sans-serif',
        opacity: slideOpacity,
        transform: `scale(${cameraScale})`,
      }}
    >
      {/* Gold flare wipe */}
      <div
        style={{
          position: 'absolute',
          width: '150%',
          height: '100%',
          left: `${flareX}%`,
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Swirling gold particles */}
      <div style={{ transform: `rotate(${particleRotation}deg)`, opacity: 0.3 }}>
        <ParticleLayer opacity={0.4} count={30} color="rgba(255,215,0,0.8)" />
      </div>

      {/* Logo */}
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
        <Img src={LOGO_URL} style={{ width: 120, height: 120 }} />
      </div>

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          padding: '0 70px',
        }}
      >
        <CinematicText
          text="You're on your path to"
          frame={frame - 15}
          fps={fps}
          style={{
            fontSize: 50,
            fontWeight: 600,
            color: 'rgba(0,0,0,0.85)',
            margin: '0 0 40px 0',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 25,
            marginTop: 40,
          }}
        >
          <ShimmerText
            text={kingQueen.toUpperCase()}
            frame={frame - 30}
            fps={fps}
            style={{
              fontSize: 92,
              fontWeight: 900,
              color: 'black',
              margin: 0,
              letterSpacing: 4,
              textShadow: '0 8px 50px rgba(255,215,0,0.6)',
            }}
          />
          <div
            style={{
              fontSize: 100,
              opacity: crownShimmer,
              filter: `drop-shadow(0 0 20px rgba(255,215,0,0.8))`,
            }}
          >
            {kingQueenEmoji}
          </div>
        </div>
        <CinematicText
          text="365 days of focus."
          frame={frame - 55}
          fps={fps}
          style={{
            fontSize: 52,
            fontWeight: 600,
            color: 'rgba(0,0,0,0.8)',
            margin: '40px 0 0 0',
          }}
        />
      </div>

      <Footer darkMode />
    </AbsoluteFill>
  );
};

// Slide 5: Brand Outro - Inspiration
const BrandOutroSlide: React.FC<{outro: string}> = ({outro}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Radial light burst
  const burstScale = spring({
    frame,
    fps,
    from: 0,
    to: 2,
    durationInFrames: 30,
  });

  const burstOpacity = spring({
    frame,
    fps,
    from: 0.8,
    to: 0,
    durationInFrames: 30,
  });

  // Logo scale-up with ease spring
  const logoScale = spring({
    frame,
    fps,
    from: 0.5,
    to: 1,
    durationInFrames: 30,
    config: { mass: 0.5, damping: 15, stiffness: 100 },
  });

  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  // Brand text fade
  const textOpacity = spring({
    frame: frame - 25,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  // Footer pulse
  const footerPulse = 1 + (frame === 50 ? 0.1 : 0);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {/* Radial burst effect */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          transform: `scale(${burstScale})`,
          opacity: burstOpacity,
        }}
      />

      {/* Particle layer */}
      <ParticleLayer opacity={0.3} count={40} />

      {/* Large logo with white flare */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 60,
          position: 'relative',
        }}
      >
        {/* White flare behind logo */}
        <div
          style={{
            position: 'absolute',
            width: 250,
            height: 250,
            left: -25,
            top: -25,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
        <Img
          src={LOGO_URL}
          style={{
            width: 200,
            height: 200,
            position: 'relative',
            zIndex: 2,
          }}
        />
      </div>

      {/* Brand text */}
      <div style={{ opacity: textOpacity, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 68,
            fontWeight: 900,
            color: 'white',
            margin: 0,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          Screen Time Journey
        </h1>
        <p
          style={{
            fontSize: 42,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '30px 0 0 0',
          }}
        >
          {outro}
        </p>
      </div>

      {/* Footer with pulse */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: `scale(${footerPulse})`,
        }}
      >
        <p
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
          }}
        >
          screentimejourney.com
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Cinematic typewriter with smooth reveal
const CinematicText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  style: React.CSSProperties;
}> = ({text, frame, fps, style}) => {
  const progress = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: Math.min(30, text.length * 2),
  });

  const charsToShow = Math.floor(progress * text.length);
  const visibleText = text.substring(0, charsToShow);

  return <div style={style}>{visibleText}</div>;
};

// Impact text with letter-by-letter shimmer
const ImpactText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  style: React.CSSProperties;
}> = ({text, frame, fps, style}) => {
  const progress = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  const charsToShow = Math.floor(progress * text.length);

  return (
    <div style={{ display: 'flex', ...style }}>
      {text.split('').map((char, i) => {
        const charOpacity = i < charsToShow ? 1 : 0;
        const charY = i < charsToShow ? 0 : 20;
        return (
          <span
            key={i}
            style={{
              opacity: charOpacity,
              transform: `translateY(${charY}px)`,
              transition: 'all 0.1s ease-out',
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

// Shimmer text with gold glow
const ShimmerText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  style: React.CSSProperties;
}> = ({text, frame, fps, style}) => {
  const progress = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 30,
  });

  const charsToShow = Math.floor(progress * text.length);

  return (
    <div style={{ display: 'flex', ...style }}>
      {text.split('').map((char, i) => {
        const isVisible = i < charsToShow;
        const shimmer = Math.abs(Math.sin((frame - i * 3) * 0.2));
        return (
          <span
            key={i}
            style={{
              opacity: isVisible ? 1 : 0,
              filter: `brightness(${1 + shimmer * 0.5})`,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

// Particle layer for depth and motion
const ParticleLayer: React.FC<{
  opacity: number;
  count: number;
  color?: string;
}> = ({opacity, count, color = 'rgba(255,255,255,0.4)'}) => {
  const frame = useCurrentFrame();
  
  const particles = Array.from({length: count}, (_, i) => {
    const x = (i * 137.5) % 100; // Golden angle distribution
    const y = (i * 50) % 100;
    const speed = 0.5 + (i % 3) * 0.3;
    const size = 2 + (i % 4);
    const offsetY = (frame * speed) % 120;
    
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${(y + offsetY) % 100}%`,
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: opacity * (0.3 + Math.sin(frame * 0.05 + i) * 0.3),
          filter: 'blur(1px)',
        }}
      />
    );
  });

  return <div style={{ position: 'absolute', width: '100%', height: '100%' }}>{particles}</div>;
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








