import { webcrypto } from 'node:crypto';
import type {
  BadgePort,
  CameraPermission,
  CameraPort,
  CodeDetectorPort,
  DecodedImage,
  DetectedCode,
  Device,
  DeviceCanvas,
  DrawingContext,
  HeldLock,
} from '../src/index';

/**
 * A device for tests: every part of the port `Device` in memory, with a log of what was done.
 * Each part can be left out (`camera: undefined`) or replaced, so every state of a browser is one
 * line of a test. Only the tests of this package need it; it moves to `@onestrand/testing` once a
 * second package does.
 */

/** What the fake did, in order: `share`, `download:<name>`, `print`, `badge:<n>`, … */
export type DeviceLog = string[];

/** A drawing call on a fake canvas. */
export type DrawCall = readonly [name: string, ...args: unknown[]];

export interface FakeCanvas extends DeviceCanvas {
  readonly calls: DrawCall[];
  /** The types `toBlob` was asked for, with the quality. */
  readonly written: [string, number | undefined][];
}

export interface FakeCanvasOptions {
  /** What `toBlob` gives: the bytes for a type and a quality, or null for a type it cannot write. */
  encode?: (type: string, quality: number | undefined, canvas: FakeCanvas) => Uint8Array | null;
  /** The pixels `getImageData` returns. */
  pixels?: (width: number, height: number) => Uint8ClampedArray;
  /** No 2D context at all. */
  noContext?: boolean;
}

/** A canvas that records what is drawn and writes what `encode` says. */
export function fakeCanvas(width: number, height: number, options: FakeCanvasOptions = {}) {
  const calls: DrawCall[] = [];
  const written: [string, number | undefined][] = [];
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push([name, ...args]);
    };
  const context: DrawingContext = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    fillRect: record('fillRect'),
    drawImage: record('drawImage'),
    getImageData: (x, y, w, h) => {
      calls.push(['getImageData', x, y, w, h]);
      const data = options.pixels?.(w, h) ?? new Uint8ClampedArray(w * h * 4);
      return { data, width: w, height: h, colorSpace: 'srgb' } as ImageData;
    },
    beginPath: record('beginPath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    arc: record('arc'),
    fill: record('fill'),
    stroke: record('stroke'),
  };
  const canvas: FakeCanvas = {
    width,
    height,
    calls,
    written,
    getContext: () => (options.noContext === true ? null : context),
    toBlob: (type, quality) => {
      written.push([type, quality]);
      const bytes = (options.encode ?? defaultEncode)(type, quality, canvas);
      return Promise.resolve(bytes === null ? null : new Blob([new Uint8Array(bytes)], { type }));
    },
  };
  return canvas;
}

/** A JPEG of a few bytes, or a PNG signature: enough for the logic that reads the form. */
function defaultEncode(type: string): Uint8Array | null {
  if (type === 'image/jpeg') {
    return jpeg([]);
  }
  if (type === 'image/png') {
    return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  }
  return null;
}

/** A JPEG of the segments given (marker, payload), then the start of the scan and some data. */
export function jpeg(segments: readonly (readonly [number, readonly number[]])[]): Uint8Array {
  const bytes = [0xff, 0xd8];
  for (const [marker, payload] of segments) {
    const length = payload.length + 2;
    bytes.push(0xff, marker, length >> 8, length & 0xff, ...payload);
  }
  bytes.push(0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0x22, 0x33, 0xff, 0xd9);
  return new Uint8Array(bytes);
}

/** A decoded picture of the given size, which counts how often it was closed. */
export function fakeImage(width: number, height: number): DecodedImage & { closed: number } {
  const image = {
    width,
    height,
    source: { fake: 'image' } as unknown as CanvasImageSource,
    closed: 0,
    close: () => {
      image.closed += 1;
    },
  };
  return image;
}

/** A track of a camera stream that records whether it was stopped. */
export interface FakeTrack {
  stopped: boolean;
  readonly deviceId: string;
  readonly constraints: MediaTrackConstraints[];
}

export function fakeStream(deviceId = 'back', capabilities: Record<string, unknown> = {}) {
  const track: FakeTrack & Partial<MediaStreamTrack> = {
    stopped: false,
    deviceId,
    constraints: [],
  };
  const media = {
    track,
    getTracks: () => [track as unknown as MediaStreamTrack],
    getVideoTracks: () => [
      {
        ...track,
        getSettings: () => ({ deviceId }),
        getCapabilities: () => capabilities,
        applyConstraints: (constraints: MediaTrackConstraints) => {
          track.constraints.push(constraints);
          return Promise.resolve();
        },
        stop: () => {
          track.stopped = true;
        },
      } as unknown as MediaStreamTrack,
    ],
  };
  (track as { stop?: () => void }).stop = () => {
    track.stopped = true;
  };
  return media as unknown as MediaStream & { track: FakeTrack };
}

/** A wake lock the test can release as the browser would (`browserRelease`). */
export interface FakeLock extends HeldLock {
  browserRelease: () => void;
}

export function fakeLock(log: DeviceLog): FakeLock {
  let released = false;
  const listeners: (() => void)[] = [];
  return {
    get released() {
      return released;
    },
    release: () => {
      if (!released) {
        released = true;
        log.push('wakeLock:release');
      }
      return Promise.resolve();
    },
    onRelease: (listener) => {
      listeners.push(listener);
    },
    browserRelease: () => {
      released = true;
      for (const listener of listeners.splice(0)) {
        listener();
      }
    },
  };
}

