// Origin: BanioX/Randen apps/web/src/ui/PhotoField.tsx @ e0f0907 — adapted: the file input dressed as a button on its own, with the look of a secondary button of @onestrand/ui; `capture` only for «Foto aufnehmen»
import type { LucideIcon } from 'lucide-react';
import { buttonClasses, type ButtonVariant } from '@onestrand/ui';

export interface FilePickButtonProps {
  icon: LucideIcon;
  /** What the button does: «Foto aufnehmen», «Aus Dateien wählen». */
  text: string;
  /** Added for screen readers after the text, so two buttons on a page differ (`, Foto der Stelle`). */
  context?: string | undefined;
  /** `image/*` for pictures. */
  accept: string;
  /**
   * `environment` opens the back camera of a phone at once (SE-08). Without it the device offers
   * both its camera and its files, so a device without a camera still has a way.
   */
  capture?: 'environment' | undefined;
  disabled?: boolean | undefined;
  variant?: ButtonVariant | undefined;
  fullWidth?: boolean | undefined;
  onFile: (file: File) => void;
}

/**
 * A file input dressed as a button (SE-08). The camera app or the file picker opens only on this
 * tap. The same file can be chosen again after a failure.
 */
export function FilePickButton({
  icon: Icon,
  text,
  context,
  accept,
  capture,
  disabled = false,
  variant = 'secondary',
  fullWidth,
  onFile,
}: FilePickButtonProps) {
  return (
    <label
      className={`${buttonClasses({ variant, fullWidth })} relative cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-edge has-disabled:cursor-not-allowed has-disabled:opacity-50`}
    >
      <Icon size={20} aria-hidden="true" className="shrink-0" />
      {text}
      {context === undefined ? null : <span className="sr-only">{context}</span>}
      <input
        type="file"
        accept={accept}
        capture={capture}
        disabled={disabled}
        className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file !== undefined) {
            onFile(file);
          }
        }}
      />
    </label>
  );
}
