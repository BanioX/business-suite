// Origin: BanioX/Randen apps/web/src/ui/PageHeader.tsx @ e0f0907 — adapted: the back link through the link component of the app; a corner at the top right for the settings (S-26)
// Origin: BanioX/Randen apps/web/src/ui/BackLink.tsx @ e0f0907 — adapted: tokens of the theme; a link through the link component of the app
import { ChevronLeft } from 'lucide-react';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { KitLink } from './context';

/** Back to the page this one was opened from, named as on iOS: chevron and that page's title. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <KitLink
      href={href}
      className="-ml-1.5 inline-flex min-h-11 items-center gap-0.5 rounded-lg pr-2 font-semibold text-accent-strong"
    >
      <ChevronLeft size={24} aria-hidden="true" className="shrink-0" />
      {label}
    </KitLink>
  );
}

/** How many actions the header holds; a fragment of buttons counts its buttons. */
function countActions(actions: ReactNode): number {
  const items = Children.toArray(actions);
  const only = items[0];
  if (
    items.length === 1 &&
    isValidElement<{ children?: ReactNode }>(only) &&
    only.type === Fragment
  ) {
    return countActions(only.props.children);
  }
  return items.length;
}

export interface PageHeaderProps {
  title: string;
  /** One quiet line under the title: what the page is for, or where its numbers stand. */
  subtitle?: ReactNode | undefined;
  /** The page this one was opened from: «‹ Kundschaft». */
  back?: { href: string; label: string } | undefined;
  /** Buttons of the page: beside the title from tablet width, under it on the phone. */
  actions?: ReactNode | undefined;
  /**
   * The top right corner, on the line of the back link: the cogwheel of the settings (S-26), an
   * `IconButton`.
   */
  corner?: ReactNode | undefined;
  /** `2` only where a page shows a second header. */
  level?: 1 | 2 | undefined;
}

/**
 * The top of every page: where you came from, the large title, and what you can do here. No
 * brand bar above it; the title leads.
 */
export function PageHeader({ title, subtitle, back, actions, corner, level = 1 }: PageHeaderProps) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <header className="mb-6">
      {back === undefined && corner === undefined ? null : (
        <div className="flex min-h-11 items-center justify-between gap-3">
          {back === undefined ? <span /> : <BackLink href={back.href} label={back.label} />}
          {corner === undefined ? null : <div className="-mr-2 flex shrink-0 gap-1">{corner}</div>}
        </div>
      )}
      <div className="md:flex md:items-end md:justify-between md:gap-6">
        <div className="min-w-0">
          <Heading className="large-title hyphens-calm break-words">{title}</Heading>
          {subtitle === undefined ? null : <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {actions === undefined ? null : (
          <div
            className={
              countActions(actions) >= 2
                ? // Two or more: equal-width cells on the phone, as on the tablet they sit in a row.
                  'mt-4 grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2 md:mt-0 md:flex md:shrink-0 md:flex-wrap md:justify-end [&>*]:w-full md:[&>*]:w-auto'
                : 'mt-4 flex flex-wrap gap-2 md:mt-0 md:shrink-0 md:justify-end'
            }
          >
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
