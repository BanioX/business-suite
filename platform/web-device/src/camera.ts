// Origin: BanioX/Rettich apps/web/src/features/scan/camera.ts @ 0ac1fd2 — adapted: through the port `Device`; every state of the permission as data (granted, denied, not available, no camera, insecure page) instead of two; the lens and the zoom for codes kept, the torch left out
import type { CameraPort, Device } from './ports';
import { errorName } from './share';

/**
 * The camera (SE-07), opened only after a tap and never kept running behind the person's back.
 * Every step is optional: what a browser does not offer is skipped, and every way a camera can
 * fail ends in a state the page explains, with the file picker as the way that always works.
 *
 * Browsers start with a small picture (often 640×480) and some phones pick a lens that cannot
 * focus near: on some phones the default back camera stays blurry at 10 cm. So, for codes: ask
 * for a sharp picture, prefer the main lens, zoom in where the browser allows it, and keep the
 * autofocus running.
 */

/**
 * Why there is no picture of the camera:
 * - `insecure`: the page is not on https (or localhost); the browser gives no camera there;
 * - `unsupported`: the browser has no camera interface at all;
 * - `denied`: the person or a setting of the device refused the camera;
 * - `missing`: the device has no camera, or none it gives to the browser;
 * - `busy`: another app holds the camera;
 * - `failed`: anything else.
 */
export type CameraProblem = 'insecure' | 'unsupported' | 'denied' | 'missing' | 'busy' | 'failed';

export const CAMERA_PROBLEMS: readonly CameraProblem[] = Object.freeze([
  'insecure',
  'unsupported',
  'denied',
  'missing',
  'busy',
  'failed',
]);

/** Whether a tap on «Kamera» can work at all, before anything is asked. */
export type CameraAvailability =
  | { readonly available: true; readonly camera: CameraPort }
  | { readonly available: false; readonly problem: 'insecure' | 'unsupported' };

export function cameraAvailability(device: Device): CameraAvailability {
  if (!device.environment.secureContext) {
    return { available: false, problem: 'insecure' };
  }
  if (device.camera === undefined) {
    return { available: false, problem: 'unsupported' };
  }
  return { available: true, camera: device.camera };
}

/** What a refusal of `getUserMedia` means for the person. */
export function cameraProblemOf(error: unknown): CameraProblem {
  switch (errorName(error)) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'denied';
    case 'SecurityError':
      return 'insecure';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'missing';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'busy';
    case undefined:
    default:
      return 'failed';
  }
}

/** Sharp enough for small codes at 20 cm, still light on the decoder. */
export const VIDEO_SIZE = { width: { ideal: 1920 }, height: { ideal: 1080 } } as const;

/** Moderate zoom: the phone stays far enough away to focus, the code still fills the frame. */
export const TARGET_ZOOM = 2;

const BACK = /back|rear|rück|arrière|posteriore|environment|facing back/i;
const NOT_MAIN = /ultra|tele|front|vorder|selfie|user|dual|triple|macro|depth|tof/i;

/**
 * The main back lens from the cameras the browser lists (labels are only filled in after the
 * permission was granted): «Back Camera», not «Back Ultra Wide Camera» or the «Dual» and
 * «Triple» virtual cameras; on other phones the first «facing back», usually the main sensor.
 */
export function pickMainBackCamera(devices: readonly MediaDeviceInfo[]): string | undefined {
  return devices.find(
    (device) =>
      device.kind === 'videoinput' &&
      device.deviceId !== '' &&
      BACK.test(device.label) &&
      !NOT_MAIN.test(device.label),
  )?.deviceId;
}

/** What the camera track can do, as far as this browser tells. */
export interface CameraFeatures {
  zoom?: { min: number; max: number };
  continuousFocus: boolean;
}

interface Range {
  min?: number;
  max?: number;
}

/** Reads the capabilities defensively: they are not in every browser or TypeScript DOM type. */
export function cameraFeatures(track: MediaStreamTrack): CameraFeatures {
  const capabilities = (
    typeof (track.getCapabilities as unknown) === 'function' ? track.getCapabilities() : {}
  ) as Record<string, unknown>;
  const zoom = capabilities.zoom as Range | undefined;
  const focusModes = capabilities.focusMode;
  return {
    ...(zoom?.min !== undefined && zoom.max !== undefined && zoom.max > zoom.min
      ? { zoom: { min: zoom.min, max: zoom.max } }
      : {}),
    continuousFocus: Array.isArray(focusModes) && focusModes.includes('continuous'),
  };
}

/** The zoom to ask for: 2× where possible, never outside what the camera offers. */
export function zoomFor(features: CameraFeatures): number | undefined {
  if (features.zoom === undefined) {
    return undefined;
  }
  return Math.min(features.zoom.max, Math.max(features.zoom.min, TARGET_ZOOM));
}

/** Applies autofocus and zoom one by one, so one refused setting does not undo the other. */
export async function tuneForCodes(track: MediaStreamTrack): Promise<CameraFeatures> {
  const features = cameraFeatures(track);
  const zoom = zoomFor(features);
  const wishes: Record<string, unknown>[] = [
    ...(features.continuousFocus ? [{ focusMode: 'continuous' }] : []),
    ...(zoom === undefined ? [] : [{ zoom }]),
  ];
  for (const wish of wishes) {
    await track.applyConstraints({ advanced: [wish as MediaTrackConstraintSet] }).catch(() => {
      // Not every device accepts every setting; reading works without it.
    });
  }
  return features;
}

/** Stops every track of a stream: the light of the camera goes out. */
export function stopStream(stream: MediaStream | null | undefined): void {
  for (const track of stream?.getTracks() ?? []) {
    track.stop();
  }
}

const BACK_CAMERA: MediaStreamConstraints = {
  video: { facingMode: { ideal: 'environment' }, ...VIDEO_SIZE },
  audio: false,
};

/**
 * Opens the back camera: first any back camera (to get the permission and the labels), then the
 * main lens if that is a different one. Never asks for sound.
 */
export async function openBackCamera(camera: CameraPort): Promise<MediaStream> {
  const first = await camera.getUserMedia(BACK_CAMERA);
  const current = first.getVideoTracks()[0]?.getSettings().deviceId;
  const main = pickMainBackCamera(await camera.enumerateDevices().catch(() => []));
  if (main === undefined || main === current) {
    return first;
  }
  stopStream(first);
  return camera
    .getUserMedia({ video: { deviceId: { exact: main }, ...VIDEO_SIZE }, audio: false })
    .catch(() =>
      // The main lens is busy or gone: fall back to what worked before.
      camera.getUserMedia(BACK_CAMERA),
    );
}

/** The result of a tap on «Kamera»: a running stream, or the reason there is none. */
export type CameraStart =
  | { readonly ok: true; readonly stream: MediaStream }
  | { readonly ok: false; readonly problem: CameraProblem };

/**
 * The tap on «Kamera»: checks what can be checked without asking, then opens the back camera.
 * The browser asks the person for the permission at this moment, never before. Never throws.
 */
export async function startCamera(device: Device): Promise<CameraStart> {
  const availability = cameraAvailability(device);
  if (!availability.available) {
    return { ok: false, problem: availability.problem };
  }
  try {
    return { ok: true, stream: await openBackCamera(availability.camera) };
  } catch (error) {
    return { ok: false, problem: cameraProblemOf(error) };
  }
}
