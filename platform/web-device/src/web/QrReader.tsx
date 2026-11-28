// Origin: BanioX/Rettich apps/web/src/features/scan/BarcodeScanner.tsx @ 0ac1fd2 — adapted: QR only, through the port and its reader (the browser's own or the one of the bundle); every state of the camera explained with the way that works; the screen kept on while the camera reads; built with @onestrand/ui; no torch, no vibration
import { Camera, CameraOff, ImageUp } from 'lucide-react';
import { Button, Notice, TextField } from '@onestrand/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cameraPermission,
  startCamera,
  stopStream,
  tuneForCodes,
  type CameraProblem,
} from '../camera';
import { createQrReader, readQrFromFile, typedCode, type QrReader } from '../qr';
import { holdWakeLock, type TaskWakeLock } from '../screen';
import { useDevice, useDeviceTexts } from './context';
import { FilePickButton } from './FilePickButton';

/** Milliseconds between two reads of the video: fast enough to feel instant, light on battery. */
export const QR_SCAN_INTERVAL_MS = 250;

type CameraState = 'idle' | 'starting' | 'reading';

export interface QrReaderProps {
  /** Hears the text of the code: read by the camera, from a photo, or typed. */
  onCode: (code: string) => void;
  /** The label of the typed field; default «Code eintippen». */
  typedLabel?: string | undefined;
  /** What stands beside the code on paper, so a person finds it to type. */
  typedHint?: string | undefined;
}

/**
 * Reads a QR code with every fallback (CLAUDE.md, camera only after a tap): the camera starts
 * only on «Kamera öffnen» (SE-07), a refused, missing or busy camera explains itself, and a photo
 * of the code (SE-08) and the typed code always work. Pictures are read in memory and never
 * kept. While the camera reads, the screen stays on (SE-09).
 */
export function QrReaderPanel({ onCode, typedLabel, typedHint }: QrReaderProps) {
  const device = useDevice();
  const texts = useDeviceTexts();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const lock = useRef<TaskWakeLock | null>(null);
  const reader = useRef<Promise<QrReader> | null>(null);
  /** Counts camera sessions: a start that is overtaken by «stop» gives up. */
  const session = useRef(0);
  const [state, setState] = useState<CameraState>('idle');
  const [problem, setProblem] = useState<CameraProblem | null>(null);
  const [message, setMessage] = useState('');
  const [typed, setTyped] = useState('');

  const readerOf = useCallback(() => {
    reader.current ??= createQrReader(device);
    return reader.current;
  }, [device]);

  // Before any tap: a camera that is refused already, or cannot be, says so with the ways that
  // work. Reading the state asks nothing.
  useEffect(() => {
    let current = true;
    void cameraPermission(device).then((state) => {
      if (current && (state === 'denied' || state === 'insecure' || state === 'unsupported')) {
        setProblem(state);
      }
    });
    return () => {
      current = false;
    };
  }, [device]);

  const stop = useCallback(() => {
    session.current += 1;
    window.clearTimeout(timer.current);
    stopStream(stream.current);
    stream.current = null;
    void lock.current?.release();
    lock.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const found = useCallback(
    (code: string) => {
      stop();
      setState('idle');
      setMessage(texts.qr.found(code));
      onCode(code);
    },
    [onCode, stop, texts],
  );

  async function start() {
    setMessage('');
    setProblem(null);
    setState('starting');
    session.current += 1;
    const mine = session.current;
    const overtaken = () => session.current !== mine;
    const result = await startCamera(device);
    if (overtaken()) {
      if (result.ok) {
        stopStream(result.stream);
      }
      return;
    }
    if (!result.ok) {
      setState('idle');
      setProblem(result.problem);
      return;
    }
    stream.current = result.stream;
    lock.current = holdWakeLock(device);
    const track = result.stream.getVideoTracks()[0];
    if (track !== undefined) {
      await tuneForCodes(track);
    }
    const element = video.current;
    if (overtaken() || element === null) {
      return;
    }
    try {
      element.srcObject = result.stream;
      await element.play();
    } catch {
      stop();
      setState('idle');
      setProblem('failed');
      return;
    }
    if (overtaken()) {
      return;
    }
    setState('reading');
    const qr = await readerOf();
    const tick = async () => {
      if (overtaken()) {
        return;
      }
      const code = await qr.read({
        source: element,
        width: element.videoWidth,
        height: element.videoHeight,
      });
      if (overtaken()) {
        return;
      }
      if (code === null) {
        timer.current = window.setTimeout(() => void tick(), QR_SCAN_INTERVAL_MS);
      } else {
        found(code);
      }
    };
    void tick();
  }

  async function readPhoto(file: File) {
    setMessage('');
    const code = await readQrFromFile(device, await readerOf(), file);
    if (code === null) {
      setMessage(texts.qr.noCode);
    } else {
      found(code);
    }
  }

  function submitTyped() {
    const code = typedCode(typed);
    if (code !== null) {
      setTyped('');
      found(code);
    }
  }

  const live = state !== 'idle';

  return (
    <div className="space-y-3">
      <div className={live ? 'relative overflow-hidden rounded-2xl bg-surface-muted' : 'hidden'}>
        <video
          ref={video}
          playsInline
          muted
          aria-label={texts.camera.preview}
          className="aspect-[4/3] w-full object-cover"
        />
        {/* Aiming frame: codes in the middle are read first and best. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[18%] top-1/2 aspect-square -translate-y-1/2 rounded-xl border-2 border-accent-edge"
        />
      </div>
      {live ? (
        <>
          <p className="text-sm text-muted">
            {state === 'starting' ? texts.camera.starting : texts.camera.aim}
          </p>
          <Button
            variant="secondary"
            icon={CameraOff}
            fullWidth
            onClick={() => {
              stop();
              setState('idle');
            }}
          >
            {texts.camera.stop}
          </Button>
        </>
      ) : (
        <Button
          icon={Camera}
          fullWidth
          onClick={() => {
            void start();
          }}
        >
          {texts.camera.start}
        </Button>
      )}

      {problem === null ? null : (
        <Notice tone="warn" variant="row">
          {texts.camera[problem]}
        </Notice>
      )}

      <FilePickButton
        icon={ImageUp}
        text={texts.qr.photo}
        accept="image/*"
        fullWidth
        onFile={(file) => {
          void readPhoto(file);
        }}
      />

      {/* No <form> here: the reader may sit inside a form, and forms must not nest. */}
      <div className="space-y-2">
        <TextField
          label={typedLabel ?? texts.qr.typed}
          hint={typedHint ?? texts.qr.typedHint}
          value={typed}
          onChange={setTyped}
          autoComplete="off"
        />
        <Button variant="secondary" onClick={submitTyped}>
          {texts.qr.use}
        </Button>
      </div>

      <p role="status" className="text-sm text-muted">
        {message}
      </p>
    </div>
  );
}
