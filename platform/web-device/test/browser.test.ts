import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrowserDevice } from '../src/index';

/**
 * The one place that reads the globals of the page. jsdom stands in for the browser; what it
 * lacks (share sheet, camera, wake lock, badge, code reader) is set on `navigator` and `window` for
 * a test and removed after it, so both sides of each check are seen.
 */

type Writable = Record<string, unknown>;
const nav = navigator as unknown as Writable;
const win = window as unknown as Writable;
const added: [Writable, string][] = [];

function give(target: Writable, key: string, value: unknown) {
  Object.defineProperty(target, key, { value, configurable: true, writable: true });
  added.push([target, key]);
}

afterEach(() => {
  for (const [target, key] of added.splice(0)) {
    Reflect.deleteProperty(target, key);
  }
  vi.restoreAllMocks();
});

describe('createBrowserDevice', () => {
  it('reads the page without asking for anything, and has none of what jsdom lacks', () => {
    const device = createBrowserDevice();
    expect(device.environment.userAgent).toBe(navigator.userAgent);
    expect(typeof device.environment.secureContext).toBe('boolean');
    expect(device.environment.matches('(display-mode: standalone)')).toBe(false);
    expect(device.files.share).toBeUndefined();
    expect(device.files.canShare([])).toBe(false);
    expect(device.camera).toBeUndefined();
    expect(device.codes).toBeUndefined();
    expect(device.screen.requestWakeLock).toBeUndefined();
    expect(device.badge).toBeUndefined();
    expect(device.screen.visible()).toBe(true);
    expect(device.crypto).toBe(window.crypto);
  });

  it('downloads with a link that is clicked once, and frees the address later', () => {
    vi.useFakeTimers();
    const create = vi.fn(() => 'blob:page/1');
    const revoke = vi.fn();
    give(URL as unknown as Writable, 'createObjectURL', create);
    give(URL as unknown as Writable, 'revokeObjectURL', revoke);
    const clicked: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(`${this.download} ${this.href}`);
    });
    expect(createBrowserDevice().files.download(new Blob(['x']), 'liste.pdf')).toBe(true);
    expect(clicked).toEqual(['liste.pdf blob:page/1']);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledWith('blob:page/1');
    vi.useRealTimers();
  });

  it('says false when the browser cannot even make an address for the file', () => {
    give(URL as unknown as Writable, 'createObjectURL', () => {
      throw new Error('no');
    });
    expect(createBrowserDevice().files.download(new Blob(['x']), 'x.pdf')).toBe(false);
  });

  it('gives an address for a picture and frees it', () => {
    give(URL as unknown as Writable, 'createObjectURL', () => 'blob:page/2');
    const revoke = vi.fn();
    give(URL as unknown as Writable, 'revokeObjectURL', revoke);
    const preview = createBrowserDevice().images.preview(new Blob(['x'], { type: 'image/png' }));
    expect(preview.url).toBe('blob:page/2');
    preview.release();
    expect(revoke).toHaveBeenCalledWith('blob:page/2');
  });

  it('shares through the share sheet where the browser has one', async () => {
    const share = vi.fn(() => Promise.resolve());
    give(nav, 'share', share);
    give(nav, 'canShare', () => true);
    const device = createBrowserDevice();
    const file = new File(['x'], 'a.pdf');
    expect(device.files.canShare([file])).toBe(true);
    await device.files.share?.({ files: [file] });
    expect(share).toHaveBeenCalledWith({ files: [file] });
  });

  it('opens the camera, lists the cameras and reads the permission without asking', async () => {
    const getUserMedia = vi.fn(() => Promise.resolve({ stream: true }));
    give(nav, 'mediaDevices', { getUserMedia, enumerateDevices: () => Promise.resolve([]) });
    give(nav, 'permissions', { query: () => Promise.resolve({ state: 'denied' }) });
    const camera = createBrowserDevice().camera;
    expect(camera).toBeDefined();
    await camera?.getUserMedia({ video: true });
    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    expect(await camera?.enumerateDevices()).toEqual([]);
    expect(await camera?.permission()).toBe('denied');
    give(nav, 'permissions', { query: () => Promise.reject(new TypeError('camera')) });
    expect(await createBrowserDevice().camera?.permission()).toBe('unknown');
  });

  it('holds and releases a wake lock and hears when the browser releases it', async () => {
    const listeners: (() => void)[] = [];
    const sentinel = {
      released: false,
      release: vi.fn(() => Promise.resolve()),
      addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
    };
    give(nav, 'wakeLock', { request: vi.fn(() => Promise.resolve(sentinel)) });
    const lock = await createBrowserDevice().screen.requestWakeLock?.();
    const heard = vi.fn();
    lock?.onRelease(heard);
    expect(lock?.released).toBe(false);
    listeners.forEach((listener) => {
      listener();
    });
    expect(heard).toHaveBeenCalledTimes(1);
    await lock?.release();
    expect(sentinel.release).toHaveBeenCalledTimes(1);
  });

  it('hears when the page is hidden and seen, until it stops listening', () => {
    const device = createBrowserDevice();
    const seen: boolean[] = [];
    const stop = device.screen.onVisibilityChange((visible) => seen.push(visible));
    document.dispatchEvent(new Event('visibilitychange'));
    stop();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(seen).toEqual([true]);
  });

  it('sets and clears the number on the app icon, and writes to the clipboard', async () => {
    const setAppBadge = vi.fn(() => Promise.resolve());
    const clearAppBadge = vi.fn(() => Promise.resolve());
    const writeText = vi.fn(() => Promise.resolve());
    give(nav, 'setAppBadge', setAppBadge);
    give(nav, 'clearAppBadge', clearAppBadge);
    give(nav, 'clipboard', { writeText });
    const device = createBrowserDevice();
    await device.badge?.set(4);
    await device.badge?.clear();
    await device.clipboard?.writeText('AUFTRAG-42');
    expect(setAppBadge).toHaveBeenCalledWith(4);
    expect(clearAppBadge).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('AUFTRAG-42');
  });

  it('reads codes with the reader of the browser where it has one', async () => {
    class Detector {
      static getSupportedFormats = () => Promise.resolve(['qr_code']);
      formats: string[];
      constructor({ formats }: { formats: string[] }) {
        this.formats = formats;
      }
      detect = () => Promise.resolve([{ rawValue: 'A', format: 'qr_code', cornerPoints: [] }]);
    }
    give(win, 'BarcodeDetector', Detector);
    const codes = createBrowserDevice().codes;
    expect(await codes?.formats()).toEqual(['qr_code']);
    expect(await codes?.detect({} as ImageBitmapSource, ['qr_code'])).toEqual([
      { rawValue: 'A', format: 'qr_code' },
    ]);
  });

  it('decodes upright with createImageBitmap, and with an <img> where that refuses', async () => {
    const close = vi.fn();
    const bitmap = vi.fn(() => Promise.resolve({ width: 40, height: 30, close }));
    give(win, 'createImageBitmap', bitmap);
    const decoded = await createBrowserDevice().images.decode(new Blob(['x']));
    expect(bitmap).toHaveBeenCalledWith(expect.any(Blob), { imageOrientation: 'from-image' });
    expect([decoded.width, decoded.height]).toEqual([40, 30]);
    decoded.close();
    expect(close).toHaveBeenCalledTimes(1);

    give(win, 'createImageBitmap', () => Promise.reject(new Error('format')));
    give(URL as unknown as Writable, 'createObjectURL', () => 'blob:page/3');
    const revoke = vi.fn();
    give(URL as unknown as Writable, 'revokeObjectURL', revoke);
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (
      this: HTMLImageElement,
    ) {
      Object.defineProperty(this, 'naturalWidth', { value: 20 });
      Object.defineProperty(this, 'naturalHeight', { value: 10 });
      queueMicrotask(() => {
        this.onload?.(new Event('load'));
      });
    });
    const fallback = await createBrowserDevice().images.decode(new Blob(['x']));
    expect([fallback.width, fallback.height]).toEqual([20, 10]);
    fallback.close();
    expect(revoke).toHaveBeenCalledWith('blob:page/3');
  });

  it('rejects a file the <img> cannot read either, and frees its address', async () => {
    give(URL as unknown as Writable, 'createObjectURL', () => 'blob:page/4');
    const revoke = vi.fn();
    give(URL as unknown as Writable, 'revokeObjectURL', revoke);
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (
      this: HTMLImageElement,
    ) {
      queueMicrotask(() => {
        this.onerror?.(new Event('error'));
      });
    });
    await expect(createBrowserDevice().images.decode(new Blob(['x']))).rejects.toThrow(/decoded/);
    expect(revoke).toHaveBeenCalledWith('blob:page/4');
  });

  it('makes a canvas of the size asked, and writes it as a file', async () => {
    const canvas = createBrowserDevice().images.createCanvas(30, 20);
    expect([canvas.width, canvas.height]).toEqual([30, 20]);
    canvas.width = 10;
    canvas.height = 5;
    expect([canvas.width, canvas.height]).toEqual([10, 5]);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback) {
      callback(new Blob(['png'], { type: 'image/png' }));
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
    expect(canvas.getContext('2d')).toBeNull();
    expect((await canvas.toBlob('image/png'))?.type).toBe('image/png');
  });

  it('prints with the print dialog of the page', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    createBrowserDevice().print?.();
    expect(print).toHaveBeenCalledTimes(1);
  });
});
