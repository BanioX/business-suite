// Origin: BanioX/Randen apps/web/src/ui/DateField.tsx @ e0f0907 — adapted: today from UiProvider instead of a hook of the app; tokens of the theme; texts from its catalogue; a month without a day is refused, a quick choice outside min and max is switched off
import { addDays, formatSwissDate, parseDateInput, type LocalDate } from '@onestrand/core';
import { useId, useState } from 'react';
import { CalendarButton } from './CalendarButton';
import { useToday, useUiTexts } from './context';
import { describeDate, describeRelative, isMonthOnly, nextDateText } from './date-text';
import { controlClass, Field, fieldLabelId, useParsedText, type FieldBaseProps } from './Field';

/** A quick choice under the date field: «morgen» = 1, «in einer Woche» = 7, «heute» = 0. */
export interface DatePreset {
  label: string;
  /** Days from today; negative for the past. */
  days: number;
}

export interface DateFieldProps extends FieldBaseProps {
  /** The calendar day (`YYYY-MM-DD`), or null while the field is empty or cannot be read. */
  value: LocalDate | null;
  onChange: (value: LocalDate | null) => void;
  /** One-tap choices counted from today, fitting what the date is for. */
  presets?: readonly DatePreset[] | undefined;
  /** The earliest and the latest day allowed. */
  min?: LocalDate | undefined;
  max?: LocalDate | undefined;
}

/**
 * A calendar day typed as TT.MM.JJJJ, never the device's own date field as the visible input (it
 * would show the format of the device). Digits get their dots while typing, under the field
 * stands what the app understood («Fr, 20. Nov. 2026 · in 6 Tagen»), the calendar button opens
 * the device's picker and quick choices set a date with one tap. Today comes from `UiProvider`.
 */
export function DateField({
  label,
  hint,
  error,
  hideLabel,
  optional,
  required,
  disabled,
  id,
  name,
  className,
  value,
  onChange,
  presets = [],
  min,
  max,
}: DateFieldProps) {
  const today = useToday();
  const t = useUiTexts().date;
  const generated = useId();
  const controlId = id ?? generated;
  const [autoFormatting, setAutoFormatting] = useState(true);

  // A month without a day is no date here, although the core reads it as the end of the month.
  const read = (text: string) => (isMonthOnly(text) ? null : parseDateInput(text, today));
  const tooEarly = (date: LocalDate) => min !== undefined && date < min;
  const tooLate = (date: LocalDate) => max !== undefined && date > max;

  const {
    ref,
    text,
    parsed,
    error: shown,
    commit,
    onBlur,
    onInvalid,
  } = useParsedText<LocalDate>({
    value,
    onChange,
    parse: (text) => {
      const date = read(text);
      return date === null || tooEarly(date) || tooLate(date) ? null : date;
    },
    format: formatSwissDate,
    problem: (text) => {
      const date = read(text);
      if (date !== null && min !== undefined && tooEarly(date)) {
        return t.min(formatSwissDate(min));
      }
      if (date !== null && max !== undefined && tooLate(date)) {
        return t.max(formatSwissDate(max));
      }
      return t.unreadable;
    },
    error,
    required,
  });

  function type(raw: string) {
    const next = nextDateText(text, raw, autoFormatting);
    setAutoFormatting(next.autoFormatting);
    commit(next.text);
  }

  function choose(date: LocalDate) {
    setAutoFormatting(true);
    commit(formatSwissDate(date));
  }

  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      <Field
        label={label}
        hint={hint}
        error={shown}
        info={
          parsed === null
            ? null
            : `${describeDate(parsed, t)} · ${describeRelative(parsed, today, t)}`
        }
        hideLabel={hideLabel}
        optional={optional}
        id={controlId}
      >
        {(control) => (
          <div className="flex min-w-0 gap-2">
            <input
              {...control}
              ref={ref}
              name={name}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={t.placeholder}
              required={required}
              disabled={disabled}
              value={text}
              onChange={(event) => {
                type(event.target.value);
              }}
              onBlur={onBlur}
              onInvalid={onInvalid}
              className={`${controlClass(shown !== undefined)} flex-1 tabular-nums`}
            />
            <CalendarButton
              describedBy={fieldLabelId(control.id)}
              value={parsed}
              onPick={choose}
              today={today}
              min={min}
              max={max}
              disabled={disabled}
            />
          </div>
        )}
      </Field>
      {presets.length > 0 ? (
        <div
          role="group"
          aria-label={t.presets}
          aria-describedby={fieldLabelId(controlId)}
          className="mt-2.5 flex flex-wrap gap-2"
        >
          {presets.map((preset) => {
            const date = addDays(today, preset.days);
            const selected = parsed === date;
            // A quick choice outside the allowed days cannot be chosen.
            const outside = tooEarly(date) || tooLate(date);
            return (
              <button
                key={`${String(preset.days)}-${preset.label}`}
                type="button"
                aria-pressed={selected}
                disabled={disabled === true || outside}
                onClick={() => {
                  choose(date);
                }}
                className={`min-h-11 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? 'border-accent-edge bg-accent text-on-accent'
                    : 'border-line-strong bg-surface text-fg hover:bg-surface-muted'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
