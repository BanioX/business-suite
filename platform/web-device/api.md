# @onestrand/web-device (P-10)

Was eine Ausgabe vom Gerät braucht: Teilen und Drucken (auf iPhone und iPad über das PDF), Kamera nur nach einem Tipp mit Datei als Ausweg, Fotos auf dem Gerät verkleinern, QR-Code lesen, Unterschrift auf dem Gerät, Bildschirm wach halten und die Zahl am Symbol der App. Alles, was das Gerät berührt, geht über **einen Port** (`Device`); die Logik liest nie eine Globale und läuft darum im Test ohne Browser. Nichts verlässt das Gerät: Teilen, Drucken und Herunterladen geben eine Datei der Person, die entscheidet, wohin sie geht. **Kein Standort, nie:** Der Port hat keinen Teil dafür, und ein Test findet jede Schnittstelle dazu.

Zwei Einstiege, zwei Schichten:

```ts
import { createBrowserDevice, shrinkPhoto, drawnSignature } from '@onestrand/web-device'; // Logik, ohne React
import { DeviceProvider, PrintButton, PhotoField, QrReaderPanel, SignaturePad } from '@onestrand/web-device/web'; // sichtbare Teile
```

- `src/` ist ein Paket der Schicht «Browser» (`BROWSER_PACKAGES` in `eslint.config.js`): `window`, `document`, `navigator` und `crypto` erreicht es, und nur `src/browser.ts` tut es. Es importiert `@onestrand/core` und `@onestrand/storage` (Prüfsumme), kein React und nichts aus `src/web/`.
- `src/web/` ist der React-Teil (`REACT_PARTS`): `react`, `lucide-react`, `@onestrand/ui`, `@onestrand/i18n`, `@onestrand/core`, `@onestrand/storage` und die Logik des Pakets über relative Pfade; nur `window` und `document` als Globale. Kein `react-dom`: Die Ansicht eines Fotos ist ein `<dialog>` mit `showModal()`, kein Portal.
- `"sideEffects": false`: Eine Ausgabe, die keinen QR-Code liest, trägt den Decoder nicht im Bündel.

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Port | `Device`, `EnvironmentPort`, `FilePort`, `CameraPort`, `CameraPermission`, `ImagePort`, `DecodedImage`, `DeviceCanvas`, `DrawingContext`, `PicturePreview`, `CodeDetectorPort`, `DetectedCode`, `ScreenPort`, `HeldLock`, `BadgePort`, `ClipboardPort`; `createBrowserDevice` | das Gerät als ein Objekt; im Test eine Attrappe (`test/fake-device.ts`) |
| Teilen | `shareOrDownload`, `ShareOutcome`, `ShareOptions`, `canShareFiles`, `downloadFile`, `fileHandedOver`, `isInstalledIos`, `isAbort`, `errorName` | Teilen-Blatt, sonst Herunterladen; `cancelled` ist kein Fehler |
| Drucken | `printMode`, `PrintMode` (`dialog`, `share`, `download`), `needsPdf`, `printPage`, `PrintOutcome` | Druckdialog im Browser, PDF über das Teilen in der installierten App auf iPhone und iPad |
| Kamera | `startCamera`, `CameraStart`, `cameraPermission`, `cameraAvailability`, `CameraAvailability`, `cameraProblemOf`, `CameraProblem`, `CAMERA_PROBLEMS`, `openBackCamera`, `pickMainBackCamera`, `tuneForCodes`, `cameraFeatures`, `CameraFeatures`, `zoomFor`, `stopStream`, `VIDEO_SIZE`, `TARGET_ZOOM` | hintere Kamera ohne Ton nach einem Tipp; jeder Zustand als Daten |
| Foto | `shrinkPhoto`, `ShrinkOptions`, `ShrunkPhoto`, `PHOTO_DEFAULTS`, `PhotoError`, `PhotoProblem`, `stripJpegMetadata`, `hasJpegMetadata`, `fitWithin`, `qualitySteps` | aufrecht, kleiner, als JPEG ohne Metadaten |
| QR | `createQrReader`, `QrReader`, `QrReaderKind`, `QrSource`, `QrDecoder`, `bundledQrDecoder`, `hasNativeQr`, `readQrFromFile`, `typedCode`, `QR_FORMAT`, `QR_MAX_SIDE` | Leser des Browsers, sonst der im Bündel; immer ein getippter Weg |
| Unterschrift | `drawnSignature`, `typedSignature`, `SignatureRecord`, `DrawnSignature`, `TypedSignature`, `SignatureSubject`, `SignatureStrokes`, `SignaturePoint`, `signaturePng`, `drawSignature`, `checksumOf`, `isBlank`, `roundPoint`, `SignatureError`, `SignatureProblem`, `SIGNATURE_INK`, `SIGNATURE_LINE`, `SIGNATURE_SCALE` | wer, wann, was; PNG mit Prüfsumme und die Striche |
| Bildschirm, Symbol, Ablage | `holdWakeLock`, `TaskWakeLock`, `WakeLockState`, `showActionCount`, `copyText` | wach halten während einer Aufgabe; Zahl am Symbol; Text in die Zwischenablage |

