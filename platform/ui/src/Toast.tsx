// Origin: BanioX/Randen apps/web/src/ui/Toast.tsx @ e0f0907 — adapted: tokens of the theme (the toast is the text colour with the page as its text); tone bad instead of danger; a queue instead of replacing, and an outlet inside an open sheet (top layer)
import { Check, TriangleAlert } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface ToastOptions {
  /** One calm line: what just happened. */
  text: string;
  /** One way back or forward, e.g. `{ label: 'Rückgängig', onAction }`. */
  action?: { label: string; onAction: () => void } | undefined;
  /** `ok` adds a check, `bad` a warning sign; the words carry the meaning. */
  tone?: 'neutral' | 'ok' | 'bad' | undefined;
}

export type ShowToast = (options: ToastOptions) => void;

/** How long a toast stays when nothing waits behind it, in milliseconds. */
export const TOAST_MS = 5000;

/**
 * How long a toast stays at least when another one waits behind it. A toast of the tone `bad`
 * always stays its full `TOAST_MS`.
 */
export const TOAST_MIN_MS = 2000;

// Without a provider (a page rendered on its own in a test) a toast is simply not shown.
const ToastContext = createContext<ShowToast>(() => undefined);

/**
 * Returns `toast({ text, action?, tone? })`. Toasts wait in line and none is lost: one is shown
 * at a time, for five seconds; when another waits, it leaves after two (a toast about something
 * wrong, `bad`, always stays its five). It waits while the pointer or the focus is on it.
 */
export function useToast(): ShowToast {
  return useContext(ToastContext);
}

interface Shown extends ToastOptions {
  id: number;
}

/** What the outlets read: the toast on screen and which outlet shows it. */
interface ToastView {
  shown: Shown | undefined;
  /** The outlet that shows the toast: the innermost open sheet, else the page (`page`). */
  active: string;
  hold: (held: boolean) => void;
  act: () => void;
  addHost: (host: string) => () => void;
}

const ToastViewContext = createContext<ToastView | null>(null);

/** The outlet of the page, under every sheet. */
const PAGE = 'page';

/** The line of toasts: the first is on screen. */
interface QueueState {
  queue: readonly Shown[];
  /** The pointer or the focus rests on the toast on screen. */
  held: boolean;
  /** The id of the toast that has been on screen for its least time. */
  served: number | undefined;
}

const EMPTY: QueueState = { queue: [], held: false, served: undefined };

/** The toast on screen leaves, if it is still the one with this id. */
function leave(state: QueueState, id: number): QueueState {
  return state.queue[0]?.id === id ? { ...state, queue: state.queue.slice(1), held: false } : state;
}

/**
 * The toast on screen makes room for the next one in line once it has had its least time,
 * unless it is held or says that something is wrong (`bad`: always its full time).
 */
function advance(state: QueueState): QueueState {
  const [first] = state.queue;
  const makesRoom =
    first !== undefined &&
    state.served === first.id &&
    state.queue.length > 1 &&
    first.tone !== 'bad' &&
    !state.held;
  return makesRoom ? leave(state, first.id) : state;
}

