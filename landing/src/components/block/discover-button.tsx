import React, { type MouseEventHandler } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DiscoverButtonProps {
  label?: string;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function DiscoverButton({
  label = 'Demo',
  href,
  target,
  rel,
  onClick,
  className,
}: DiscoverButtonProps) {
  const buttonFace = (
    <>
      <span className="obsidian-discover-button__fill" aria-hidden="true" />
      <span className="obsidian-discover-button__icon" aria-hidden="true">
        <ArrowRight size={25} strokeWidth={2.25} />
      </span>
      <span className="obsidian-discover-button__text">{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        className={cn('obsidian-discover-button', className)}
        href={href}
        target={target}
        rel={rel}
      >
        {buttonFace}
      </a>
    );
  }

  return (
    <button
      className={cn('obsidian-discover-button', className)}
      type="button"
      onClick={onClick}
    >
      {buttonFace}
    </button>
  );
}

export default DiscoverButton;
