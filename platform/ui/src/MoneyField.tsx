// Origin: BanioX/Randen apps/web/src/ui/MoneyField.tsx @ e0f0907 — adapted: the currency of the business from UiProvider instead of a hook of the app; texts from its catalogue
import { currencySymbol, formatMoney, parseMoney, rappen, type Rappen } from '@onestrand/core';
import { useCurrency, useUiTexts } from './context';
import { ParsedField, withoutTrailingMark, type FieldBaseProps } from './Field';

export interface MoneyFieldProps extends FieldBaseProps {
  /** The amount in the smallest unit of the business currency (Rappen), never a float. */
  value: Rappen | null;
  onChange: (value: Rappen | null) => void;
  /** Amounts below zero are allowed (a credit note). Default: from zero up. */
  allowNegative?: boolean | undefined;
  placeholder?: string | undefined;
}

/** What the example in an error message shows: twelve and a half of the currency. */
const EXAMPLE = rappen(1250);

/**
 * An amount of money in the currency of the business, with the currency in front of the field.
 * Reads «12.50», «12,50», «1’234.50» and «12.–» through `@onestrand/core`, so no float ever
 * touches an amount.
 */
export function MoneyField({
  value,
  onChange,
  allowNegative = false,
  placeholder,
  ...base
}: MoneyFieldProps) {
  const texts = useUiTexts();
  const currency = useCurrency();
  const read = (text: string) => parseMoney(withoutTrailingMark(text), currency);
  return (
    <ParsedField
      {...base}
      value={value}
      onChange={onChange}
      inputMode="decimal"
      prefix={currencySymbol(currency)}
      placeholder={placeholder}
      resetKey={currency}
      parse={(text) => {
        const amount = read(text);
        return amount !== null && amount < 0 && !allowNegative ? null : amount;
      }}
      format={(amount) => formatMoney(amount, currency, { currency: false })}
      problem={(text) =>
        read(text) === null
          ? texts.money.unreadable(formatMoney(EXAMPLE, currency, { currency: false }))
          : texts.money.negative
      }
    />
  );
}
