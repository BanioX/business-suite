// Origin: BanioX/Randen apps/web/src/ui/PhotoField.tsx @ e0f0907 — adapted: built with @onestrand/ui; the photo as bytes made small through the port (`shrinkPhoto`) with its options; the picture shown through an address of the page that is freed again; no word of a trade
import { Camera, FolderOpen, RefreshCw, Trash2 } from 'lucide-react';
import { Button, FieldGroup } from '@onestrand/ui';
import { useEffect, useMemo, useState } from 'react';
import { PhotoError, shrinkPhoto, type ShrinkOptions } from '../photo';
import { useDevice, useDeviceTexts } from './context';
import { FilePickButton } from './FilePickButton';
import { ZoomablePhoto } from './PhotoViewer';

/** A photo as the app keeps it: bytes and their type. `shrinkPhoto` gives one. */
export interface PhotoValue {
  readonly bytes: Uint8Array;
  readonly mediaType: string;
}

export interface PhotoFieldProps {
  /** What the photo shows: «Foto der Stelle», «Foto des Schadens». */
  label: string;
  hideLabel?: boolean | undefined;
  value: PhotoValue | null;
  onChange: (value: PhotoValue | null) => void;
  hint?: string | undefined;
  /** An error the form found. */
  error?: string | null | undefined;
  disabled?: boolean | undefined;
  /** Longest side, quality and size of the photo (`shrinkPhoto`). */
  shrink?: ShrinkOptions | undefined;
  className?: string | undefined;
}

/** An address of the page for the photo while it is shown; freed when it changes or goes. */
function usePreview(value: PhotoValue | null): string | null {
  const device = useDevice();
  const preview = useMemo(
    () =>
      value === null
        ? null
        : device.images.preview(new Blob([new Uint8Array(value.bytes)], { type: value.mediaType })),
    [device, value],
  );
  useEffect(
    () => () => {
      preview?.release();
    },
    [preview],
  );
  return preview?.url ?? null;
}

/**
 * A photo field. Two ways in: «Foto aufnehmen» opens the back camera of a phone, «Aus Dateien
 * wählen» the pictures and files of the device, so a device without a camera, or with the camera
 * refused, still has a way (SE-08). The photo is made small on the device and written anew
 * without metadata, so the place it was taken is not kept; it never leaves the device. With a
 * photo the field shows it, large on a tap, with «Ersetzen» and «Entfernen».
 */
export function PhotoField({
  label,
  hideLabel,
  value,
  onChange,
  hint,
  error,
  disabled = false,
  shrink,
  className,
}: PhotoFieldProps) {
  const device = useDevice();
  const texts = useDeviceTexts().photo;
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const src = usePreview(value);

  async function take(file: File) {
    setWorking(true);
    setProblem(null);
    try {
      onChange(await shrinkPhoto(device, file, shrink));
    } catch (caught) {
      setProblem(
        caught instanceof PhotoError && caught.problem === 'too_large'
          ? texts.tooLarge
          : texts.failed,
      );
    } finally {
      setWorking(false);
    }
  }

  const onFile = (file: File) => {
    void take(file);
  };
  const resting = disabled || working;
  const context = texts.forField(label);

  return (
    <FieldGroup
      legend={label}
      hideLegend={hideLabel}
      hint={hint ?? texts.onDevice}
      error={problem ?? error}
      className={className}
    >
      {value === null || src === null ? (
        <div className="flex flex-wrap gap-2">
          <FilePickButton
            icon={Camera}
            text={texts.take}
            context={context}
            accept="image/*"
            capture="environment"
            disabled={resting}
            onFile={onFile}
          />
          <FilePickButton
            icon={FolderOpen}
            text={texts.choose}
            context={context}
            accept="image/*"
            disabled={resting}
            onFile={onFile}
          />
        </div>
      ) : (
        <div className="max-w-sm space-y-2">
          <ZoomablePhoto src={src} title={label} className="aspect-[4/3]" />
          <div className="flex flex-wrap gap-2">
            <FilePickButton
              icon={RefreshCw}
              text={texts.replace}
              context={context}
              accept="image/*"
              disabled={resting}
              onFile={onFile}
            />
            <Button
              variant="secondary"
              icon={Trash2}
              disabled={resting}
              onClick={() => {
                setProblem(null);
                onChange(null);
              }}
            >
              {texts.remove}
              <span className="sr-only">{context}</span>
            </Button>
          </div>
        </div>
      )}
      <p role="status" className="text-sm text-muted">
        {working ? <span className="mt-1.5 block">{texts.working}</span> : null}
      </p>
    </FieldGroup>
  );
}
