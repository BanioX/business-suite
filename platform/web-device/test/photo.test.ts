import { describe, expect, it } from 'vitest';
import {
  fitWithin,
  hasJpegMetadata,
  PHOTO_DEFAULTS,
  PhotoError,
  qualitySteps,
  shrinkPhoto,
  stripJpegMetadata,
} from '../src/index';
import { createFakeDevice, fakeImage, jpeg } from './fake-device';

const EXIF = 0xe1;
const XMP_OR_ICC = 0xe2;
const COMMENT = 0xfe;
const JFIF = 0xe0;
const QUANT = 0xdb;

/** Exif with a place: the bytes are only a stand-in, what counts is the segment. */
const PLACE = [...new TextEncoder().encode('Exif'), 0, 0, 47, 11, 8, 46];

const photo = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });

async function problemOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return error instanceof PhotoError ? error.problem : `other: ${String(error)}`;
  }
  return 'none';
}

describe('stripJpegMetadata', () => {
  it('removes Exif, other application segments and comments, and keeps JFIF and the picture', () => {
    const withPlace = jpeg([
      [JFIF, [74, 70, 73, 70, 0]],
      [EXIF, PLACE],
      [XMP_OR_ICC, [1, 2, 3]],
      [COMMENT, [104, 105]],
      [QUANT, [9, 9]],
    ]);
    const clean = stripJpegMetadata(withPlace);
    expect(hasJpegMetadata(withPlace)).toBe(true);
    expect(hasJpegMetadata(clean)).toBe(false);
    expect([...clean]).toEqual([
      ...jpeg([
        [JFIF, [74, 70, 73, 70, 0]],
        [QUANT, [9, 9]],
      ]),
    ]);
  });

  it('returns the same bytes when there is nothing to remove, or when they are no JPEG', () => {
    const plain = jpeg([[QUANT, [1]]]);
    expect(stripJpegMetadata(plain)).toBe(plain);
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    expect(stripJpegMetadata(png)).toBe(png);
    const short = new Uint8Array([0xff, 0xd8]);
    expect(stripJpegMetadata(short)).toBe(short);
  });

  it('leaves a broken JPEG as it is', () => {
    const truncated = jpeg([[EXIF, PLACE]]).subarray(0, 8);
    expect(stripJpegMetadata(truncated)).toBe(truncated);
    const noMarker = new Uint8Array([0xff, 0xd8, 0x00, 0xe1, 0x00, 0x04, 1, 2]);
    expect(stripJpegMetadata(noMarker)).toBe(noMarker);
    const badLength = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x01, 1, 2]);
    expect(stripJpegMetadata(badLength)).toBe(badLength);
  });
});

describe('the size of a photo', () => {
  it('keeps the proportions and never makes a picture larger', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual([1600, 1200]);
    expect(fitWithin(3000, 4000, 1600)).toEqual([1200, 1600]);
    expect(fitWithin(800, 600, 1600)).toEqual([800, 600]);
    expect(fitWithin(10_000, 1, 1600)).toEqual([1600, 1]);
  });

  it('steps the quality down to the lowest', () => {
    expect(qualitySteps(0.82)).toEqual([0.82, 0.72, 0.62, 0.52, 0.42]);
    expect(qualitySteps(0.42)).toEqual([0.42]);
  });
});

describe('shrinkPhoto', () => {
  it('draws the photo upright on a white ground no larger than the longest side, as JPEG', async () => {
    const image = fakeImage(4032, 3024);
    const device = createFakeDevice({ decode: () => Promise.resolve(image) });
    const result = await shrinkPhoto(device, photo(), { maxSide: 1280, quality: 0.8 });
    expect(result).toMatchObject({ mediaType: 'image/jpeg', width: 1280, height: 960 });
    const [canvas] = device.canvases;
    expect(canvas?.calls).toEqual([
      ['fillRect', 0, 0, 1280, 960],
      ['drawImage', image.source, 0, 0, 1280, 960],
    ]);
    expect(canvas?.written).toEqual([['image/jpeg', 0.8]]);
    expect(image.closed).toBe(1);
  });

  it('removes the metadata the canvas might have written', async () => {
    const device = createFakeDevice({
      canvas: {
        encode: () =>
          jpeg([
            [EXIF, PLACE],
            [QUANT, [1]],
          ]),
      },
    });
    const result = await shrinkPhoto(device, photo());
    expect(hasJpegMetadata(result.bytes)).toBe(false);
    expect([...result.bytes]).toEqual([...jpeg([[QUANT, [1]]])]);
  });

  it('steps the quality down, then the size, until the bytes fit', async () => {
    const big = (size: number) =>
      new Uint8Array(size)
        .fill(7, 2)
        .map((value, index) => (index === 0 ? 0xff : index === 1 ? 0xd8 : value));
    const device = createFakeDevice({
      decode: () => Promise.resolve(fakeImage(2000, 1000)),
      canvas: {
        // The bytes shrink with the width and the quality.
        encode: (_type, quality, canvas) => big(Math.round(canvas.width * (quality ?? 1))),
      },
    });
    const result = await shrinkPhoto(device, photo(), {
      maxSide: 1000,
      quality: 0.8,
      maxBytes: 400,
    });
    expect(result.bytes.length).toBeLessThanOrEqual(400);
    expect(device.canvases.map((canvas) => canvas.width)).toEqual([1000, 750]);
    expect(device.canvases[0]?.written.map(([, quality]) => quality)).toEqual([0.8, 0.7, 0.6, 0.5]);
  });

  it('gives up when not even the smallest picture fits', async () => {
    const device = createFakeDevice({
      canvas: { encode: () => new Uint8Array(1000).fill(1) },
    });
    expect(await problemOf(shrinkPhoto(device, photo(), { maxBytes: 10 }))).toBe('too_large');
  });

  it.each([
    ['unreadable', { decode: () => Promise.reject(new Error('no picture')) }],
    ['empty', { decode: () => Promise.resolve(fakeImage(0, 10)) }],
    ['no_canvas', { canvas: { noContext: true } }],
    ['no_jpeg', { canvas: { encode: () => null } }],
  ] as const)('names the problem %s', async (problem, options) => {
    expect(await problemOf(shrinkPhoto(createFakeDevice(options), photo()))).toBe(problem);
  });

  it('closes the decoded picture also when it fails', async () => {
    const image = fakeImage(100, 100);
    const device = createFakeDevice({
      decode: () => Promise.resolve(image),
      canvas: { noContext: true },
    });
    await problemOf(shrinkPhoto(device, photo()));
    expect(image.closed).toBe(1);
  });

  it('refuses options of the wrong form', async () => {
    const device = createFakeDevice();
    await expect(shrinkPhoto(device, photo(), { maxSide: 100 })).rejects.toThrow(RangeError);
    await expect(shrinkPhoto(device, photo(), { maxSide: 1000.5 })).rejects.toThrow(RangeError);
    await expect(shrinkPhoto(device, photo(), { quality: 0 })).rejects.toThrow(RangeError);
    await expect(shrinkPhoto(device, photo(), { quality: 1.2 })).rejects.toThrow(RangeError);
    await expect(shrinkPhoto(device, photo(), { maxBytes: 0 })).rejects.toThrow(RangeError);
    expect(PHOTO_DEFAULTS).toEqual({ maxSide: 1600, quality: 0.82, maxBytes: 600_000 });
  });
});
