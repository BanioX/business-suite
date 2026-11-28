// Origin: BanioX/Randen apps/web/src/ui/share-file.ts @ e0f0907 — adapted: the download and the reading of the browser as parts of the port `Device`, built once from the globals of the page
// Origin: BanioX/Randen apps/web/src/ui/photo.ts @ e0f0907 — adapted: decoding upright with createImageBitmap, an <img> as the fallback, and the canvas as parts of the port
import type {
  BadgePort,
  CameraPermission,
  CameraPort,
  ClipboardPort,
  CodeDetectorPort,
  DecodedImage,
  Device,
  DeviceCanvas,
  DrawingContext,
  HeldLock,
  PicturePreview,
  ScreenPort,
} from './ports';

/**
 * The device of this browser: the one place of the package that reads the globals of the page
 * (`window`, `document`, `navigator`, `crypto`). Every other function takes the `Device` it
 * returns, so a test passes a fake instead. Build it once, when the app starts, and hand it to
 * the React part (`DeviceProvider` of `@onestrand/web-device/web`).
 *
 * Reading a part never asks for a permission and never starts anything: the camera opens with
 * `startCamera`, the wake lock with `holdWakeLock`, each after a tap or for a task.
 */
export function createBrowserDevice(): Device {
  return {
    environment: {
      // An old browser without the property: the camera interface decides alone (it exists only
      // on secure pages).
      secureContext: (window.isSecureContext as boolean | undefined) !== false,
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
      standalone: (navigator as Navigator & { standalone?: boolean }).standalone,
      matches: (query) =>
        typeof (window.matchMedia as unknown) === 'function' && window.matchMedia(query).matches,
    },
    files: {
      canShare: (files) =>
        typeof (navigator.canShare as unknown) === 'function' &&
        navigator.canShare({ files: [...files] }),
      share:
        typeof (navigator.share as unknown) === 'function'
          ? (data) => navigator.share(data)
          : undefined,
      download,
    },
    print:
      typeof (window.print as unknown) === 'function'
        ? () => {
            window.print();
          }
        : undefined,
    camera: browserCamera(),
    images: { decode, createCanvas, preview },
    codes: browserCodes(),
    crypto: window.crypto,
    screen: browserScreen(),
    badge: browserBadge(),
    clipboard: browserClipboard(),
  };
}

/** Saves the file with a link that is clicked once; the address is released a little later. */
function download(file: Blob, name: string): boolean {
  let url: string;
  try {
    url = URL.createObjectURL(file);
  } catch {
    return false;
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // Some browsers start the download only after the click has returned.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
  return true;
}

function browserCamera(): CameraPort | undefined {
  // Only in secure contexts (https, localhost) and on devices with media support.
  const media = navigator.mediaDevices as MediaDevices | undefined;
  if (media === undefined || typeof (media.getUserMedia as unknown) !== 'function') {
    return undefined;
  }
  return {
    getUserMedia: (constraints) => media.getUserMedia(constraints),
    enumerateDevices: () => media.enumerateDevices(),
    permission: async (): Promise<CameraPermission> => {
      try {
        const status = await navigator.permissions.query({ name: 'camera' });
        return status.state;
      } catch {
        return 'unknown';
      }
    },
  };
}

function decodeWithElement(file: Blob): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        source: image,
        close: () => {
          URL.revokeObjectURL(url);
        },
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The picture could not be decoded'));
    };
    image.src = url;
  });
}

async function decode(file: Blob): Promise<DecodedImage> {
  if (typeof (window.createImageBitmap as unknown) === 'function') {
    try {
      // Upright as taken: the bitmap follows the orientation the camera stored (EXIF).
      const bitmap = await window.createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        close: () => {
          bitmap.close();
        },
      };
    } catch {
      // Some browsers decode formats in an <img> that createImageBitmap refuses.
    }
  }
  // An <img> shows a photo upright as taken in every current browser (CSS image-orientation).
  return decodeWithElement(file);
}

function preview(file: Blob): PicturePreview {
  const url = URL.createObjectURL(file);
  return {
    url,
    release: () => {
      URL.revokeObjectURL(url);
    },
  };
}

function createCanvas(width: number, height: number): DeviceCanvas {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return {
    get width() {
      return canvas.width;
    },
    set width(value) {
      canvas.width = value;
    },
    get height() {
      return canvas.height;
    },
    set height(value) {
      canvas.height = value;
    },
    getContext: (kind): DrawingContext | null =>
      canvas.getContext(kind, { willReadFrequently: true }),
    toBlob: (type, quality) =>
      new Promise((resolve) => {
        canvas.toBlob(resolve, type, quality);
      }),
  };
}

/** The Barcode Detection API: not in every TypeScript DOM lib, and missing in many browsers. */
interface BarcodeDetectorGlobal {
  getSupportedFormats: () => Promise<string[]>;
  new (options: { formats: string[] }): {
    detect: (source: ImageBitmapSource) => Promise<{ rawValue: string; format: string }[]>;
  };
}

function browserCodes(): CodeDetectorPort | undefined {
  const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorGlobal }).BarcodeDetector;
  if (Detector === undefined) {
    return undefined;
  }
  return {
    formats: () => Detector.getSupportedFormats(),
    detect: async (source, formats) => {
      const found = await new Detector({ formats: [...formats] }).detect(source);
      return found.map(({ rawValue, format }) => ({ rawValue, format }));
    },
  };
}

function browserScreen(): ScreenPort {
  const wakeLock = navigator.wakeLock as WakeLock | undefined;
  return {
    requestWakeLock:
      wakeLock === undefined
        ? undefined
        : async (): Promise<HeldLock> => {
            const sentinel = await wakeLock.request('screen');
            return {
              get released() {
                return sentinel.released;
              },
              release: () => sentinel.release(),
              onRelease: (listener) => {
                sentinel.addEventListener('release', listener, { once: true });
              },
            };
          },
    visible: () => document.visibilityState === 'visible',
    onVisibilityChange: (listener) => {
      const handler = () => {
        listener(document.visibilityState === 'visible');
      };
      document.addEventListener('visibilitychange', handler);
      return () => {
        document.removeEventListener('visibilitychange', handler);
      };
    },
  };
}

function browserBadge(): BadgePort | undefined {
  // The Badging API is missing in many browsers, whatever the types say.
  const badging = navigator as Partial<Pick<Navigator, 'setAppBadge' | 'clearAppBadge'>>;
  if (typeof badging.setAppBadge !== 'function' || typeof badging.clearAppBadge !== 'function') {
    return undefined;
  }
  return {
    set: (count) => navigator.setAppBadge(count),
    clear: () => navigator.clearAppBadge(),
  };
}

function browserClipboard(): ClipboardPort | undefined {
  // Missing in some browsers and on insecure pages, whatever the types say.
  const clipboard = navigator.clipboard as Clipboard | undefined;
  if (clipboard === undefined) {
    return undefined;
  }
  return { writeText: (text) => clipboard.writeText(text) };
}
