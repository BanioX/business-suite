import { hexEncode, type Hasher } from '@onestrand/storage';

/**
 * SHA-256 in plain TypeScript (FIPS 180-4), for tests.
 *
 * The storage, the backup and the ledger take their checksums from a `Hasher`. The app passes
 * WebCrypto in; a test should not have to: it may run where WebCrypto is missing or
 * incomplete, and the pure part of the platform reaches no global of a runtime. This is the
 * real algorithm, so a checksum made in a test is the one the app would make, and a backup
 * written with one hasher is accepted by the other. It is slower than WebCrypto and meant for
 * the small files of tests, not for the app.
 */

type State = readonly [number, number, number, number, number, number, number, number];

/** The first 32 bits of the fractional parts of the square roots of the first eight primes. */
const INITIAL: State = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

/** The first 32 bits of the fractional parts of the cube roots of the first 64 primes. */
const ROUND_CONSTANTS: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const BLOCK_BYTES = 64;
const WORD_BYTES = 4;

/** The length of a message in bits must fit one word here: below 512 MB, far above any test. */
const MAX_BYTES = 2 ** 29 - 1;

const rotateRight = (word: number, bits: number) => (word >>> bits) | (word << (32 - bits));

/** The message followed by a 1 bit, zeros and its length in bits, to a whole number of blocks. */
function padded(data: Uint8Array): DataView {
  // One byte for the 1 bit and eight for the length must fit after the message.
  const length = Math.ceil((data.length + 9) / BLOCK_BYTES) * BLOCK_BYTES;
  const bytes = new Uint8Array(length);
  bytes.set(data);
  bytes[data.length] = 0x80;
  const view = new DataView(bytes.buffer);
  // The length in bits takes eight bytes; the upper four stay zero (see `MAX_BYTES`).
  view.setUint32(length - 4, data.length * 8);
  return view;
}

/** One block of 64 bytes worked into the state. */
function compress(state: State, message: DataView, offset: number, schedule: DataView): State {
  for (let i = 0; i < 16; i += 1) {
    schedule.setUint32(i * WORD_BYTES, message.getUint32(offset + i * WORD_BYTES));
  }
  for (let i = 16; i < ROUND_CONSTANTS.length; i += 1) {
    const w15 = schedule.getUint32((i - 15) * WORD_BYTES);
    const w2 = schedule.getUint32((i - 2) * WORD_BYTES);
    const s0 = rotateRight(w15, 7) ^ rotateRight(w15, 18) ^ (w15 >>> 3);
    const s1 = rotateRight(w2, 17) ^ rotateRight(w2, 19) ^ (w2 >>> 10);
    // Each term is below 2^32 in size, so the sum is exact; the view keeps its low 32 bits.
    schedule.setUint32(
      i * WORD_BYTES,
      schedule.getUint32((i - 16) * WORD_BYTES) +
        s0 +
        schedule.getUint32((i - 7) * WORD_BYTES) +
        s1,
    );
  }

  let [a, b, c, d, e, f, g, h] = state;
  ROUND_CONSTANTS.forEach((constant, i) => {
    const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
    const choice = (e & f) ^ (~e & g);
    const t1 = (h + s1 + choice + constant + schedule.getUint32(i * WORD_BYTES)) | 0;
    const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
    const majority = (a & b) ^ (a & c) ^ (b & c);
    const t2 = (s0 + majority) | 0;
    h = g;
    g = f;
    f = e;
    e = (d + t1) | 0;
    d = c;
    c = b;
    b = a;
    a = (t1 + t2) | 0;
  });

  const [a0, b0, c0, d0, e0, f0, g0, h0] = state;
  return [
    (a0 + a) | 0,
    (b0 + b) | 0,
    (c0 + c) | 0,
    (d0 + d) | 0,
    (e0 + e) | 0,
    (f0 + f) | 0,
    (g0 + g) | 0,
    (h0 + h) | 0,
  ];
}

/**
 * SHA-256 of the bytes as 64 hex digits, lower case. Throws a `TypeError` for what is no
 * `Uint8Array` and a `RangeError` for 512 MB or more.
 */
export function sha256Hex(data: Uint8Array): string {
  if (!(data instanceof Uint8Array)) {
    // Anything else would be hashed as an empty message without a word.
    throw new TypeError('sha256Hex takes the bytes as a Uint8Array');
  }
  if (data.length > MAX_BYTES) {
    throw new RangeError('sha256Hex is for the small files of tests: less than 512 MB');
  }
  const message = padded(data);
  const schedule = new DataView(new ArrayBuffer(ROUND_CONSTANTS.length * WORD_BYTES));
  let state = INITIAL;
  for (let offset = 0; offset < message.byteLength; offset += BLOCK_BYTES) {
    state = compress(state, message, offset, schedule);
  }
  const digest = new DataView(new ArrayBuffer(state.length * WORD_BYTES));
  state.forEach((word, i) => {
    digest.setUint32(i * WORD_BYTES, word);
  });
  return hexEncode(new Uint8Array(digest.buffer));
}

/**
 * A `Hasher` that needs nothing from the runtime: for `createMemoryStorage`, `createBackupKit`
 * and a ledger in tests. `createTestContext` uses it unless it is given another.
 */
export const testHasher: Hasher = {
  sha256: (data) =>
    new Promise((resolve) => {
      resolve(sha256Hex(data));
    }),
};
