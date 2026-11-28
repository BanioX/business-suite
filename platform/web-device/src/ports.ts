import type { DigestCrypto } from '@onestrand/storage';

/**
 * The device as one port (P-10). Every function of this package that touches the device reaches
 * it through a `Device`: the browser gives one with `createBrowserDevice()`, a test its fake. The
 * logic never names a global, so it runs the same in a test without a browser.
 *
 * Every part is optional where a browser may lack it: `undefined` means «this device has none»,
 * and the logic says so in its result instead of throwing. Nothing here sends anything anywhere:
 * the share sheet, the print dialog and a download hand a file to the person, who decides where
 * it goes. There is no location, ever: the port has no part for it.
 */
export interface Device {
  readonly environment: EnvironmentPort;
  readonly files: FilePort;
  /** The print dialog of the browser; missing where there is none. */
  readonly print: (() => void) | undefined;
  /** The cameras of the device; missing without `navigator.mediaDevices` (no camera, insecure page). */
  readonly camera: CameraPort | undefined;
  readonly images: ImagePort;
  /** The code reader of the browser (`BarcodeDetector`); missing where the browser has none. */
  readonly codes: CodeDetectorPort | undefined;
  /** WebCrypto, for the checksum of a signature (`createWebCryptoHasher` of `@onestrand/storage`). */
  readonly crypto: DigestCrypto;
  readonly screen: ScreenPort;
  /** The number on the app icon; missing where the browser has no Badging API. */
  readonly badge: BadgePort | undefined;
  /** Writing text to the clipboard; missing where the browser gives none. */
  readonly clipboard: ClipboardPort | undefined;
}

/** What the page knows about where it runs. */
export interface EnvironmentPort {
  /** True on https and on localhost: only there does a browser give the camera. */
  readonly secureContext: boolean;
  readonly userAgent: string;
  readonly maxTouchPoints: number;
  /** `navigator.standalone` of iOS: true in a web app opened from the Home Screen. */
  readonly standalone: boolean | undefined;
  /** A media query; false where the browser has no `matchMedia`. */
  matches: (query: string) => boolean;
}

/** Handing a file to the person: the share sheet, or a download. */
export interface FilePort {
  /** `navigator.canShare` for these files; false where the browser has no share sheet for files. */
  canShare: (files: readonly File[]) => boolean;
  /** `navigator.share`; missing where the browser has none (desktop Firefox). */
  readonly share: ((data: ShareData) => Promise<void>) | undefined;
  /** Saves the file with a link that is clicked once. False if the browser cannot even start it. */
  download: (file: Blob, name: string) => boolean;
}

/** What the camera part reads of `navigator.mediaDevices` and `navigator.permissions`. */
export interface CameraPort {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  enumerateDevices: () => Promise<MediaDeviceInfo[]>;
  /** The state of the camera permission, where the browser tells it without asking. */
  permission: () => Promise<CameraPermission>;
}

/** `unknown`: the browser does not tell without asking (Safari, Firefox). */
export type CameraPermission = 'granted' | 'denied' | 'prompt' | 'unknown';

/** A decoded picture, upright as taken, ready to be drawn. */
export interface DecodedImage {
  readonly width: number;
  readonly height: number;
  readonly source: CanvasImageSource;
  /** Frees the decoded picture. */
  close: () => void;
}

/** The part of a 2D context this package draws with. */
export interface DrawingContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  fillRect: (x: number, y: number, width: number, height: number) => void;
  drawImage: (
    image: CanvasImageSource,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
  getImageData: (x: number, y: number, width: number, height: number) => ImageData;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  arc: (x: number, y: number, radius: number, start: number, end: number) => void;
  fill: () => void;
  stroke: () => void;
}

/** The part of a canvas this package uses. */
export interface DeviceCanvas {
  width: number;
  height: number;
  getContext: (kind: '2d') => DrawingContext | null;
  /** The picture as a file; null where the browser cannot write this type. */
  toBlob: (type: string, quality?: number) => Promise<Blob | null>;
}

/** Decoding and drawing pictures, on the device. */
export interface ImagePort {
  /**
   * Decodes a picture file upright as taken (the orientation the camera stored, EXIF). Rejects
   * if the file is no picture this browser can read.
   */
  decode: (file: Blob) => Promise<DecodedImage>;
  createCanvas: (width: number, height: number) => DeviceCanvas;
  /**
   * An address of the page for a picture in memory, to show it (`<img src>`); `release` frees it.
   * The address works on this page only and leads nowhere outside it.
   */
  preview: (file: Blob) => PicturePreview;
}

/** A picture in memory as an address of the page. */
export interface PicturePreview {
  readonly url: string;
  release: () => void;
}

/** One code a detector found. */
export interface DetectedCode {
  readonly rawValue: string;
  readonly format: string;
}

/** The code reader of the browser, for the formats asked. */
export interface CodeDetectorPort {
  /** The formats this browser reads; empty if it reads none. */
  formats: () => Promise<string[]>;
  detect: (source: ImageBitmapSource, formats: readonly string[]) => Promise<DetectedCode[]>;
}

/** A held wake lock: released by the page or by the browser (the page was hidden). */
export interface HeldLock {
  readonly released: boolean;
  release: () => Promise<void>;
  /** Called once when the browser releases the lock by itself. */
  onRelease: (listener: () => void) => void;
}

/** The screen: keeping it on, and whether the page is seen. */
export interface ScreenPort {
  /** `navigator.wakeLock.request('screen')`; missing where the browser has no Wake Lock API. */
  readonly requestWakeLock: (() => Promise<HeldLock>) | undefined;
  /** True while the page is visible. */
  visible: () => boolean;
  /** Calls the listener when the page is hidden or seen again; returns the function that stops it. */
  onVisibilityChange: (listener: (visible: boolean) => void) => () => void;
}

/** The number on the app icon of an installed app. */
export interface BadgePort {
  set: (count: number) => Promise<void>;
  clear: () => Promise<void>;
}

/** Writing text to the clipboard. */
export interface ClipboardPort {
  writeText: (text: string) => Promise<void>;
}
