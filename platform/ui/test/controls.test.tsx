import { localDate, type LocalDate } from '@onestrand/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode, type SyntheticEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  Checkbox,
  DateField,
  describeDate,
  describeRelative,
  isMonthOnly,
  nextDateText,
  SegmentedControl,
  Switch,
  uiMessages,
  UiProvider,
  type DateFieldProps,
} from '../src/index';

const t = uiMessages;
const TODAY = localDate('2026-11-14');

function Form({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  return (
    <form
      onSubmit={(event: SyntheticEvent) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
      <button type="submit">Sichern</button>
    </form>
  );
}

function described(element: HTMLElement): string {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' | ');
}

describe('Checkbox', () => {
  function Tick({
    required = false,
    onValue,
  }: {
    required?: boolean;
    onValue?: (v: boolean) => void;
  }) {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        label="Schlüssel abgegeben"
        description="Beim Hauswart."
        checked={checked}
        required={required}
        onChange={(next) => {
          setChecked(next);
          onValue?.(next);
        }}
      />
    );
  }

  it('renders its label and description and reacts to a tap and to Space', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Tick onValue={onValue} />);
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Schlüssel abgegeben' });
    expect(described(box)).toBe('Beim Hauswart.');
    await user.click(screen.getByText('Schlüssel abgegeben'));
    expect(onValue).toHaveBeenLastCalledWith(true);
    expect(box.checked).toBe(true);
    await user.keyboard(' ');
    expect(onValue).toHaveBeenLastCalledWith(false);
  });

  it('draws a ticked box in the accent with an edge of its own', async () => {
    const user = userEvent.setup();
    render(<Tick />);
    const mark = () => screen.getByRole('checkbox').nextElementSibling;
    expect(mark()?.className).toContain('border-line-strong');
    await user.click(screen.getByRole('checkbox'));
    expect(mark()?.className).toContain('bg-accent');
    expect(mark()?.className).toContain('border-accent-edge');
    expect(mark()?.querySelector('svg')).not.toBeNull();
  });

  it('stops a form until it is ticked, and says so', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit}>
        <Tick required />
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onSubmit).not.toHaveBeenCalled();
    const box = screen.getByRole('checkbox');
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(described(box)).toContain(t.field.required);
    await user.click(box);
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows the error of the form and can be switched off', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Checkbox
        label="Kontrolliert"
        checked={false}
        onChange={onChange}
        disabled
        error="Erst kontrollieren."
      />,
    );
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Kontrolliert' });
    expect(box.disabled).toBe(true);
    expect(described(box)).toBe('Erst kontrollieren.');
    await user.click(box);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Switch', () => {
  function Setting({
    onValue,
    disabled = false,
  }: {
    onValue?: (v: boolean) => void;
    disabled?: boolean;
  }) {
    const [checked, setChecked] = useState(false);
    return (
      <Switch
        label="Erinnerungen"
        description="Am Vorabend eines Einsatzes."
        checked={checked}
        disabled={disabled}
        onChange={(next) => {
          setChecked(next);
          onValue?.(next);
        }}
      />
    );
  }

  it('is a switch named by its label, described by its line, and turns with a tap and Space', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Setting onValue={onValue} />);
    const control = screen.getByRole<HTMLInputElement>('switch', { name: 'Erinnerungen' });
    expect(described(control)).toBe('Am Vorabend eines Einsatzes.');
    await user.click(control);
    expect(onValue).toHaveBeenLastCalledWith(true);
    expect(control.checked).toBe(true);
    await user.keyboard(' ');
    expect(onValue).toHaveBeenLastCalledWith(false);
  });

  it('says «on» with a mark in the knob, not with colour alone', async () => {
    const user = userEvent.setup();
    render(<Setting />);
    const track = () => screen.getByRole('switch').nextElementSibling;
    expect(track()?.querySelector('svg')).toBeNull();
    expect(track()?.className).toContain('bg-line-strong');
    await user.click(screen.getByRole('switch'));
    expect(track()?.querySelector('svg')).not.toBeNull();
    expect(track()?.className).toContain('border-accent-edge');
  });

  it('does nothing while switched off', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Setting onValue={onValue} disabled />);
    await user.click(screen.getByRole('switch'));
    expect(onValue).not.toHaveBeenCalled();
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'day', label: 'Tag' },
    { value: 'week', label: 'Woche' },
    { value: 'month', label: 'Monat' },
  ] as const;

  function Period({ onValue }: { onValue?: (v: string) => void }) {
    const [value, setValue] = useState<'day' | 'week' | 'month'>('week');
    return (
      <SegmentedControl
        label="Zeitraum"
        options={options}
        value={value}
        onChange={(next) => {
          setValue(next);
          onValue?.(next);
        }}
      />
    );
  }

  it('is a radio group named by its label, with the chosen segment marked', () => {
    render(<Period />);
    const group = screen.getByRole('radiogroup', { name: 'Zeitraum' });
    const chosen = within(group).getByRole('radio', { name: 'Woche' });
    expect(chosen.getAttribute('aria-checked')).toBe('true');
    expect(chosen.className).toContain('bg-accent');
    expect(chosen.className).toContain('ring-accent-edge');
    expect(within(group).getByRole('radio', { name: 'Tag' }).getAttribute('aria-checked')).toBe(
      'false',
    );
  });

  it('chooses with a tap', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Period onValue={onValue} />);
    await user.click(screen.getByRole('radio', { name: 'Monat' }));
    expect(onValue).toHaveBeenLastCalledWith('month');
  });

  it('is one tab stop, and the arrow keys, Home and End move and choose', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Period onValue={onValue} />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Woche' }));
    await user.keyboard('{ArrowRight}');
    expect(onValue).toHaveBeenLastCalledWith('month');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Monat' }));
    await user.keyboard('{ArrowRight}');
    expect(onValue).toHaveBeenLastCalledWith('day');
    await user.keyboard('{ArrowLeft}');
    expect(onValue).toHaveBeenLastCalledWith('month');
    await user.keyboard('{Home}');
    expect(onValue).toHaveBeenLastCalledWith('day');
    await user.keyboard('{End}');
    expect(onValue).toHaveBeenLastCalledWith('month');
    await user.keyboard('{ArrowUp}');
    expect(onValue).toHaveBeenLastCalledWith('week');
    await user.keyboard('{ArrowDown}');
    expect(onValue).toHaveBeenLastCalledWith('month');
    onValue.mockClear();
    await user.keyboard('a');
    expect(onValue).not.toHaveBeenCalled();
  });

  it('makes the first segment the tab stop when nothing is chosen, and can hide its label', () => {
    render(
      <SegmentedControl
        label="Zeitraum"
        hideLabel
        options={options}
        value={'year' as 'day'}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Tag' }).tabIndex).toBe(0);
    expect(screen.getByRole('radio', { name: 'Woche' }).tabIndex).toBe(-1);
    expect(screen.getByText('Zeitraum').className).toContain('sr-only');
  });
});

