// Origin: BanioX/Randen apps/web/src/ui/photo.ts @ e0f0907 — adapted: through the port `Device`; longest side, quality and size as parameters; bytes instead of a data URL (the storage keeps files as bytes); metadata such as the place of a photo removed from what the canvas writes
import type { DecodedImage, Device } from './ports';

/**
 * Makes a photo small on the device (SE-07, SE-08). The camera of a phone delivers several
 * megabytes with metadata (often the place the photo was taken); a spot, a damage or a receipt
 * needs far less to be recognised, and the place has no business on a device of a business.
 *
 * The picture is decoded upright as taken (the orientation the camera stored), drawn on a canvas
 * no larger than `maxSide`, and written anew as JPEG. What the canvas writes carries no metadata of
 * the original; to be sure, `stripJpegMetadata` removes every application segment but the first
 * (JFIF) and every comment from the result. Nothing is uploaded.
 */

export interface ShrinkOptions {
  /** The longest side of the result in pixels. Default 1600. */
  maxSide?: number | undefined;
  /** The JPEG quality to start with, 0 to 1. Default 0.82. */
  quality?: number | undefined;
  /**
   * The largest result in bytes. The quality steps down until it fits; if even the lowest is too
   * large, the picture gets smaller. Default 600 000.
   */
  maxBytes?: number | undefined;
}

export const PHOTO_DEFAULTS = Object.freeze({ maxSide: 1600, quality: 0.82, maxBytes: 600_000 });

/** The lowest quality a photo is written with: below it a photo shows blocks. */
const LOWEST_QUALITY = 0.42;
const QUALITY_STEP = 0.1;
/** Below this side even the lowest quality should fit; smaller pictures show nothing useful. */
const MIN_SIDE = 320;

/** A photo as it is kept: JPEG bytes and the size in pixels. */
export interface ShrunkPhoto {
  readonly bytes: Uint8Array;
  readonly mediaType: 'image/jpeg';
  readonly width: number;
  readonly height: number;
}

/**
 * Why a photo could not be made small: `unreadable` (no picture this browser can read),
 * `empty` (a picture without pixels), `no_canvas` (the device cannot draw), `no_jpeg` (it
 * cannot write JPEG), `too_large` (not even the smallest version fits `maxBytes`).
 */
export type PhotoProblem = 'unreadable' | 'empty' | 'no_canvas' | 'no_jpeg' | 'too_large';

export class PhotoError extends Error {
  readonly problem: PhotoProblem;
  constructor(problem: PhotoProblem, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PhotoError';
    this.problem = problem;
  }
}

function checked(options: ShrinkOptions): Required<{ [K in keyof ShrinkOptions]: number }> {
  const maxSide = options.maxSide ?? PHOTO_DEFAULTS.maxSide;
  const quality = options.quality ?? PHOTO_DEFAULTS.quality;
  const maxBytes = options.maxBytes ?? PHOTO_DEFAULTS.maxBytes;
  if (!Number.isInteger(maxSide) || maxSide < MIN_SIDE) {
    throw new RangeError(`maxSide is a whole number of at least ${String(MIN_SIDE)} pixels`);
  }
  if (!(quality > 0 && quality <= 1)) {
    throw new RangeError('quality lies above 0 and at most 1');
  }
  if (!Number.isInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError('maxBytes is a whole number of at least 1');
  }
  return { maxSide, quality, maxBytes };
}

/** The qualities to try, from the given one down to the lowest. */
export function qualitySteps(start: number): number[] {
  const steps = [start];
  for (let next = start - QUALITY_STEP; next >= LOWEST_QUALITY - 1e-9; next -= QUALITY_STEP) {
    steps.push(Math.round(next * 100) / 100);
  }
  return steps;
}

