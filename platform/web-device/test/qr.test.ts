import { describe, expect, it } from 'vitest';
import {
  bundledQrDecoder,
  createQrReader,
  hasNativeQr,
  QR_FORMAT,
  readQrFromFile,
  typedCode,
  type CodeDetectorPort,
  type QrSource,
} from '../src/index';
import { createFakeDevice, fakeCodes, fakeImage } from './fake-device';
import { qrPixels } from './qr-fixture';

const TEXT = 'AUFTRAG-42';
const file = () => new Blob([new Uint8Array([1])], { type: 'image/png' });
const frame = (width = 116, height = 116): QrSource => ({
  source: { frame: true } as unknown as CanvasImageSource,
  width,
  height,
});

describe('the decoder of the bundle', () => {
  it('reads a real QR code from its pixels', () => {
    const { pixels, side } = qrPixels(TEXT);
    expect(bundledQrDecoder(pixels, side, side)).toBe(TEXT);
  });

  it('reads nothing from a blank picture', () => {
    expect(bundledQrDecoder(new Uint8ClampedArray(40 * 40 * 4).fill(255), 40, 40)).toBeNull();
  });
});

describe('createQrReader', () => {
  it('takes the reader of the browser where it reads QR', async () => {
    const device = createFakeDevice({
      codes: fakeCodes(['ean_13', QR_FORMAT], [{ rawValue: TEXT, format: QR_FORMAT }]),
    });
    expect(await hasNativeQr(device)).toBe(true);
    const reader = await createQrReader(device);
    expect(reader.kind).toBe('native');
    expect(await reader.read(frame())).toBe(TEXT);
    expect(device.canvases).toEqual([]);
  });

  it('says nothing was found when the reader of the browser finds nothing or fails', async () => {
    const empty = await createQrReader(createFakeDevice({ codes: fakeCodes([QR_FORMAT]) }));
    expect(await empty.read(frame())).toBeNull();
    const failing: CodeDetectorPort = {
      formats: () => Promise.resolve([QR_FORMAT]),
      detect: () => Promise.reject(new Error('broken')),
    };
    const reader = await createQrReader(createFakeDevice({ codes: failing }));
    expect(await reader.read(frame())).toBeNull();
  });

  it('takes the decoder of the bundle where the browser has no reader, or none for QR', async () => {
    const { pixels, side } = qrPixels(TEXT);
    for (const codes of [undefined, fakeCodes(['ean_13'])]) {
      const device = createFakeDevice({ codes, canvas: { pixels: () => pixels } });
      expect(await hasNativeQr(device)).toBe(false);
      const reader = await createQrReader(device);
      expect(reader.kind).toBe('bundled');
      expect(await reader.read(frame(side, side))).toBe(TEXT);
    }
  });

  it('counts a reader that cannot even list its formats as none', async () => {
    const broken: CodeDetectorPort = {
      formats: () => Promise.reject(new Error('no')),
      detect: () => Promise.resolve([]),
    };
    expect(await hasNativeQr(createFakeDevice({ codes: broken }))).toBe(false);
  });

  it('draws a large picture smaller before the decoder of the bundle reads it', async () => {
    const seen: [number, number][] = [];
    const device = createFakeDevice();
    const reader = await createQrReader(device, (_pixels, width, height) => {
      seen.push([width, height]);
      return null;
    });
    expect(await reader.read(frame(4000, 3000))).toBeNull();
    expect(seen).toEqual([[1024, 768]]);
    expect(await reader.read(frame(0, 10))).toBeNull();
    expect(seen).toHaveLength(1);
  });

  it('reads nothing where the device cannot draw, and never throws', async () => {
    const noContext = await createQrReader(createFakeDevice({ canvas: { noContext: true } }));
    expect(await noContext.read(frame())).toBeNull();
    const throwing = await createQrReader(createFakeDevice(), () => {
      throw new Error('decoder broke');
    });
    expect(await throwing.read(frame())).toBeNull();
  });
});

describe('readQrFromFile', () => {
  it('reads a code from a picture file and frees the picture', async () => {
    const { pixels, side } = qrPixels(TEXT);
    const image = fakeImage(side, side);
    const device = createFakeDevice({
      decode: () => Promise.resolve(image),
      canvas: { pixels: () => pixels },
    });
    const reader = await createQrReader(device);
    expect(await readQrFromFile(device, reader, file())).toBe(TEXT);
    expect(image.closed).toBe(1);
  });

  it('reads nothing from a file that is no picture', async () => {
    const device = createFakeDevice({ decode: () => Promise.reject(new Error('no picture')) });
    expect(await readQrFromFile(device, await createQrReader(device), file())).toBeNull();
  });
});

describe('typedCode', () => {
  it('takes what was typed, trimmed, and nothing for an empty field', () => {
    expect(typedCode('  AUFTRAG 42 ')).toBe('AUFTRAG 42');
    expect(typedCode('   ')).toBeNull();
  });
});
