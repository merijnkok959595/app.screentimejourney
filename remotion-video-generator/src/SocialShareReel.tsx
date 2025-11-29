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
import {loadFont} from '@remotion/google-fonts/DMSans';
import {loadFont as loadDMSerifDisplay} from '@remotion/google-fonts/DMSerifDisplay';
import {Emoji} from './Emoji';
import {TransitionOverlay} from './TransitionOverlay';
import {AppleEmoji} from './AppleEmoji';

// Load DM Sans font
const {fontFamily: dmSansFontFamily} = loadFont();
// Load DM Serif Display font
const {fontFamily: dmSerifDisplayFontFamily} = loadDMSerifDisplay();

export interface SocialShareReelProps {
  firstname: string;
  rank: number;
  level: number;
  nextLevel: number;
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
const LOGO_INVERTED_URL = 'https://cdn.shopify.com/s/files/1/0866/6749/3623/files/stj_trimmed_png.png?v=1757864303';
const LOGO_YELLOW_SCREEN = 'https://cdn.shopify.com/s/files/1/0866/6749/3623/files/Untitled-20250823-230641-6751-undefinedx.png?v=1755983241';

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
  level,
  nextLevel,
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
      {/* Slide 1: Greeting + Description (0-8s) - Fade down */}
      <Sequence from={0} durationInFrames={225}>
        <GreetingSlide
          firstname={firstname}
          rank={rank}
          level={level}
          currentTitle={currentTitle}
          description={description}
          currentColorCode={currentColorCode}
          days={days}
          currentEmoji={currentEmoji}
        />
      </Sequence>

      {/* Transition 1→2 */}
      <Sequence from={220} durationInFrames={10}>
        <TransitionOverlay fromFrame={220} duration={10} />
      </Sequence>

      {/* Slide 2: Next Level (7.5-10.5s) - Fall down */}
      <Sequence from={225} durationInFrames={90}>
        <NextLevelSlide
          nextLevel={nextLevel}
          nextTitle={nextTitle}
          nextEmoji={nextEmoji}
          daysToNext={daysToNext}
          nextColorCode={nextColorCode}
        />
      </Sequence>

      {/* Transition 2→3 */}
      <Sequence from={310} durationInFrames={10}>
        <TransitionOverlay fromFrame={310} duration={10} />
      </Sequence>

