import { IsoDateTimeSchema, type IsoDateTime } from '@onestrand/core';
import { createWebCryptoHasher, SHA256_PATTERN, sha256Of } from '@onestrand/storage';
import type { Device, DrawingContext } from './ports';

/**
 * A signature on the device (P-10): drawn with a finger or a pen on the pad, or a typed name
 * where drawing is not possible. The app never judges whether a signature is legally valid. It
 * records who signed, when (ISO-UTC, from the clock of the app) and what (the checksum of the
 * document), and keeps the drawing as a PNG with its own checksum plus the strokes as data, so
 * the drawing can be shown again at any size. Nothing leaves the device.
 */

/** A point of a stroke in pixels of the pad, from its top left corner, rounded to a tenth. */
export type SignaturePoint = readonly [x: number, y: number];

/** What the pad recorded: its size and the strokes, each a line of points. */
export interface SignatureStrokes {
  readonly width: number;
  readonly height: number;
  readonly strokes: readonly (readonly SignaturePoint[])[];
}

/** The ink of the PNG: a dark blue-black that prints on every paper. */
export const SIGNATURE_INK = '#10141b';
/** The line width on the pad, in its pixels. */
export const SIGNATURE_LINE = 2.5;
/** How many pixels of the PNG make one pixel of the pad: sharp on a printed page. */
export const SIGNATURE_SCALE = 2;

/** A point rounded to a tenth of a pixel: what the strokes keep. */
export function roundPoint(x: number, y: number): SignaturePoint {
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

/** True if nothing was drawn: no stroke with a point. */
export function isBlank(strokes: SignatureStrokes): boolean {
  return strokes.strokes.every((stroke) => stroke.length === 0);
}

/** A stroke that is only one point is drawn as a dot; else as a line through its points. */
function drawStroke(context: DrawingContext, stroke: readonly SignaturePoint[], scale: number) {
  const [first, ...rest] = stroke;
  if (first === undefined) {
    return;
  }
  context.beginPath();
  if (rest.length === 0) {
    context.arc(first[0] * scale, first[1] * scale, (SIGNATURE_LINE * scale) / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }
  context.moveTo(first[0] * scale, first[1] * scale);
  for (const [x, y] of rest) {
    context.lineTo(x * scale, y * scale);
  }
  context.stroke();
}

/**
 * Draws the strokes on a context: ink on a transparent ground, round ends. The pad draws with it
 * on its screen canvas (`scale` 1 for each pixel of the pad) and the PNG with `SIGNATURE_SCALE`.
 */
export function drawSignature(
  context: DrawingContext,
  strokes: SignatureStrokes,
  scale = 1,
  ink = SIGNATURE_INK,
): void {
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineWidth = SIGNATURE_LINE * scale;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  for (const stroke of strokes.strokes) {
    drawStroke(context, stroke, scale);
  }
}

/** Why a signature could not be made. */
export type SignatureProblem = 'blank' | 'no_signer' | 'no_document' | 'no_time' | 'no_png';

export class SignatureError extends Error {
  readonly problem: SignatureProblem;
  constructor(problem: SignatureProblem, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SignatureError';
    this.problem = problem;
  }
}

/** The drawing as a PNG: ink on a transparent ground, `SIGNATURE_SCALE` pixels per pixel of the pad. */
export async function signaturePng(device: Device, strokes: SignatureStrokes): Promise<Uint8Array> {
  if (isBlank(strokes)) {
    throw new SignatureError('blank', 'Nothing was drawn');
  }
  const width = Math.max(1, Math.round(strokes.width * SIGNATURE_SCALE));
  const height = Math.max(1, Math.round(strokes.height * SIGNATURE_SCALE));
  const canvas = device.images.createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (context === null) {
    throw new SignatureError('no_png', 'This device cannot draw pictures');
  }
  drawSignature(context, strokes, SIGNATURE_SCALE);
  const blob = await canvas.toBlob('image/png');
  if (blob?.type !== 'image/png') {
    throw new SignatureError('no_png', 'This device cannot write PNG pictures');
  }
  return new Uint8Array(await blob.arrayBuffer());
}

/** SHA-256 of bytes as 64 lower-case hex digits, on the WebCrypto of the device. */
export function checksumOf(device: Device, bytes: Uint8Array): Promise<string> {
  return sha256Of(createWebCryptoHasher(device.crypto), bytes);
}

/** What is signed, by whom and when. */
export interface SignatureSubject {
  /** The name of the person who signs, as they give it. */
  signer: string;
  /** The checksum of the document that is signed (SHA-256 of its bytes, `checksumOf`). */
  documentChecksum: string;
  /** The moment of the signature, ISO-UTC, from the clock of the app. */
  signedAt: IsoDateTime;
}

/** A drawn signature: the PNG with its checksum and the strokes it was drawn from. */
export interface DrawnSignature {
  readonly method: 'drawn';
  readonly signer: string;
  readonly signedAt: IsoDateTime;
  readonly documentChecksum: string;
  readonly image: {
    readonly bytes: Uint8Array;
    readonly mediaType: 'image/png';
    readonly checksum: string;
  };
  readonly strokes: SignatureStrokes;
}

/**
 * A typed signature: the name the person typed instead of drawing (no pad usable, a keyboard
 * only). It says so wherever it is shown («getippt»); it is not a drawing.
 */
export interface TypedSignature {
  readonly method: 'typed';
  readonly signer: string;
  readonly signedAt: IsoDateTime;
  readonly documentChecksum: string;
}

export type SignatureRecord = DrawnSignature | TypedSignature;

function checkedSubject(subject: SignatureSubject): SignatureSubject {
  const signer = subject.signer.trim().replace(/\s+/g, ' ');
  if (signer === '') {
    throw new SignatureError('no_signer', 'A signature needs the name of the person who signs');
  }
  if (!SHA256_PATTERN.test(subject.documentChecksum)) {
    throw new SignatureError(
      'no_document',
      'A signature needs the checksum of the document: 64 lower-case hex digits',
    );
  }
  if (!IsoDateTimeSchema.safeParse(subject.signedAt).success) {
    throw new SignatureError('no_time', 'A signature needs its moment as ISO-UTC');
  }
  return { ...subject, signer };
}

/**
 * The record of a drawn signature: the PNG of the strokes and its checksum, with who, when and
 * what. Throws a `SignatureError` for a blank pad, a missing name, a checksum of the wrong form or
 * a moment that is not ISO-UTC.
 */
export async function drawnSignature(
  device: Device,
  subject: SignatureSubject,
  strokes: SignatureStrokes,
): Promise<DrawnSignature> {
  const { signer, documentChecksum, signedAt } = checkedSubject(subject);
  const bytes = await signaturePng(device, strokes);
  return Object.freeze({
    method: 'drawn',
    signer,
    signedAt,
    documentChecksum,
    image: Object.freeze({
      bytes,
      mediaType: 'image/png',
      checksum: await checksumOf(device, bytes),
    }),
    strokes,
  });
}

/** The record of a typed signature. Throws like `drawnSignature`. */
export function typedSignature(subject: SignatureSubject): TypedSignature {
  const { signer, documentChecksum, signedAt } = checkedSubject(subject);
  return Object.freeze({ method: 'typed', signer, signedAt, documentChecksum });
}