describe('DateField', () => {
  function Day({
    onValue,
    initial = null,
    ...props
  }: Partial<DateFieldProps> & {
    onValue?: (v: LocalDate | null) => void;
    initial?: LocalDate | null;
  }) {
    const [value, setValue] = useState<LocalDate | null>(initial);
    return (
      <UiProvider today={TODAY}>
        <DateField
          label="Nächster Einsatz"
          {...props}
          value={value}
          onChange={(next) => {
            setValue(next);
            onValue?.(next);
          }}
        />
      </UiProvider>
    );
  }

  it('reads a day typed with or without dots and says what it understood', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Day onValue={onValue} />);
    const input = screen.getByLabelText<HTMLInputElement>('Nächster Einsatz');
    expect(input.placeholder).toBe(t.date.placeholder);
    await user.type(input, '201126');
    expect(input.value).toBe('20.11.26');
    expect(onValue).toHaveBeenLastCalledWith('2026-11-20');
    expect(described(input)).toBe('Fr, 20. Nov. 2026 · in 6 Tagen');
  });

  it('shows a stored day in the Swiss form', () => {
    render(<Day initial={localDate('2026-12-01')} />);
    expect(screen.getByLabelText<HTMLInputElement>('Nächster Einsatz').value).toBe('01.12.2026');
  });

  it('answers a day that does not exist with null and a message once the field is left', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Day onValue={onValue} />);
    await user.type(screen.getByLabelText('Nächster Einsatz'), '31.02.2026');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.date.unreadable)).toBeTruthy();
  });

  it('keeps to the earliest and the latest day', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Day onValue={onValue} min={localDate('2026-11-14')} max={localDate('2026-12-31')} />);
    const input = screen.getByLabelText('Nächster Einsatz');
    await user.type(input, '10.11.2026');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.date.min('14.11.2026'))).toBeTruthy();
    await user.clear(input);
    await user.type(input, '05.01.2027');
    await user.tab();
    expect(screen.getByText(t.date.max('31.12.2026'))).toBeTruthy();
  });

  it('sets a day with one tap on a quick choice, and marks the one that is chosen', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(
      <Day
        onValue={onValue}
        presets={[
          { label: 'heute', days: 0 },
          { label: 'in einer Woche', days: 7 },
        ]}
      />,
    );
    const presets = screen.getByRole('group', { name: t.date.presets });
    await user.click(within(presets).getByRole('button', { name: 'in einer Woche' }));
    expect(onValue).toHaveBeenLastCalledWith('2026-11-21');
    expect(
      within(presets).getByRole('button', { name: 'in einer Woche' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      within(presets).getByRole('button', { name: 'heute' }).getAttribute('aria-pressed'),
    ).toBe('false');
    expect(screen.getByLabelText<HTMLInputElement>('Nächster Einsatz').value).toBe('21.11.2026');
  });

  it('switches off a quick choice outside the earliest and the latest day', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(
      <Day
        onValue={onValue}
        min={localDate('2026-11-15')}
        max={localDate('2026-11-20')}
        presets={[
          { label: 'heute', days: 0 },
          { label: 'morgen', days: 1 },
          { label: 'in einer Woche', days: 7 },
        ]}
      />,
    );
    const presets = screen.getByRole('group', { name: t.date.presets });
    const today = within(presets).getByRole<HTMLButtonElement>('button', { name: 'heute' });
    const week = within(presets).getByRole<HTMLButtonElement>('button', { name: 'in einer Woche' });
    expect(today.disabled).toBe(true);
    expect(week.disabled).toBe(true);
    expect(
      within(presets).getByRole<HTMLButtonElement>('button', { name: 'morgen' }).disabled,
    ).toBe(false);
    await user.click(week);
    expect(onValue).not.toHaveBeenCalled();
  });

  it('keeps an ISO date typed by keyboard in its form and reads it', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Day onValue={onValue} />);
    const input = screen.getByLabelText<HTMLInputElement>('Nächster Einsatz');
    await user.type(input, '2026-11-20');
    expect(input.value).toBe('2026-11-20');
    expect(onValue).toHaveBeenLastCalledWith('2026-11-20');
    // A year that could be a day and a month: the dash takes the dots back out.
    await user.clear(input);
    await user.type(input, '2012-11-20');
    expect(input.value).toBe('2012-11-20');
    expect(onValue).toHaveBeenLastCalledWith('2012-11-20');
  });

  it('does not take a month without a day for the end of the month', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Day onValue={onValue} />);
    const input = screen.getByLabelText('Nächster Einsatz');
    await user.type(input, '11.2026');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.date.unreadable)).toBeTruthy();
    await user.clear(input);
    await user.type(input, '11/26');
    expect(onValue).toHaveBeenLastCalledWith(null);
    // A day and a month without a year still read as this year.
    await user.clear(input);
    await user.type(input, '6.12');
    expect(onValue).toHaveBeenLastCalledWith('2026-12-06');
  });

  it('takes a day from the calendar of the device', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Day onValue={onValue} />);
    const calendar = screen.getByLabelText<HTMLInputElement>(t.date.openCalendar);
    expect(calendar.type).toBe('date');
    await user.click(calendar);
    await user.type(calendar, '2026-11-30');
    expect(onValue).toHaveBeenLastCalledWith('2026-11-30');
  });

  it('stops a form while a required day is missing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit}>
        <Day required />
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(t.field.required)).toBeTruthy();
  });

  it('can be switched off, the calendar with it', () => {
    render(<Day disabled />);
    expect(screen.getByLabelText<HTMLInputElement>('Nächster Einsatz').disabled).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>(t.date.openCalendar).disabled).toBe(true);
  });

  it('refuses to render without today: the kit never reads the clock', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      expect(() => render(<DateField label="Tag" value={null} onChange={vi.fn()} />)).toThrow(
        /today/,
      );
    } finally {
      error.mockRestore();
    }
  });
});

