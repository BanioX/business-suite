// Origin: BanioX/Randen apps/web/src/ui/share-file.ts @ e0f0907 — adapted: every touch of the browser through the port `Device` (no global, no window); no product name in the texts of the code; the iOS check takes the environment of the port
import type { Device, EnvironmentPort } from './ports';

/**
 * Hands a file out of the app (SE-04 share, SE-05 download). Nothing is sent anywhere: the
 * person picks in the share sheet where the file goes, or the browser saves it.
 *
 * Why the share sheet: since iOS and iPadOS 27, the print dialog does not open in a web app
 * installed to the Home Screen (WebKit bug 327504), and a download there opens a preview instead
 * of saving. The share sheet works there and offers «Drucken» and «In Dateien sichern».
 *
 * Rules of the share sheet:
 * - `navigator.share` needs the tap itself (transient user activation). The file must be ready
 *   before the tap; call `shareOrDownload` directly in the tap handler, not after an `await`.
 * - Files are shared without text, else some targets drop the file.
 * - `canShare({ files })` first; desktop Firefox has no `share` at all.
 * - `AbortError` means the person closed the sheet: a normal cancel, nothing to report.
 */

export type ShareOutcome = 'shared' | 'cancelled' | 'downloaded' | 'failed';

/** An iPhone, iPod or iPad; iPadOS says «Macintosh» but is the only one of those with touch. */
function isIosDevice(environment: EnvironmentPort): boolean {
  const agent = environment.userAgent;
  if (/\b(iPhone|iPad|iPod)\b/.test(agent)) {
    return true;
  }
  return /\bMacintosh\b/.test(agent) && environment.maxTouchPoints > 1;
}

/**
 * True in an app installed to the Home Screen of an iPhone or iPad. Only on an iOS device: a Mac
 * web app added to the Dock also reports `navigator.standalone`, and there the print dialog
 * works. On the device `navigator.standalone` is the sure sign; else the display mode, where an
 * installed app can report `fullscreen` instead of `standalone` (WebKit bug 264218). The display
 * mode alone is never enough: Android and desktop apps report it too.
 */
export function isInstalledIos(environment: EnvironmentPort): boolean {
  if (!isIosDevice(environment)) {
    return false;
  }
  if (environment.standalone === true) {
    return true;
  }
  return environment.matches('(display-mode: standalone), (display-mode: fullscreen)');
}

/** True if this browser can hand these files to the share sheet. */
export function canShareFiles(device: Device, files: readonly File[]): boolean {
  if (device.files.share === undefined) {
    return false;
  }
  try {
    return device.files.canShare(files);
  } catch {
    return false;
  }
}

/**
 * True if the file left the app and is kept somewhere after this outcome, so a backup counts as
 * saved. In the installed iOS app a download only opens a preview, which is gone once it is
 * closed: there only `shared` counts. Elsewhere a download saves the file.
 */
export function fileHandedOver(outcome: ShareOutcome, installedIos: boolean): boolean {
  return outcome === 'shared' || (outcome === 'downloaded' && !installedIos);
}

export interface ShareOptions {
  /** The subject, where a share target uses one (Mail). */
  title?: string | undefined;
}

/**
 * Hands the file to the share sheet, or downloads it where sharing files is not possible.
 *
 * - `shared`: the person chose a target in the sheet.
 * - `cancelled`: the person closed the sheet (`AbortError`); nothing else happens.
 * - `downloaded`: no share sheet for files, or the sheet refused (`NotAllowedError` when the tap
 *   was too long ago, `TypeError`, `DataError`): the file is downloaded instead. The download is
 *   the one path left; refusing silently would leave a button that does nothing. In the installed
 *   iOS app it only opens a preview: see `fileHandedOver`.
 * - `failed`: the download could not start either. The page says what to do.
 */
export async function shareOrDownload(
  device: Device,
  file: File,
  options: ShareOptions = {},
): Promise<ShareOutcome> {
  const share = device.files.share;
  if (share !== undefined && canShareFiles(device, [file])) {
    try {
      // Files without text: some targets keep only the text when both come.
      await share(
        options.title === undefined ? { files: [file] } : { files: [file], title: options.title },
      );
      return 'shared';
    } catch (error) {
      if (isAbort(error)) {
        return 'cancelled';
      }
    }
  }
  return downloadFile(device, file, file.name) ? 'downloaded' : 'failed';
}

/** Saves the file through the port; false if the browser cannot even start the download. */
export function downloadFile(device: Device, file: Blob, name: string): boolean {
  try {
    return device.files.download(file, name);
  } catch {
    return false;
  }
}

/** The person closed a sheet or a dialog of the browser: a normal cancel. */
export function isAbort(error: unknown): boolean {
  return errorName(error) === 'AbortError';
}

/** The name of a `DOMException` or an `Error`, without relying on `instanceof` across realms. */
export function errorName(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const { name } = error;
    return typeof name === 'string' ? name : undefined;
  }
  return undefined;
}