Aus `@onestrand/web-device/web`:

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Rahmen | `DeviceProvider`, `DeviceProviderProps`, `useDevice`, `useDeviceTexts`, `deviceMessages`, `DeviceMessages` | das Gerät und die Texte für die sichtbaren Teile |
| Drucken und Teilen | `PrintButton`, `PrintButtonProps`, `PrintPdf`, `usePrintAction`, `PrintAction`, `PrintNotice`, `PrintNoticeSheet`, `ShareButton`, `ShareButtonProps` | «Drucken» auf jeder Seite mit einem PDF; «Teilen» für eine fertige Datei |
| Foto | `PhotoField`, `PhotoFieldProps`, `PhotoValue`, `PhotoViewer`, `PhotoViewerProps`, `ZoomablePhoto`, `FilePickButton`, `FilePickButtonProps` | Kamera-App oder Dateien; gross auf einen Tipp |
| QR | `QrReaderPanel`, `QrReaderProps`, `QR_SCAN_INTERVAL_MS` | Kamera, Foto und getippter Code an einem Ort |
| Unterschrift | `SignaturePad`, `SignaturePadProps` | Feld für Finger oder Stift, «Löschen», «Übernehmen», getippter Name als Ausweg |
| Hooks | `useWakeLock`, `useActionCount` | Bildschirm wach während einer Aufgabe; Zahl am Symbol aus «Heute» |

## Regeln, die du kennen musst

