// Origin: BanioX/Randen apps/web/src/ui/fields.test.tsx @ e0f0907 — adapted: only Field, the text fields, NumberField and SelectField, with neutral words; texts from the catalogue of the kit; tests of the money field added
import { CurrencyCodeSchema, rappen, type Rappen } from '@onestrand/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode, type SyntheticEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  controlClass,
  Field,
  FieldGroup,
  firstError,
  joinIds,
  MoneyField,
  formatMilli,
  NumberField,
  QuantityField,
  readMilli,
  readTimeOfDay,
  readWholeNumber,
  TIME_OF_DAY_PATTERN,
  TimeField,
  SelectField,
  TextArea,
  TextField,
  uiMessages,
  UiProvider,
  withoutTrailingMark,
  type NumberFieldProps,
} from '../src/index';

const t = uiMessages;

/** A form that records whether it was sent and never navigates. */
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

/** The texts the control is described by, in their order. */
function described(element: HTMLElement): string {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' | ');
}

function Numbers({
  onValue,
  initial = null,
  ...props
}: Partial<NumberFieldProps> & {
  onValue?: (value: number | null) => void;
  initial?: number | null;
}) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <NumberField
      label="Tage"
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

function Money({
  onValue,
  initial = null,
  allowNegative,
}: {
  onValue?: (value: Rappen | null) => void;
  initial?: Rappen | null;
  allowNegative?: boolean;
}) {
  const [value, setValue] = useState<Rappen | null>(initial);
  return (
    <MoneyField
      label="Betrag"
      value={value}
      allowNegative={allowNegative}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

describe('Field', () => {
  it('wires label, hint and error to the control', () => {
    render(
      <Field label="Name" labelSuffix="der Kundschaft" hint="Wie auf der Offerte." error="Zu lang.">
        {(control) => <input {...control} />}
      </Field>,
    );
    const input = screen.getByLabelText('Name der Kundschaft');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(described(input)).toBe('Zu lang. | Wie auf der Offerte.');
    expect(screen.getByText('Zu lang.').parentElement?.querySelector('svg')).not.toBeNull();
  });

  it('keeps a hidden label for screen readers and marks optional fields', () => {
    render(
      <Field label="Notiz" hideLabel optional>
        {(control) => <input {...control} />}
      </Field>,
    );
    const input = screen.getByLabelText('Notiz');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(described(input)).toBe(t.field.optional);
    expect(screen.getByText('Notiz').parentElement?.className).toContain('sr-only');
  });

  it('shows a line that follows the input, unless an error stands there', () => {
    const { rerender } = render(
      <Field label="Datum" info="Fr, 20. Nov. 2026">
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(described(screen.getByLabelText('Datum'))).toBe('Fr, 20. Nov. 2026');
    rerender(
      <Field label="Datum" info="Fr, 20. Nov. 2026" error="Dieses Datum gibt es nicht.">
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(described(screen.getByLabelText('Datum'))).toBe('Dieses Datum gibt es nicht.');
  });

  it('joins only the ids that are there, and finds the first error', () => {
    expect(joinIds('a', false, null, undefined, '', 'b')).toBe('a b');
    expect(joinIds(false, undefined)).toBeUndefined();
    expect(firstError(undefined, '', false, 'zweiter', 'dritter')).toBe('zweiter');
    expect(firstError(null)).toBeUndefined();
    expect(withoutTrailingMark(' 12. ')).toBe('12');
    expect(withoutTrailingMark('12,')).toBe('12');
  });

  it('draws a control with an edge that can be seen, and in the colour of «falsch» on error', () => {
    expect(controlClass(false)).toContain('border-line-strong');
    expect(controlClass(true)).toContain('border-bad');
    expect(controlClass(false)).toContain('min-h-12');
  });
});

describe('FieldGroup', () => {
  it('names a group of controls and describes it with hint and error', () => {
    render(
      <FieldGroup legend="Tage" hint="Wann gereinigt wird." error="Wähle mindestens einen Tag.">
        <input type="checkbox" aria-label="Montag" />
      </FieldGroup>,
    );
    const group = screen.getByRole('group', { name: 'Tage' });
    expect(described(group)).toBe('Wähle mindestens einen Tag. | Wann gereinigt wird.');
  });

  it('switches every control of the group off at once', () => {
    render(
      <FieldGroup legend="Tage" disabled legendStyle="title">
        <input type="checkbox" aria-label="Montag" />
      </FieldGroup>,
    );
    expect(
      screen.getByRole<HTMLInputElement>('checkbox', { name: 'Montag' }).matches(':disabled'),
    ).toBe(true);
  });
});

describe('TextField and TextArea', () => {
  it('reports what is typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Name() {
      const [value, setValue] = useState('');
      return (
        <TextField
          label="Name"
          value={value}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    }
    render(<Name />);
    await user.type(screen.getByLabelText('Name'), 'Treppenhaus');
    expect(onChange).toHaveBeenLastCalledWith('Treppenhaus');
    expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Treppenhaus');
  });

  it('shows the error of the form with a symbol and marks the field', () => {
    render(
      <TextField label="Name" value="Ost" onChange={vi.fn()} error="Diesen Namen gibt es schon." />,
    );
    const input = screen.getByLabelText('Name');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(described(input)).toBe('Diesen Namen gibt es schon.');
  });

  it('does not let a form go while a required field is empty, and says so at the field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    function Both() {
      const [name, setName] = useState('');
      const [note, setNote] = useState('   ');
      return (
        <Form onSubmit={onSubmit}>
          <TextField label="Name" value={name} onChange={setName} required />
          <TextArea label="Notiz" value={note} onChange={setNote} required />
        </Form>
      );
    }
    render(<Both />);
    expect(screen.queryByText(t.field.required)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onSubmit).not.toHaveBeenCalled();
    // Blanks alone are no text either.
    expect(screen.getAllByText(t.field.required)).toHaveLength(2);
    // The first field with a problem takes the focus.
    expect(document.activeElement).toBe(screen.getByLabelText('Name'));

    await user.type(screen.getByLabelText('Name'), 'Ost');
    await user.clear(screen.getByLabelText('Notiz'));
    await user.type(screen.getByLabelText('Notiz'), 'Schlüssel beim Hauswart');
    expect(screen.queryByText(t.field.required)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('can be switched off', () => {
    render(
      <>
        <TextField label="Name" value="" onChange={vi.fn()} disabled />
        <TextArea label="Notiz" value="" onChange={vi.fn()} disabled />
      </>,
    );
    expect(screen.getByLabelText<HTMLInputElement>('Name').disabled).toBe(true);
    expect(screen.getByLabelText<HTMLTextAreaElement>('Notiz').disabled).toBe(true);
  });

  it('takes the kind of a line: e-mail, phone', () => {
    render(<TextField label="E-Mail" type="email" inputMode="email" value="" onChange={vi.fn()} />);
    const input = screen.getByLabelText<HTMLInputElement>('E-Mail');
    expect(input.type).toBe('email');
    expect(input.inputMode).toBe('email');
  });
});

describe('NumberField', () => {
  it('reads whole numbers and shows a stored value', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Numbers onValue={onValue} initial={10} suffix="Tage" />);
    const input = screen.getByLabelText<HTMLInputElement>('Tage');
    expect(input.value).toBe('10');
    expect(input.inputMode).toBe('numeric');
    expect(described(input)).toBe('Tage');
    await user.clear(input);
    expect(onValue).toHaveBeenLastCalledWith(null);
    await user.type(input, '1’250');
    expect(onValue).toHaveBeenLastCalledWith(1250);
    await user.clear(input);
    await user.type(input, '12,0');
    expect(onValue).toHaveBeenLastCalledWith(12);
  });

  it('answers garbage with null and a message once the field is left', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Numbers onValue={onValue} />);
    const input = screen.getByLabelText('Tage');
    await user.type(input, '2.5');
    expect(onValue).toHaveBeenLastCalledWith(null);
    // Not while typing: «2.» is on its way to «2.0».
    expect(screen.queryByText(t.number.unreadable)).toBeNull();
    await user.tab();
    expect(screen.getByText(t.number.unreadable)).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    // Once shown, the message follows the typing and goes when the text can be read.
    await user.clear(input);
    await user.type(input, '3');
    expect(screen.queryByText(t.number.unreadable)).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(onValue).toHaveBeenLastCalledWith(3);
  });

  it('asks again for «1.000» instead of taking it as one', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Numbers onValue={onValue} />);
    await user.type(screen.getByLabelText('Tage'), '1.000');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.number.unreadable)).toBeTruthy();
  });

  it('keeps to its range', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Numbers onValue={onValue} min={1} max={500} />);
    const input = screen.getByLabelText('Tage');
    await user.type(input, '0');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.number.min('1'))).toBeTruthy();
    await user.clear(input);
    await user.type(input, '501');
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.number.max('500'))).toBeTruthy();
  });

  it('stops a form with text it cannot read instead of dropping it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit}>
        <Numbers />
      </Form>,
    );
    // Enter in the field sends the form: no blur has happened yet.
    await user.type(screen.getByLabelText('Tage'), 'zwölf{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(t.number.unreadable)).toBeTruthy();
    await user.clear(screen.getByLabelText('Tage'));
    await user.type(screen.getByLabelText('Tage'), '12{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows unreadable text at once when the form reports an error of its own', async () => {
    const user = userEvent.setup();
    render(<Numbers error="Trag die Tage ein." />);
    expect(screen.getByText('Trag die Tage ein.')).toBeTruthy();
    await user.type(screen.getByLabelText('Tage'), 'viele');
    expect(screen.getByText(t.number.unreadable)).toBeTruthy();
    expect(screen.queryByText('Trag die Tage ein.')).toBeNull();
  });

  it('follows a value set from outside and clears with it', () => {
    const { rerender } = render(<NumberField label="Tage" value={3} onChange={vi.fn()} />);
    expect(screen.getByLabelText<HTMLInputElement>('Tage').value).toBe('3');
    rerender(<NumberField label="Tage" value={14} onChange={vi.fn()} />);
    expect(screen.getByLabelText<HTMLInputElement>('Tage').value).toBe('14');
    rerender(<NumberField label="Tage" value={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText<HTMLInputElement>('Tage').value).toBe('');
  });

  it('can be switched off', () => {
    render(<NumberField label="Tage" value={3} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText<HTMLInputElement>('Tage').disabled).toBe(true);
  });

  it('reads a whole number in the Swiss way, and nothing else', () => {
    expect(readWholeNumber('1’250')).toBe(1250);
    expect(readWholeNumber(" 1'250 ")).toBe(1250);
    expect(readWholeNumber('−3')).toBe(-3);
    expect(readWholeNumber('12.00')).toBe(12);
    expect(readWholeNumber('12.5')).toBeNull();
    expect(readWholeNumber('12,00')).toBe(12);
    expect(readWholeNumber('12.')).toBe(12);
  });

  it('reads «1.000» and «1,000» as nothing, not as one: a thousand or one is a guess', () => {
    expect(readWholeNumber('1.000')).toBeNull();
    expect(readWholeNumber('1,000')).toBeNull();
    expect(readWholeNumber('12.000')).toBeNull();
    expect(readWholeNumber('1.0000')).toBeNull();
  });

  it('turns «-0» into 0', () => {
    expect(Object.is(readWholeNumber('-0'), 0)).toBe(true);
    expect(Object.is(readWholeNumber('−0'), 0)).toBe(true);
    expect(Object.is(readWholeNumber('-0.0'), 0)).toBe(true);
    expect(readWholeNumber('9999999999999999999')).toBeNull();
  });
});

