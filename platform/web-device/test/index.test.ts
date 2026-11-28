import { describe, expect, it } from 'vitest';
import * as device from '../src/index';
import * as web from '../src/web/index';

/** The public surface of both entries, pinned: a new export is a decision, not an accident. */
describe('the entries of @onestrand/web-device', () => {
  it('exports the logic and the port, and no React', () => {
    expect(Object.keys(device).sort()).toEqual(
      [
        'CAMERA_PROBLEMS',
        'PHOTO_DEFAULTS',
        'PhotoError',
        'QR_FORMAT',
        'QR_MAX_SIDE',
        'SIGNATURE_INK',
        'SIGNATURE_LINE',
        'SIGNATURE_SCALE',
        'SignatureError',
        'TARGET_ZOOM',
        'VIDEO_SIZE',
        'bundledQrDecoder',
        'cameraAvailability',
        'cameraPermission',
        'cameraFeatures',
        'cameraProblemOf',
        'canShareFiles',
        'checksumOf',
        'copyText',
        'createBrowserDevice',
        'createQrReader',
        'downloadFile',
        'drawSignature',
        'drawnSignature',
        'errorName',
        'fileHandedOver',
        'fitWithin',
        'hasJpegMetadata',
        'hasNativeQr',
        'holdWakeLock',
        'isAbort',
        'isBlank',
        'isInstalledIos',
        'needsPdf',
        'openBackCamera',
        'pickMainBackCamera',
        'printMode',
        'printPage',
        'qualitySteps',
        'readQrFromFile',
        'roundPoint',
        'shareOrDownload',
        'showActionCount',
        'shrinkPhoto',
        'signaturePng',
        'startCamera',
        'stopStream',
        'stripJpegMetadata',
        'tuneForCodes',
        'typedCode',
        'typedSignature',
        'zoomFor',
      ].sort(),
    );
  });

  it('exports the visible parts from /web', () => {
    expect(Object.keys(web).sort()).toEqual(
      [
        'DeviceProvider',
        'FilePickButton',
        'PhotoField',
        'PhotoViewer',
        'PrintButton',
        'PrintNoticeSheet',
        'QR_SCAN_INTERVAL_MS',
        'QrReaderPanel',
        'ShareButton',
        'SignaturePad',
        'ZoomablePhoto',
        'deviceMessages',
        'useActionCount',
        'useDevice',
        'useDeviceTexts',
        'usePrintAction',
        'useWakeLock',
      ].sort(),
    );
  });

  it('freezes its lists', () => {
    expect(Object.isFrozen(device.CAMERA_PROBLEMS)).toBe(true);
    expect(Object.isFrozen(device.PHOTO_DEFAULTS)).toBe(true);
  });
});
