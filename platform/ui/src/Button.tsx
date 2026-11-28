// Origin: BanioX/Randen apps/web/src/ui/Button.tsx @ e0f0907 — adapted: tokens of the theme; variant quiet instead of ghost, no filled danger; the link through the link component of the app instead of a router; IconButton is new
import { LoaderCircle, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { KitLink, type KitLinkProps } from './context';

/**
 * `primary` is the one main action of a screen (accent, S-27). `secondary` stands beside it
 * («Abbrechen»), `quiet` is a lesser action in a row or a header, `danger` deletes or undoes
 * something that matters: text in the colour of «falsch» on a fine edge, never a fill.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
/** `md` is the main action of a screen (48 px), `sm` an action in a row or a header (44 px). */
export type ButtonSize = 'md' | 'sm';

/** The colour of each variant at rest. */
const variantClasses: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-accent text-on-accent',
  secondary: 'border border-line bg-surface text-fg',
  quiet: 'text-accent-strong',
  danger: 'border border-bad/40 bg-surface text-bad',
};

/** The hover and press feedback of each variant. A busy button drops it and keeps its colour. */
const variantFeedback: Readonly<Record<ButtonVariant, string>> = {
  primary: 'hover:brightness-95 active:brightness-90',
  secondary: 'hover:bg-surface-muted active:bg-surface-muted',
  quiet: 'hover:bg-accent-soft active:bg-accent-soft',
  danger: 'hover:bg-bad-soft active:bg-bad-soft',
};

const sizeClasses: Readonly<Record<ButtonSize, string>> = {
  md: 'min-h-12 gap-2 px-5',
  sm: 'min-h-11 gap-1.5 px-3.5 text-[0.9375rem]',
};

export interface ButtonLook {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  icon?: LucideIcon | undefined;
  fullWidth?: boolean | undefined;
  className?: string | undefined;
}

/**
 * The classes of a button, for an element of the app that must look like one (a link of the
 * router the kit does not know). A busy button keeps its colour and gives no feedback.
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  busy = false,
}: Omit<ButtonLook, 'icon'> & { busy?: boolean | undefined } = {}): string {
  // A busy button keeps its full colour: it is working, not switched off. Only a real disabled
  // button fades.
  const fade = busy ? 'cursor-progress' : 'disabled:opacity-50 aria-disabled:opacity-50';
  const feedback = busy ? '' : variantFeedback[variant];
  // `text-center` and `py-2`: a long label breaks into two lines instead of being cut off.
  return `inline-flex items-center justify-center rounded-xl py-2 text-center font-semibold transition ${fade} ${sizeClasses[size]} ${variantClasses[variant]} ${feedback} ${fullWidth ? 'w-full' : ''} ${className}`;
}

function Content({
  icon: Icon,
  size = 'md',
  spin = false,
  children,
}: {
  icon: LucideIcon | undefined;
  size: ButtonSize | undefined;
  spin?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <>
      {Icon ? (
        <Icon
          size={size === 'sm' ? 18 : 20}
          aria-hidden="true"
          className={`shrink-0 ${spin ? 'animate-spin motion-reduce:animate-none' : ''}`}
        />
      ) : null}
      {children}
    </>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonLook {
  /** The action is running: the symbol turns, the label stays, no second press. */
  busy?: boolean | undefined;
}

/**
 * A button. `busy` says that the action is running: the symbol turns, the label stays,
 * `aria-busy` tells assistive technology why, and a press does nothing. The button is then
 * `aria-disabled` rather than `disabled`, so it keeps the focus and its place in the tab order
 * (a native disabled button would drop the focus). `disabled` is only for «not possible now».
 */
export function Button({
  variant,
  size,
  icon,
  fullWidth,
  className,
  type = 'button',
  busy = false,
  disabled = false,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className, busy })}
      disabled={disabled}
      aria-disabled={busy ? 'true' : undefined}
      aria-busy={busy ? 'true' : undefined}
      onClick={(event) => {
        // A busy button swallows the press, including the submit of its form.
        if (busy) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...rest}
    >
      <Content icon={busy ? LoaderCircle : icon} size={size} spin={busy}>
        {children}
      </Content>
    </button>
  );
}

export interface ButtonLinkProps extends ButtonLook, Omit<KitLinkProps, 'className'> {}

/** A link that looks like a button: for an action that opens another page. */
export function ButtonLink({
  variant,
  size,
  icon,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <KitLink className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      <Content icon={icon} size={size}>
        {children}
      </Content>
    </KitLink>
  );
}

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label'
> {
  icon: LucideIcon;
  /** The name of the button, read out and shown as a tip: «Einstellungen», «Schliessen». */
  label: string;
}

/**
 * A round button with a symbol only, 44 px: the cogwheel of the settings at the top right
 * (S-26), the cross of a sheet. The label is its name for screen readers and the tip.
 */
export function IconButton({
  icon: Icon,
  label,
  type = 'button',
  className = '',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted active:bg-surface-muted disabled:opacity-50 ${className}`}
      {...rest}
    >
      <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
