// Origin: BanioX/Randen apps/web/src/ui/Checkbox.tsx @ e0f0907 — adapted: tokens of the theme, a ticked box keeps an edge of 3:1; texts from the catalogue of UiProvider
import { Check } from 'lucide-react';
import { useId } from 'react';
import { useUiTexts } from './context';
import { FieldError, firstError, joinIds, useSubmitGuard } from './Field';

export interface CheckboxProps {
  label: string;
  /** A quiet line under the label. */
  description?: string | undefined;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** An error the form found. */
  error?: string | null | undefined;
  /** The box has to be ticked before a form is sent (a confirmed check). */
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  name?: string | undefined;
  className?: string | undefined;
}

/**
 * A tick that is saved with the form: «Schlüssel abgegeben», «Kontrolliert». For a setting that
 * takes effect at once use `Switch`. A ticked box is the accent with a tick in `on-accent` and an
 * edge in `accent-edge`, so it stands out from the card by 3:1 whatever the accent is.
 */
export function Checkbox({
  label,
  description,
  checked,
  onChange,
  error,
  required = false,
  disabled = false,
  id,
  name,
  className = '',
}: CheckboxProps) {
  const texts = useUiTexts();
  const generated = useId();
  const inputId = id ?? generated;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  const missing = required && !checked;
  const { ref, submitted, onInvalid } = useSubmitGuard<HTMLInputElement>(
    missing ? texts.field.required : null,
  );
  const shown = firstError(error, submitted && missing && texts.field.required);
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex min-h-11 min-w-0 items-start gap-3 py-2.5">
        <span className="relative flex size-6 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="checkbox"
            checked={checked}
            required={required}
            disabled={disabled}
            aria-invalid={shown === undefined ? undefined : true}
            aria-describedby={joinIds(
              shown !== undefined && errorId,
              description !== undefined && descriptionId,
            )}
            onChange={(event) => {
              onChange(event.target.checked);
            }}
            onInvalid={onInvalid}
            className="peer absolute -inset-2.5 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <span
            aria-hidden="true"
            className={`flex size-6 items-center justify-center rounded-md border-2 text-on-accent transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-edge peer-disabled:opacity-60 ${
              checked
                ? 'border-accent-edge bg-accent'
                : shown === undefined
                  ? 'border-line-strong bg-surface'
                  : 'border-bad bg-surface'
            }`}
          >
            {checked ? <Check size={16} strokeWidth={3} /> : null}
          </span>
        </span>
        {/* The text fills the row, so a tap anywhere on it ticks the box. */}
        <div className="min-w-0 flex-1">
          <label
            htmlFor={inputId}
            className={`block ${disabled ? 'cursor-not-allowed text-muted' : 'cursor-pointer'}`}
          >
            {label}
          </label>
          {description === undefined ? null : (
            <p id={descriptionId} className="text-sm text-muted">
              {description}
            </p>
          )}
        </div>
      </div>
      <div aria-live="polite">
        {shown === undefined ? null : <FieldError id={errorId}>{shown}</FieldError>}
      </div>
    </div>
  );
}
