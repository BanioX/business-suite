/**
 * Text and bytes without the runtime: UTF-8, Base64 and hex as small pure functions, so the
 * pure part of the platform needs neither `TextEncoder` nor `btoa`. Each of them behaves like
 * its counterpart of the web platform where that is strict, and is strict where that one is
 * lenient (Base64 is read in its one canonical spelling only). The tests compare them with the
 * implementations of the runtime, byte by byte.
 */

/** Strings are built in pieces of this many code units, below the argument limit of a call. */
const CHUNK = 0x8000;

const REPLACEMENT = 0xfffd;

/** The Unicode scalar value at `index`; a surrogate without its partner reads as U+FFFD. */
function scalarAt(text: string, index: number): number {
  const point = text.codePointAt(index) ?? REPLACEMENT;
  return point >= 0xd800 && point <= 0xdfff ? REPLACEMENT : point;
}

function utf8Length(point: number): 1 | 2 | 3 | 4 {
  if (point < 0x80) {
    return 1;
  }
  if (point < 0x800) {
    return 2;
  }
  return point < 0x10000 ? 3 : 4;
}

/**
 * The UTF-8 bytes of a text. A surrogate without its partner cannot be written in UTF-8 and
 * becomes U+FFFD, as `TextEncoder` does it.
 */
