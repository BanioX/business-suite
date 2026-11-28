import { IsoDateTimeSchema, localDate } from '@onestrand/core';
import { Card, Notice, PageHeader, Section, ToastProvider, UiProvider } from '@onestrand/ui';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserDevice, type SignatureRecord } from '../src/index';
import {
  DeviceProvider,
  PhotoField,
  PrintButton,
  QrReaderPanel,
  ShareButton,
  SignaturePad,
  type PhotoValue,
} from '../src/web/index';

/** The day and the moment the gallery counts from: fixed, so the pictures stay the same. */
const TODAY = localDate('2026-11-28');
const NOW = IsoDateTimeSchema.parse('2026-11-28T09:15:00.000Z');
/** The checksum of a document of the gallery (SHA-256 of «rapport»). */
const DOCUMENT = '3f3b5f2e0a9f0c4ad7d5f8cbd1d0e5e3b5b1f6a7c0b2d4e6f8a1c3e5b7d9f0a2';

/** A small picture drawn on the device: a sample photo for the field, no file needed. */
function useSamplePhoto(): PhotoValue | null {
  const [photo, setPhoto] = useState<PhotoValue | null>(null);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const context = canvas.getContext('2d');
    if (context === null) {
      return;
    }
    const sky = context.createLinearGradient(0, 0, 0, 480);
    sky.addColorStop(0, '#c9d6e6');
    sky.addColorStop(1, '#8d9db3');
    context.fillStyle = sky;
    context.fillRect(0, 0, 640, 480);
    context.fillStyle = '#5b6575';
    context.fillRect(80, 220, 480, 260);
    context.fillStyle = '#e6e9ee';
    context.fillRect(140, 280, 120, 110);
    context.fillRect(380, 280, 120, 110);
    canvas.toBlob(
      (blob) => {
        void blob?.arrayBuffer().then((buffer) => {
          setPhoto({ bytes: new Uint8Array(buffer), mediaType: 'image/jpeg' });
        });
      },
      'image/jpeg',
      0.8,
    );
  }, []);
  return photo;
}

function Parts() {
  const sample = useSamplePhoto();
  const [empty, setEmpty] = useState<PhotoValue | null>(null);
  const [filled, setFilled] = useState<PhotoValue | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [signature, setSignature] = useState<SignatureRecord | null>(null);
  const pdf = useMemo(
    () => ({
      buildPdf: () => Promise.resolve(new Blob(['%PDF-1.4'], { type: 'application/pdf' })),
      fileName: 'rapport.pdf',
      title: 'Rapport',
    }),
    [],
  );
  const file = useMemo(() => new File(['{}'], 'sicherung.json', { type: 'application/json' }), []);

  return (
    <div className="space-y-8">
      <Section
        title="Drucken und Teilen"
        hint="Im Browser der Druckdialog; in der installierten App auf dem iPhone das PDF über das Teilen."
      >
        <Card>
          <div className="flex flex-wrap gap-2">
            <PrintButton pdf={pdf} />
            <ShareButton file={file} label="Sicherung teilen" />
          </div>
        </Card>
      </Section>

      <Section title="Foto" hint="Kamera-App oder Dateien, auf dem Gerät verkleinert, ohne Ort.">
        <Card>
          <div className="space-y-6">
            <PhotoField label="Foto der Stelle" value={empty} onChange={setEmpty} />
            <PhotoField label="Foto des Schadens" value={filled ?? sample} onChange={setFilled} />
          </div>
        </Card>
      </Section>

      <Section
        title="QR-Code lesen"
        hint="Kamera erst nach dem Tippen, sonst ein Foto oder der getippte Code."
      >
        <Card>
          <QrReaderPanel onCode={setCode} />
          {code === null ? null : (
            <div className="mt-3">
              <Notice tone="ok" variant="row">
                {code}
              </Notice>
            </div>
          )}
        </Card>
      </Section>

      <Section
        title="Unterschrift"
        hint="Mit dem Finger oder einem Stift; der Name lässt sich auch eintippen."
      >
        <Card>
          <SignaturePad
            label="Rapport vom 28.11.2026"
            documentChecksum={DOCUMENT}
            now={() => NOW}
            onSign={setSignature}
            signer="Kundin Beispiel"
          />
          {signature === null ? null : (
            <div className="mt-3">
              <Notice tone="ok" variant="row">
                {`${signature.signer}, ${signature.signedAt}, ${signature.method === 'drawn' ? signature.image.checksum.slice(0, 12) : 'getippt'}`}
              </Notice>
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}

export function Gallery() {
  const device = useMemo(() => createBrowserDevice(), []);
  return (
    <UiProvider today={TODAY}>
      <ToastProvider>
        <DeviceProvider device={device}>
          <div className="min-h-dvh bg-app text-fg">
            <main className="mx-auto max-w-2xl px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-16">
              <PageHeader title="Gerät" />
              <Parts />
            </main>
          </div>
        </DeviceProvider>
      </ToastProvider>
    </UiProvider>
  );
}
