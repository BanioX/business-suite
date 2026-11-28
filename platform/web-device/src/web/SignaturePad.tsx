import type { IsoDateTime } from '@onestrand/core';
import { Eraser, Keyboard, PenLine, Check } from 'lucide-react';
import { Button, Notice, TextField } from '@onestrand/ui';
import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import {
  drawnSignature,
  drawSignature,
  isBlank,
  roundPoint,
  SignatureError,
  typedSignature,
  type SignaturePoint,
  type SignatureRecord,
  type SignatureStrokes,
} from '../signature';
import { useDevice, useDeviceTexts } from './context';
import { useWakeLock } from './hooks';

export interface SignaturePadProps {
  /** The checksum of the document that is signed (`checksumOf` its bytes). */
  documentChecksum: string;
  /** The clock of the app: the moment of the signature, ISO-UTC. The pad never reads the clock. */
  now: () => IsoDateTime;
  /** Hears the record once «Übernehmen» made it. */
  onSign: (record: SignatureRecord) => void;
  /** The name to start with, if the app knows who signs. */
  signer?: string | undefined;
  /** Above the pad: what is signed («Rapport vom 28.11.2026»). */
  label?: string | undefined;
}

type Mode = 'draw' | 'type';

const EMPTY: SignatureStrokes = { width: 0, height: 0, strokes: [] };

/**
 * A signature on the device (P-10): a pad for a finger or a pen (pointer events), with
 * «Löschen» and «Übernehmen». Where drawing is not possible (a keyboard only, a screen reader),
 * «Namen eintippen statt zeichnen» records the typed name as a typed signature, and says so. The
 * record holds who, when and what, the PNG with its checksum and the strokes; the app never judges
 * whether the signature is legally valid. The screen stays on while the pad is open (SE-09).
 */
export function SignaturePad({
  documentChecksum,
  now,
  onSign,
  signer: initialSigner = '',
  label,
}: SignaturePadProps) {
  const device = useDevice();
  const texts = useDeviceTexts().signature;
  const hintId = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<SignaturePoint[] | null>(null);
  const [mode, setMode] = useState<Mode>('draw');
  const [strokes, setStrokes] = useState<SignatureStrokes>(EMPTY);
  const [signer, setSigner] = useState(initialSigner);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useWakeLock(true);

  // Draws what is recorded, sharp on the screen of the device, in the colour of the text.
  useEffect(() => {
    const element = canvas.current;
    if (element === null) {
      return;
    }
    const box = element.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    element.width = Math.max(1, Math.round(box.width * ratio));
    element.height = Math.max(1, Math.round(box.height * ratio));
    const context = element.getContext('2d');
    if (context === null) {
      return;
    }
    context.clearRect(0, 0, element.width, element.height);
    drawSignature(context, strokes, ratio, window.getComputedStyle(element).color);
  }, [strokes, mode]);

  function point(event: PointerEvent<HTMLCanvasElement>): SignaturePoint {
    const box = event.currentTarget.getBoundingClientRect();
    return roundPoint(event.clientX - box.left, event.clientY - box.top);
  }

  function onDown(event: PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const box = event.currentTarget.getBoundingClientRect();
    const stroke = [point(event)];
    drawing.current = stroke;
    setProblem(null);
    setStrokes((before) => ({
      width: Math.round(box.width),
      height: Math.round(box.height),
      strokes: [...before.strokes, [...stroke]],
    }));
  }

  function onMove(event: PointerEvent<HTMLCanvasElement>) {
    const stroke = drawing.current;
    if (stroke === null) {
      return;
    }
    stroke.push(point(event));
    setStrokes((before) => ({ ...before, strokes: [...before.strokes.slice(0, -1), [...stroke]] }));
  }

  function onUp() {
    drawing.current = null;
  }

  async function accept() {
    setProblem(null);
    if (signer.trim() === '') {
      setProblem(texts.noSigner);
      return;
    }
    if (mode === 'draw' && isBlank(strokes)) {
      setProblem(texts.blank);
      return;
    }
    const subject = { signer, documentChecksum, signedAt: now() };
    setBusy(true);
    try {
      onSign(
        mode === 'type' ? typedSignature(subject) : await drawnSignature(device, subject, strokes),
      );
    } catch (error) {
      setProblem(
        error instanceof SignatureError && error.problem === 'no_signer'
          ? texts.noSigner
          : texts.failed,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <TextField
        label={texts.signer}
        value={signer}
        onChange={setSigner}
        autoComplete="name"
        required
      />
      {mode === 'draw' ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-fg">{label ?? texts.pad}</p>
          <canvas
            ref={canvas}
            role="img"
            aria-label={label ?? texts.pad}
            aria-describedby={hintId}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="block h-40 w-full touch-none rounded-2xl border border-line-strong bg-surface text-fg"
          />
          <p id={hintId} className="text-sm text-muted">
            {texts.padHint} {texts.drawnNote}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={Eraser}
              disabled={isBlank(strokes) || busy}
              onClick={() => {
                setStrokes(EMPTY);
                setProblem(null);
              }}
            >
              {texts.clear}
            </Button>
            <Button icon={Check} busy={busy} onClick={() => void accept()}>
              {texts.accept}
            </Button>
          </div>
          <Button
            variant="quiet"
            size="sm"
            icon={Keyboard}
            onClick={() => {
              setMode('type');
              setProblem(null);
            }}
          >
            {texts.typeInstead}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Notice tone="info" variant="row">
            {texts.typedNote}
          </Notice>
          <div className="flex flex-wrap gap-2">
            <Button icon={Check} busy={busy} onClick={() => void accept()}>
              {texts.accept}
            </Button>
            <Button
              variant="quiet"
              icon={PenLine}
              onClick={() => {
                setMode('draw');
                setProblem(null);
              }}
            >
              {texts.drawInstead}
            </Button>
          </div>
        </div>
      )}
      <p role="alert" className="text-sm font-semibold text-bad">
        {problem ?? ''}
      </p>
    </div>
  );
}
