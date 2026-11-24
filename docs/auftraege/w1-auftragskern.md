# W1: Auftragskern

Die Pakete, die fast jede Branche als Muss braucht: Rechte, Kundschaft, Objekte, Katalog, Aufträge mit Einsätzen und Rapporten, Pläne, Checklisten, Kalender und Erinnerungen. Zuerst die Verträge (W1-00), dann parallel je ein Agent. Gleichzeitig beginnt die Branche Facility ([Auftrag](branche-facility.md)) gegen die Verträge.

**Abnahme der Welle:** Eine Reinigung mit drei Objekten plant eine Woche, hakt ab, schreibt Rapporte mit Fotos und Unterschrift, druckt den Reinigungsplan als Aushang; ein Rapport ist nach der Unterschrift gesperrt, ein Nachtrag bleibt sichtbar. Alles auf einem Gerät, ohne Netz.

## W1-00

**Verträge des Auftragskerns (alpha).** Rolle: Kopf oder ein Plattform-Agent. Voraussetzung: W0-03.

- **Ziel:** Ein PR nur mit Schemas (Zod), Namen, Operationen, Ereignissen, Ports und Steckplätzen für P-21 bis P-28 und P-33, Stufe «alpha», mit Einträgen in `registry/names.json`. Danach bauen Plattform-Agenten und der Facility-Agent parallel dagegen.
- **Lesestoff:** [ADR-0005](../adr/0005-gemeinsames-datenmodell.md), [`../plattform.md`](../plattform.md), die Steckbriefe [Facility](../branchen/facility.md), [Maler](../branchen/maler.md), [Gebäudehülle](../branchen/gebaeudehuelle.md), [Umzug](../branchen/umzug.md) (Abschnitte Bedarf und Datenobjekte), damit die Verträge die ersten vier Aussendienst-Branchen tragen.
- **Abnahme:** Jede Entität aus ADR-0005, Punkt 1 (ohne Rechnung, Zeit und Kasse, die in Welle 2 kommen) hat Schema, Heikelkeit, Abgleich-Art, Operationen mit `access` und Ereignisse; Preisarten und Sperre nach Unterschrift sind im Schema; die vier Steckbriefe finden je ihre Datenobjekte als Plattform-Entität oder als eigene Tabelle mit Verweis; `api.md` je Paket.

## W1-01 bis W1-06

Je ein Plattform-Agent, parallel nach W1-00. Für jeden gelten Lesestoff, Stopp-Regeln und Bericht wie in [W0-01](w0-01-fundament.md); die Pfade sind genau das genannte Paket mit `src/`, `web/`, `test/` und `api.md`.

| Nr. | Paket | Inhalt | Herkunft | Abnahme (Auszug) |
| --- | --- | --- | --- | --- |
| W1-01 | `platform/access` (P-21) | Seiten für Rollen und Rechte, Vorlagen (Inhaber:in, Büro, Objektleitung, Mitarbeitende, Aushilfe, Lernende), Vorschau «So sieht die App für diese Rolle aus», PIN am gemeinsamen Gerät | Randen AP-2, falls plattformfähig fertig: ernten; sonst bauen | Eine Mitarbeiterin sieht keine Ansätze, Löhne, Rechnungen; niemand vergibt mehr Rechte, als er hat; eine Inhaberin bleibt immer |
| W1-02 | `platform/customers`, `platform/sites` (P-22, P-23) | Kundschaft mit Kontakten und Dokument-Sprache; Objekte hierarchisch mit Bereichen, Flächen, Anlagen, Zugangshinweisen (heikel, nie Codes), Fotos «Wo ist was?», QR-Etikett; Import aus vCard und CSV | neu | Eine Verwaltung mit zwei Liegenschaften und je drei Wohnungen; Zugangshinweis nur mit Recht sichtbar |
| W1-03 | `platform/catalog` (P-24) | Leistungen und Material mit Einheit, Ansatz in Rappen, Leistungswert als Richtwert, MWST-Satz; Vorlagen ohne Ansätze | neu | Eine Position «Unterhaltsreinigung Büro, m², 2.5 min/m² (Richtwert)» rechnet Soll-Zeit |
| W1-04 | `platform/jobs` (P-25) | Auftrag mit Status-Ledger und Preisart; Ausmass mit sichtbarer Formel; Einsatz; Rapport mit Stunden, Reisezeit, Material, Fotos, Regie getrennt, Unterschrift, danach gesperrt; Nachtrag; Abnahme mit Mängeln und Fristen | neu | Ein unterschriebener Rapport lässt sich nicht ändern, nur ergänzen; das Ausmass zeigt seine Formel |
| W1-05 | `platform/plans`, `platform/checks` (P-26, P-27) | Leistungspläne mit Intervallen, die Einsätze erzeugen; Checklisten mit Vorlage, Wiederkehr, Durchgang und Nachweis (abgehakt, Foto, Messwert, Unterschrift), Stopp-Meldung, Unterweisungsnachweis | neu; Checklisten nach dem Muster der Selbstkontrolle von Randen (AP-7 ernten, falls fertig) | Ein Plan «Treppenhaus wöchentlich, Fenster quartalsweise» erzeugt die richtigen Einsätze über Feiertage; der Aushang geht als PDF |
| W1-06 | `platform/calendar` (P-28), `platform/files` (P-33) | Betriebskalender, Feiertage je Kanton (Regelwerk mit Quelle), Saison, Abwesenheiten, Erinnerungen ohne Server (Liste, Kalenderdatei, Zahl am Symbol); Dateien und Fotos als Blob mit Prüfsumme, vorher und nachher | Randen AP-8 und AP-17 (ernten, falls fertig), Rettich (Kalenderdatei) | Feiertage für ZH, BE, VD stimmen mit der Quelle; eine Erinnerung geht als Kalenderdatei |