/** The size of the picture so that its longest side is at most `maxSide`; never larger than it was. */
export function fitWithin(width: number, height: number, maxSide: number): [number, number] {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

async function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Makes a photo small enough to keep, on the device: see the comment of the module. Rejects
 * with a `PhotoError` that names the problem; a `RangeError` for options of the wrong form.
 */
export async function shrinkPhoto(
  device: Device,
  file: Blob,
  options: ShrinkOptions = {},
): Promise<ShrunkPhoto> {
  const { maxSide, quality, maxBytes } = checked(options);
  let image: DecodedImage;
  try {
    image = await device.images.decode(file);
  } catch (error) {
    throw new PhotoError('unreadable', 'The picture could not be decoded', { cause: error });
  }
  try {
    if (image.width <= 0 || image.height <= 0) {
      throw new PhotoError('empty', 'The picture has no pixels');
    }
    let side = Math.min(maxSide, Math.max(image.width, image.height));
    for (;;) {
      const [width, height] = fitWithin(image.width, image.height, side);
      const canvas = device.images.createCanvas(width, height);
      const context = canvas.getContext('2d');
      if (context === null) {
        throw new PhotoError('no_canvas', 'This device cannot draw pictures');
      }
      // JPEG knows no transparency: without a white ground a cut-out picture turns black.
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image.source, 0, 0, width, height);
      for (const step of qualitySteps(quality)) {
        const blob = await canvas.toBlob('image/jpeg', step);
        if (blob?.type !== 'image/jpeg') {
          throw new PhotoError('no_jpeg', 'This device cannot write JPEG pictures');
        }
        const bytes = stripJpegMetadata(await bytesOf(blob));
        if (bytes.length <= maxBytes) {
          return { bytes, mediaType: 'image/jpeg', width, height };
        }
      }
      if (Math.max(width, height) <= MIN_SIDE) {
        throw new PhotoError('too_large', 'The picture cannot be made small enough');
      }
      side = Math.max(MIN_SIDE, Math.round(Math.max(width, height) * 0.75));
    }
  } finally {
    image.close();
  }
}

// --- JPEG metadata ------------------------------------------------------------------------------

const MARKER = 0xff;
const START_OF_IMAGE = 0xd8;
const START_OF_SCAN = 0xda;
/** APP0, the JFIF header: it says how to read the pixels and carries no metadata of a person. */
const APP0 = 0xe0;
const APP15 = 0xef;
const COMMENT = 0xfe;

function isMetadata(marker: number): boolean {
  return (marker > APP0 && marker <= APP15) || marker === COMMENT;
}

/**
 * The JPEG without its metadata: every application segment after APP0 (Exif with the place and
 * the time a photo was taken, XMP, ICC, maker notes) and every comment, up to the start of the
 * picture data, which stays as it is. Bytes that are no JPEG, or a JPEG that ends early, come
 * back unchanged: they are not ours to repair, and the caller wrote them itself.
 */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== MARKER || bytes[1] !== START_OF_IMAGE) {
    return bytes;
  }
  const kept: Uint8Array[] = [bytes.subarray(0, 2)];
  let at = 2;
  let removed = false;
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== MARKER) {
      return bytes;
    }
    const marker = bytes[at + 1] ?? 0;
    if (marker === START_OF_SCAN) {
      break;
    }
    const length = ((bytes[at + 2] ?? 0) << 8) | (bytes[at + 3] ?? 0);
    const end = at + 2 + length;
    if (length < 2 || end > bytes.length) {
      return bytes;
    }
    if (isMetadata(marker)) {
      removed = true;
    } else {
      kept.push(bytes.subarray(at, end));
    }
    at = end;
  }
  if (!removed) {
    return bytes;
  }
  kept.push(bytes.subarray(at));
  const result = new Uint8Array(kept.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of kept) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

/** True if the JPEG carries a segment `stripJpegMetadata` would remove. */
export function hasJpegMetadata(bytes: Uint8Array): boolean {
  return stripJpegMetadata(bytes) !== bytes;
}
