// Origin: BanioX/Randen apps/web/src/ui/GroupedList.tsx @ e0f0907 — adapted: tokens of the theme; a row links through the link component of the app (`href`) instead of a router
import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { KitLink } from './context';
import { toneClasses, type Tone } from './tones';

/**
 * The inset grouped list of iOS: rows share one rounded surface and are separated by hairlines
 * that start where the text starts, not by gaps between cards.
 */
export function GroupedList({
  children,
  label,
}: {
  children: ReactNode;
  /** Names the list for screen readers when no heading stands over it. */
  label?: string | undefined;
}) {
  return (
    <ul aria-label={label} className="overflow-hidden rounded-2xl bg-surface shadow-card">
      {children}
    </ul>
  );
}

/**
 * One row of a grouped list. `inset` is where the hairline above the row begins, so it lines up
 * with the text after an icon (`icon`, 40 px tile), a checkbox (`check`) or plain text (`text`).
 */
export function GroupedListItem({
  children,
  inset = 'icon',
  className = '',
}: {
  children: ReactNode;
  inset?: 'icon' | 'check' | 'text' | undefined;
  className?: string | undefined;
}) {
  const line = { icon: 'before:left-[4.25rem]', check: 'before:left-13', text: 'before:left-4' }[
    inset
  ];
  return (
    <li
      className={`relative before:absolute before:top-0 before:right-0 before:h-px before:bg-line first:before:hidden ${line} ${className}`}
    >
      {children}
    </li>
  );
}

/** Highlight on hover and tap, focus ring inside the rounded group. */
const ROW_HIT =
  'hover:bg-surface-muted active:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2';

/** Classes for a link that fills a grouped row of your own making (`ListRow` brings its own). */
export const GROUPED_ROW_LINK = `block ${ROW_HIT}`;

export interface ListRowProps {
  title: string;
  /** One line under the title. */
  subtitle?: ReactNode | undefined;
  /** A further quiet line or a row of small chips under the subtitle. */
  meta?: ReactNode | undefined;
  /** An icon in a tinted tile on the left. */
  icon?: LucideIcon | undefined;
  /** Tone of the icon tile; default: a quiet tile with the icon in the accent. */
  iconTone?: Tone | undefined;
  /** On the right: a chip, an amount. Goes under the text when the row gets too narrow. */
  trailing?: ReactNode | undefined;
  /**
   * The trailing slot holds free words, not an amount or a chip: they wrap inside the row.
   * Money and chips keep their line (the default).
   */
  trailingWords?: boolean | undefined;
  /** Makes the whole row a link (with a chevron). */
  href?: string | undefined;
  /** Makes the whole row a button (with a chevron). Ignored when `href` is set. */
  onClick?: (() => void) | undefined;
}

/**
 * The standard row of a grouped list: icon tile, title, up to two quiet lines and a trailing
 * slot. With `href` or `onClick` the whole row is the hit target and shows a chevron. Must be a
 * child of `GroupedList`.
 */
export function ListRow({
  title,
  subtitle,
  meta,
  icon: Icon,
  iconTone,
  trailing,
  trailingWords = false,
  href,
  onClick,
}: ListRowProps) {
  const leading =
    Icon === undefined ? undefined : (
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          iconTone === undefined
            ? 'bg-surface-muted text-accent-strong'
            : toneClasses[iconTone].chip
        }`}
      >
        <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
      </span>
    );
  const interactive = href !== undefined || onClick !== undefined;
  const content = (
    <>
      {leading}
      {/* The trailing slot wraps under the text before either of them would be cut off. */}
      <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="min-w-[min(14rem,100%)] flex-1">
          <span className="block font-semibold break-words hyphens-calm">{title}</span>
          {subtitle === undefined ? null : (
            <span className="block text-sm break-words text-muted">{subtitle}</span>
          )}
          {meta === undefined ? null : (
            <span className="mt-0.5 block text-sm text-muted">{meta}</span>
          )}
        </span>
        {trailing === undefined ? null : (
          <span
            className={`flex max-w-full items-center gap-2 text-right tabular-nums ${
              trailingWords ? 'min-w-0' : 'shrink-0 whitespace-nowrap'
            }`}
          >
            {trailingWords ? (
              <span className="min-w-0 break-words whitespace-normal">{trailing}</span>
            ) : (
              trailing
            )}
          </span>
        )}
      </span>
      {interactive ? (
        <ChevronRight size={18} aria-hidden="true" className="-ml-1 shrink-0 text-muted" />
      ) : null}
    </>
  );
  const layout = 'flex min-h-14 w-full items-center gap-3 py-2.5 pr-3 pl-4 text-left';
  return (
    <GroupedListItem inset={leading === undefined ? 'text' : 'icon'}>
      {href !== undefined ? (
        <KitLink href={href} className={`${ROW_HIT} ${layout}`}>
          {content}
        </KitLink>
      ) : onClick !== undefined ? (
        <button type="button" onClick={onClick} className={`${ROW_HIT} ${layout}`}>
          {content}
        </button>
      ) : (
        <div className={layout}>{content}</div>
      )}
    </GroupedListItem>
  );
}
