import React from 'react';

export const CourtroomAsciiArt: React.FC = () => {
  return (
    <figure
      className="relative flex items-center justify-center sm:justify-end select-none"
      aria-label="Aesthetic ASCII engraving of classical blindfolded Lady Justice holding scales and sword"
    >
      <img
        src="/brand/lady-justice-ascii.png"
        alt="Lady Justice rendered in fine editorial ASCII typography"
        width={984}
        height={1760}
        className="w-full max-w-[200px] sm:max-w-[240px] md:max-w-[270px] lg:max-w-[300px] h-auto object-contain pointer-events-none"
        draggable={false}
      />
    </figure>
  );
};
