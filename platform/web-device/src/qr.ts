import jsQR from 'jsqr';
import type { Device, DecodedImage } from './ports';

/**
 * Reading a QR code (P-10), on the device: the code reader of the browser (`BarcodeDetector`)
 * where it has one that reads QR, else a decoder that ships in the bundle (`jsqr`, Apache-2.0,
 * pure JavaScript: no CDN, no WebAssembly, so the CSP stays `'self'`). The page always offers a
 * typed field beside it: a code that cannot be read can still be typed.
 *
 * The picture comes from the camera (a frame of the video) or from a file the person chose; it
 * is read in memory and never kept.
 */

/** The format name of the Barcode Detection API for QR. */
export const QR_FORMAT = 'qr_code';

/** Larger pictures are drawn smaller before the decoder of the bundle reads them: fast enough. */
export const QR_MAX_SIDE = 1024;

/** Reads the text of a QR code from the pixels of a picture, or null. */
export type QrDecoder = (pixels: Uint8ClampedArray, width: number, height: number) => string | null;

/** The decoder of the bundle. */
export const bundledQrDecoder: QrDecoder = (pixels, width, height) =>
  jsQR(pixels, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null;

/** Which reader this device uses: the browser's own, or the one of the bundle. */
export type QrReaderKind = 'native' | 'bundled';

/** True if the browser has a code reader that reads QR. Never throws. */
export async function hasNativeQr(device: Device): Promise<boolean> {
  if (device.codes === undefined) {
    return false;
  }
  try {
    return (await device.codes.formats()).includes(QR_FORMAT);
  } catch {
    return false;
  }
}

/** A picture to read: a frame of the video or a decoded file, with its size in pixels. */
export interface QrSource {
  readonly source: CanvasImageSource & ImageBitmapSource;
  readonly width: number;
  readonly height: number;
}

export interface QrReader {
  readonly kind: QrReaderKind;
  /** The text of the first QR code in the picture, or null. Never throws. */
  read: (picture: QrSource) => Promise<string | null>;
}

/**
 * The reader of this device: the browser's own where it reads QR, else the one of the bundle.
 * `decoder` replaces the decoder of the bundle (a test).
 */
export async function createQrReader(
  device: Device,
  decoder: QrDecoder = bundledQrDecoder,
): Promise<QrReader> {
  const codes = device.codes;
  if (codes !== undefined && (await hasNativeQr(device))) {
    return {
      kind: 'native',
      read: async ({ source }) => {
        try {
          const [first] = await codes.detect(source, [QR_FORMAT]);
          return first?.rawValue ?? null;
        } catch {
          return null;
        }
      },
    };
  }
  return {
    kind: 'bundled',
    read: (picture) => Promise.resolve(readWithDecoder(device, picture, decoder)),
  };
}

function readWithDecoder(device: Device, picture: QrSource, decoder: QrDecoder): string | null {
  if (picture.width <= 0 || picture.height <= 0) {
    return null;
  }
  const scale = Math.min(1, QR_MAX_SIDE / Math.max(picture.width, picture.height));
  const width = Math.max(1, Math.round(picture.width * scale));
  const height = Math.max(1, Math.round(picture.height * scale));
  try {
    const canvas = device.images.createCanvas(width, height);
    const context = canvas.getContext('2d');
    if (context === null) {
      return null;
    }
    context.drawImage(picture.source, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);
    return decoder(data, width, height);
  } catch {
    return null;
  }
}

/**
 * Reads a QR code from a picture file the person chose (a photo or a screenshot). Null if the
 * file is no picture or holds no code this reader finds. Never throws.
 */
export async function readQrFromFile(
  device: Device,
  reader: QrReader,
  file: Blob,
): Promise<string | null> {
  let image: DecodedImage;
  try {
    image = await device.images.decode(file);
  } catch {
    return null;
  }
  try {
    return await reader.read({
      source: image.source,
      width: image.width,
      height: image.height,
    });
  } finally {
    image.close();
  }
}

/** A typed code: trimmed, inner spaces kept; null if nothing is left. */
export function typedCode(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}
