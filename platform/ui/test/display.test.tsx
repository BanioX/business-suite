import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings, Users } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import {
  BackLink,
  Card,
  EmptyState,
  GROUPED_ROW_LINK,
  GroupedList,
  GroupedListItem,
  IconButton,
  KpiGrid,
  ListRow,
  Notice,
  PageHeader,
  Section,
  StatTile,
  StatusChip,
  toneClasses,
  uiMessages,
  UiProvider,
  type KitLinkProps,
  type Tone,
} from '../src/index';

/** A link of a router, as the shell hands one in: it marks its links. */
function RouterLink({ href, className, children }: KitLinkProps) {
  return (
    <a href={`#${href}`} className={className} data-router="">
      {children}
    </a>
  );
}

describe('GroupedList and ListRow', () => {
  it('names the list and shows title, lines and the trailing slot of a row', () => {
    render(
      <GroupedList label="Einsätze">
        <ListRow
          title="Treppenhaus Ost"
          subtitle="Dienstag, 08:00"
          meta="2 Personen"
          trailing="CHF 180.00"
        />
      </GroupedList>,
    );
    const list = screen.getByRole('list', { name: 'Einsätze' });
    const row = within(list).getByRole('listitem');
    expect(row.textContent).toContain('Treppenhaus Ost');
    expect(row.textContent).toContain('Dienstag, 08:00');
    expect(row.textContent).toContain('2 Personen');
    expect(row.textContent).toContain('CHF 180.00');
    // Not interactive: no chevron, no link, no button.
    expect(within(row).queryByRole('link')).toBeNull();
    expect(within(row).queryByRole('button')).toBeNull();
    expect(row.querySelector('svg')).toBeNull();
  });

  it('makes the whole row a link through the link of the app, with a chevron', () => {
    render(
      <UiProvider link={RouterLink}>
        <GroupedList>
          <ListRow title="Kundschaft" icon={Users} href="/kundschaft" />
        </GroupedList>
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: 'Kundschaft' });
    expect(link.getAttribute('href')).toBe('#/kundschaft');
    expect(link.hasAttribute('data-router')).toBe(true);
    expect(link.className).toContain('min-h-14');
    expect(link.querySelectorAll('svg')).toHaveLength(2);
  });

  it('makes the whole row a button, reachable with the keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GroupedList>
        <ListRow title="Sichern" onClick={onClick} trailing="vor 2 Tagen" trailingWords />
      </GroupedList>,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Sichern/ }));
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('tints the icon tile with a tone, and lines the hairline up with the text', () => {
    render(
      <GroupedList>
        <ListRow title="Offen" icon={Users} iconTone="warn" />
        <GroupedListItem inset="check">
          <a href="/x" className={GROUPED_ROW_LINK}>
            Eigene Zeile
          </a>
        </GroupedListItem>
      </GroupedList>,
    );
    const [first, second] = screen.getAllByRole('listitem');
    expect(first?.querySelector('span')?.className).toContain(toneClasses.warn.chip);
    expect(first?.className).toContain('before:left-[4.25rem]');
    expect(second?.className).toContain('before:left-13');
  });
});