export function utf8Encode(text: string): Uint8Array<ArrayBuffer> {
  let size = 0;
  for (let index = 0; index < text.length;) {
    const point = scalarAt(text, index);
    size += utf8Length(point);
    index += point > 0xffff ? 2 : 1;
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (let index = 0; index < text.length;) {
    const point = scalarAt(text, index);
    index += point > 0xffff ? 2 : 1;
    switch (utf8Length(point)) {
      case 1:
        bytes[at++] = point;
        break;
      case 2:
        bytes[at++] = 0xc0 | (point >> 6);
        bytes[at++] = 0x80 | (point & 0x3f);
        break;
      case 3:
        bytes[at++] = 0xe0 | (point >> 12);
        bytes[at++] = 0x80 | ((point >> 6) & 0x3f);
        bytes[at++] = 0x80 | (point & 0x3f);
        break;
      case 4:
        bytes[at++] = 0xf0 | (point >> 18);
        bytes[at++] = 0x80 | ((point >> 12) & 0x3f);
        bytes[at++] = 0x80 | ((point >> 6) & 0x3f);
        bytes[at++] = 0x80 | (point & 0x3f);
        break;
    }
  }
  return bytes;
}

/** Joins UTF-16 code units to a string, piece by piece. */
function fromCodeUnits(units: Uint16Array, length: number): string {
  let text = '';
  for (let start = 0; start < length; start += CHUNK) {
    text += String.fromCharCode(...units.subarray(start, Math.min(start + CHUNK, length)));
  }
  return text;
}

/**
 * The text of UTF-8 bytes. Strict: bytes that are not well-formed UTF-8 (a cut sequence, an
 * overlong form, a surrogate, a value above U+10FFFF) throw a `TypeError`, as
 * `new TextDecoder('utf-8', { fatal: true })` does. Nothing is replaced and nothing is dropped:
 * a byte order mark at the start stays part of the text.
 */
export function utf8Decode(bytes: Uint8Array): string {
  // One byte gives at most one code unit; only four bytes give two.
  const units = new Uint16Array(bytes.length);
  let length = 0;
  let point = 0;
  let needed = 0;
  // The range the next continuation byte must lie in; narrower after some lead bytes, which
  // rules out overlong forms, surrogates and values above U+10FFFF.
  let lower = 0x80;
  let upper = 0xbf;
  for (const byte of bytes) {
    if (needed === 0) {
      if (byte < 0x80) {
        units[length++] = byte;
      } else if (byte >= 0xc2 && byte <= 0xdf) {
        needed = 1;
        point = byte & 0x1f;
      } else if (byte >= 0xe0 && byte <= 0xef) {
        needed = 2;
        point = byte & 0x0f;
        lower = byte === 0xe0 ? 0xa0 : 0x80;
        upper = byte === 0xed ? 0x9f : 0xbf;
      } else if (byte >= 0xf0 && byte <= 0xf4) {
        needed = 3;
        point = byte & 0x07;
        lower = byte === 0xf0 ? 0x90 : 0x80;
        upper = byte === 0xf4 ? 0x8f : 0xbf;
      } else {
        throw new TypeError('The bytes are not valid UTF-8');
      }
      continue;
    }
    if (byte < lower || byte > upper) {
      throw new TypeError('The bytes are not valid UTF-8');
    }
    lower = 0x80;
    upper = 0xbf;
    point = (point << 6) | (byte & 0x3f);
    needed -= 1;
    if (needed === 0) {
      if (point > 0xffff) {
        const rest = point - 0x10000;
        units[length++] = 0xd800 | (rest >> 10);
        units[length++] = 0xdc00 | (rest & 0x3ff);
      } else {
        units[length++] = point;
      }
    }
  }
  if (needed !== 0) {
    throw new TypeError('The bytes are not valid UTF-8');
  }
  return fromCodeUnits(units, length);
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_PAD = 0x3d;

const BASE64_CODES = Uint8Array.from(BASE64_ALPHABET, (char) => char.charCodeAt(0));

/** The value of a Base64 character by its code; -1 for every other character. */
const BASE64_VALUES = (() => {
  const values = new Int8Array(128).fill(-1);
  BASE64_CODES.forEach((code, value) => {
    values[code] = value;
  });
  return values;
})();

/** Bytes as Base64 (RFC 4648, section 4): the standard alphabet, padded with `=`. */
export function base64Encode(bytes: Uint8Array): string {
  const codes = new Uint16Array(Math.ceil(bytes.length / 3) * 4);
  let at = 0;
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    codes[at++] = BASE64_CODES[first >> 2] ?? 0;
    codes[at++] = BASE64_CODES[((first & 0x03) << 4) | ((second ?? 0) >> 4)] ?? 0;
    codes[at++] =
      second === undefined
        ? BASE64_PAD
        : (BASE64_CODES[((second & 0x0f) << 2) | ((third ?? 0) >> 6)] ?? 0);
    codes[at++] = third === undefined ? BASE64_PAD : (BASE64_CODES[third & 0x3f] ?? 0);
  }
  return fromCodeUnits(codes, at);
}

function base64Value(text: string, index: number): number {
  const code = text.charCodeAt(index);
  const value = code < 128 ? (BASE64_VALUES[code] ?? -1) : -1;
  if (value < 0) {
    throw new TypeError('The text is not valid Base64');
  }
  return value;
}

/**
 * The bytes of a Base64 text. Strict: only the canonical spelling is read (standard alphabet,
 * padded to a multiple of four, unused bits zero, no white space), so one sequence of bytes has
 * exactly one text. Anything else throws a `TypeError`.
 */
export function base64Decode(text: string): Uint8Array<ArrayBuffer> {
  if (text.length % 4 !== 0) {
    throw new TypeError('The text is not valid Base64');
  }
  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((text.length / 4) * 3 - padding);
  let at = 0;
  for (let index = 0; index < text.length; index += 4) {
    const last = index + 4 === text.length;
    const first = base64Value(text, index);
    const second = base64Value(text, index + 1);
    bytes[at++] = (first << 2) | (second >> 4);
    if (last && padding === 2) {
      if ((second & 0x0f) !== 0) {
        throw new TypeError('The text is not valid Base64');
      }
      break;
    }
    const third = base64Value(text, index + 2);
    bytes[at++] = ((second & 0x0f) << 4) | (third >> 2);
    if (last && padding === 1) {
      if ((third & 0x03) !== 0) {
        throw new TypeError('The text is not valid Base64');
      }
      break;
    }
    bytes[at++] = ((third & 0x03) << 6) | base64Value(text, index + 3);
  }
  return bytes;
}

/** Bytes as lower-case hex, two digits per byte: the spelling of a checksum. */
export function hexEncode(bytes: Uint8Array): string {
  let text = '';
  for (const byte of bytes) {
    text += byte.toString(16).padStart(2, '0');
  }
  return text;
}
