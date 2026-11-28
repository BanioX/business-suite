// Origin: BanioX/Randen apps/web/src/ui/Toast.test.tsx @ e0f0907 — adapted: neutral words; tone bad instead of danger; a test of the tone ok and of the focus added
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOAST_MS, ToastProvider, useToast, type ToastOptions } from '../src/index';

function Trigger({ label, options }: { label: string; options: ToastOptions }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        toast(options);
      }}
    >
      {label}
    </button>
  );
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Toast', () => {
  it('appears in a polite live region that is there from the start', () => {
    render(
      <ToastProvider>
        <Trigger label="Sichern" options={{ text: 'Rapport gesichert.' }} />
      </ToastProvider>,
    );
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toBe('');

    click('Sichern');
    expect(region.textContent).toBe('Rapport gesichert.');
  });

  it('disappears after five seconds', () => {
    render(
      <ToastProvider>
        <Trigger label="Sichern" options={{ text: 'Rapport gesichert.' }} />
      </ToastProvider>,
    );
    click('Sichern');
    advance(TOAST_MS - 1);
    expect(screen.getByText('Rapport gesichert.')).toBeTruthy();
    advance(1);
    expect(screen.queryByText('Rapport gesichert.')).toBeNull();
    expect(TOAST_MS).toBe(5000);
  });

  it('offers «Rückgängig», runs the action and leaves', () => {
    const onAction = vi.fn();
    render(
      <ToastProvider>
        <Trigger
          label="Löschen"
          options={{ text: 'Einsatz gelöscht.', action: { label: 'Rückgängig', onAction } }}
        />
      </ToastProvider>,
    );
    click('Löschen');
    click('Rückgängig');
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Einsatz gelöscht.')).toBeNull();
  });

  it('shows the toast an action raises itself', () => {
    function Undoable() {
      const toast = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            toast({
              text: 'Einsatz gelöscht.',
              action: {
                label: 'Rückgängig',
                onAction: () => {
                  toast({ text: 'Löschen zurückgenommen.' });
                },
              },
            });
          }}
        >
          Löschen
        </button>
      );
    }
    render(
      <ToastProvider>
        <Undoable />
      </ToastProvider>,
    );
    click('Löschen');
    click('Rückgängig');
    expect(screen.getByRole('status').textContent).toBe('Löschen zurückgenommen.');
    advance(TOAST_MS);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('is replaced by the next toast, which gets its own five seconds', () => {
    render(
      <ToastProvider>
        <Trigger label="Erste" options={{ text: 'Kundschaft gesichert.' }} />
        <Trigger label="Zweite" options={{ text: 'Offerte gesichert.' }} />
      </ToastProvider>,
    );
    click('Erste');
    advance(4000);
    click('Zweite');
    expect(screen.queryByText('Kundschaft gesichert.')).toBeNull();
    expect(screen.getByText('Offerte gesichert.')).toBeTruthy();
    // The timer of the first toast must not take the second one away.
    advance(4000);
    expect(screen.getByText('Offerte gesichert.')).toBeTruthy();
    advance(1000);
    expect(screen.queryByText('Offerte gesichert.')).toBeNull();
  });

  it('shows the same text again when it is raised twice', () => {
    render(
      <ToastProvider>
        <Trigger label="Sichern" options={{ text: 'Gesichert.' }} />
      </ToastProvider>,
    );
    click('Sichern');
    advance(TOAST_MS);
    click('Sichern');
    expect(screen.getByText('Gesichert.')).toBeTruthy();
  });

  it('waits while the pointer rests on it', () => {
    render(
      <ToastProvider>
        <Trigger label="Sichern" options={{ text: 'Rapport gesichert.' }} />
      </ToastProvider>,
    );
    click('Sichern');
    const toast = screen.getByText('Rapport gesichert.').parentElement;
    expect(toast).not.toBeNull();
    if (toast === null) {
      return;
    }
    fireEvent.mouseEnter(toast);
    advance(TOAST_MS * 2);
    expect(screen.getByText('Rapport gesichert.')).toBeTruthy();
    fireEvent.mouseLeave(toast);
    advance(TOAST_MS);
    expect(screen.queryByText('Rapport gesichert.')).toBeNull();
  });

  it('adds an icon for a tone, never colour alone', () => {
    render(
      <ToastProvider>
        <Trigger label="Plain" options={{ text: 'Ohne Ton.' }} />
        <Trigger label="Fehler" options={{ text: 'Das hat nicht geklappt.', tone: 'bad' }} />
      </ToastProvider>,
    );
    click('Plain');
    expect(screen.getByRole('status').querySelector('svg')).toBeNull();
    click('Fehler');
    expect(screen.getByRole('status').querySelector('svg')).not.toBeNull();
  });

  it('does nothing without a provider, so a page can be rendered on its own', () => {
    render(<Trigger label="Sichern" options={{ text: 'Rapport gesichert.' }} />);
    click('Sichern');
    expect(screen.queryByText('Rapport gesichert.')).toBeNull();
  });
  it('adds a check for «ok» and waits while the focus is on it', () => {
    render(
      <ToastProvider>
        <Trigger
          label="Sichern"
          options={{
            text: 'Gesichert.',
            tone: 'ok',
            action: { label: 'Rückgängig', onAction: vi.fn() },
          }}
        />
      </ToastProvider>,
    );
    click('Sichern');
    expect(screen.getByRole('status').querySelector('svg')).not.toBeNull();
    const toast = screen.getByText('Gesichert.').parentElement;
    if (toast === null) {
      throw new Error('no toast');
    }
    fireEvent.focus(toast);
    advance(TOAST_MS * 2);
    expect(screen.getByText('Gesichert.')).toBeTruthy();
    fireEvent.blur(toast);
    advance(TOAST_MS);
    expect(screen.queryByText('Gesichert.')).toBeNull();
  });
});
