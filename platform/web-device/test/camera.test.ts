import { describe, expect, it } from 'vitest';
import {
  CAMERA_PROBLEMS,
  cameraAvailability,
  cameraFeatures,
  cameraProblemOf,
  openBackCamera,
  pickMainBackCamera,
  startCamera,
  stopStream,
  tuneForCodes,
  zoomFor,
} from '../src/index';
import { createFakeDevice, fakeCamera, fakeStream } from './fake-device';

function camera(label: string, deviceId = label): MediaDeviceInfo {
  return { kind: 'videoinput', label, deviceId, groupId: '', toJSON: () => ({}) };
}

const refused = (name: string) => () => Promise.reject(new DOMException('no', name));

describe('whether a camera can be asked for', () => {
  it('refuses on a page that is not secure, before anything is asked', async () => {
    const asking = fakeCamera(() => Promise.resolve(fakeStream()));
    const device = createFakeDevice({ secureContext: false, camera: asking });
    expect(cameraAvailability(device)).toEqual({ available: false, problem: 'insecure' });
    expect(await startCamera(device)).toEqual({ ok: false, problem: 'insecure' });
    expect(asking.asked).toEqual([]);
  });

  it('says when the browser has no camera interface', async () => {
    const device = createFakeDevice({ camera: undefined });
    expect(await startCamera(device)).toEqual({ ok: false, problem: 'unsupported' });
  });
});

describe('startCamera', () => {
  it('opens the back camera without sound', async () => {
    const asking = fakeCamera(() => Promise.resolve(fakeStream()));
    const result = await startCamera(createFakeDevice({ camera: asking }));
    expect(result.ok).toBe(true);
    expect(asking.asked).toEqual([
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      },
    ]);
  });

  it.each([
    ['NotAllowedError', 'denied'],
    ['PermissionDeniedError', 'denied'],
    ['SecurityError', 'insecure'],
    ['NotFoundError', 'missing'],
    ['OverconstrainedError', 'missing'],
    ['NotReadableError', 'busy'],
    ['AbortError', 'busy'],
    ['UnknownError', 'failed'],
  ])('turns %s into the state %s', async (name, problem) => {
    const device = createFakeDevice({ camera: fakeCamera(refused(name)) });
    expect(await startCamera(device)).toEqual({ ok: false, problem });
  });

  it('names a refusal without a name «failed», and knows every state', () => {
    expect(cameraProblemOf(new Error('x'))).toBe('failed');
    expect(cameraProblemOf(undefined)).toBe('failed');
    expect(CAMERA_PROBLEMS).toEqual([
      'insecure',
      'unsupported',
      'denied',
      'missing',
      'busy',
      'failed',
    ]);
  });
});

describe('the lens', () => {
  it('picks the main back lens, not the wide, the tele, the front or a virtual camera', () => {
    expect(
      pickMainBackCamera([
        camera('Front Camera'),
        camera('Back Ultra Wide Camera'),
        camera('Back Dual Wide Camera'),
        camera('Back Camera', 'main'),
      ]),
    ).toBe('main');
    expect(pickMainBackCamera([camera('camera2 0, facing back', 'a')])).toBe('a');
    expect(pickMainBackCamera([camera('Back Camera', '')])).toBeUndefined();
    expect(pickMainBackCamera([])).toBeUndefined();
  });

  it('switches to the main lens when the first camera was another one, and stops the first', async () => {
    const first = fakeStream('wide');
    const main = fakeStream('main');
    const asking = fakeCamera(
      (constraints) =>
        Promise.resolve(JSON.stringify(constraints).includes('exact') ? main : first),
      [camera('Back Ultra Wide Camera', 'wide'), camera('Back Camera', 'main')],
    );
    expect(await openBackCamera(asking)).toBe(main);
    expect(first.track.stopped).toBe(true);
  });

  it('keeps the first camera when it is the main one, and falls back when the main one is busy', async () => {
    const only = fakeStream('main');
    expect(
      await openBackCamera(
        fakeCamera(() => Promise.resolve(only), [camera('Back Camera', 'main')]),
      ),
    ).toBe(only);
    let calls = 0;
    const fallback = fakeStream('wide');
    const busy = fakeCamera(() => {
      calls += 1;
      return calls === 2
        ? Promise.reject(new DOMException('busy', 'NotReadableError'))
        : Promise.resolve(fallback);
    }, [camera('Back Camera', 'main')]);
    expect(await openBackCamera(busy)).toBe(fallback);
    expect(calls).toBe(3);
  });

  it('opens a camera even when the list of cameras cannot be read', async () => {
    const stream = fakeStream();
    const asking = {
      ...fakeCamera(() => Promise.resolve(stream)),
      enumerateDevices: () => Promise.reject(new Error('no list')),
    };
    expect(await openBackCamera(asking)).toBe(stream);
  });
});

describe('tuning for codes', () => {
  it('asks for continuous focus and a zoom of 2 within what the camera offers', async () => {
    const stream = fakeStream('main', {
      zoom: { min: 1, max: 5 },
      focusMode: ['manual', 'continuous'],
    });
    const [track] = stream.getVideoTracks();
    if (track === undefined) {
      throw new Error('no track');
    }
    expect(await tuneForCodes(track)).toEqual({ zoom: { min: 1, max: 5 }, continuousFocus: true });
    expect(stream.track.constraints).toEqual([
      { advanced: [{ focusMode: 'continuous' }] },
      { advanced: [{ zoom: 2 }] },
    ]);
  });

  it('skips what the camera does not tell, and keeps the zoom inside its range', () => {
    expect(zoomFor({ continuousFocus: false })).toBeUndefined();
    expect(zoomFor({ zoom: { min: 3, max: 8 }, continuousFocus: false })).toBe(3);
    expect(zoomFor({ zoom: { min: 1, max: 1.5 }, continuousFocus: false })).toBe(1.5);
    const bare = { getCapabilities: undefined } as unknown as MediaStreamTrack;
    expect(cameraFeatures(bare)).toEqual({ continuousFocus: false });
    const flat = {
      getCapabilities: () => ({ zoom: { min: 1, max: 1 } }),
    } as unknown as MediaStreamTrack;
    expect(cameraFeatures(flat)).toEqual({ continuousFocus: false });
  });

  it('goes on when the camera refuses a setting', async () => {
    const track = {
      getCapabilities: () => ({ focusMode: ['continuous'] }),
      applyConstraints: () => Promise.reject(new Error('refused')),
    } as unknown as MediaStreamTrack;
    expect(await tuneForCodes(track)).toEqual({ continuousFocus: true });
  });

  it('stops every track, and nothing without a stream', () => {
    const stream = fakeStream();
    stopStream(stream);
    expect(stream.track.stopped).toBe(true);
    expect(() => {
      stopStream(null);
    }).not.toThrow();
  });
});
