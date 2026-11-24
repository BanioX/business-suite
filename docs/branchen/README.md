# Branchen

Landkarte aller Branchen der Suite. Je Branche gibt es einen **Steckbrief** (verbindlich, nach der [Vorlage](_vorlage.md)), die **Recherche** dahinter (Hintergrund, mit Quellen) und einen **Auftrag** für den Branchen-Agenten in [`../auftraege/`](../auftraege/README.md). Stand 24.11.2026; Recherche mit Quellen vom selben Tag.

## Landkarte

| Branche | Steckbrief | Kennung im Code | Ausgabe | Welle | Eignung (1–5) |
| --- | --- | --- | --- | --- | --- |
| Gastronomie und Lebensmittelhandwerk | [gastro](gastro.md) | `gastro` (heute Repo Randen) | Gastro | läuft in Randen | – |
| Gebäudereinigung, Hauswartung, Facility | [facility](facility.md) | `facility` | Vor Ort | W1 | 4 |
| Maler, Gipser, Innenausbau | [maler](maler.md) | `painting` | Vor Ort | W2 | 4.5 |
| Umzug, Räumung, Entsorgung, Kleintransport | [umzug](umzug.md) | `moving` | Vor Ort | W2 | 4 |
| Dachdecker, Spengler, Fassade, Gerüst | [gebaeudehuelle](gebaeudehuelle.md) | `envelope` | Vor Ort | W3 | 4 |
| Elektro, Sanitär, Heizung, Schreiner, Zimmerei | [haustechnik-holz](haustechnik-holz.md) | `building-services`, `carpentry` | Vor Ort | W3 | 4 |
| Gartenbau, Kaminfeger, Schädlingsbekämpfung | [aussen](aussen.md) | `garden`, `chimney`, `pest-control` | Vor Ort | W3 | 4 |
| Coiffeur, Kosmetik, Fusspflege, Massage, Hundesalon | [termine](termine.md) | `salon` | Studio | W4 | 4 |
| Fitness, Studios, Kurse, Musik- und Hundeschulen | [kurse](kurse.md) | `courses` | Studio | W4 | 4 |
| Kleine Hotels, B&B, Ferienwohnungen, Gasthof | [beherbergung](beherbergung.md) | `lodging` | Haus | W5 | 4 |
| Weitere Branchen und Abgrenzung | [weitere](weitere.md) | – | – | Screening | – |

Die Eignung stammt aus der Recherche (Nutzen für den Betrieb × Wiederverwendung der Plattform × geringe Rechtsrisiken). Die Wellen folgen der Plattform, nicht der Eignung: Eine Branche beginnt, sobald die Pakete ihres MVP stehen.

## Was die Branchen gemeinsam haben

Aus den Recherchen, übereinstimmend:

- **Die Arbeit geschieht beim Objekt der Kundschaft** (Reinigung, Maler, Dach, Umzug, Haustechnik, Garten): oft ohne Netz, mit Handschuhen, auf eigenen Handys. Das Büro ist ein Laptop am Abend. Darum ist der Abgleich Büro ↔ Aussendienst die wichtigste offene Frage ([S-06](../entscheide.md)).
- **Das Geld kommt zu spät herein:** Offerten am Abend, Regiearbeiten vergessen, Rechnungen Wochen nach der Arbeit, offene Posten im Kopf. Offerte, Rapport mit Unterschrift und Rechnung mit QR-Zahlteil sind in jeder Aussendienst-Branche Muss ([ADR-0010](../adr/0010-rechnungen-als-vorsystem.md)).
- **Stunden und Lohn nach GAV sind fehleranfällig:** Zuschläge, Ferienanteil, Reisezeit, Lohnstufen, Kontrollen der paritätischen Kommissionen. Die Suite bereitet vor und zeigt Richtwerte mit Quelle; sie rechnet keinen Lohn mit Gewähr.
- **Viele Sprachen im Team:** Arbeitsplatz der Mitarbeitenden in ihrer Sprache, Aushänge mit Symbolen ([ADR-0007](../adr/0007-sprachen.md)).
- **Nachweise:** Rapport, Fotos vorher und nachher, Abnahmeprotokoll, Checklisten für Sicherheit; gesperrt, was die Kundschaft unterschrieben hat.
- **Gemischte Betriebe:** Hauswartung mit Reinigung und Garten, Umzug mit Endreinigung, Maler mit Gipser und Boden, Hotel mit Restaurant. Darum kann jede Ausgabe jede Branche einschalten ([ADR-0002](../adr/0002-plattform-branchen-ausgaben.md)).

## Was jede Branche selbst bringt

| Branche | Eigenes, das sonst niemand braucht |
| --- | --- |
| Facility | Leistungsverzeichnis mit Intervallen, Reinigungsplan als Aushang, Schlüssel als Ledger, Wohnungsabnahme, Qualitätskontrolle nach Stichprobe, Winterdienst-Journal |
| Maler | Besichtigung mit Ausmass je Raum, Farbbuch, Schadstoff-Abklärung vor Arbeitsbeginn |
| Gebäudehülle | Dachaufnahme, Ausmass mit Neigung, Wetterentscheid, Sicherheit in der Höhe, Asbest-Ablauf |
| Umzug | Umzugsgutliste mit Volumen, Halteverbot, Fahrzeuge über 3.5 t, Schadenprotokoll, Räumung mit Fundsachen, Einlagerung |
| Kurse | Mitgliedschaften mit Fristen, Mehrfachkarten, Kursplan mit Plätzen, Check-in an der Theke |

## Neue Branche aufnehmen

1. Recherche nach der Struktur der bestehenden Recherchen (Fakten mit Quelle, keine Namen, keine Preise).
2. Steckbrief nach der [Vorlage](_vorlage.md), Auftrag nach der Vorlage in [`../auftraege/README.md`](../auftraege/README.md).
3. Kennung und ADR-Präfix vergibt der Kopf ([ADR-0001](../adr/0001-entscheide-festhalten.md)); Eintrag in diese Landkarte und in die Übersicht von [`../plattform.md`](../plattform.md).
4. Prüfen, ob die Branche in eine bestehende Ausgabe passt; eine neue Ausgabe ist Albans Entscheid ([S-01](../entscheide.md)).