describe('MoneyField', () => {
  it('reads an amount into Rappen, with the currency in front', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Money onValue={onValue} />);
    const input = screen.getByLabelText<HTMLInputElement>('Betrag');
    expect(input.inputMode).toBe('decimal');
    expect(described(input)).toBe('CHF');
    await user.type(input, '1’234.50');
    expect(onValue).toHaveBeenLastCalledWith(123450);
    await user.clear(input);
    await user.type(input, '12,5');
    expect(onValue).toHaveBeenLastCalledWith(1250);
    await user.clear(input);
    // A decimal mark at the end while typing is no error.
    await user.type(input, '12.');
    expect(onValue).toHaveBeenLastCalledWith(1200);
  });

  it('shows a stored amount without the currency, as the core writes it', () => {
    render(<Money initial={rappen(123450)} />);
    expect(screen.getByLabelText<HTMLInputElement>('Betrag').value).toBe('1’234.50');
  });

  it('answers what it cannot read with null and an example', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Money onValue={onValue} />);
    await user.type(screen.getByLabelText('Betrag'), 'zwölf');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.money.unreadable('12.50'))).toBeTruthy();
  });

  it('refuses an amount below zero unless it is allowed', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    const { unmount } = render(<Money onValue={onValue} />);
    await user.type(screen.getByLabelText('Betrag'), '-5');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.money.negative)).toBeTruthy();
    unmount();
    render(<Money onValue={onValue} allowNegative />);
    await user.type(screen.getByLabelText('Betrag'), '-5');
    expect(onValue).toHaveBeenLastCalledWith(-500);
  });

  it('counts in the currency of the business that UiProvider gives', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <UiProvider currency={CurrencyCodeSchema.parse('EUR')}>
        <MoneyField label="Betrag" value={null} onChange={onChange} />
      </UiProvider>,
    );
    const input = screen.getByLabelText('Betrag');
    expect(described(input)).toBe('€');
    await user.type(input, '1.234,50');
    expect(onChange).toHaveBeenLastCalledWith(123450);
  });

  it('can be switched off', () => {
    render(<MoneyField label="Betrag" value={null} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText<HTMLInputElement>('Betrag').disabled).toBe(true);
  });
});

