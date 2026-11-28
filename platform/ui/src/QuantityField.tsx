import { groupThousands } from '@onestrand/core';
import { useUiTexts } from './context';
import { ParsedField, type FieldBaseProps } from './Field';

/** What the field reads: a sign, whole digits with or without ’, a mark and up to three digits. */
const QUANTITY = /^(-?)(\d*)(?:[.,](\d*))?$/;

/** Why a text is no quantity. */
type Unreadable = 'unreadable' | 'digits';

/**
 * Reads a quantity typed the Swiss way into thousandths: «2.5» and «2,5» are 2500, «1’250.125» is
 * 1’250’125, «.5» is 500, «12.» while typing is 12’000. More than three digits after the mark is
 * `digits`; anything else that is not a number is `unreadable`. Exact: the digits are counted,
 * never multiplied as a float.
 */
export function readMilli(input: string): number | Unreadable {
  const text = input
    .trim()
    .replace(/[’'\s]/g, '')
    .replace('−', '-');
  const match = QUANTITY.exec(text);
  const [, sign = '', whole = '', fraction = ''] = match ?? [];
  if (match === null || (whole === '' && fraction === '')) {
    return 'unreadable';
  }
  if (fraction.length > 3) {
    return 'digits';
  }
  const value = Number(whole === '' ? '0' : whole) * 1000 + Number(fraction.padEnd(3, '0'));
  if (!Number.isSafeInteger(value)) {
    return 'unreadable';
  }
  return sign === '-' && value !== 0 ? -value : value;
}

/** Thousandths as the Swiss write a quantity: «2.5», «1’250.125», «12»; no trailing zeros. */
export function formatMilli(milli: number): string {
  const absolute = Math.abs(milli);
  const whole = groupThousands(String(Math.trunc(absolute / 1000)));
  const fraction = String(absolute % 1000)
    .padStart(3, '0')
    .replace(/0+$/, '');
  return `${milli < 0 ? '-' : ''}${whole}${fraction === '' ? '' : `.${fraction}`}`;
}

export interface QuantityFieldProps extends FieldBaseProps {
  /**
   * The quantity in thousandths of its unit, an integer (2.5 h is 2500), or null while the field
   * is empty or cannot be read. The quantity of the core is `value / 1000`.
   */
  value: number | null;
  onChange: (value: number | null) => void;
  /** The unit behind the number, in the words of the page: «h», «m²», «Stk.». */
  unit: string;
  /** Quantities below zero are allowed (a correction). Default: from zero up. */
  allowNegative?: boolean | undefined;
  placeholder?: string | undefined;
}

/** What the example in an error message shows. */
const EXAMPLE = 2500;

/**
 * A quantity with up to three decimals and its unit behind it: hours, square metres, pieces.
 * The value is an integer of thousandths, so no float ever stands in a quantity.
 */
export function QuantityField({
  value,
  onChange,
  unit,
  allowNegative = false,
  placeholder,
  ...base
}: QuantityFieldProps) {
  const texts = useUiTexts();
  return (
    <ParsedField
      {...base}
      value={value}
      onChange={onChange}
      inputMode="decimal"
      suffix={unit}
      placeholder={placeholder}
      parse={(text) => {
        const milli = readMilli(text);
        return typeof milli === 'string' || (milli < 0 && !allowNegative) ? null : milli;
      }}
      format={formatMilli}
      problem={(text) => {
        const milli = readMilli(text);
        if (milli === 'digits') {
          return texts.quantity.digits;
        }
        return milli === 'unreadable'
          ? texts.quantity.unreadable(formatMilli(EXAMPLE))
          : texts.quantity.negative;
      }}
    />
  );
}
