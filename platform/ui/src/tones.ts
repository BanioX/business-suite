// Origin: BanioX/Randen apps/web/src/ui/tones.ts @ e0f0907 — adapted: five neutral tones on the tokens of the theme instead of the tones of a brand and of storage areas
/**
 * The tones of the kit (decision S-27). One meaning per colour, and colour never carries a
 * meaning alone: whatever wears a tone also says it in words or with a symbol.
 *
 * `ok` in order · `warn` soon, watch · `bad` wrong, missing, expired · `accent` marked or
 * chosen, never good or bad · `neutral` everything else.
 */
export type Tone = 'ok' | 'warn' | 'bad' | 'accent' | 'neutral';

export interface ToneClasses {
  /** Tinted background with its text: chips, icon tiles. */
  chip: string;
  /** Background of a small dot beside text. */
  dot: string;
  /** The tone as text on a card or on the page. */
  text: string;
}

/* Every pair below is in CONTRAST_PAIRS (theme.ts) and proven for each theme by `pnpm contrast`. */
export const toneClasses: Readonly<Record<Tone, ToneClasses>> = {
  ok: { chip: 'bg-ok-soft text-ok', dot: 'bg-ok', text: 'text-ok' },
  warn: { chip: 'bg-warn-soft text-warn', dot: 'bg-warn', text: 'text-warn' },
  // What is wrong: a fine edge as well, so it never reads as a mere tint.
  bad: { chip: 'border border-bad/40 bg-bad-soft text-bad', dot: 'bg-bad', text: 'text-bad' },
  accent: {
    chip: 'bg-accent-soft text-accent-strong',
    dot: 'bg-accent-edge',
    text: 'text-accent-strong',
  },
  neutral: { chip: 'bg-surface-muted text-muted', dot: 'bg-line-strong', text: 'text-muted' },
};
