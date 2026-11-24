# Glossar

Begriffe der Suite. Wer einen neuen Begriff einführt, trägt ihn hier ein. Begriffe der Gastronomie stehen im Glossar von Randen; Begriffe einer Branche im Steckbrief der Branche.

| Begriff | Code | Bedeutung |
| --- | --- | --- |
| Suite | – | Onestrand Business Suite: Plattform, Branchen und Ausgaben zusammen. Das Wort steht nie in einer App |
| Onestrand | `onestrand` | Firma und Dachmarke; Absender unter «Über …», auf onestrand.ch und in rechtlichen Texten |
| Kopf | `head` | die Sitzung, die dieses Repo führt: Plan, Architektur, Aufträge, Sammelstellen |
| Plattform | `platform/`, `@onestrand/*` | gemeinsame Pakete ohne ein Wort einer Branche |
| Branche | `industries/<id>/`, `Industry` | Paket mit eigenen Abläufen, Tabellen, Wörtern, Vorlagen und Regeln, das an die Plattform andockt |
| Ausgabe | `editions/<id>/`, `Edition` | installierbare App mit Marke, Adresse, Datenbank und Sicherungsformat; kann jede Branche einschalten |
| Haupt-Branche | `mainIndustry` | Branche, deren Wörter und Vorschläge eine Ausgabe oder ein Betrieb zeigt |
| Betrieb | `Business` | die Firma, die eine Ausgabe nutzt; ein Gerät kann mehrere Betriebe tragen |
| Modul | `FeatureGroupId` | Gruppe von Funktionen im Register (Randen-ADR-0022) |
| Funktion | `FeatureId` | einzeln schaltbarer Teil eines Moduls |
| Option | `featureOptions` | Feineinstellung einer Funktion |
| Steckplatz | `slot` | Stelle in der Shell, an der eine Branche erscheint (Navigation, Heute, Abschnitte, Dokumente) |
| Manifest | `defineIndustry`, `defineEdition` | Erklärung, was eine Branche oder Ausgabe mitbringt |
| Namensregister | `registry/names.json` | Liste aller Kennungen, Präfixe und Namensräume; schreibt nur der Kopf |
| Schema-Ledger | – | nur angefügte Liste der Datenbank-Schritte je Ausgabe |
| Gestempelte Kopie | `vendor/onestrand/`, `STEMPEL.json` | Plattform-Paket in einem anderen Repo mit Quelle, Commit und Prüfsummen; nie von Hand ändern |
| Ernte | – | einmalige Übernahme eines plattformfähigen Teils aus Randen in die Suite |
| Plattform-Antrag | `docs/branchen/<id>/antraege.md` | Bitte einer Branche um ein Stück Plattform |
| Regel der zwei | – | Was zwei Branchen brauchen, gehört in die Plattform |
| Herkunft (Origin) | – | Schema, Host und Port einer Adresse; an ihr hängen Speicher und installierte App |
| Hauptgerät | `primaryDevice` | Gerät, das Stammdaten, Preise, Rechnungen und Nummernkreise schreibt |
| Aussendienst-Gerät | – | Handy einer Person oder Equipe; bekommt eine Mappe, schickt Befehle |
| Mappe | `field pack` | nach Rolle gefilterte, nur lesbare Daten für ein Aussendienst-Gerät, mit Ablauf |
| Päckli | `sealed file` | verschlüsselte Datei mit Befehlen oder einer Mappe, über das Teilen-Menü weitergegeben (nach Albans JA) |
| Kundschaft | `Customer` | Auftraggeberin: privat, Firma, Verwaltung, öffentliche Hand |
| Objekt | `Site` | Ort der Arbeit, hierarchisch; heisst je Branche Liegenschaft, Baustelle, Garten, Zimmer |
| Anlage | `Asset` (am Objekt) | Einrichtung beim Objekt mit Intervall: Heizung, Feuerung, Lift, Dachrinne |
| Zugangshinweis | `accessNote` | heikle Angabe, wie man ins Objekt kommt; nie ein Code |
| Leistung | `CatalogItem` | Position des Katalogs mit Einheit und Ansatz des Betriebs |
| Leistungswert | `productivity` | Zeit je Einheit (Richtwert des Betriebs) |
| Auftrag | `Job` | Klammer um alles, was für eine Kundschaft geschieht; Status als Ledger |
| Preisart | `pricing` | Pauschal, Einheitspreis nach Ausmass, Regie (nach Aufwand), Kostendach |
| Ausmass | `Measurement` | gemessene Mengen (m², m, m³, Stück) mit sichtbarer Formel |
| Regie | `time_and_material` | Arbeit nach Aufwand, mit Rapport und Unterschrift |
| Einsatz | `Visit` | wer, wann, wo; Schritte, Aufgaben, Fotos |
| Rapport | `Report` | gesperrter Stand eines Einsatzes oder Tages, oft mit Unterschrift der Kundschaft |
| Nachtrag | `ChangeOrder` | unterschriebene Änderung an Offerte oder Auftrag |
| Abnahme | `Acceptance` | Übergabe mit Protokoll und Mängeln |
| Leistungsplan | `Plan` | wiederkehrende Arbeit mit Intervallen; erzeugt Einsätze |
| Checkliste | `Checklist` | Vorlage mit Durchgang und Nachweis (abgehakt, Foto, Messwert, Unterschrift) |
| Vertrag, Mitgliedschaft | `Contract` | Vereinbarung mit Laufzeit, Verlängerung, Kündigung, Pause; erzeugt Rechnungen und Einsätze. In der App nie «Abo», «Paket» oder «freischalten» (Randen E-01) |
| Mehrfachkarte | `PunchCard` | Karte mit Einheiten; Restguthaben als Summe der Bewegungen |
| Vorsystem | – | erfasst und bereitet vor, was die Treuhand bucht; keine Buchhaltung |
| Monatspaket | `MonthPackage` | Rechnungen, Zahlungen, Belege, Kassenbuch und Lohn-Vorbereitung eines Monats als Dateien |
| Lohn-Vorbereitung | – | Stunden, Zuschläge und Hinweise je Person als Datei für die Treuhand; keine Lohnabrechnung |
| Regelwerk | `RuleSet` | Regeln als Daten mit Quelle und Gültigkeit (GAV, Feiertage, MWST-Sätze) |
| Richtwert | – | Vorschlag mit Quelle, den der Betrieb ändern kann |
| Stufe 1, Stufe 2 | `stage` | Stufe 1 läuft auf dem Gerät ohne Server; Stufe 2 braucht einen Server und Albans JA |
