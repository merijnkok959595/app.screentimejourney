import {Composition} from 'remotion';
import {MilestoneReel, MilestoneReelProps} from './MilestoneReel';
import {SocialShareReel, SocialShareReelProps} from './SocialShareReel';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MilestoneReel"
        component={MilestoneReel}
        durationInFrames={360} // 12 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          firstname: 'Merijn',
          currentTitle: 'Ground Zero',
          currentEmoji: '🪨',
          days: 7,
          rank: 85,
          nextTitle: 'Fighter',
          nextEmoji: '🥊',
          colorCode: '2e2e2e',
          nextColorCode: '5b1b1b',
          gender: 'male',
        } as MilestoneReelProps}
      />
      
      <Composition
        id="SocialShareReel"
        component={SocialShareReel}
        durationInFrames={450} // 15 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          firstname: 'Champion',
          rank: 100,
          level: 0,
          nextLevel: 1,
          currentTitle: 'Ground Zero',
          currentEmoji: '🪨',
          days: 0,
          currentColorCode: '2e2e2e',
          nextTitle: 'Fighter',
          nextEmoji: '🥊',
          daysToNext: 7,
          nextColorCode: '5b1b1b',
          description: 'Your brain craves instant hits. Dopamine receptors flood from years of digital stimulation. The fight begins now - neural pathways primed for battle.',
          gender: 'male',
          kingColorCode: 'ffd700',
        } as SocialShareReelProps}
      />
    </>
  );
};