describe('SelectField', () => {
  const options = [
    { value: 'weekly', label: 'Jede Woche' },
    { value: 'monthly', label: 'Jeden Monat' },
    { value: 'yearly', label: 'Jedes Jahr', disabled: true },
  ] as const;

  function Interval({
    required = false,
    onValue,
  }: {
    required?: boolean;
    onValue?: (v: string | null) => void;
  }) {
    const [value, setValue] = useState<string | null>(null);
    return (
      <SelectField
        label="Rhythmus"
        options={options}
        value={value}
        required={required}
        onChange={(next) => {
          setValue(next);
          onValue?.(next);
        }}
      />
    );
  }

  it('offers the options under its label and reports the choice', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Interval onValue={onValue} />);
    const select = screen.getByLabelText<HTMLSelectElement>('Rhythmus');
    expect([...select.options].map((option) => option.text)).toEqual([
      t.select.placeholder,
      'Jede Woche',
      'Jeden Monat',
      'Jedes Jahr',
    ]);
    await user.selectOptions(select, 'monthly');
    expect(onValue).toHaveBeenLastCalledWith('monthly');
    // An optional field keeps the empty choice, so a choice can be taken back.
    await user.selectOptions(select, '');
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole<HTMLOptionElement>('option', { name: 'Jedes Jahr' }).disabled).toBe(
      true,
    );
  });

  it('drops the empty choice of a required field once something is chosen, and stops the form before', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit}>
        <Interval required />
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(t.field.required)).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Rhythmus'), 'weekly');
    expect(screen.queryByRole('option', { name: t.select.placeholder })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Sichern' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows a value that is no longer in the list as nothing chosen, in its own words', () => {
    render(
      <SelectField
        label="Rhythmus"
        options={options}
        value={'daily' as 'weekly'}
        onChange={vi.fn()}
        placeholder="Kein Rhythmus"
      />,
    );
    const select = screen.getByLabelText<HTMLSelectElement>('Rhythmus');
    expect(select.value).toBe('');
    expect(select.options[0]?.text).toBe('Kein Rhythmus');
  });

  it('can be switched off and shows the error of the form', () => {
    render(
      <SelectField
        label="Rhythmus"
        options={options}
        value={null}
        onChange={vi.fn()}
        disabled
        error="Wähle einen Rhythmus."
      />,
    );
    const select = screen.getByLabelText<HTMLSelectElement>('Rhythmus');
    expect(select.disabled).toBe(true);
    expect(described(select)).toBe('Wähle einen Rhythmus.');
  });
});

