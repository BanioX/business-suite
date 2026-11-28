// Origin: BanioX/Randen apps/web/src/ui/SelectField.tsx @ e0f0907 — adapted: tokens of the theme; texts from the catalogue of UiProvider
import { ChevronDown } from 'lucide-react';
import { useUiTexts } from './context';
import { controlClass, Field, firstError, useSubmitGuard, type FieldBaseProps } from './Field';

export interface SelectOption<TValue extends string> {
  value: TValue;
  label: string;
  disabled?: boolean | undefined;
}

export interface SelectFieldProps<TValue extends string> extends FieldBaseProps {
  options: readonly SelectOption<TValue>[];
  /** The chosen value, or null while nothing is chosen. */
  value: TValue | null;
  onChange: (value: TValue | null) => void;
  /**
   * The words of the empty choice: «Bitte wählen» by default, or what «none» means here. An
   * optional field always offers it, so a choice can be taken back.
   */
  placeholder?: string | undefined;
}

/**
 * One choice from a short list, with the device's own picker: on the phone the wheel, at the
 * desk the list with type-ahead.
 */
export function SelectField<TValue extends string>({
  label,
  hint,
  error,
  hideLabel,
  optional,
  required = false,
  disabled,
  id,
  name,
  className,
  options,
  value,
  onChange,
  placeholder,
}: SelectFieldProps<TValue>) {
  const texts = useUiTexts();
  // A value that is no longer in the list shows as «nothing chosen».
  const chosen = options.find((option) => option.value === value);
  const missing = required && chosen === undefined;
  const { ref, submitted, onInvalid } = useSubmitGuard<HTMLSelectElement>(
    missing ? texts.field.required : null,
  );
  const shown = firstError(error, submitted && missing && texts.field.required);
  return (
    <Field
      label={label}
      hint={hint}
      error={shown}
      hideLabel={hideLabel}
      optional={optional}
      id={id}
      className={className}
    >
      {(control) => (
        <div className="relative">
          <select
            {...control}
            ref={ref}
            name={name}
            required={required}
            disabled={disabled}
            value={chosen?.value ?? ''}
            onChange={(event) => {
              const next = options.find((option) => option.value === event.target.value);
              onChange(next?.value ?? null);
            }}
            onInvalid={onInvalid}
            className={`${controlClass(shown !== undefined)} appearance-none pr-11 text-ellipsis`}
          >
            {chosen === undefined || !required ? (
              <option value="">{placeholder ?? texts.select.placeholder}</option>
            ) : null}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={20}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
          />
        </div>
      )}
    </Field>
  );
}
