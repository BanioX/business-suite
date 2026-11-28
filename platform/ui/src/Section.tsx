// Origin: BanioX/Randen apps/web/src/ui/Section.tsx @ e0f0907 — adapted: tokens of the theme; the action links through the link component of the app (`href`)
import { useId, type ReactNode } from 'react';
import { KitLink } from './context';

export type SectionAction =
  | { label: string; href: string; onClick?: undefined }
  | { label: string; onClick: () => void; href?: undefined };

export interface SectionProps {
  title: string;
  /**
   * `group` is the small caps line over a grouped list, as in the iOS settings; `title` is a
   * normal 20 px heading over cards and figures.
   */
  titleStyle?: 'group' | 'title' | undefined;
  /** A link or a button on the right of the title: «Alle anzeigen». */
  action?: SectionAction | undefined;
  /** One quiet line under the title. */
  hint?: string | undefined;
  /** Heading level; `3` inside another section. */
  level?: 2 | 3 | undefined;
  children: ReactNode;
  className?: string | undefined;
}

const ACTION =
  '-my-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-1 text-[0.9375rem] font-semibold text-accent-strong';

/** A titled block of a page. The heading names the region for screen readers. */
export function Section({
  title,
  titleStyle = 'title',
  action,
  hint,
  level = 2,
  children,
  className = '',
}: SectionProps) {
  const headingId = useId();
  const Heading = level === 2 ? 'h2' : 'h3';
  const group = titleStyle === 'group';
  return (
    <section aria-labelledby={headingId} className={`min-w-0 ${className}`}>
      <div
        className={`mb-2 flex min-h-7 items-center justify-between gap-3 ${group ? 'px-4' : ''}`}
      >
        <div className="min-w-0">
          <Heading
            id={headingId}
            className={
              group
                ? 'text-[0.8125rem] font-semibold tracking-wide text-muted uppercase'
                : 'text-xl font-semibold'
            }
          >
            {title}
          </Heading>
          {hint === undefined ? null : (
            <p className={`text-muted ${group ? 'text-[0.8125rem]' : 'mt-0.5 text-sm'}`}>{hint}</p>
          )}
        </div>
        {action === undefined ? null : action.href === undefined ? (
          <button type="button" onClick={action.onClick} className={ACTION}>
            {action.label}
          </button>
        ) : (
          <KitLink href={action.href} className={ACTION}>
            {action.label}
          </KitLink>
        )}
      </div>
      {children}
    </section>
  );
}
