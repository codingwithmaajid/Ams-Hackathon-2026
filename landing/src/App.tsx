/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { getConsoleUrl } from './lib/api';
import { CourtroomAsciiArt } from './components/CourtroomAsciiArt';
import { DiscoverButton } from './components/block/discover-button';

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const callUrl = getConsoleUrl('/call');

  const fadeUpProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.55,
          ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        },
      };

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#111827] flex flex-col justify-center selection:bg-[#111827] selection:text-[#FBF9F4]">
      {/* Subtle SVG filter for authentic sumi-ink paintbrush texture */}
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="paint-brush-edge" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.045"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <main id="main-content" className="w-full">
        <section className="mx-auto max-w-[1120px] px-6 py-8 sm:px-10">
          <motion.div
            {...fadeUpProps}
            className="grid grid-cols-1 items-center gap-10 sm:grid-cols-12 sm:gap-8 lg:gap-12"
          >
            {/* Left: Brush Cursive Title + Distilled Statement */}
            <div className="sm:col-span-7 text-left">
              <div className="mb-3 sm:mb-4">
                <img
                  src="/brand/jolly-brush-wordmark.png"
                  alt="Jolly"
                  width={492}
                  height={286}
                  className="font-brush h-[76px] sm:h-[96px] lg:h-[112px] w-auto object-contain select-none pointer-events-none -ml-2"
                  draggable={false}
                />
              </div>

              <h1 className="font-editorial text-[clamp(2.25rem,4.4vw,3.85rem)] leading-[1.06] tracking-[-0.03em] text-[#111827] [text-wrap:balance]">
                The voice clerk for advocates who live in court.
              </h1>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <DiscoverButton
                  label="Demo"
                  href={callUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </div>
            </div>

            {/* Right: Compact Lady Justice ASCII Engraving */}
            <div className="sm:col-span-5 flex justify-center sm:justify-end">
              <CourtroomAsciiArt />
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
