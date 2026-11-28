// Origin: BanioX/Randen apps/web/src/ui/messages.files.ts @ e0f0907 — adapted: only the texts of printing; no product name (the app is «die App»); the texts of sharing, the photo, the camera, the QR code and the signature added
// Origin: BanioX/Randen apps/web/src/ui/messages.forms.ts @ e0f0907 — adapted: only the texts of the photo field and the viewer
/**
 * The texts of the device, in German (Switzerland): the source of every other language (suite
 * ADR-0007). «ss» instead of «ß», one person addressed with «du», no exclamation mark. A problem
 * says what is and what to do, without blame and without technical words, and always names the
 * way that works (a file, a typed code). No component holds a text of its own: each reads this
 * catalogue through `useDeviceTexts()`, so `DeviceProvider` can hand in another language.
 */
export const deviceMessages = {
  print: {
    print: 'Drucken',
    /** Read out while the PDF of the page is being prepared. */
    preparing: 'Das PDF wird vorbereitet …',
    sheetTitle: 'Drucken',
    /** The PDF could not be built from the page's data; «Noch einmal» builds it again. */
    buildFailed:
      'Das PDF liess sich nicht vorbereiten. Tippe auf «Noch einmal». Geht es wieder nicht, schliesse die App ganz und öffne sie neu.',
    retry: 'Noch einmal',
    /** The finished PDF could be neither shared nor downloaded. */
    failed:
      'Das PDF liess sich weder weitergeben noch sichern. Schliesse die App ganz, öffne sie wieder und tippe noch einmal auf «Drucken».',
    /** In the installed app on an iPhone or iPad, where printing goes through the share sheet. */
    shareHint: 'Nach dem Tippen wählst du beim Teilen «Drucken» oder «In Dateien sichern».',
    /** Where there is no print dialog at all. */
    downloaded: 'Das PDF ist gesichert. Du findest es bei deinen Downloads.',
    close: 'Verstanden',
  },
  share: {
    share: 'Teilen',
    failed: 'Die Datei liess sich weder weitergeben noch sichern. Tippe noch einmal auf «Teilen».',
    downloaded: 'Die Datei ist gesichert. Du findest sie bei deinen Downloads.',
  },
  photo: {
    take: 'Foto aufnehmen',
    choose: 'Aus Dateien wählen',
    replace: 'Ersetzen',
    remove: 'Entfernen',
    working: 'Das Foto wird verkleinert …',
    failed: 'Dieses Bild lässt sich nicht lesen. Wähle ein anderes Foto.',
    tooLarge: 'Dieses Bild lässt sich nicht klein genug machen. Wähle ein anderes Foto.',
    /** Read after the name of the field, so two photo fields on a page differ. */
    forField: (field: string) => `, ${field}`,
    open: (title: string) => `${title} gross anzeigen`,
    close: 'Schliessen',
    /** Under the field: what happens with the photo. */
    onDevice: 'Das Foto bleibt auf diesem Gerät, ohne Ort und ohne Angaben der Kamera.',
  },
  camera: {
    start: 'Kamera öffnen',
    stop: 'Kamera schliessen',
    starting: 'Die Kamera startet …',
    /** While the camera is reading. */
    aim: 'Halte den Code in den Rahmen.',
    insecure:
      'Die Kamera geht nur auf einer sicheren Verbindung. Wähle ein Foto des Codes oder tippe ihn ein.',
    unsupported:
      'Dieser Browser gibt keine Kamera frei. Wähle ein Foto des Codes oder tippe ihn ein.',
    denied:
      'Die Kamera ist für diese App gesperrt. Du kannst sie in den Einstellungen des Geräts erlauben, ein Foto wählen oder den Code eintippen.',
    missing:
      'Auf diesem Gerät ist keine Kamera zu finden. Wähle ein Foto des Codes oder tippe ihn ein.',
    busy: 'Die Kamera ist gerade besetzt. Schliesse andere Apps mit Kamera, wähle ein Foto oder tippe den Code ein.',
    failed: 'Die Kamera liess sich nicht öffnen. Wähle ein Foto des Codes oder tippe ihn ein.',
    /** The name of the live picture of the camera. */
    preview: 'Bild der Kamera',
  },
  qr: {
    photo: 'Foto des Codes wählen',
    noCode:
      'Auf diesem Bild ist kein Code zu lesen. Wähle ein schärferes Foto oder tippe den Code ein.',
    typed: 'Code eintippen',
    typedHint: 'Steht neben dem Code, oder unter ihm in kleiner Schrift.',
    use: 'Übernehmen',
    found: (code: string) => `Gelesen: ${code}`,
  },
  signature: {
    pad: 'Unterschrift',
    padHint: 'Unterschreibe mit dem Finger oder einem Stift im Feld.',
    clear: 'Löschen',
    accept: 'Übernehmen',
    blank: 'Im Feld steht noch keine Unterschrift.',
    signer: 'Name der Person, die unterschreibt',
    /** The switch to the typed name, for a keyboard or where drawing is not possible. */
    typeInstead: 'Namen eintippen statt zeichnen',
    drawInstead: 'Unterschrift zeichnen',
    typedNote:
      'Der Name wird als getippte Unterschrift festgehalten, nicht als gezeichnete. Die App hält fest, wer, wann und was, und prüft nicht, ob das rechtlich genügt.',
    drawnNote:
      'Die App hält fest, wer, wann und was unterschrieben hat, und prüft nicht, ob das rechtlich genügt.',
    /** Shown with a typed signature wherever it appears. */
    typed: 'getippt',
    noSigner: 'Trag den Namen der Person ein, die unterschreibt.',
    failed: 'Die Unterschrift liess sich nicht festhalten. Tippe noch einmal auf «Übernehmen».',
    done: 'Unterschrift festgehalten.',
  },
} as const;

/** The texts of the device: the type of `deviceMessages` and of every translation of it. */
export type DeviceMessages = typeof deviceMessages;
