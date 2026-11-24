# ADR-0006: Geräte und Abgleich zwischen Büro und Aussendienst

- **Status:** Entwurf; Punkte 4 und 5 brauchen Albans JA ([S-06](../entscheide.md)) [Datenfluss]
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf
- **Betrifft:** Randen-ADR-0006 (Daten bleiben auf dem Gerät), Randen-ADR-0025 (Stufe 2), Randen-ADR-0028 (Kopplung im WLAN), Randen W13 bis W15

## Kontext

In Reinigung, Maler, Dach, Umzug und Haustechnik geschieht der grösste Teil der Arbeit beim Objekt der Kundschaft, oft ohne Netz, mit Handschuhen, auf eigenen Handys der Mitarbeitenden. Das Büro ist ein Laptop am Abend. Ohne Server gibt es keinen Abgleich über das Internet. Die Kopplung im WLAN des Betriebs ist in Randen nur für Bons der Gastronomie erlaubt.

## Entscheid

1. **Gerätearten:** Hauptgerät (Büro oder Handy der Inhaberin; ganzer Betrieb, alleiniger Schreiber von Stammdaten, Preisen, Rechnungen und Nummernkreisen), Gerät im Betrieb (Werkhof, Empfang, Theke; oft im Gerätemodus), Aussendienst-Gerät (Handy einer Person oder einer Equipe).
2. **Runter eine Mappe, rauf Befehle:** Aufs Aussendienst-Gerät kommt eine nach Rolle gefilterte, nur lesbare Mappe mit Ablaufdatum (eigene Einsätze, nötige Angaben zu Objekt und Kundschaft, Checklisten, Vorlagen). Zurück gehen Befehle mit `commandId` (Rapport, Zeit, Foto, Unterschrift, Mangel), die das Hauptgerät mit Schema und Rechten prüft und idempotent ausführt. Handys fügen nur an; es gibt keine Konfliktregel zu erfinden.
3. **Ein Abgleich, Transport als Port:** `@onestrand/pairing` baut genau einen Abgleich; der Transport ist austauschbar (Kopplung im WLAN, verschlüsselte Datei, später Relais). Keine Branche baut einen eigenen.
4. **Stufe 1, nach Albans JA:** Kopplung im WLAN des Betriebs auch für Einsätze, Rapporte, Zeit, Fotos und Mängel (morgens Mappe, abends Befehle; Handschlag über den Vermittler nach W15, nur lokale Kandidaten); dazu ein **verschlüsseltes Päckli** über das Teilen-Menü, mit dem Schlüssel der Kopplung verschlüsselt, für Teams, die sich selten treffen. Je eine feste Liste der Datentypen in einem eigenen ADR.
5. **Bis zum JA:** Papier und PDF tragen. Einsatzblatt als PDF mit QR-Code; Rapport auf Papier und als Foto zurück ins Hauptgerät; jedes Gerät für sich; Sicherung als Datei.
6. **Nie aufs Handy:** Löhne, Ansätze, Margen, Rechnungen, Kasse, Zahlen anderer Personen, Tür- und Alarmcodes, Gesundheitsdaten. Zugangshinweise und Objektangaben nur für die eigenen Einsätze des Tages.
7. **Nie reisen:** Kopplungen, PIN, Gerätemodus, Ansicht, Befehlsprotokoll.
8. **Stufe 2** (Relais mit Ende-zu-Ende-Verschlüsselung, dieselben Nachrichten) nur nach Albans JA zu Randen-ADR-0025; gemeinsam für alle Ausgaben.
9. **Ehrlich im Zustand:** Jede Ansicht sagt, wann zuletzt abgeglichen wurde; die Sicherung erinnert, solange ein Gerät nicht abgeglichen ist.

## Begründung

Die Asymmetrie (Mappe runter, Befehle rauf) ist nötig, weil das Handy nicht den ganzen Betrieb kennen darf und das Büro nie fremde Zeilen übernehmen soll. Sie macht den Abgleich ohne Server robust und denselben Weg später über ein Relais möglich. Der Rhythmus Werkhof am Morgen und Abend passt zum Alltag von Handwerk und Unterhalt (Recherche Facility, Gebäudehülle, Umzug).

## Folgen

- Facility und Maler beginnen mit Punkt 5 (Papier) auf einem Gerät; Welle 3 bringt Punkt 4 nach dem JA.
- Die Wächter-Tests für Nebenwirkungen (`fetch`, `WebSocket`, `RTCPeerConnection`) laufen in jeder Ausgabe, damit niemand «schnell» einen Abgleich über das Netz baut.
- Der Vermittler sieht IP-Adressen; onestrand.ch braucht dafür eine Datenschutzerklärung.
