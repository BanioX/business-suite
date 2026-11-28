// Origin: BanioX/Randen apps/web/src/ui/print.ts @ e0f0907 — adapted: the decision of the way to print and the tap as functions over the port, without React; the hook that keeps the PDF ready lives in the React part (web/print.tsx)
import type { Device } from './ports';
import { isInstalledIos, shareOrDownload, type ShareOutcome } from './share';

/**
 * Printing a page (SE-06). In a browser the tap opens the print dialog, as always. In the app
 * installed on an iPhone or iPad `window.print()` does nothing (WebKit bug 327504): there the
 * page's PDF is built on the device before the tap, and the tap hands the finished file to the
 * share sheet, which offers «Drucken» and «In Dateien sichern». Where neither exists, the PDF is
 * downloaded: the last way out.
 */

/**
 * How this device prints:
 * - `dialog`: the print dialog of the browser;
 * - `share`: the PDF of the page through the share sheet (installed iOS app);
 * - `download`: no print dialog at all; the PDF is saved as a file.
 */
export type PrintMode = 'dialog' | 'share' | 'download';

export function printMode(device: Device): PrintMode {
  if (isInstalledIos(device.environment)) {
    return 'share';
  }
  return device.print === undefined ? 'download' : 'dialog';
}

/** True if the PDF must be ready before the tap: only the print dialog needs none. */
export function needsPdf(mode: PrintMode): boolean {
  return mode !== 'dialog';
}

/**
 * What a tap on «Drucken» did:
 * - `dialog`: the print dialog opened;
 * - an outcome of `shareOrDownload` for the PDF.
 */
export type PrintOutcome = 'dialog' | ShareOutcome;

/**
 * The tap on «Drucken». Call it in the tap handler itself, never after an `await`: the share
 * sheet needs the tap. `file` is the PDF of the page, built before the tap; it is needed in the
 * modes `share` and `download` (without it the tap does nothing and returns `failed`).
 */
export function printPage(
  device: Device,
  mode: PrintMode,
  file: File | null,
  options: { title?: string | undefined } = {},
): Promise<PrintOutcome> {
  if (mode === 'dialog' && device.print !== undefined) {
    device.print();
    return Promise.resolve('dialog');
  }
  if (file === null) {
    return Promise.resolve('failed');
  }
  return shareOrDownload(device, file, options);
}