describe('QuantityField', () => {
  function Hours({
    onValue,
    initial = null,
    allowNegative,
  }: {
    onValue?: (value: number | null) => void;
    initial?: number | null;
    allowNegative?: boolean;
  }) {
    const [value, setValue] = useState<number | null>(initial);
    return (
      <QuantityField
        label="Dauer"
        unit="h"
        value={value}
        allowNegative={allowNegative}
        onChange={(next) => {
          setValue(next);
          onValue?.(next);
        }}
      />
    );
  }

  it('reads up to three decimals into thousandths, with the unit behind', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Hours onValue={onValue} />);
    const input = screen.getByLabelText<HTMLInputElement>('Dauer');
    expect(input.inputMode).toBe('decimal');
    expect(described(input)).toBe('h');
    await user.type(input, '2.5');
    expect(onValue).toHaveBeenLastCalledWith(2500);
    await user.clear(input);
    await user.type(input, '1’250,125');
    expect(onValue).toHaveBeenLastCalledWith(1_250_125);
    await user.clear(input);
    await user.type(input, '.75');
    expect(onValue).toHaveBeenLastCalledWith(750);
  });

  it('shows a stored quantity the Swiss way, without trailing zeros', () => {
    render(<Hours initial={1_250_500} />);
    expect(screen.getByLabelText<HTMLInputElement>('Dauer').value).toBe('1’250.5');
  });

  it('says when there are more than three decimals, and when it cannot read at all', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Hours onValue={onValue} />);
    const input = screen.getByLabelText('Dauer');
    await user.type(input, '1.2345');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.quantity.digits)).toBeTruthy();
    await user.clear(input);
    await user.type(input, 'zwei');
    expect(screen.getByText(t.quantity.unreadable('2.5'))).toBeTruthy();
  });

  it('refuses a quantity below zero unless it is allowed', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    const { unmount } = render(<Hours onValue={onValue} />);
    await user.type(screen.getByLabelText('Dauer'), '-1.5');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.quantity.negative)).toBeTruthy();
    unmount();
    render(<Hours onValue={onValue} allowNegative />);
    await user.type(screen.getByLabelText('Dauer'), '-1.5');
    expect(onValue).toHaveBeenLastCalledWith(-1500);
  });

  it('can be switched off', () => {
    render(<QuantityField label="Fläche" unit="m²" value={null} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText<HTMLInputElement>('Fläche').disabled).toBe(true);
  });

  it('reads and writes thousandths exactly, never through a float', () => {
    expect(readMilli('0.001')).toBe(1);
    expect(readMilli('1.005')).toBe(1005);
    expect(readMilli('12.')).toBe(12_000);
    expect(readMilli('-0')).toBe(0);
    expect(Object.is(readMilli('-0.000'), 0)).toBe(true);
    expect(readMilli('1.0001')).toBe('digits');
    expect(readMilli('1.2.3')).toBe('unreadable');
    expect(readMilli('.')).toBe('unreadable');
    expect(readMilli('99999999999999999')).toBe('unreadable');
    expect(formatMilli(1)).toBe('0.001');
    expect(formatMilli(-1500)).toBe('-1.5');
    expect(formatMilli(12_000)).toBe('12');
    expect(formatMilli(1_234_567_890)).toBe('1’234’567.89');
  });
});

