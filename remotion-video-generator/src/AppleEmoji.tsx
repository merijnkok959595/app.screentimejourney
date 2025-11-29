import React from 'react';
import {Img} from 'remotion';

// Convert emoji to unified codepoint for Apple emoji CDN
const emojiToCodepoint = (emoji: string): string => {
  const codePoints: string[] = [];
  
  // Handle emoji with variation selectors and ZWJ sequences
  for (let i = 0; i < emoji.length; i++) {
    const codePoint = emoji.codePointAt(i);
    if (codePoint) {
      // Skip variation selectors (0xFE0F) for emoji-datasource compatibility
      if (codePoint !== 0xFE0F) {
        codePoints.push(codePoint.toString(16).toLowerCase().padStart(4, '0'));
      }
      // Skip the low surrogate if we're dealing with a surrogate pair
      if (codePoint > 0xFFFF) {
        i++;
      }
    }
  }
  
  return codePoints.join('-');
};

export const AppleEmoji: React.FC<{ 
  emoji: string; 
  size?: number;
  animate?: boolean;
  frame?: number;
}> = ({ emoji, size = 80, animate = false, frame = 0 }) => {
  
  const bounce = animate ? Math.sin(frame / 5) * 5 : 0;
  const codepoint = emojiToCodepoint(emoji);
  
  // Use emoji-datasource-apple from jsdelivr CDN (Apple-style emojis)
  const appleEmojiUrl = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/${codepoint}.png`;
  
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${bounce}px)`,
        width: size,
        height: size,
      }}
    >
      <Img
        src={appleEmojiUrl}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          imageRendering: 'auto',
        }}
      />
    </div>
  );
};

