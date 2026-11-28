/**
 * A QR code for the tests, made here: version 1 (21 × 21), error correction M, bytes, mask 0.
 * Written after the specification (ISO/IEC 18004), short and for tests only, so the decoder that
 * ships in the bundle is tested against a real code and not against a fake of itself. Up to 14
 * bytes of text.
 */

const SIZE = 21;
const DATA_CODEWORDS = 16;
const ECC_CODEWORDS = 10;

function multiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function divisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = multiply(result[j] ?? 0, root);
      if (j + 1 < result.length) {
        result[j] = (result[j] ?? 0) ^ (result[j + 1] ?? 0);
      }
    }
    root = multiply(root, 0x02);
  }
  return result;
}

function remainder(data: readonly number[], by: readonly number[]): number[] {
  const result = new Array<number>(by.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    by.forEach((coefficient, index) => {
      result[index] = (result[index] ?? 0) ^ multiply(coefficient, factor);
    });
  }
  return result;
}

function codewords(text: string): number[] {
  const bytes = [...new TextEncoder().encode(text)];
  if (bytes.length > 14) {
    throw new RangeError('A code of version 1-M holds at most 14 bytes');
  }
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) {
      bits.push((value >>> i) & 1);
    }
  };
  push(0b0100, 4);
  push(bytes.length, 8);
  for (const byte of bytes) {
    push(byte, 8);
  }
  const capacity = DATA_CODEWORDS * 8;
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }
  for (let pad = 0xec; data.length < DATA_CODEWORDS; pad ^= 0xec ^ 0x11) {
    data.push(pad);
  }
  return [...data, ...remainder(data, divisor(ECC_CODEWORDS))];
}

/** The modules of the code: `true` is dark, `[row][column]`. */
export function qrMatrix(text: string): boolean[][] {
  const modules = Array.from({ length: SIZE }, () => new Array<boolean>(SIZE).fill(false));
  const fixed = Array.from({ length: SIZE }, () => new Array<boolean>(SIZE).fill(false));
  const set = (x: number, y: number, dark: boolean) => {
    const row = modules[y];
    const mark = fixed[y];
    if (row !== undefined && mark !== undefined && x >= 0 && x < SIZE) {
      row[x] = dark;
      mark[x] = true;
    }
  };
  for (let i = 0; i < SIZE; i += 1) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [SIZE - 4, 3],
    [3, SIZE - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (cy + dy >= 0 && cy + dy < SIZE) {
          set(cx + dx, cy + dy, distance !== 2 && distance !== 4);
        }
      }
    }
  }
  // Format: error correction M (00) and mask 0, with its BCH code and the fixed mask.
  const format = 0;
  let rest = format;
  for (let i = 0; i < 10; i += 1) {
    rest = (rest << 1) ^ ((rest >>> 9) * 0x537);
  }
  const bits = ((format << 10) | rest) ^ 0x5412;
  const bit = (i: number) => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i += 1) {
    set(8, i, bit(i));
  }
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let i = 9; i < 15; i += 1) {
    set(14 - i, 8, bit(i));
  }
  for (let i = 0; i < 8; i += 1) {
    set(SIZE - 1 - i, 8, bit(i));
  }
  for (let i = 8; i < 15; i += 1) {
    set(8, SIZE - 15 + i, bit(i));
  }
  set(8, SIZE - 8, true);

  const data = codewords(text);
  let index = 0;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right = 5;
    }
    for (let vertical = 0; vertical < SIZE; vertical += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? SIZE - 1 - vertical : vertical;
        const row = modules[y];
        if (row !== undefined && fixed[y]?.[x] === false && index < data.length * 8) {
          const dark = (((data[index >>> 3] ?? 0) >>> (7 - (index & 7))) & 1) === 1;
          // Mask 0: a module where row and column add up to an even number changes.
          row[x] = dark !== ((x + y) % 2 === 0);
          index += 1;
        }
      }
    }
  }
  return modules;
}

/** The code as the pixels of a picture (RGBA), `scale` pixels a module, with a quiet zone of 4. */
export function qrPixels(text: string, scale = 4): { pixels: Uint8ClampedArray; side: number } {
  const matrix = qrMatrix(text);
  const side = (SIZE + 8) * scale;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (!dark) {
        return;
      }
      for (let py = 0; py < scale; py += 1) {
        for (let px = 0; px < scale; px += 1) {
          const at = (((y + 4) * scale + py) * side + (x + 4) * scale + px) * 4;
          pixels[at] = 0;
          pixels[at + 1] = 0;
          pixels[at + 2] = 0;
        }
      }
    });
  });
  return { pixels, side };
}
