import React from 'react';

export type JollyGlyphState = 'default' | 'brief' | 'listen' | 'think' | 'speak' | 'approve';

interface JollyGlyphProps {
  variant?: 'black' | 'white';
  state?: JollyGlyphState;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Official Jolly Advocate Band Glyph — exact SVG geometry from jolly-glyph-v2
 * plus the 5 expressive states from jolly-glyph-sheet (Brief, Listen, Think, Speak, Approve).
 */
export const JollyGlyph: React.FC<JollyGlyphProps> = ({
  variant = 'black',
  state = 'default',
  size = 28,
  className = '',
  title,
}) => {
  const bgFill = variant === 'black' ? '#0E0E0E' : '#FFFFFF';
  const fgFill = variant === 'black' ? '#FFFFFF' : '#0E0E0E';
  const brassFill = '#C59B5F';

  // Band coordinates per state matching jolly-glyph-sheet.png
  let leftBand = '400,400 480,400 480,730 360,730';
  let rightBand = '520,400 600,400 640,730 520,730';
  let bandTransform: string | undefined = undefined;
  let showBrassDot = false;

  if (state === 'brief') {
    showBrassDot = true;
  } else if (state === 'listen') {
    leftBand = '400,400 480,400 480,645 372,645';
    rightBand = '520,400 600,400 628,645 520,645';
  } else if (state === 'think') {
    leftBand = '400,400 480,400 480,725 365,725';
    rightBand = '520,400 600,400 635,725 520,725';
    bandTransform = 'rotate(-8 500 400)';
  } else if (state === 'speak') {
    leftBand = '400,400 480,400 480,775 355,775';
    rightBand = '520,400 600,400 645,775 520,775';
  } else if (state === 'approve') {
    leftBand = '412,400 494,400 494,730 375,730';
    rightBand = '506,400 588,400 625,730 506,730';
    showBrassDot = true;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="500" cy="500" r="500" fill={bgFill} />
      {showBrassDot && (
        <circle
          cx="500"
          cy="210"
          r="34"
          fill={brassFill}
          className="transition-opacity duration-200"
        />
      )}
      <g
        fill={fgFill}
        transform={bandTransform}
        className="transition-transform duration-200"
      >
        <polygon points={leftBand} />
        <polygon points={rightBand} />
      </g>
      <polyline
        points="330,300 500,390 670,300"
        fill="none"
        stroke={fgFill}
        strokeWidth="26"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface JollyWordmarkProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Official Jolly italic serif wordmark using the uploaded brand image asset.
 * Uses object-contain and mix-blend-multiply so the full J/y descenders and ll ascenders
 * remain completely intact and the white background blends seamlessly into the warm paper.
 */
export const JollyWordmark: React.FC<JollyWordmarkProps> = ({
  size = 'md',
  className = '',
}) => {
  const heightClass = size === 'sm' ? 'h-5' : 'h-6';

  return (
    <img
      src="/assets/aistudio/73c4e8e8-a73c-43bd-a85c-921a1b8d47b1_5506a45c.jpg"
      alt="Jolly"
      className={`${heightClass} w-auto object-contain mix-blend-multiply contrast-125 select-none shrink-0 -ml-1 ${className}`}
    />
  );
};


