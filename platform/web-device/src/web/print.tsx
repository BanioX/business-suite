// Origin: BanioX/Randen apps/web/src/ui/print.ts @ e0f0907 — adapted: the way to print from `printMode` of the port (dialog, share, download); the PDF is kept ready for both ways that need it; the outcome of a download is told
// Origin: BanioX/Randen apps/web/src/ui/PrintButton.tsx @ e0f0907 — adapted: built with @onestrand/ui; texts from the catalogue of the device; a share button for any prepared file beside the print button
import { Printer, Share, type LucideIcon } from 'lucide-react';
import { Button, Sheet, useToast, type ButtonSize, type ButtonVariant } from '@onestrand/ui';
import { useCallback, useEffect, useState } from 'react';
import { needsPdf, printMode, printPage, type PrintMode } from '../print';
import { shareOrDownload, type ShareOutcome } from '../share';
import { useDevice, useDeviceTexts } from './context';

/** The PDF of a page. Every print button has one: no page prints without it. */
export interface PrintPdf {
  /**
   * Builds the PDF from the page's data, or `undefined` while the data loads. Keep it stable
   * (`useMemo`, `useCallback`): a new function builds the PDF again, for new data.
   */
  buildPdf: (() => Promise<Blob>) | undefined;
  fileName: string;
  /** The subject, where a share target uses one (Mail). */
  title?: string | undefined;
}

/**
 * `buildFailed`: the PDF could not be prepared; `retry` builds it again. `failed`: the finished
 * PDF could be neither shared nor saved.
 */
export type PrintNotice = 'buildFailed' | 'failed';

export interface PrintAction {
  /** How this device prints: the print dialog, the PDF through the share sheet, or as a download. */
  mode: PrintMode;
  /** For the tap: call it in the tap handler itself, never after an `await`. */
  print: () => void;
  /** The PDF is being built or handed out: the button turns and takes no second tap. */
  busy: boolean;
  /** A calm notice the page shows after a tap, or null. */
  notice: PrintNotice | null;
  dismiss: () => void;
  /** After `buildFailed`: closes the notice and builds the PDF again. */
  retry: () => void;
}

interface Built {
  build: () => Promise<Blob>;
  /** The name it was built for: a new name (another period, another area) builds again. */
  fileName: string;
  /** Which try this is: a retry builds again from the same data. */
  attempt: number;
  file: File | null;
}

/**
 * Printing a page (SE-06). In a browser the tap opens the print dialog. In the app installed on
 * an iPhone or iPad, and where there is no print dialog, the page's PDF is built on the device as
 * soon as its data is there, so the tap can hand the finished file to the share sheet (the sheet
 * needs the tap itself) or save it.
 */
export function usePrintAction(pdf: PrintPdf): PrintAction {
  const device = useDevice();
  const toast = useToast();
  const texts = useDeviceTexts();
  const [mode] = useState(() => printMode(device));
  const [built, setBuilt] = useState<Built | null>(null);
  const [handing, setHanding] = useState(false);
  const [notice, setNotice] = useState<PrintNotice | null>(null);
  const [attempt, setAttempt] = useState(0);

  const build = needsPdf(mode) ? pdf.buildPdf : undefined;
  const { fileName, title } = pdf;

  // Built while the page is open, so the file is ready before the tap (transient activation).
  useEffect(() => {
    if (build === undefined) {
      return;
    }
    const state = { cancelled: false };
    build().then(
      (blob) => {
        if (!state.cancelled) {
          const file = new File([blob], fileName, { type: 'application/pdf' });
          setBuilt({ build, fileName, attempt, file });
        }
      },
      () => {
        if (!state.cancelled) {
          setBuilt({ build, fileName, attempt, file: null });
        }
      },
    );
    return () => {
      state.cancelled = true;
    };
  }, [build, fileName, attempt]);

  // A PDF built from older data or for another name, or a failure before the retry, does not count.
  const current =
    built !== null &&
    built.build === build &&
    built.fileName === fileName &&
    built.attempt === attempt
      ? built
      : null;
  const file = current?.file ?? null;
  const buildFailed = current !== null && current.file === null;

  const print = useCallback(() => {
    if (!needsPdf(mode)) {
      void printPage(device, mode, null);
      return;
    }
    if (buildFailed) {
      setNotice('buildFailed');
      return;
    }
    if (file === null || handing) {
      return;
    }
    setHanding(true);
    void printPage(device, mode, file, { title }).then((outcome) => {
      setHanding(false);
      if (outcome === 'failed') {
        setNotice('failed');
      } else if (outcome === 'downloaded' && mode === 'download') {
        toast({ text: texts.print.downloaded, tone: 'ok' });
      }
    });
  }, [device, mode, buildFailed, file, handing, title, toast, texts]);

  const dismiss = useCallback(() => {
    setNotice(null);
  }, []);

  const retry = useCallback(() => {
    setNotice(null);
    setAttempt((count) => count + 1);
  }, []);

  return {
    mode,
    print,
    busy: needsPdf(mode) && !buildFailed && (file === null || handing),
    notice,
    dismiss,
    retry,
  };
}

