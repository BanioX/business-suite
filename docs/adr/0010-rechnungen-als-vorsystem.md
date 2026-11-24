# ADR-0010: Offerten und Rechnungen als Vorsystem, ohne Buchhaltung und ohne Bank

- **Status:** Entwurf, zur Bestätigung durch Alban ([S-08](../entscheide.md))
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf

## Kontext

Für Handwerk, Unterhalt, Umzug, Termine und Kurse ist das Geld hereinholen die grösste tägliche Sorge: Offerten am Abend, vergessene Regiearbeiten, späte Rechnungen, offene Posten und Mahnungen von Hand (Recherche Maler, Facility, Umzug, Kurse). Randen kennt keine Rechnungen an Kundschaft. Eine Anbindung an Banken ist verboten (Randen-ADR-0011).

## Entscheid

1. Die Plattform baut **Offerte, Auftragsbestätigung, Nachtrag, Rechnung, Gutschrift, Erinnerung und Mahnung** als Dokumente aus den Daten des Auftrags (Katalog, Ausmass, Rapporte, Vertrag).
2. **QR-Zahlteil nach den Swiss Implementation Guidelines** der Herausgeberin; Regeln und Fassung stehen mit Quelle in [`../fakten/`](../fakten/README.md). Eine Bibliothek dafür nur mit permissiver Lizenz und nach Prüfung.
3. **MWST je Satz**; Betriebe mit Saldosteuersatz sehen einen Hinweis, keine Berechnung der Abrechnung. Sätze mit Gültigkeit als Regelwerk.
4. **Nummernkreis auf genau einem Gerät;** ausgestellte Dokumente sind gesperrt; Korrektur als Gutschrift oder neue Fassung.
5. **Zahlungseingang** von Hand, bar (mit Barquittung) oder **aus einer Bankdatei**, die die Person selbst aus ihrem E-Banking lädt; Zuordnung über die Referenz. Kein Zugriff auf ein E-Banking, keine Lastschrift.
6. **Vorsystem, keine Buchhaltung:** Am Monatsende geht ein Paket an die Treuhand (Rechnungen, Zahlungen, Belege, Kassenbuch, Lohn-Vorbereitung als PDF, CSV und ZIP). Die Suite führt keine Buchhaltung und gibt keine Gewähr für Steuerabrechnungen.
7. **Fristen als Erinnerung mit Quelle** (Mängelrüge, Verjährung, Bauhandwerkerpfandrecht, Verzugszins), nie als Rechtsberatung.

## Folgen

- P-29 `@onestrand/invoicing` in Welle 2; Facility, Maler und Umzug sind die ersten Nutzer.
- Vor dem ersten Pilot prüft der Betrieb eine Rechnung mit kleinem Betrag mit seiner Banking-App.