export interface FakeDevice extends Device {
  readonly log: DeviceLog;
  /** The canvases the device made, in order. */
  readonly canvases: FakeCanvas[];
  /** The wake locks the device gave, in order. */
  readonly locks: FakeLock[];
  /** Hides or shows the page, as the browser tells it. */
  setVisible: (visible: boolean) => void;
}

export interface FakeDeviceOptions {
  secureContext?: boolean;
  userAgent?: string;
  maxTouchPoints?: number;
  standalone?: boolean | undefined;
  /** The media queries that match. */
  media?: readonly string[];
  canShare?: (files: readonly File[]) => boolean;
  /** `undefined` for a browser without a share sheet; a function to decide what sharing does. */
  share?: ((data: ShareData) => Promise<void>) | undefined;
  download?: (file: Blob, name: string) => boolean;
  print?: (() => void) | undefined;
  camera?: CameraPort | undefined;
  decode?: (file: Blob) => Promise<DecodedImage>;
  canvas?: FakeCanvasOptions;
  codes?: CodeDetectorPort | undefined;
  requestWakeLock?: ((log: DeviceLog) => Promise<HeldLock>) | undefined | 'default';
  badge?: BadgePort | undefined | 'default';
  clipboard?: Device['clipboard'] | 'default';
  visible?: boolean;
}

/** A camera that opens the given stream, or refuses with the given error. */
export function fakeCamera(
  open: (constraints: MediaStreamConstraints) => Promise<MediaStream>,
  devices: MediaDeviceInfo[] = [],
  permission: CameraPermission = 'prompt',
): CameraPort & { asked: MediaStreamConstraints[] } {
  const asked: MediaStreamConstraints[] = [];
  return {
    asked,
    getUserMedia: (constraints) => {
      asked.push(constraints);
      return open(constraints);
    },
    enumerateDevices: () => Promise.resolve(devices),
    permission: () => Promise.resolve(permission),
  };
}

/** A detector of the browser that reads the formats given and finds what `found` says. */
export function fakeCodes(formats: string[], found: DetectedCode[] = []): CodeDetectorPort {
  return {
    formats: () => Promise.resolve(formats),
    detect: () => Promise.resolve(found),
  };
}

/** A device of a desktop browser with every part, unless the options say otherwise. */
export function createFakeDevice(options: FakeDeviceOptions = {}): FakeDevice {
  const log: DeviceLog = [];
  const canvases: FakeCanvas[] = [];
  const locks: FakeLock[] = [];
  let visible = options.visible ?? true;
  let previews = 0;
  const listeners = new Set<(visible: boolean) => void>();
  const has = (key: keyof FakeDeviceOptions) => key in options;

  const request =
    options.requestWakeLock === undefined && has('requestWakeLock')
      ? undefined
      : options.requestWakeLock === undefined || options.requestWakeLock === 'default'
        ? () => {
            const lock = fakeLock(log);
            locks.push(lock);
            log.push('wakeLock:request');
            return Promise.resolve(lock);
          }
        : options.requestWakeLock;

  const badge: BadgePort | undefined =
    options.badge === undefined && has('badge')
      ? undefined
      : options.badge === undefined || options.badge === 'default'
        ? {
            set: (count) => {
              log.push(`badge:${String(count)}`);
              return Promise.resolve();
            },
            clear: () => {
              log.push('badge:clear');
              return Promise.resolve();
            },
          }
        : options.badge;

  const clipboard: Device['clipboard'] =
    options.clipboard === undefined && has('clipboard')
      ? undefined
      : options.clipboard === undefined || options.clipboard === 'default'
        ? {
            writeText: (text) => {
              log.push(`clipboard:${text}`);
              return Promise.resolve();
            },
          }
        : options.clipboard;

  const share =
    has('share') && options.share === undefined
      ? undefined
      : (options.share ??
        ((data: ShareData) => {
          log.push(`share:${(data.files ?? []).map((file) => file.name).join(',')}`);
          return Promise.resolve();
        }));

  const print =
    has('print') && options.print === undefined
      ? undefined
      : (options.print ??
        (() => {
          log.push('print');
        }));

  const device: FakeDevice = {
    log,
    canvases,
    locks,
    environment: {
      secureContext: options.secureContext ?? true,
      userAgent: options.userAgent ?? 'Mozilla/5.0 (X11; Linux x86_64) Chrome/140',
      maxTouchPoints: options.maxTouchPoints ?? 0,
      standalone: options.standalone,
      matches: (query) => (options.media ?? []).includes(query),
    },
    files: {
      canShare: options.canShare ?? (() => true),
      share,
      download:
        options.download ??
        ((_file, name) => {
          log.push(`download:${name}`);
          return true;
        }),
    },
    print,
    camera: options.camera,
    images: {
      decode: options.decode ?? (() => Promise.resolve(fakeImage(800, 600))),
      createCanvas: (width, height) => {
        const canvas = fakeCanvas(width, height, options.canvas);
        canvases.push(canvas);
        return canvas;
      },
      preview: (file) => {
        previews += 1;
        const url = `blob:fake/${String(previews)}`;
        log.push(`preview:${file.type}`);
        return {
          url,
          release: () => {
            log.push(`release:${url}`);
          },
        };
      },
    },
    codes: options.codes,
    crypto: webcrypto,
    screen: {
      requestWakeLock: request === undefined ? undefined : () => request(log),
      visible: () => visible,
      onVisibilityChange: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    },
    badge,
    clipboard,
    setVisible: (next) => {
      visible = next;
      for (const listener of [...listeners]) {
        listener(next);
      }
    },
  };
  return device;
}

/** The iPhone in Safari, and in the app installed to its Home Screen. */
export const IPHONE_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
export const IPAD_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/27.0 Safari/605.1.15';
