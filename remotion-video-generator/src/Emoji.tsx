import React from 'react';
import twemoji from 'twemoji';

interface EmojiProps {
  emoji: string;
  size?: number;
  style?: React.CSSProperties;
}

export const Emoji: React.FC<EmojiProps> = ({emoji, size = 72, style}) => {
  // Convert emoji to twemoji image URL (Apple-style emojis)
  const emojiCode = twemoji.convert.toCodePoint(emoji);
  const twemojiUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${emojiCode}.svg`;
  
  return (
    <img
      src={twemojiUrl}
      alt={emoji}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
};










