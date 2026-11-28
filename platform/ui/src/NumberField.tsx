// Origin: BanioX/Randen apps/web/src/ui/NumberField.tsx @ e0f0907 — adapted: texts from the catalogue of UiProvider
import { formatDecimal } from '@onestrand/core';
import { useUiTexts } from './context';
import { ParsedField, type FieldBaseProps } from './Field';

export interface NumberFieldProps extends FieldBaseProps {
  /** A whole number, or null while the field is empty or cannot be read. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Smallest number allowed. Default 0. */
  min?: number | undefined;
  max?: number | undefined;
  /** Words behind the number: «Tage», «Personen». */
  suffix?: string | undefined;
  placeholder?: string | undefined;
}

/**
 * «12», «1’250», «12.0», «12,00» and «12.» while typing. A fraction is allowed only as one or two
 * zeros: «1.000» and «1,000» are a thousand in some writings and one in others, so they read as
 * nothing (null) and the field asks again, instead of a guess. «-0» is 0.
 */
export function readWholeNumber(input: string): number | null {
  const text = input.trim().replace(/[’'\s]/g, '');
  const match = /^(-?\d+)(?:[.,](?:0{1,2})?)?$/.exec(text.replace('−', '-'));
  if (match === null) {
    return null;
  }
  const value = Number(match[1]);
  if (!Number.isSafeInteger(value)) {
    return null;
  }
  return value === 0 ? 0 : value;
}

/** A whole number: days, people, pieces. */
export function NumberField({
  value,
  onChange,
  min = 0,
  max,
  suffix,
  placeholder,
  ...base
}: NumberFieldProps) {
  const texts = useUiTexts();
  const tooSmall = (number: number) => number < min;
  const tooLarge = (number: number) => max !== undefined && number > max;
  return (
    <ParsedField
      {...base}
      value={value}
      onChange={onChange}
      inputMode="numeric"
      suffix={suffix}
      placeholder={placeholder}
      parse={(text) => {
        const number = readWholeNumber(text);
        return number === null || tooSmall(number) || tooLarge(number) ? null : number;
      }}
      format={(number) => String(number)}
      problem={(text) => {
        const number = readWholeNumber(text);
        if (number === null) {
          return texts.number.unreadable;
        }
        return tooSmall(number)
          ? texts.number.min(formatDecimal(min, { digits: 0 }))
          : texts.number.max(formatDecimal(max ?? number, { digits: 0 }));
      }}
    />
  );
}
