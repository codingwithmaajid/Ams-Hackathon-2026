import React from 'react';

interface EditorialBackdropProps {
  variant?: 'morning-canopy' | 'archival-paper' | 'verandah-dawn';
  className?: string;
  children: React.ReactNode;
}

/**
 * Renders a calm, Granola-inspired organic nature / archival paper backdrop
 * using layered warm light gradients, botanical leaf shadow silhouettes, and tactile SVG grain.
 */
export const EditorialBackdrop: React.FC<EditorialBackdropProps> = ({
  variant = 'morning-canopy',
  className = '',
  children,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-[#111827]/10 ${
        variant === 'morning-canopy'
          ? 'bg-gradient-to-br from-[#E6E2D6] via-[#DCD6C6] to-[#C9C2B0]'
          : variant === 'archival-paper'
          ? 'bg-gradient-to-br from-[#EFECE4] via-[#E5DFD1] to-[#D8D0BE]'
          : 'bg-gradient-to-br from-[#232B28] via-[#1C242B] to-[#111827]'
      } ${className}`}
    >
      {/* Subtle dappled sunlight and organic botanical canopy SVG layer */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
        viewBox="0 0 1200 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`sunGlow-${variant}`} cx="78%" cy="22%" r="65%">
            <stop
              offset="0%"
              stopColor={variant === 'verandah-dawn' ? '#B4833E' : '#FFFDF9'}
              stopOpacity={variant === 'verandah-dawn' ? '0.32' : '0.75'}
            />
            <stop
              offset="55%"
              stopColor={variant === 'verandah-dawn' ? '#4A5D52' : '#D5CBB8'}
              stopOpacity="0.22"
            />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`mossGlow-${variant}`} cx="18%" cy="82%" r="60%">
            <stop
              offset="0%"
              stopColor={variant === 'verandah-dawn' ? '#33463D' : '#8A947E'}
              stopOpacity={variant === 'verandah-dawn' ? '0.45' : '0.28'}
            />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <filter id={`dappledBlur-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="38" />
          </filter>
        </defs>

        {/* Warm morning light pools */}
        <rect width="1200" height="800" fill={`url(#sunGlow-${variant})`} />
        <rect width="1200" height="800" fill={`url(#mossGlow-${variant})`} />

        {/* Soft out-of-focus banyan / neem canopy shadow shapes */}
        <g filter={`url(#dappledBlur-${variant})`}>
          <ellipse
            cx="210"
            cy="140"
            rx="240"
            ry="110"
            transform="rotate(-14 210 140)"
            fill={variant === 'verandah-dawn' ? '#0D131A' : '#6F7863'}
            fillOpacity={variant === 'verandah-dawn' ? '0.45' : '0.18'}
          />
          <ellipse
            cx="980"
            cy="640"
            rx="290"
            ry="140"
            transform="rotate(18 980 640)"
            fill={variant === 'verandah-dawn' ? '#0D131A' : '#7A725E'}
            fillOpacity={variant === 'verandah-dawn' ? '0.5' : '0.16'}
          />
          <ellipse
            cx="860"
            cy="120"
            rx="180"
            ry="95"
            transform="rotate(28 860 120)"
            fill={variant === 'verandah-dawn' ? '#B4833E' : '#B4833E'}
            fillOpacity={variant === 'verandah-dawn' ? '0.18' : '0.12'}
          />
          <path
            d="M-60 520 C180 430, 410 610, 680 490 C920 390, 1080 550, 1280 460 L1280 840 L-60 840 Z"
            fill={variant === 'verandah-dawn' ? '#0B1017' : '#968E7B'}
            fillOpacity={variant === 'verandah-dawn' ? '0.4' : '0.14'}
          />
        </g>

        {/* Subtle architectural verandah light lines */}
        <g
          stroke={variant === 'verandah-dawn' ? '#FBF9F4' : '#111827'}
          strokeOpacity={variant === 'verandah-dawn' ? '0.07' : '0.04'}
          strokeWidth="1"
        >
          <line x1="0" y1="160" x2="1200" y2="160" />
          <line x1="0" y1="640" x2="1200" y2="640" />
          <line x1="240" y1="0" x2="240" y2="800" />
          <line x1="960" y1="0" x2="960" y2="800" />
        </g>
      </svg>

      {/* Fine archival paper grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#111827 0.75px, transparent 0.75px)`,
          backgroundSize: '12px 12px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
};
