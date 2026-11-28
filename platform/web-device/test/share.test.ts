import { describe, expect, it } from 'vitest';
import {
  canShareFiles,
  downloadFile,
  errorName,
  fileHandedOver,
  isAbort,
  isInstalledIos,
  needsPdf,
  printMode,
  printPage,
  shareOrDownload,
} from '../src/index';
import { createFakeDevice, IPAD_AGENT, IPHONE_AGENT } from './fake-device';

const pdf = () =>
  new File([new Uint8Array([37, 80, 68, 70])], 'rapport.pdf', { type: 'application/pdf' });
const STANDALONE = '(display-mode: standalone), (display-mode: fullscreen)';

function abort(): DOMException {
  return new DOMException('closed', 'AbortError');
}

describe('isInstalledIos', () => {
  it('is true on an iPhone opened from the Home Screen', () => {
    const device = createFakeDevice({ userAgent: IPHONE_AGENT, standalone: true });
    expect(isInstalledIos(device.environment)).toBe(true);
  });

  it('is true on an iPad that says «Macintosh» but has touch, in the display mode of an app', () => {
    const device = createFakeDevice({
      userAgent: IPAD_AGENT,
      maxTouchPoints: 5,
      media: [STANDALONE],
    });
    expect(isInstalledIos(device.environment)).toBe(true);
  });

  it('is false in Safari on the iPhone, on a Mac app in the Dock and on an installed desktop app', () => {
    expect(isInstalledIos(createFakeDevice({ userAgent: IPHONE_AGENT }).environment)).toBe(false);
    const mac = createFakeDevice({ userAgent: IPAD_AGENT, maxTouchPoints: 0, standalone: true });
    expect(isInstalledIos(mac.environment)).toBe(false);
    const desktop = createFakeDevice({ media: [STANDALONE] });
    expect(isInstalledIos(desktop.environment)).toBe(false);
  });
});

describe('shareOrDownload', () => {
  it('hands the file to the share sheet without text, with the title where one is given', async () => {
    const seen: ShareData[] = [];
    const device = createFakeDevice({
      share: (data) => {
        seen.push(data);
        return Promise.resolve();
      },
    });
    const file = pdf();
    expect(await shareOrDownload(device, file, { title: 'Rapport' })).toBe('shared');
    expect(await shareOrDownload(device, file)).toBe('shared');
    expect(seen).toEqual([{ files: [file], title: 'Rapport' }, { files: [file] }]);
    expect(seen.every((data) => data.text === undefined)).toBe(true);
  });

  it('takes the closed sheet as a cancel and downloads nothing', async () => {
    const device = createFakeDevice({ share: () => Promise.reject(abort()) });
    expect(await shareOrDownload(device, pdf())).toBe('cancelled');
    expect(device.log).toEqual([]);
  });

  it.each([
    ['the tap was too long ago', new DOMException('late', 'NotAllowedError')],
    ['the file is refused', new TypeError('files')],
  ])('downloads the file when %s', async (_why, error) => {
    const device = createFakeDevice({ share: () => Promise.reject(error) });
    expect(await shareOrDownload(device, pdf())).toBe('downloaded');
    expect(device.log).toEqual(['download:rapport.pdf']);
  });

  it('downloads where the browser has no share sheet, or none for files', async () => {
    const none = createFakeDevice({ share: undefined });
    expect(await shareOrDownload(none, pdf())).toBe('downloaded');
    const noFiles = createFakeDevice({ canShare: () => false });
    expect(await shareOrDownload(noFiles, pdf())).toBe('downloaded');
    expect(noFiles.log).toEqual(['download:rapport.pdf']);
    const throwing = createFakeDevice({
      canShare: () => {
        throw new TypeError('no');
      },
    });
    expect(canShareFiles(throwing, [pdf()])).toBe(false);
  });

  it('fails when not even the download can start', async () => {
    const device = createFakeDevice({ share: undefined, download: () => false });
    expect(await shareOrDownload(device, pdf())).toBe('failed');
    const throwing = createFakeDevice({
      download: () => {
        throw new Error('blocked');
      },
    });
    expect(downloadFile(throwing, pdf(), 'x.pdf')).toBe(false);
  });
});

describe('fileHandedOver', () => {
  it('counts a download as kept everywhere but in the installed iOS app', () => {
    expect(fileHandedOver('shared', true)).toBe(true);
    expect(fileHandedOver('downloaded', false)).toBe(true);
    expect(fileHandedOver('downloaded', true)).toBe(false);
    expect(fileHandedOver('cancelled', false)).toBe(false);
    expect(fileHandedOver('failed', false)).toBe(false);
  });
});

describe('errors of the browser', () => {
  it('reads the name of an error from any realm', () => {
    expect(errorName(abort())).toBe('AbortError');
    expect(errorName({ name: 'NotAllowedError' })).toBe('NotAllowedError');
    expect(errorName({ name: 3 })).toBeUndefined();
    expect(errorName('AbortError')).toBeUndefined();
    expect(errorName(null)).toBeUndefined();
    expect(isAbort(abort())).toBe(true);
    expect(isAbort(new Error('x'))).toBe(false);
  });
});

describe('printing', () => {
  it('opens the print dialog in a browser and needs no PDF there', async () => {
    const device = createFakeDevice();
    expect(printMode(device)).toBe('dialog');
    expect(needsPdf('dialog')).toBe(false);
    expect(await printPage(device, 'dialog', null)).toBe('dialog');
    expect(device.log).toEqual(['print']);
  });

  it('shares the PDF in the app installed on an iPhone, where the print dialog does nothing', async () => {
    const device = createFakeDevice({ userAgent: IPHONE_AGENT, standalone: true });
    expect(printMode(device)).toBe('share');
    expect(needsPdf('share')).toBe(true);
    expect(await printPage(device, 'share', pdf(), { title: 'Rapport' })).toBe('shared');
    expect(device.log).toEqual(['share:rapport.pdf']);
  });

  it('downloads the PDF where there is no print dialog, and does nothing without a PDF', async () => {
    const device = createFakeDevice({ print: undefined, share: undefined });
    expect(printMode(device)).toBe('download');
    expect(await printPage(device, 'download', null)).toBe('failed');
    expect(device.log).toEqual([]);
    expect(await printPage(device, 'download', pdf())).toBe('downloaded');
    expect(device.log).toEqual(['download:rapport.pdf']);
  });

  it('falls back to the PDF when the dialog mode meets a device without a dialog', async () => {
    const device = createFakeDevice({ print: undefined });
    expect(await printPage(device, 'dialog', pdf())).toBe('shared');
  });
});
