import { useUiTexts } from './context';
import { ParsedField, type FieldBaseProps } from './Field';

/** A time of day, 24 hours: `07:45`, `23:59`. */
export type TimeOfDay = string;

export const TIME_OF_DAY_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/**
 * Reads a time of day typed in a hurry: «7:45», «07:45», «7.45», «7,45», «745», «0745», «7» (07:00),
 * «1230». Returns `HH:MM`, or null for anything that is no time of a day (24:00, 7:60, 12345).
 */
export function readTimeOfDay(input: string): TimeOfDay | null {
  const text = input.trim();
  const parts = /^(\d{1,2})(?:[:.,h](\d{2}))?$/.exec(text) ?? /^(\d{1,2})(\d{2})$/.exec(text);
  if (parts === null) {
    return null;
  }
  const hours = Number(parts[1]);
  const minutes = Number(parts[2] ?? '0');
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export interface TimeFieldProps extends FieldBaseProps {
  /** The time of day (`HH:MM`), or null while the field is empty or cannot be read. */
  value: TimeOfDay | null;
  onChange: (value: TimeOfDay | null) => void;
}

/**
 * A time of day, 24 hours, typed as it comes: «745» and «7.45» are 07:45. The keypad of the phone
 * has the decimal mark, so the point works where the colon is missing.
 */
export function TimeField({ value, onChange, ...base }: TimeFieldProps) {
  const texts = useUiTexts();
  return (
    <ParsedField
      {...base}
      value={value}
      onChange={onChange}
      inputMode="decimal"
      placeholder={texts.time.placeholder}
      parse={readTimeOfDay}
      format={(time) => time}
      problem={() => texts.time.unreadable}
      info={(time, text) => (text.trim() === time ? null : time)}
    />
  );
}