describe('TimeField', () => {
  function Start({
    onValue,
    initial = null,
  }: {
    onValue?: (value: string | null) => void;
    initial?: string | null;
  }) {
    const [value, setValue] = useState<string | null>(initial);
    return (
      <TimeField
        label="Beginn"
        value={value}
        onChange={(next) => {
          setValue(next);
          onValue?.(next);
        }}
      />
    );
  }

  it('reads «745» and «7.45» as 07:45, and says what it understood', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Start onValue={onValue} />);
    const input = screen.getByLabelText<HTMLInputElement>('Beginn');
    expect(input.placeholder).toBe(t.time.placeholder);
    expect(input.inputMode).toBe('decimal');
    await user.type(input, '745');
    expect(onValue).toHaveBeenLastCalledWith('07:45');
    expect(described(input)).toBe('07:45');
    await user.clear(input);
    await user.type(input, '7.45');
    expect(onValue).toHaveBeenLastCalledWith('07:45');
    await user.clear(input);
    await user.type(input, '17:05');
    expect(onValue).toHaveBeenLastCalledWith('17:05');
    expect(described(input)).toBe('');
  });

  it('answers what is no time of day with null and a message once the field is left', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Start onValue={onValue} />);
    await user.type(screen.getByLabelText('Beginn'), '24:00');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(t.time.unreadable)).toBeTruthy();
  });

  it('shows a stored time and can be switched off', () => {
    render(<TimeField label="Ende" value="16:30" onChange={vi.fn()} disabled />);
    const input = screen.getByLabelText<HTMLInputElement>('Ende');
    expect(input.value).toBe('16:30');
    expect(input.disabled).toBe(true);
  });

  it('reads the forms of a hurried hand, 24 hours', () => {
    expect(readTimeOfDay('7')).toBe('07:00');
    expect(readTimeOfDay('07')).toBe('07:00');
    expect(readTimeOfDay('7:45')).toBe('07:45');
    expect(readTimeOfDay('7,45')).toBe('07:45');
    expect(readTimeOfDay('7h45')).toBe('07:45');
    expect(readTimeOfDay('0745')).toBe('07:45');
    expect(readTimeOfDay('1230')).toBe('12:30');
    expect(readTimeOfDay('123')).toBe('01:23');
    expect(readTimeOfDay('23:59')).toBe('23:59');
    expect(readTimeOfDay('24:00')).toBeNull();
    expect(readTimeOfDay('7:60')).toBeNull();
    expect(readTimeOfDay('7:5')).toBeNull();
    expect(readTimeOfDay('12345')).toBeNull();
    expect(readTimeOfDay('')).toBeNull();
    expect(TIME_OF_DAY_PATTERN.test('07:45')).toBe(true);
    expect(TIME_OF_DAY_PATTERN.test('7:45')).toBe(false);
  });
});