/**
 * Shows the toasts of everything below it: one line above the tab bar on the phone, bottom right
 * from desktop width. Mounted once, in the shell. While a sheet is open, the toast shows inside
 * it: the page behind a modal dialog is inert, so a toast there would be neither seen above the
 * sheet nor read out.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QueueState>(EMPTY);
  const [hosts, setHosts] = useState<readonly string[]>([]);
  const nextId = useRef(1);

  const toast = useCallback<ShowToast>((options) => {
    const id = nextId.current;
    nextId.current += 1;
    setState((current) => advance({ ...current, queue: [...current.queue, { ...options, id }] }));
  }, []);

  const shown = state.queue[0];
  const id = shown?.id;

  // The full time, from when the toast appears or the pointer leaves it.
  useEffect(() => {
    if (id === undefined || state.held) {
      return;
    }
    const timer = window.setTimeout(() => {
      setState((current) => leave(current, id));
    }, TOAST_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [id, state.held]);

  // The least time: after it, the toast leaves as soon as another one waits.
  useEffect(() => {
    if (id === undefined) {
      return;
    }
    const timer = window.setTimeout(() => {
      setState((current) => advance({ ...current, served: id }));
    }, TOAST_MIN_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [id]);

  // Stable, so a sheet registers once while it is open and not again with every new toast.
  const addHost = useCallback((host: string) => {
    setHosts((current) => [...current, host]);
    return () => {
      setHosts((current) => current.filter((other) => other !== host));
    };
  }, []);

  const view = useMemo<ToastView>(
    () => ({
      shown,
      active: hosts.at(-1) ?? PAGE,
      hold: (held) => {
        setState((current) => advance({ ...current, held }));
      },
      act: () => {
        if (shown === undefined) {
          return;
        }
        // Leave first: the action may show a toast of its own («zurückgenommen»).
        setState((current) => leave(current, shown.id));
        shown.action?.onAction();
      },
      addHost,
    }),
    [shown, hosts, addHost],
  );

  return (
    <ToastContext.Provider value={toast}>
      <ToastViewContext.Provider value={view}>
        {children}
        <ToastOutlet host={PAGE} />
      </ToastViewContext.Provider>
    </ToastContext.Provider>
  );
}

/**
 * Makes the caller an outlet for toasts while `open`: a modal sheet calls it and renders
 * `<ToastOutlet host={…} />` inside its dialog. Returns the name of the outlet; without a
 * `ToastProvider` it does nothing.
 */
export function useToastHost(open: boolean): string {
  const host = useId();
  const view = useContext(ToastViewContext);
  const addHost = view?.addHost;
  useEffect(
    () => (open && addHost !== undefined ? addHost(host) : undefined),
    [open, addHost, host],
  );
  return host;
}

const PLACES = {
  // Above the tab bar on the phone, bottom right from desktop width.
  page: 'inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] justify-center md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-8 lg:bottom-8 lg:justify-end',
  // At the top over a sheet, which takes the bottom of the screen.
  sheet: 'inset-x-4 top-[max(1rem,env(safe-area-inset-top))] justify-center',
} as const;

/**
 * Where a toast appears: a polite live region that is always there, so a screen reader reads
 * what appears in it. The provider has the one of the page; an open sheet has its own.
 */
export function ToastOutlet({ host }: { host: string }) {
  const view = useContext(ToastViewContext);
  if (view === null) {
    return null;
  }
  const { shown, active, hold, act } = view;
  const visible = shown !== undefined && active === host ? shown : undefined;
  const Icon = visible?.tone === 'ok' ? Check : visible?.tone === 'bad' ? TriangleAlert : null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed z-30 flex print:hidden ${host === PAGE ? PLACES.page : PLACES.sheet}`}
    >
      {visible === undefined ? null : (
        <div
          key={visible.id}
          onMouseEnter={() => {
            hold(true);
          }}
          onMouseLeave={() => {
            hold(false);
          }}
          onFocus={() => {
            hold(true);
          }}
          onBlur={() => {
            hold(false);
          }}
          className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-fg py-1.5 pr-1.5 pl-4 text-[0.9375rem] text-app shadow-float lg:w-auto lg:min-w-72"
        >
          {Icon === null ? null : <Icon size={20} aria-hidden="true" className="shrink-0" />}
          <p className="min-w-0 flex-1 py-2 break-words">{visible.text}</p>
          {visible.action === undefined ? (
            <span className="w-2.5" />
          ) : (
            <button
              type="button"
              onClick={act}
              className="min-h-11 shrink-0 rounded-xl bg-app/15 px-3.5 font-semibold text-app hover:bg-app/25 focus-visible:outline-app"
            >
              {visible.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
