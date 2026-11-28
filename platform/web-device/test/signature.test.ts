import { createHash } from 'node:crypto';
import type { IsoDateTime } from '@onestrand/core';
import { describe, expect, it } from 'vitest';
import {
  checksumOf,
  drawnSignature,
  drawSignature,
  isBlank,
  roundPoint,
  SIGNATURE_INK,
  SIGNATURE_SCALE,
  SignatureError,
  signaturePng,
  typedSignature,
  type SignatureStrokes,
} from '../src/index';
import { createFakeDevice, fakeCanvas } from './fake-device';

const AT = '2026-11-28T09:15:00.000Z' as IsoDateTime;
const DOCUMENT = createHash('sha256').update('rapport').digest('hex');
const SUBJECT = { signer: '  Kundin   Beispiel ', documentChecksum: DOCUMENT, signedAt: AT };

const STROKES: SignatureStrokes = {
  width: 300,
  height: 120,
  strokes: [
    [
      [10, 20],
      [40, 60],
      [80, 30],
    ],
    [[150, 70]],
  ],
};

async function problemOf(run: () => unknown): Promise<string> {
  try {
    await run();
  } catch (error) {
    return error instanceof SignatureError ? error.problem : `other: ${String(error)}`;
  }
  return 'none';
}

describe('the strokes', () => {
  it('keeps points to a tenth of a pixel', () => {
    expect(roundPoint(10.04, 19.96)).toEqual([10, 20]);
    expect(roundPoint(1.25, 2.35)).toEqual([1.3, 2.4]);
  });

  it('knows a blank pad', () => {
    expect(isBlank({ width: 1, height: 1, strokes: [] })).toBe(true);
    expect(isBlank({ width: 1, height: 1, strokes: [[]] })).toBe(true);
    expect(isBlank(STROKES)).toBe(false);
  });

  it('draws a line through the points and a dot for a single point, in ink with round ends', () => {
    const canvas = fakeCanvas(600, 240);
    const context = canvas.getContext('2d');
    if (context === null) {
      throw new Error('no context');
    }
    drawSignature(context, STROKES, 2);
    expect(context).toMatchObject({
      strokeStyle: SIGNATURE_INK,
      fillStyle: SIGNATURE_INK,
      lineWidth: 5,
      lineCap: 'round',
      lineJoin: 'round',
    });
    expect(canvas.calls).toEqual([
      ['beginPath'],
      ['moveTo', 20, 40],
      ['lineTo', 80, 120],
      ['lineTo', 160, 60],
      ['stroke'],
      ['beginPath'],
      ['arc', 300, 140, 2.5, 0, Math.PI * 2],
      ['fill'],
    ]);
  });
});

describe('signaturePng', () => {
  it('writes the strokes as a PNG at twice the size of the pad', async () => {
    const device = createFakeDevice();
    const bytes = await signaturePng(device, STROKES);
    expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    const [canvas] = device.canvases;
    expect([canvas?.width, canvas?.height]).toEqual([300 * SIGNATURE_SCALE, 120 * SIGNATURE_SCALE]);
    expect(canvas?.written).toEqual([['image/png', undefined]]);
  });

  it('refuses a blank pad and a device that cannot write PNG', async () => {
    expect(
      await problemOf(() => signaturePng(createFakeDevice(), { ...STROKES, strokes: [] })),
    ).toBe('blank');
    expect(
      await problemOf(() =>
        signaturePng(createFakeDevice({ canvas: { encode: () => null } }), STROKES),
      ),
    ).toBe('no_png');
    expect(
      await problemOf(() =>
        signaturePng(createFakeDevice({ canvas: { noContext: true } }), STROKES),
      ),
    ).toBe('no_png');
  });
});

describe('drawnSignature', () => {
  it('records who, when and what, with the PNG and its SHA-256, and the strokes', async () => {
    const device = createFakeDevice();
    const record = await drawnSignature(device, SUBJECT, STROKES);
    expect(record).toMatchObject({
      method: 'drawn',
      signer: 'Kundin Beispiel',
      signedAt: AT,
      documentChecksum: DOCUMENT,
      strokes: STROKES,
      image: { mediaType: 'image/png' },
    });
    const expected = createHash('sha256').update(record.image.bytes).digest('hex');
    expect(record.image.checksum).toBe(expected);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.image)).toBe(true);
  });

  it('judges nothing: it says only what is missing to record a signature', async () => {
    const device = createFakeDevice();
    expect(
      await problemOf(() => drawnSignature(device, { ...SUBJECT, signer: '  ' }, STROKES)),
    ).toBe('no_signer');
    expect(
      await problemOf(() =>
        drawnSignature(device, { ...SUBJECT, documentChecksum: 'ABC' }, STROKES),
      ),
    ).toBe('no_document');
    expect(
      await problemOf(() =>
        drawnSignature(device, { ...SUBJECT, documentChecksum: DOCUMENT.toUpperCase() }, STROKES),
      ),
    ).toBe('no_document');
    expect(
      await problemOf(() =>
        drawnSignature(device, { ...SUBJECT, signedAt: '28.11.2026' as IsoDateTime }, STROKES),
      ),
    ).toBe('no_time');
    expect(
      await problemOf(() => drawnSignature(device, SUBJECT, { ...STROKES, strokes: [] })),
    ).toBe('blank');
  });
});

describe('typedSignature', () => {
  it('records a typed name as typed, without a drawing', () => {
    expect(typedSignature(SUBJECT)).toEqual({
      method: 'typed',
      signer: 'Kundin Beispiel',
      signedAt: AT,
      documentChecksum: DOCUMENT,
    });
  });

  it('refuses the same gaps as a drawn one', async () => {
    expect(await problemOf(() => typedSignature({ ...SUBJECT, signer: '' }))).toBe('no_signer');
  });
});

describe('checksumOf', () => {
  it('is the SHA-256 of the bytes on the WebCrypto of the device', async () => {
    const bytes = new TextEncoder().encode('rapport');
    expect(await checksumOf(createFakeDevice(), bytes)).toBe(DOCUMENT);
  });
});