describe('the words of a day', () => {
  it('writes a day from the catalogue, the same on every device', () => {
    expect(describeDate(localDate('2026-11-20'), t.date)).toBe('Fr, 20. Nov. 2026');
    expect(describeDate(localDate('2026-03-01'), t.date)).toBe('So, 1. März 2026');
  });

  it('says how far a day is from today', () => {
    const at = (date: string) => describeRelative(localDate(date), TODAY, t.date);
    expect(at('2026-11-14')).toBe('heute');
    expect(at('2026-11-15')).toBe('morgen');
    expect(at('2026-11-13')).toBe('gestern');
    expect(at('2026-11-20')).toBe('in 6 Tagen');
    expect(at('2026-11-12')).toBe('vor 2 Tagen');
    expect(at('2026-12-05')).toBe('in 3 Wochen');
    expect(at('2026-11-21')).toBe('in 7 Tagen');
    expect(at('2027-05-14')).toBe('in 6 Monaten');
    expect(at('2028-11-14')).toBe('in 2 Jahren');
    expect(at('2026-10-14')).toBe('vor 4 Wochen');
  });

  it('gives digits their dots while typing, and leaves typed marks alone', () => {
    expect(nextDateText('', '2', true)).toEqual({ text: '2', autoFormatting: true });
    expect(nextDateText('20.11', '20.112', true)).toEqual({
      text: '20.11.2',
      autoFormatting: true,
    });
    expect(nextDateText('6', '6.', true)).toEqual({ text: '6.', autoFormatting: false });
    expect(nextDateText('6.', '6.1', false)).toEqual({ text: '6.1', autoFormatting: false });
    expect(nextDateText('6.1', '', false)).toEqual({ text: '', autoFormatting: true });
    expect(nextDateText('abc', 'ab', true)).toEqual({ text: 'ab', autoFormatting: false });
  });

  it('takes four digits that cannot be a day and a month for a year', () => {
    expect(nextDateText('202', '2026', true)).toEqual({ text: '2026', autoFormatting: false });
    expect(nextDateText('2026', '2026-', false)).toEqual({ text: '2026-', autoFormatting: false });
    expect(nextDateText('201', '2011', true)).toEqual({ text: '20.11', autoFormatting: true });
    expect(nextDateText('20.11', '20.11-', true)).toEqual({ text: '2011-', autoFormatting: false });
    expect(nextDateText('6', '6-', false)).toEqual({ text: '6-', autoFormatting: false });
  });

  it('tells a month without a day from a day without a year', () => {
    expect(isMonthOnly('11.2026')).toBe(true);
    expect(isMonthOnly('11/26')).toBe(true);
    expect(isMonthOnly('11.2026.')).toBe(true);
    expect(isMonthOnly('6.11')).toBe(false);
    expect(isMonthOnly('6.11.')).toBe(false);
    expect(isMonthOnly('06.11.2026')).toBe(false);
    expect(isMonthOnly('2026-11-20')).toBe(false);
    expect(isMonthOnly('201126')).toBe(false);
  });
});
