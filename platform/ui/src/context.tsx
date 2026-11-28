import { DEFAULT_CURRENCY, type CurrencyCode, type LocalDate } from '@onestrand/core';
import { resolveCatalogue, type Translation } from '@onestrand/i18n';
import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react';
import { uiMessages, type UiMessages } from './messages';

/** What a link of the kit hands to the link component of the app. */
export interface KitLinkProps {
  href: string;
  className?: string | undefined;
  'aria-current'?: 'page' | undefined;
  children: ReactNode;
}

/**
 * The component that renders a link: a plain `<a>` by default. The shell hands in the link of
 * its router, so a tap on a row or a back link changes the page without loading it again.
 */
export type LinkComponent = ComponentType<KitLinkProps>;

function PlainLink({ href, className, children, ...rest }: KitLinkProps) {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}

/** What the kit takes from the app around it, never from the device itself. */
interface UiSettings {
  texts: UiMessages;
  today: LocalDate | undefined;
  currency: CurrencyCode;
  link: LinkComponent;
}

const UiContext = createContext<UiSettings>({
  texts: uiMessages,
  today: undefined,
  currency: DEFAULT_CURRENCY,
  link: PlainLink,
});

export interface UiProviderProps {
  /** The texts of the kit in the language of the person; a missing key falls back to de-CH. */
  translation?: Translation<UiMessages> | undefined;
  /** Today in Europe/Zurich, from the clock of the app. The date field counts from it. */
  today?: LocalDate | undefined;
  /** The currency of the business. Default CHF. */
  currency?: CurrencyCode | undefined;
  /** The link of the router of the app. Default a plain `<a>`. */
  link?: LinkComponent | undefined;
  children: ReactNode;
}

/**
 * Hands the kit what it must not find out by itself: the language, today, the currency and the
 * link of the router. Mounted once, by the shell. Without it the kit speaks de-CH, counts in CHF,
 * links with a plain `<a>` and has no today (a date field then refuses to render).
 */
export function UiProvider({ translation, today, currency, link, children }: UiProviderProps) {
  const texts = useMemo(() => resolveCatalogue(uiMessages, translation), [translation]);
  const value = useMemo(
    () => ({
      texts,
      today,
      currency: currency ?? DEFAULT_CURRENCY,
      link: link ?? PlainLink,
    }),
    [texts, today, currency, link],
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

/** The texts of the kit in the language `UiProvider` was given. */
export function useUiTexts(): UiMessages {
  return useContext(UiContext).texts;
}

/** The currency of the business. */
export function useCurrency(): CurrencyCode {
  return useContext(UiContext).currency;
}

/** Today, from `UiProvider`. Throws when there is none: the kit never reads the clock itself. */
export function useToday(): LocalDate {
  const { today } = useContext(UiContext);
  if (today === undefined) {
    throw new Error('A date field needs today: wrap the page in <UiProvider today={…}>.');
  }
  return today;
}

/** A link through the link component of the app. */
export function KitLink(props: KitLinkProps) {
  const { link: Link } = useContext(UiContext);
  return <Link {...props} />;
}
