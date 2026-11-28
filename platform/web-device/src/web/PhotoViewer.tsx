// Origin: BanioX/Randen apps/web/src/ui/PhotoViewer.tsx @ e0f0907 — adapted: a modal <dialog> with showModal (above everything, the page behind inert) instead of a portal, so no react-dom; tokens of the theme instead of black and white; texts from the catalogue of the device
import { Maximize2, X } from 'lucide-react';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useDeviceTexts } from './context';

export interface PhotoViewerProps {
  /** The address of the picture (`preview` of the port, or a file of the app). */
  src: string;
  /** What the photo shows: the name over the large view and for screen readers. */
  title: string;
  open: boolean;
  onClose: () => void;
}

/**
 * A photo over the whole screen: the ground of the app, the photo centred and whole, the name on
 * top and «Schliessen» in reach of the thumb. Escape, «Schliessen» or a tap beside the photo close
 * it. Built on `<dialog>` and `showModal()`, so it lies above everything and the page behind it is
 * inert; the focus starts on «Schliessen» and returns to what opened it.
 */
export function PhotoViewer({ src, title, open, onClose }: PhotoViewerProps) {
  const texts = useDeviceTexts().photo;
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const native = useRef(false);

  useEffect(() => {
    const element = dialog.current;
    if (element === null || !open) {
      return;
    }
    const opener = document.activeElement;
    native.current = typeof element.showModal === 'function';
    if (native.current) {
      element.showModal();
    } else {
      element.setAttribute('open', '');
    }
    close.current?.focus();
    return () => {
      if (native.current) {
        element.close();
      } else {
        element.removeAttribute('open');
      }
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }
    };
  }, [open]);

  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      aria-modal="true"
      aria-label={title}
      onCancel={onCancel}
      onKeyDown={(event) => {
        if (!native.current && event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-full max-w-none flex-col border-0 bg-ground p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-fg backdrop:bg-scrim open:flex"
    >
      {open ? (
        <>
          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <p className="min-w-0 truncate font-semibold">{title}</p>
            <button
              ref={close}
              type="button"
              onClick={onClose}
              aria-label={texts.close}
              title={texts.close}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-fg shadow-card hover:bg-surface-muted"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center p-3"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                onClose();
              }
            }}
          >
            <img
              src={src}
              alt={title}
              className="max-h-full max-w-full rounded-xl object-contain"
            />
          </div>
        </>
      ) : null}
    </dialog>
  );
}

/**
 * A photo that shows it can grow: a tap opens it over the whole screen. The small corner mark
 * says so, because a long press (the browser's own preview) is found by nobody.
 */
export function ZoomablePhoto({
  src,
  title,
  className = '',
}: {
  src: string;
  title: string;
  /** Size and shape of the small picture, e.g. `aspect-[4/3]`. */
  className?: string | undefined;
}) {
  const texts = useDeviceTexts().photo;
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className={`group relative block min-h-11 w-full overflow-hidden rounded-2xl border border-line bg-surface-muted ${className}`}
      >
        <img src={src} alt="" className="size-full object-cover" />
        <span
          aria-hidden="true"
          className="absolute right-2 bottom-2 inline-flex size-9 items-center justify-center rounded-full bg-surface text-fg shadow-card"
        >
          <Maximize2 size={18} />
        </span>
        <span className="sr-only">{texts.open(title)}</span>
      </button>
      <PhotoViewer
        src={src}
        title={title}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
