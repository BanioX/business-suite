// Origin: BanioX/Randen apps/web/src/ui/Card.tsx @ e0f0907 — adapted: tokens of the theme; variant hint instead of tip, calm (the quiet gradient of S-27) instead of the dark card of a brand
import type { ReactNode } from 'react';

export type CardVariant = 'default' | 'hint' | 'calm';

// Variants instead of className overrides: two utilities for the same property do not reliably
// override each other by their order in the class attribute.
const variantClasses: Readonly<Record<CardVariant, string>> = {
  default: 'bg-surface shadow-card',
  /** A hint in the soft tint of the accent. */
  hint: 'bg-accent-soft text-fg',
  /** The quiet surface of key figures: a gradient from `calm-start` to `calm-end`. */
  calm: 'bg-linear-to-b from-calm-start to-calm-end shadow-card',
};

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant | undefined;
  /** `compact` for a card that holds one line. */
  padding?: 'normal' | 'compact' | undefined;
  className?: string | undefined;
}

/** A surface for things that belong together. */
export function Card({
  children,
  variant = 'default',
  padding = 'normal',
  className = '',
}: CardProps) {
  const inner = padding === 'compact' ? 'px-4 py-3' : 'p-5';
  return (
    <div className={`min-w-0 rounded-2xl ${inner} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