1. **Ein Gerät je App.** Die Shell baut es einmal (`createBrowserDevice()`) und hängt `DeviceProvider` unter `UiProvider` und `ToastProvider` ein. Kein Teil baut ein eigenes; ein Test gibt seine Attrappe. Was das Gerät nicht hat, ist `undefined` im Port, und die Logik sagt es im Ergebnis, statt zu werfen.
2. **Nebenwirkungen nur im Adapter.** Teilen, Herunterladen, Drucken, Kamera, Wachhalten, Zahl am Symbol und Zwischenablage stehen in `src/browser.ts`, die Dateiauswahl in `FilePickButton` (SE-04 bis SE-11 in [`docs/nebenwirkungen.md`](../../docs/nebenwirkungen.md)). Der Adapter nennt jede Schnittstelle wörtlich (`navigator.share`, nicht `nav.share`), damit der Wächter sie sieht.
3. **Teilen braucht den Tipp.** `shareOrDownload` und `printPage` im Handler des Tipps aufrufen, nie nach einem `await`: Das Teilen-Blatt verlangt die Geste. Darum baut `usePrintAction` das PDF, sobald die Daten da sind (nur wo der Modus ein PDF braucht), und der Knopf dreht, bis es fertig ist. Dateien gehen ohne Text ins Teilen. `cancelled` heisst: Die Person hat das Blatt geschlossen, nichts melden. Herunterladen ist der letzte Weg. In der installierten App auf iPhone und iPad zählt nur `shared` als gesichert (`fileHandedOver`).
4. **Drucken auf jedem Gerät oder gar nicht.** `PrintButton` verlangt `pdf` (`buildPdf`, `fileName`, `title`); die Seite gibt ihr PDF aus `@onestrand/pdf` (Schritt 4). Im Browser öffnet der Tipp den Druckdialog, in der installierten App auf iPhone und iPad geht das PDF ins Teilen, ohne Druckdialog wird es heruntergeladen. Konnte das PDF nicht entstehen, sagt ein Blatt es ruhig, mit «Noch einmal».
5. **Kamera nur nach einem Tipp, immer mit Ausweg.** `startCamera` prüft zuerst, was ohne Frage geht (sichere Verbindung, Schnittstelle), dann fragt der Browser. Jeder Zustand hat ein Wort und einen Weg: `insecure`, `unsupported`, `denied`, `missing`, `busy`, `failed`. `cameraPermission` liest den Stand der Erlaubnis, ohne zu fragen; `QrReaderPanel` zeigt eine schon gesperrte Kamera vor dem ersten Tipp an. Die sichtbaren Teile bieten immer die Dateiauswahl, beim QR-Code dazu das Eintippen. Ohne Ton, nie im Hintergrund: «Kamera schliessen», ein gefundener Code und das Verlassen der Seite stoppen jede Spur.
6. **Fotos werden klein und stumm.** `shrinkPhoto(device, file, { maxSide, quality, maxBytes })` (Vorgabe 1600 px, 0.82, 600 000 Bytes) dekodiert aufrecht (die Lage, die die Kamera speicherte), zeichnet auf Weiss und schreibt JPEG neu; `stripJpegMetadata` entfernt dazu jedes Anwendungssegment ausser JFIF und jeden Kommentar, also auch den Ort. Das Ergebnis sind Bytes (`ShrunkPhoto`), bereit für den Dateispeicher. Probleme kommen als `PhotoError` mit `problem`.
7. **QR-Code: drei Wege.** `createQrReader(device)` nimmt den Leser des Browsers (`BarcodeDetector` mit `qr_code`), sonst den Decoder im Bündel (`jsqr`, Apache-2.0, reines JavaScript, kein CDN, kein WebAssembly: die CSP bleibt `'self'`). `QrReaderPanel` bietet Kamera, Foto und getippten Code; das Bild wird im Speicher gelesen und nie gesichert. Nur QR: Strichcodes (EAN) liest nur der Leser des Browsers (Schuld TD-135).
8. **Unterschrift: festhalten, nie beurteilen.** `drawnSignature(device, { signer, documentChecksum, signedAt }, strokes)` gibt einen eingefrorenen Datensatz: wer (der Name, wie gegeben), wann (ISO-UTC aus der Uhr der App, nie vom Gerät gelesen), was (SHA-256 des Dokuments, `checksumOf`), dazu das PNG (doppelte Grösse, Tinte auf durchsichtigem Grund) mit eigener Prüfsumme und die Striche als Daten. `typedSignature` hält einen getippten Namen fest und heisst überall «getippt». Die App sagt nie, ob eine Unterschrift rechtlich genügt; `SignaturePad` sagt es der Person so. Was unterschrieben ist, ist gesperrt: Das ist Sache des Moduls, das den Datensatz speichert.
9. **Wach halten nur während einer Aufgabe.** `holdWakeLock(device)` (oder `useWakeLock(active)`) hält den Bildschirm an, solange die Seite sichtbar ist, lässt los, sobald sie verborgen ist, fragt beim Zurückkehren neu und lässt am Ende der Aufgabe los. Ohne Schnittstelle: `unsupported`, und die Aufgabe geht trotzdem.
10. **Die Zahl am Symbol ist kein Lockmittel** ([S-26](../../docs/entscheide.md)). `showActionCount(device, n)` (oder `useActionCount(n)`) zeigt nur, was die Person tun muss, nichts bei 0, still ohne Schnittstelle.
11. **Texte nur aus dem Katalog** (`deviceMessages`, de-CH, «du», «ss»). `DeviceProvider translation={…}` gibt eine andere Sprache, eine Lücke fällt Schlüssel für Schlüssel auf de-CH zurück. Jede Meldung eines Problems nennt den Weg, der geht.
12. **Kit und Tokens.** Die sichtbaren Teile sind aus `@onestrand/ui` gebaut und zeichnen nur mit Tokens; die zwei festen Farben des Pakets gehören zu Dateien, nicht zum Bildschirm (Weiss unter einem JPEG, die Tinte des PNG) und stehen in der Logik. Auf dem Bildschirm zeichnet das Feld der Unterschrift in der Farbe der Schrift (`text-fg`), hell und dunkel lesbar. Ziele ab 44 px, Felder ab 16 px.

## Beispiel

```tsx
const device = createBrowserDevice(); // einmal, beim Start der App

<UiProvider today={today}>
  <ToastProvider>
    <DeviceProvider device={device}>
      <PrintButton pdf={{ buildPdf, fileName: 'rapport.pdf', title: 'Rapport' }} />
      <PhotoField label="Foto der Stelle" value={photo} onChange={setPhoto} shrink={{ maxSide: 1280 }} />
      <QrReaderPanel onCode={(code) => open(code)} typedLabel="Nummer des Objekts" />
      <SignaturePad documentChecksum={await checksumOf(device, pdfBytes)} now={clock.now} onSign={save} />
    </DeviceProvider>
  </ToastProvider>
</UiProvider>
```

## Galerie

`pnpm --filter @onestrand/web-device gallery` zeigt jeden sichtbaren Teil auf dem echten Gerät des Browsers im Thema nach S-27 (`gallery/`, nur zur Entwicklung, nie ausgeliefert); `?scheme=dark` wählt den dunklen Modus.

## Was nicht hier steht

Das PDF selbst (`@onestrand/pdf`), der Rahmen und die App-Sperre (`@onestrand/shell`), und was eine Branche mit einem Foto, einem Code oder einer Unterschrift tut (Speichern, Sperren nach der Unterschrift, Nachtrag).