/**
 * What a tap on «Drucken» could not do: the PDF of this page could not be prepared
 * (`buildFailed`, with «Noch einmal»), or could not be handed out (`failed`). Calm, with what works.
 */
export function PrintNoticeSheet({
  action,
}: {
  action: Pick<PrintAction, 'notice' | 'dismiss' | 'retry'>;
}) {
  const texts = useDeviceTexts().print;
  const { notice, dismiss, retry } = action;
  return (
    <Sheet
      open={notice !== null}
      onClose={dismiss}
      title={texts.sheetTitle}
      hideClose
      footer={
        notice === 'buildFailed' ? (
          <div className="flex flex-col gap-2">
            <Button fullWidth onClick={retry}>
              {texts.retry}
            </Button>
            <Button fullWidth variant="secondary" onClick={dismiss}>
              {texts.close}
            </Button>
          </div>
        ) : (
          <Button fullWidth onClick={dismiss}>
            {texts.close}
          </Button>
        )
      }
    >
      <p>{notice === 'failed' ? texts.failed : texts.buildFailed}</p>
    </Sheet>
  );
}

export interface PrintButtonProps {
  pdf: PrintPdf;
  /** Default «Drucken». */
  label?: string | undefined;
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  icon?: LucideIcon | undefined;
  disabled?: boolean | undefined;
  fullWidth?: boolean | undefined;
  className?: string | undefined;
}

/**
 * «Drucken» on a page: the print dialog in a browser; in the app installed on an iPhone or iPad
 * the page's PDF through the share sheet, with a word that says where «Drucken» is there. `pdf` is
 * required: a page prints on every device or has no print button.
 */
export function PrintButton({
  pdf,
  label,
  variant = 'secondary',
  size,
  icon = Printer,
  disabled,
  fullWidth,
  className,
}: PrintButtonProps) {
  const texts = useDeviceTexts().print;
  const action = usePrintAction(pdf);
  return (
    <>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        busy={action.busy}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
        aria-description={action.mode === 'share' ? texts.shareHint : undefined}
        onClick={action.print}
      >
        {label ?? texts.print}
      </Button>
      <span role="status" className="sr-only">
        {action.busy && !action.notice ? texts.preparing : ''}
      </span>
      <PrintNoticeSheet action={action} />
    </>
  );
}

export interface ShareButtonProps {
  /** The file to hand out, ready before the tap; null while it is being made (the button turns). */
  file: File | null;
  /** The subject, where a share target uses one (Mail). */
  title?: string | undefined;
  /** Default «Teilen». */
  label?: string | undefined;
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
  /** Hears how it went: a backup counts as kept after `fileHandedOver`. */
  onOutcome?: ((outcome: ShareOutcome) => void) | undefined;
}

/**
 * «Teilen» for a file the page has made (a PDF, a backup, an export): the share sheet of the
 * device, else a download. The file must be ready before the tap.
 */
export function ShareButton({
  file,
  title,
  label,
  variant = 'secondary',
  size,
  fullWidth,
  onOutcome,
}: ShareButtonProps) {
  const device = useDevice();
  const toast = useToast();
  const texts = useDeviceTexts().share;
  const [handing, setHanding] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      icon={Share}
      fullWidth={fullWidth}
      busy={file === null || handing}
      onClick={() => {
        if (file === null || handing) {
          return;
        }
        setHanding(true);
        void shareOrDownload(device, file, { title }).then((outcome) => {
          setHanding(false);
          if (outcome === 'failed') {
            toast({ text: texts.failed, tone: 'bad' });
          } else if (outcome === 'downloaded') {
            toast({ text: texts.downloaded, tone: 'ok' });
          }
          onOutcome?.(outcome);
        });
      }}
    >
      {label ?? texts.share}
    </Button>
  );
}