describe('StatusChip', () => {
  it.each<[Tone, string]>([
    ['ok', 'text-ok'],
    ['warn', 'text-warn'],
    ['bad', 'text-bad'],
    ['accent', 'text-accent-strong'],
    ['neutral', 'text-muted'],
  ])('carries its words in the tone %s', (tone, text) => {
    render(<StatusChip tone={tone}>Bezahlt</StatusChip>);
    const chip = screen.getByText('Bezahlt').parentElement;
    expect(chip?.className).toContain(text);
  });

  it('shows an icon as decoration, small or as an outline', () => {
    render(
      <>
        <StatusChip tone="ok" icon={Users} size="sm">
          Zwei
        </StatusChip>
        <StatusChip tone="bad" outline>
          Fehlt
        </StatusChip>
      </>,
    );
    const small = screen.getByText('Zwei').parentElement;
    expect(small?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(small?.className).toContain('text-xs');
    expect(screen.getByText('Fehlt').parentElement?.className).toContain('border-line-strong');
  });
});

describe('Card, Notice and EmptyState', () => {
  it('draws a card in each variant with the tokens of the theme', () => {
    render(
      <>
        <Card>Standard</Card>
        <Card variant="hint" padding="compact">
          Hinweis
        </Card>
        <Card variant="calm">Ruhig</Card>
      </>,
    );
    expect(screen.getByText('Standard').className).toContain('bg-surface');
    expect(screen.getByText('Hinweis').className).toContain('bg-accent-soft');
    expect(screen.getByText('Hinweis').className).toContain('px-4');
    expect(screen.getByText('Ruhig').className).toContain('from-calm-start');
  });

  it('announces a notice about what is wrong at once, the others politely', () => {
    render(
      <>
        <Notice tone="bad" title="Sicherung fehlt">
          Sichere die Daten auf ein zweites Gerät.
        </Notice>
        <Notice tone="ok" variant="row" title="Gesichert" />
        <Notice title="Hinweis" icon={Settings} action={<button type="button">Öffnen</button>} />
      </>,
    );
    expect(screen.getByRole('alert').textContent).toContain('Sicherung fehlt');
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Öffnen' })).toBeTruthy();
  });

  it('shows an empty list with the way forward', () => {
    render(
      <EmptyState
        icon={Users}
        title="Noch keine Kundschaft"
        text="Erfasse die erste Kundschaft, dann steht sie hier."
        action={<button type="button">Kundschaft erfassen</button>}
      />,
    );
    expect(screen.getByText('Noch keine Kundschaft')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kundschaft erfassen' })).toBeTruthy();
  });
});

describe('PageHeader, BackLink and Section', () => {
  it('leads with the large title, the way back and the corner at the top right', () => {
    render(
      <UiProvider link={RouterLink}>
        <PageHeader
          title="Treppenhaus Ost"
          subtitle="Objekt"
          back={{ href: '/objekte', label: 'Objekte' }}
          corner={<IconButton icon={Settings} label="Einstellungen" />}
          actions={<button type="button">Einsatz planen</button>}
        />
      </UiProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Treppenhaus Ost' })).toBeTruthy();
    const back = screen.getByRole('link', { name: 'Objekte' });
    expect(back.getAttribute('href')).toBe('#/objekte');
    expect(back.className).toContain('min-h-11');
    expect(screen.getByRole('button', { name: 'Einstellungen' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Einsatz planen' }).parentElement?.className,
    ).toContain('flex');
  });

  it('sets two or more actions in equal cells on the phone, and a second header as h2', () => {
    render(
      <PageHeader
        title="Zweiter Kopf"
        level={2}
        actions={
          <>
            <button type="button">Eins</button>
            <button type="button">Zwei</button>
          </>
        }
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Zweiter Kopf' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eins' }).parentElement?.className).toContain('grid');
  });

  it('links back with a plain link without a provider', () => {
    render(<BackLink href="/heute" label="Heute" />);
    expect(screen.getByRole('link', { name: 'Heute' }).getAttribute('href')).toBe('/heute');
  });

  it('names its region by its title and offers one action, a link or a button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Section
          title="Diese Woche"
          hint="Fünf Einsätze"
          action={{ label: 'Alle anzeigen', href: '/einsaetze' }}
        >
          <p>Inhalt</p>
        </Section>
        <Section
          title="Team"
          titleStyle="group"
          level={3}
          action={{ label: 'Bearbeiten', onClick }}
        >
          <p>Inhalt</p>
        </Section>
      </>,
    );
    expect(screen.getByRole('region', { name: 'Diese Woche' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Alle anzeigen' }).getAttribute('href')).toBe(
      '/einsaetze',
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Team' }).className).toContain(
      'uppercase',
    );
    await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('StatTile and KpiGrid', () => {
  it('shows label, unit and figure on the calm surface, and the words of its tone', () => {
    render(<StatTile label="Offen" unit="CHF" value="1’234.50" tone="warn" />);
    expect(screen.getByText('Offen')).toBeTruthy();
    expect(screen.getByText('CHF')).toBeTruthy();
    expect(screen.getByText('1’234.50').className).toContain('tabular-nums');
    // No words of the page: the tone says itself in words, never in colour alone.
    expect(screen.getByText(uiMessages.tone.warn).className).toContain('text-warn');
    expect(screen.getByText('Offen').closest('div')?.className).toContain('from-calm-start');
  });

  it('takes the words of the page before the word of its tone, and links through the app', () => {
    render(
      <UiProvider link={RouterLink}>
        <StatTile label="Stunden" value="38.5" hint="diese Woche" tone="ok" href="/stunden" />
      </UiProvider>,
    );
    expect(screen.queryByText(uiMessages.tone.ok)).toBeNull();
    const link = screen.getByRole('link', { name: /Stunden/ });
    expect(link.getAttribute('href')).toBe('#/stunden');
    expect(link.textContent).toContain('diese Woche');
  });

  it('shows no tone line when there are no words', () => {
    render(<StatTile label="Kundschaft" value="12" />);
    expect(screen.getByText('12').closest('div')?.textContent).toBe('Kundschaft12');
  });

  it('lays as many tiles side by side from tablet width as there are, up to four', () => {
    const grid = (count: number) => {
      const { container, unmount } = render(
        <KpiGrid>
          {Array.from({ length: count }, (_, index) => (
            <StatTile key={index} label={`Kennzahl ${String(index)}`} value="1" />
          ))}
        </KpiGrid>,
      );
      const classes = container.querySelector('.grid')?.className ?? '';
      unmount();
      return classes;
    };
    expect(grid(1)).toContain('@2xl:grid-cols-1');
    expect(grid(2)).toContain('@2xl:grid-cols-2');
    expect(grid(3)).toContain('@2xl:grid-cols-3');
    expect(grid(5)).toContain('@2xl:grid-cols-4');
    expect(grid(3)).toContain('grid-cols-2');
  });
});
