// Origin: BanioX/Randen apps/web/src/ui/StatTile.tsx @ e0f0907 — adapted: the calm surface of S-27 instead of a dark card of a brand; tones of the kit; texts from the catalogue of UiProvider; the link through the link component of the app (`href`)
import { ChevronRight } from 'lucide-react';
import { Children, type ReactNode } from 'react';
import { KitLink, useUiTexts } from './context';
import { toneClasses } from './tones';

/** How a figure stands. Never without words: the hint, or the word of the tone. */
export type StatTone = 'ok' | 'warn' | 'bad' | 'neutral';

export interface StatTileProps {
  /** What the figure is: «Offen», «Stunden diese Woche». */
  label: string;
  /** The figure, formatted by the page (`formatMoney`, `formatDecimal`). */
  value: string;
  /**
   * Shown small in front of the figure, for the currency: «CHF». Pass the amount without it
   * (`formatMoney(amount, currency, { currency: false })`), so a large amount still fits.
   */
  unit?: string | undefined;
  /** One quiet line under the figure: the period, the target, what changed. */
  hint?: string | undefined;
  /** How the figure stands: a small dot in front of the hint. Never without words. */
  tone?: StatTone | undefined;
  /** Makes the whole tile a link to the page behind the figure. */
  href?: string | undefined;
}

/**
 * One key figure on the calm surface (S-27): label, figure in tabular numbers, and a line that
 * says how it stands. The figure grows with the tile and breaks after its unit before it would
 * be cut off. No counter as a lure (S-26): a figure says how things stand, not what to chase.
 */
export function StatTile({ label, value, unit, hint, tone, href }: StatTileProps) {
  const texts = useUiTexts();
  // The tone is said in words: the page's own hint, or a standard word for the tone.
  const line = hint ?? (tone === undefined ? undefined : texts.tone[tone]);
  const dot = tone === undefined ? undefined : toneClasses[tone].dot;
  const lineColour =
    tone === undefined || tone === 'neutral' ? 'text-muted' : toneClasses[tone].text;
  const content = (
    <>
      <span className="flex items-start justify-between gap-2">
        {/* Two lines reserved: the figures of one row start at the same height. */}
        <span className="block min-h-[2lh] text-[0.8125rem] leading-snug font-semibold break-words text-muted hyphens-calm">
          {label}
        </span>
        {href === undefined ? null : (
          <ChevronRight size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-muted" />
        )}
      </span>
      <span className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
        {unit === undefined ? null : (
          <span className="text-[0.8125rem] font-semibold text-muted">{unit}</span>
        )}
        {/* `min-w-0`: as a flex item the figure may shrink below its width and break inside the
            tile, instead of running out of it at 390 px. */}
        <span className="max-w-full min-w-0 text-xl leading-tight font-semibold tracking-tight break-words text-fg tabular-nums @[12.5rem]:text-2xl @[14.5rem]:text-[1.75rem]">
          {value}
        </span>
      </span>
      {line === undefined ? null : (
        <span className="mt-auto flex items-baseline gap-1.5 pt-2 text-[0.8125rem]">
          {dot === undefined ? null : (
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 -translate-y-px rounded-full ${dot}`}
            />
          )}
          <span className={`min-w-0 hyphens-calm ${lineColour}`}>{line}</span>
        </span>
      )}
    </>
  );
  const frame =
    '@container flex h-full min-w-0 flex-col rounded-2xl bg-linear-to-b from-calm-start to-calm-end p-4 text-left shadow-card';
  if (href === undefined) {
    return <div className={frame}>{content}</div>;
  }
  return (
    <KitLink href={href} className={`${frame} transition hover:brightness-[0.98]`}>
      {content}
    </KitLink>
  );
}

/** Columns from tablet width for the number of tiles: two, three or four side by side. */
function columnsFor(count: number): string {
  if (count <= 1) {
    return '@2xl:grid-cols-1';
  }
  if (count === 2) {
    return '@2xl:grid-cols-2';
  }
  if (count === 3) {
    return '@2xl:grid-cols-3';
  }
  return '@2xl:grid-cols-4';
}

/**
 * The row of key figures of a page: two side by side on the phone, and from tablet width as many
 * across as there are figures (up to four). On the phone the last figure of an odd count spans
 * both columns, so no gap is left. It follows the room it gets, so it also works in a column.
 */
export function KpiGrid({ children }: { children: ReactNode }) {
  const count = Children.toArray(children).length;
  return (
    <div className="@container min-w-0">
      <div
        className={`grid grid-cols-2 gap-3 @2xl:gap-4 ${columnsFor(count)} [&>*:last-child:nth-child(odd)]:col-span-2 @2xl:[&>*:last-child:nth-child(odd)]:col-span-1`}
      >
        {children}
      </div>
    </div>
  );
}
