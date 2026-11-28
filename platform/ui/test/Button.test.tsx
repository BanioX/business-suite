// Origin: BanioX/Randen apps/web/src/ui/Button.test.tsx @ e0f0907 — adapted: tokens of the theme; tests of the variants, the link, the icon button and the keyboard added
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus, Settings } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  ButtonLink,
  buttonClasses,
  IconButton,
  UiProvider,
  type KitLinkProps,
} from '../src/index';

describe('Button while busy', () => {
  it('keeps keyboard focus after a click and does not call its handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button busy onClick={onClick}>
        Sichern
      </Button>,
    );
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Sichern' });
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('keeps its place in the tab order', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button busy>Sichern</Button>
        <Button variant="secondary">Abbrechen</Button>
      </>,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Sichern' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abbrechen' }));
  });

  it('does not submit the form it sits in', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" busy>
          Sichern
        </Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls its handler again once it is no longer busy', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <Button busy onClick={onClick}>
        Sichern
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onClick).not.toHaveBeenCalled();
    rerender(<Button onClick={onClick}>Sichern</Button>);
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('drops the hover and press feedback while busy and keeps its colour', () => {
    const { rerender } = render(<Button>Sichern</Button>);
    expect(screen.getByRole('button', { name: 'Sichern' }).className).toContain(
      'hover:brightness-95',
    );
    rerender(<Button busy>Sichern</Button>);
    const busy = screen.getByRole('button', { name: 'Sichern' }).className;
    expect(busy).toContain('bg-accent');
    expect(busy).not.toContain('hover:');
    expect(busy).not.toContain('active:');
  });

  it('a real disabled button is still disabled and skipped by the tab order', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button disabled>Sichern</Button>
        <Button variant="secondary">Abbrechen</Button>
      </>,
    );
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Sichern' }).disabled).toBe(true);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abbrechen' }));
  });
});

describe('Button', () => {
  it('renders its label as its name and reacts to a press and to the keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Sichern</Button>);
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Sichern' });
    expect(button.type).toBe('button');
    await user.click(button);
    expect(document.activeElement).toBe(button);
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('draws each variant with the tokens of the theme', () => {
    expect(buttonClasses({ variant: 'primary' })).toContain('bg-accent text-on-accent');
    expect(buttonClasses({ variant: 'secondary' })).toContain('bg-surface text-fg');
    expect(buttonClasses({ variant: 'quiet' })).toContain('text-accent-strong');
    expect(buttonClasses({ variant: 'danger' })).toContain('text-bad');
    expect(buttonClasses({ size: 'md' })).toContain('min-h-12');
    expect(buttonClasses({ size: 'sm' })).toContain('min-h-11');
    expect(buttonClasses({ fullWidth: true })).toContain('w-full');
  });

  it('shows its icon beside the label, hidden from screen readers', () => {
    render(<Button icon={Plus}>Erfassen</Button>);
    const button = screen.getByRole('button', { name: 'Erfassen' });
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('ButtonLink', () => {
  it('is a link with the look of a button, through the link of the app', () => {
    function RouterLink({ href, className, children }: KitLinkProps) {
      return (
        <a href={`#${href}`} className={className} data-router="">
          {children}
        </a>
      );
    }
    render(
      <UiProvider link={RouterLink}>
        <ButtonLink href="/kundschaft" variant="secondary">
          Kundschaft
        </ButtonLink>
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: 'Kundschaft' });
    expect(link.getAttribute('href')).toBe('#/kundschaft');
    expect(link.hasAttribute('data-router')).toBe(true);
    expect(link.className).toContain('bg-surface');
  });

  it('is a plain link without a provider', () => {
    render(<ButtonLink href="/heute">Heute</ButtonLink>);
    expect(screen.getByRole('link', { name: 'Heute' }).getAttribute('href')).toBe('/heute');
  });
});

describe('IconButton', () => {
  it('is named by its label, 44 px, and reacts to a press', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon={Settings} label="Einstellungen" onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Einstellungen' });
    expect(button.className).toContain('size-11');
    expect(button.getAttribute('title')).toBe('Einstellungen');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does nothing while disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon={Settings} label="Einstellungen" onClick={onClick} disabled />);
    await user.click(screen.getByRole('button', { name: 'Einstellungen' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