      {/* Slide 3: Brand Outro (10.5-15s) - Fade up */}
      <Sequence from={315} durationInFrames={135}>
        <BrandOutroSlide outro={dynamicCopy.outro} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Slide 1: Complete greeting + level + description in one flow (8 seconds)
const GreetingSlide: React.FC<{
  firstname: string;
  rank: number;
  level: number;
  currentTitle: string;
  description: string;
  currentColorCode: string;
  days: number;
  currentEmoji: string;
}> = ({firstname, rank, level, currentTitle, description, currentColorCode, days, currentEmoji}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // All on same color background (level color)
  const backgroundColor = `#${currentColorCode}`;

  const bgOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  // Logo POP-IN effect (like ending slide)
  const logoScale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 30,
    config: {
      damping: 12,
      stiffness: 150,
      mass: 0.5,
    },
  });

  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  // Logo breathing effect (subtle pulse) - starts after pop-in
  const logoPulse = frame > 30 ? 1 + Math.sin(frame / 40) * 0.015 : 1;

  // Logo movements - only FALL from above or SLIDE from sides!
  
  // 1. Hi Merijn: Logo FALLS from ABOVE - FAST & SNAPPY!
  const logoGreetingOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 15,
  });
  const logoGreetingY = interpolate(
    spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 }),
    [0, 1],
    [-200, 0]
  );
  
  // 2. You are Ground Zero: Logo SLIDES from LEFT - FAST & SNAPPY!
  const logoLevelOpacity = frame >= 50 && frame < 95 
    ? spring({ frame: frame - 50, fps, from: 0, to: 1, durationInFrames: 12 })
    : frame >= 95 ? 1 : 0;
  const logoLevelX = frame >= 50 && frame < 95
    ? interpolate(
        spring({ frame: frame - 50, fps, from: 0, to: 1, durationInFrames: 18 }),
        [0, 1],
        [-200, 0]
      )
    : 0;
  
  // 3. With X days: Logo FALLS from ABOVE - FAST & SNAPPY!
  const logoDaysOpacity = frame >= 95 && frame < 140
    ? spring({ frame: frame - 95, fps, from: 0, to: 1, durationInFrames: 12 })
    : frame >= 140 ? 1 : 0;
  const logoDaysY = frame >= 95 && frame < 140
    ? interpolate(
        spring({ frame: frame - 95, fps, from: 0, to: 1, durationInFrames: 18 }),
        [0, 1],
        [-200, 0]
      )
    : 0;
  
  // 4. Milestone fact: Logo SLIDES from RIGHT - FAST & SNAPPY!
  const logoDescriptionOpacity = frame >= 140
    ? spring({ frame: frame - 140, fps, from: 0, to: 1, durationInFrames: 15 })
    : 0;
  const logoDescriptionX = frame >= 140
    ? interpolate(
        spring({ frame: frame - 140, fps, from: 0, to: 1, durationInFrames: 20 }),
        [0, 1],
        [200, 0]
      )
    : 0;

  // Combine logo transforms based on current frame
  const logoTransform = 
    frame < 50 
      ? `translateY(${logoGreetingY}px) scale(${logoScale * logoPulse})`
      : frame < 95 
      ? `translateX(${logoLevelX}px) scale(${logoScale * logoPulse})`
      : frame < 140 
      ? `translateY(${logoDaysY}px) scale(${logoScale * logoPulse})`
      : `translateX(${logoDescriptionX}px) scale(${logoScale * logoPulse})`;

  const logoCurrentOpacity = 
    frame < 50 ? logoOpacity * logoGreetingOpacity :
    frame < 95 ? logoOpacity * logoLevelOpacity :
    frame < 140 ? logoOpacity * logoDaysOpacity :
    logoOpacity * logoDescriptionOpacity;

  // "Hi Merijn" appears AFTER logo falls (like NextLevel!) - FAST & SNAPPY!
  const greetingOpacity = interpolate(
    frame,
    [22, 28, 42, 50],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  const greetingScale = spring({
    frame: frame - 22,
    fps,
    from: 0.85,
    to: 1,
    durationInFrames: 12,
    config: {
      damping: 18,
      stiffness: 180,
    },
  });

  // ⭐ INDEPENDENT TEXT ANIMATIONS for Pages 2-4 (decoupled from page movement)
  // Logo enters FIRST, text enters SECOND (10 frame delay, matching Page 1 & NextLevelSlide)
  
  // Page 2 Text: "You are Ground Zero" - Independent fade + scale + micro-slide (starts at frame 65, 10 frames after logo)
  const page2TextOpacity = spring({
    frame: frame - 65,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const page2TextScale = spring({
    frame: frame - 65,
    fps,
    from: 0.9,
    to: 1,
    durationInFrames: 20,
    config: {
      damping: 18,
      stiffness: 180,
    },
  });

  const page2TextY = interpolate(
    spring({ frame: frame - 65, fps, from: 0, to: 1, durationInFrames: 20 }),
    [0, 1],
    [20, 0]
  );

  // Page 3 Text: "With X days" - Independent fade + scale + micro-slide (starts at frame 108, 10 frames after logo)
  const page3TextOpacity = spring({
    frame: frame - 108,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const page3TextScale = spring({
    frame: frame - 108,
    fps,
    from: 0.9,
    to: 1,
    durationInFrames: 20,
    config: {
      damping: 18,
      stiffness: 180,
    },
  });

  const page3TextY = interpolate(
    spring({ frame: frame - 108, fps, from: 0, to: 1, durationInFrames: 20 }),
    [0, 1],
    [20, 0]
  );

  // Page 4 Text: "Milestone fact" - Independent fade + scale (starts at frame 153, 10 frames after logo)
  const page4TextOpacity = spring({
    frame: frame - 153,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const page4TextScale = spring({
    frame: frame - 153,
    fps,
    from: 0.9,
    to: 1,
    durationInFrames: 20,
    config: {
      damping: 18,
      stiffness: 180,
    },
  });

  // ⭐ PAGE STATE SYSTEM - Which page are we on?
  const currentPage = 
    frame < 55 ? 1 :
    frame < 98 ? 2 :
    frame < 143 ? 3 :
    4;

  // ⭐ PAGE MOVEMENTS - Subtle 100px movements (matching NextLevelSlide)
  // Page 1: Idle until 50, then slide DOWN 100px (exits by frame 53, 1-frame gap at 54)
  const page1Y = frame < 50
    ? 0
    : interpolate(
        spring({ frame: frame - 50, fps, from: 0, to: 1, durationInFrames: 25 }),
        [0, 1],
        [0, 100]
      );

  // Page 2: Enters from TOP (-100px) at 55, exits LEFT (-100px) at 95 (1-frame gap at 97)
  const page2Y = frame < 95
    ? interpolate(
        spring({ frame: frame - 55, fps, from: 0, to: 1, durationInFrames: 25 }),
        [0, 1],
        [-100, 0]
      )
    : 0;
  const page2X = frame < 95
    ? 0
    : interpolate(
        spring({ frame: frame - 95, fps, from: 0, to: 1, durationInFrames: 25 }),
        [0, 1],
        [0, -100]
      );

  // Page 3: Enters from RIGHT (100px) at 98, exits UP (-100px) at 140 (1-frame gap at 142)
  const page3X = frame < 140
    ? interpolate(
        spring({ frame: frame - 98, fps, from: 0, to: 1, durationInFrames: 25 }),
        [0, 1],
        [100, 0]
      )
    : 0;
  const page3Y = frame < 140
    ? 0
    : interpolate(
        spring({ frame: frame - 140, fps, from: 0, to: 1, durationInFrames: 25 }),
        [0, 1],
        [0, -100]
      );

  // Page 4: Enters from BOTTOM (100px) at 143, then stays
  const page4Y = interpolate(
    spring({ frame: frame - 143, fps, from: 0, to: 1, durationInFrames: 25 }),
    [0, 1],
    [100, 0]
  );

  // Combine transforms for each page
  const page1Transform = `translateY(${page1Y}px)`;
  const page2Transform = `translateY(${page2Y}px) translateX(${page2X}px)`;
  const page3Transform = `translateX(${page3X}px) translateY(${page3Y}px)`;
  const page4Transform = `translateY(${page4Y}px)`;

  // Individual opacity for each page (matching NextLevelSlide 20 frames)
  const page1Opacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const page2Opacity = spring({
    frame: frame - 55,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const page3Opacity = spring({
    frame: frame - 98,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const page4Opacity = spring({
    frame: frame - 143,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent', // ⭐ Transparent - exposes black canvas for micro-flash!
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ⭐ PAGE 1: "Hi Merijn" - Visible frames 0-53, exits at 50, 1-frame gap at 54 */}
      {frame >= 0 && frame <= 53 && (
        <AbsoluteFill
          style={{
            backgroundColor: backgroundColor,
            transform: page1Transform,
            opacity: page1Opacity,
          }}
        >
          <div style={{ position: 'absolute', top: '8%', left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: logoOpacity }}>
            <Img src={LOGO_URL} style={{ width: 300, height: 300, transform: `scale(${logoScale})` }} />
          </div>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ opacity: greetingOpacity, textAlign: 'center', transform: `scale(${greetingScale})` }}>
              <div style={{ fontSize: 150, fontWeight: 800, fontFamily: 'Anton, sans-serif', color: 'white', letterSpacing: 3, textShadow: '0 0 30px rgba(0,0,0,0.4)' }}>
                Hi {firstname},
              </div>
            </div>
          </div>
          <Footer />
        </AbsoluteFill>
      )}

      {/* ⭐ PAGE 2: "You are Ground Zero" - Visible frames 55-96, exits at 95, 1-frame gap at 97 */}
      {frame >= 55 && frame <= 96 && (
        <>
          {/* LAYER 1: Background + Logo (moves with page) */}
          <AbsoluteFill
            style={{
              backgroundColor: backgroundColor,
              transform: page2Transform,
              opacity: page2Opacity,
            }}
          >
            <div style={{ position: 'absolute', top: '8%', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <Img src={LOGO_URL} style={{ width: 300, height: 300 }} />
            </div>
            <Footer />
          </AbsoluteFill>

          {/* LAYER 2: Text Content (independent animation, does NOT move with page) */}
          <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 30,
                opacity: page2TextOpacity,
                transform: `translateY(${page2TextY}px) scale(${page2TextScale})`,
              }}>
                <div style={{ fontSize: 150, fontWeight: 700, fontFamily: 'Anton, sans-serif', color: 'rgba(255,255,255,0.95)', letterSpacing: 2, textShadow: '0 0 20px rgba(0,0,0,0.3)' }}>
                  You are
                </div>
                <AppleEmoji emoji={currentEmoji} size={200} animate={false} frame={frame} />
                <div style={{ fontSize: 150, fontWeight: 700, fontFamily: 'Anton, sans-serif', color: 'rgba(255,255,255,0.95)', letterSpacing: 2, textShadow: '0 0 20px rgba(0,0,0,0.3)' }}>
                  Level {level}
                </div>
                <div style={{ fontSize: 150, fontWeight: 700, fontFamily: 'Anton, sans-serif', color: 'rgba(255,255,255,0.95)', letterSpacing: 2, textShadow: '0 0 20px rgba(0,0,0,0.3)' }}>
                  {currentTitle}
                </div>
              </div>
            </div>
          </AbsoluteFill>
        </>
      )}

      {/* ⭐ PAGE 3: "With X days" - Visible frames 98-141, exits at 140, 1-frame gap at 142 */}
      {frame >= 98 && frame <= 141 && (
        <>
          {/* LAYER 1: Background + Logo (moves with page) */}
          <AbsoluteFill
            style={{
              backgroundColor: backgroundColor,
              transform: page3Transform,
              opacity: page3Opacity,
            }}
          >
            <div style={{ position: 'absolute', top: '8%', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <Img src={LOGO_URL} style={{ width: 300, height: 300 }} />
            </div>
            <Footer />
          </AbsoluteFill>

          {/* LAYER 2: Text Content (independent animation, does NOT move with page) */}
          <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 30, 
                textAlign: 'center',
                opacity: page3TextOpacity,
                transform: `translateY(${page3TextY}px) scale(${page3TextScale})`,
              }}>
                <AppleEmoji emoji="💪" size={120} animate={false} frame={frame} />
                <div style={{ fontSize: 150, fontWeight: 600, fontFamily: 'Anton, sans-serif', color: 'rgba(255,255,255,0.85)', letterSpacing: 2, textShadow: '0 0 20px rgba(0,0,0,0.3)', lineHeight: 1.3 }}>
                  With {days} {days === 1 ? 'day' : 'days'}
                  <br />
                  in focus
                </div>
              </div>
            </div>
          </AbsoluteFill>
        </>
      )}

      {/* ⭐ PAGE 4: "Milestone fact" - Visible frames 143-217, enters from bottom after 1-frame gap (shortened by 0.5s) */}
      {frame >= 143 && frame <= 217 && (
        <>
          {/* LAYER 1: Background + Logo (moves with page) */}
          <AbsoluteFill
            style={{
              backgroundColor: backgroundColor,
              transform: page4Transform,
              opacity: page4Opacity,
            }}
          >
            <div style={{ position: 'absolute', top: '8%', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <Img src={LOGO_URL} style={{ width: 300, height: 300 }} />
            </div>
            <Footer />
          </AbsoluteFill>

          {/* LAYER 2: Text Content (independent animation, does NOT move with page) */}
          <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 30, 
                textAlign: 'center', 
                maxWidth: '80%',
                opacity: page4TextOpacity,
                transform: `scale(${page4TextScale})`,
              }}>
                <AppleEmoji emoji="🧠" size={120} animate={false} frame={frame} />
                <div style={{ fontSize: 100, fontWeight: 400, fontFamily: 'Inter, sans-serif', color: 'white', lineHeight: 1.5, opacity: 0.95, textShadow: '0 0 15px rgba(0,0,0,0.3)', fontStyle: 'italic' }}>
                  {description}
                </div>
              </div>
            </div>
          </AbsoluteFill>
        </>
      )}
    </AbsoluteFill>
  );
};


// Slide 3: Next Level - Fall down transition
const NextLevelSlide: React.FC<{
  nextLevel: number;
  nextTitle: string;
  nextEmoji: string;
  daysToNext: number;
  nextColorCode: string;
}> = ({nextLevel, nextTitle, nextEmoji, daysToNext, nextColorCode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Fall down transition
  const slideY = interpolate(
    spring({ frame, fps, from: 0, to: 1, durationInFrames: 25 }),
    [0, 1],
    [-100, 0]
  );

  const slideOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 15,
  });

  const textOpacity = spring({
    frame: frame - 15,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${nextColorCode}`,
        fontFamily: 'Inter, sans-serif',
        opacity: slideOpacity,
        transform: `translateY(${slideY}px)`,
      }}
    >
      {/* Logo - Bigger */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: logoOpacity,
        }}
      >
        <Img src={LOGO_URL} style={{ width: 300, height: 300 }} />
      </div>

      {/* Next level content */}
      <div
        style={{
          position: 'absolute',
          top: '58%',
          transform: 'translateY(-50%)',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: textOpacity,
          padding: '0 100px',
        }}
      >
        <div
          style={{
            fontSize: 150,
            fontWeight: 700,
            fontFamily: 'Anton, sans-serif',
            color: 'white',
            margin: '0 0 50px 0',
            letterSpacing: 2,
            textShadow: '0 0 25px rgba(0,0,0,0.4)',
          }}
        >
          Next up
        </div>
        <AppleEmoji emoji={nextEmoji} size={200} animate frame={frame} />
        <div
          style={{
            fontSize: 150,
            fontWeight: 700,
            fontFamily: 'Anton, sans-serif',
            color: 'white',
            margin: '50px 0 0 0',
            letterSpacing: 2,
            textShadow: '0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          {nextTitle}
        </div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 700,
            fontFamily: 'Anton, sans-serif',
            color: 'white',
            margin: '30px 0 0 0',
            letterSpacing: 2,
            textShadow: '0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          in {daysToNext} {daysToNext === 1 ? 'day' : 'days'}
        </div>
      </div>

      <Footer />
    </AbsoluteFill>
  );
};

// Slide 4: King/Queen - Zoom in transition with inverted logo
const KingQueenSlide: React.FC<{
  kingQueen: string;
  kingQueenEmoji: string;
  kingColorCode: string;
  gender: string;
}> = ({kingQueen, kingQueenEmoji, kingColorCode, gender}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Zoom in transition
  const zoomScale = interpolate(
    spring({ frame, fps, from: 0, to: 1, durationInFrames: 25 }),
    [0, 1],
    [0.8, 1]
  );

  const slideOpacity = spring({
    frame,
    fps,
    from: 0,
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
    durationInFrames: 25,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `#${kingColorCode}`,
        fontFamily: 'Inter, sans-serif',
        opacity: slideOpacity,
        transform: `scale(${zoomScale})`,
      }}
    >
      {/* New logo for gold/yellow background - Bigger */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: logoOpacity,
          zIndex: 2,
        }}
      >
        <Img src={LOGO_YELLOW_SCREEN} style={{ width: 240, height: 240 }} />
      </div>

      {/* King/Queen content */}
      <div
        style={{
          position: 'absolute',
          top: '58%',
          transform: 'translateY(-50%)',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: textOpacity,
          padding: '0 110px',
          zIndex: 2,
        }}
      >
        <CinematicText
          text="This is your path to"
          frame={frame - 20}
          fps={fps}
          style={{
            fontSize: 150,
            fontWeight: 700,
            fontFamily: 'Anton, sans-serif',
            color: 'white',
            margin: '0 0 50px 0',
            letterSpacing: 2,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
          <CinematicText
            text={`${kingQueen}`}
            frame={frame - 40}
            fps={fps}
            style={{
              fontSize: 150,
              fontWeight: 800,
              fontFamily: 'Anton, sans-serif',
              color: 'white',
              margin: 0,
              letterSpacing: 4,
            }}
          />
          <AppleEmoji emoji={kingQueenEmoji} size={150} animate={false} frame={frame} />
        </div>
      </div>

      <Footer />
    </AbsoluteFill>
  );
};

// Slide 5: Brand Outro - Fade up transition with rotating slogans
const BrandOutroSlide: React.FC<{outro: string}> = ({outro}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Rotating slogans
  const slogans = [
    "Reclaim Your Focus",
    "Build Stronger Habits",
    "Level Up Your Life",
  ];

  // Fade up transition
  const slideY = interpolate(
    spring({ frame, fps, from: 0, to: 1, durationInFrames: 25 }),
    [0, 1],
    [100, 0]
  );

  const slideOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const logoScale = spring({
    frame,
    fps,
    from: 0.7,
    to: 1,
    durationInFrames: 30,
  });

  const logoOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  const textOpacity = spring({
    frame: frame - 25,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 25,
  });

  // Rotating slogan logic - cycle every 45 frames (1.5 seconds per slogan)
  // Delay slogans to appear at frame 40 (15 frames after "Screentimejourney")
  const sloganDuration = 45;
  const sloganIndex = Math.floor((frame - 40) / sloganDuration) % slogans.length;
  const sloganFrame = (frame - 40) % sloganDuration;
  
  // Fade in and out for each slogan - longer hold time
  const sloganOpacity = interpolate(
    sloganFrame,
    [0, 10, 35, 45],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
        opacity: slideOpacity,
        transform: `translateY(${slideY}px)`,
      }}
    >
      {/* Large logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 80,
        }}
      >
        <Img src={LOGO_URL} style={{ width: 340, height: 340 }} />
      </div>

      {/* Brand text - Section 1 */}
      <div style={{ opacity: textOpacity, textAlign: 'center', padding: '0 150px' }}>
        <h1
          style={{
            fontSize: 90,
            fontWeight: 400,
            fontFamily: dmSerifDisplayFontFamily,
            color: 'white',
            margin: 0,
            letterSpacing: 4,
            textShadow: '0 0 25px rgba(0,0,0,0.4)',
          }}
        >
          Screentimejourney
        </h1>
        
        {/* Section 2 - Rotating slogans */}
        <div style={{ 
          marginTop: 50,
          height: 80,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p
            style={{
              fontSize: 60,
              fontWeight: 400,
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              textShadow: '0 0 15px rgba(0,0,0,0.3)',
              opacity: frame > 40 ? sloganOpacity : 0,
              position: 'absolute',
            }}
          >
            {slogans[sloganIndex]}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 44,
            fontWeight: 400,
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            margin: 0,
            letterSpacing: 0.5,
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

// Typewriter text effect
const TypewriterText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  style: React.CSSProperties;
}> = ({text, frame, fps, style}) => {
  // Faster typewriter effect
  const charsPerFrame = 2; // Show 2 characters per frame
  const charsToShow = Math.max(0, Math.min(text.length, Math.floor(frame * charsPerFrame)));
  const visibleText = text.substring(0, charsToShow);

  return <div style={style}>{visibleText}</div>;
};


// Footer component - Static, no animations, bigger
const Footer: React.FC<{darkMode?: boolean}> = ({darkMode = false}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <p
        style={{
          fontSize: 42,
          fontWeight: 400,
          fontFamily: 'Inter, sans-serif',
          color: 'white',
          margin: 0,
          letterSpacing: 0.5,
        }}
      >
        screentimejourney.com
      </p>
    </div>
  );
};

