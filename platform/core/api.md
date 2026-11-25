# @onestrand/core (P-01)

Die Grundtypen der Suite: Kennungen, Geld, Währung, Kalendertag, Zahlen lesen und zeigen, Feld-Schemas und das **Register der Einheiten**. Reines TypeScript ohne Browser und ohne Node; einzige Abhängigkeit ist `zod`. Das Paket importiert kein anderes Paket der Plattform; alle anderen bauen darauf.

```ts
import { lineValue, PLATFORM_UNITS, rappen } from '@onestrand/core';
```

Immer über den Paketnamen importieren, nie eine Datei im Paket. Welche Dateien übernommen sind, steht im Kopf jeder Datei (`// Origin: …`) und in `docs/herkunft.md`.

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Kennungen | `IdSchema`, `Id`, `uuidV7`, `isUuidV7`, `uuidV7Timestamp`, `createIdGenerator`, `UUID_V7_PATTERN` | UUIDv7, auf dem Gerät erzeugt; Zeit und Zufall kommen von aussen |
| Geld | `RappenSchema`, `Rappen`, `rappen`, `ZERO_RAPPEN`, `sumRappen`, `allocate`, `splitEvenly`, `parseChf`, `formatChf` | Beträge als Ganzzahl in Rappen; Aufteilen ohne Rappenverlust |
| Währung | `CurrencyCodeSchema`, `CurrencyCode`, `DEFAULT_CURRENCY`, `minorDigits`, `currencySymbol`, `formatMoney`, `parseMoney` | eine Währung je Betrieb, kleinste Einheit als Ganzzahl |
| Zahlen | `formatDecimal`, `groupThousands`, `formatPercent` | Schweizer Schreibweise, unabhängig von der Laufzeit |
| Datum | `HOME_TIME_ZONE`, `localDate`, `toLocalDate`, `addDays`, `daysBetween`, `addMonths`, `addYears`, `minLocalDate`, `parseDateInput`, `formatSwissDate` | Kalendertag `YYYY-MM-DD` in Europe/Zurich |
| Feld-Schemas | `LocalDateSchema`, `IsoDateTimeSchema`, `YearMonthSchema`, `QuantitySchema`, `PositiveQuantitySchema`, `QuantityDeltaSchema`, `BpsSchema`, `CountryCodeSchema`, `WeekdaySchema`, `WEEKDAYS`, `nameSchema`, `textSchema`, `GtinSchema`, `isValidGtin`, `syncFields` (mit den Typen `LocalDate`, `IsoDateTime`, `YearMonth`, `Bps`, `CountryCode`, `Weekday`, `Gtin`) | Bausteine für die Schemas der Zeilen und Eingaben |
| Einheiten | `PLATFORM_UNITS`, `PlatformUnitId`, `defineUnit`, `createUnitRegistry`, `UnitDefinition`, `UnitRegistry`, `UNIT_ID_PATTERN`, `convertQuantity`, `sameDimension`, `assertSameDimension`, `unitFactor`, `UnitError`, `UnitErrorCode` | Register statt fester Liste; Umrechnen nur exakt |
| Mengen und Preise | `roundQuantity`, `formatQuantity`, `parseQuantityInput`, `ParseQuantityOptions`, `lineValue`, `valueMilli`, `milliToRappen`, `unitPriceFromTotal`, `PriceUnits`, `formatUnitPrice`, `parseUnitPrice`, `unitLabel`, `priceUnitLabel` | Menge mal Preis in Ganzzahlen, einmal gerundet |

Nicht im Paket: Temperatur, Datumsart von Waren, Fotos als Text in einer Zeile (Dateien sind Blobs in `@onestrand/storage`), Ports, Speicher, Schnittstelle.

## Einheiten der Plattform

| Kennung | Dimension | Faktor | Zeichen | Preis gilt für |
| --- | --- | --- | --- | --- |
| `g` | `mass` | 1 | g, ab 1000: kg | 1 kg |
| `ml` | `volume` | 1 | ml, ab 1000: l | 1 l |
| `pcs` | `count` | 1 | pcs (neutral) | 1 Stück |
| `h` | `time` | 60 | h | 1 h |
| `min` | `time` | 1 | min | 1 min |
| `m` | `length` | 1 | m | 1 m |
| `m2` | `area` | 1 | m² | 1 m² |
| `m3` | `volume` | 1’000’000 | m³ | 1 m³ |
| `km` | `length` | 1000 | km | 1 km |
| `flat` | `flat` | 1 | flat (neutral) | das Ganze (pauschal: Menge 1) |

- `PLATFORM_UNITS.schema` ist das Zod-Schema für das Einheitenfeld einer Zeile; `get(id)`, `has(id)`, `ids`, `units`, `convertible(a, b)`, `convert(menge, von, nach)`.
- **Eigene Einheiten** (Personenstunde, Tag, Tonne): `const UNITS = PLATFORM_UNITS.extend([defineUnit({ id: 'moving_person_hour', dimension: 'moving_person_time', factor: 1, symbol: 'Ph' })])`. Die Kennung trägt das Präfix der Branche und gehört ins Namensregister. Ein Register wird nie verändert; `extend` gibt ein neues zurück. Doppelte Kennungen, ein Faktor, der keine positive Ganzzahl ist, und Umrechnen über Dimensionen hinweg sind Fehler (`UnitError` mit `code`).
- **Faktor:** wie viele kleinste Einheiten der Dimension eine Einheit ist. Nur gleiche Dimension rechnet um, und nur exakt: `convert(90, 'min', 'h')` ist 1.5; `convert(50, 'min', 'h')` wirft `not_exact`, weil das Ergebnis keine drei Nachkommastellen hat.
- **Kleinste Einheit:** Der Faktor ist eine positive Ganzzahl. Eine Einheit, die kleiner ist als die kleinste ihrer Dimension (Millimeter neben `m`, Sekunde neben `min`), passt darum nicht in eine Dimension der Plattform. Brauchst du sie, stell einen Plattform-Antrag: Die Faktoren einer Dimension lassen sich anheben, ohne dass sich gespeicherte Mengen ändern, weil nur ihr Verhältnis zählt.
- **Wörter der Sprache:** `symbol` von `pcs` und `flat` ist ein neutraler Platzhalter. Ein Sprachkatalog übergibt sein Wort so: `formatQuantity(12, { ...unit, symbol: 'Stk.' })`. Im rein-TS-Teil der Plattform steht kein deutscher Text.

## Regeln, die du kennen musst

1. **Geld ist `Rappen`**, eine Ganzzahl. `rappen(3.95)` wirft; aus Text liest `parseMoney`.
2. **Mengen** haben höchstens drei Nachkommastellen (`QuantitySchema`). Nach jeder Summe `roundQuantity(a + b)`, damit kein Gleitkomma-Rest stehen bleibt.
3. **Ein Stückpreis ist `pricePer1000`:** Rappen pro 1000 Einheiten der Einheit, in der der Preis gilt. CHF 62.00 je kg sind `6200` (Einheit `g`), CHF 85.00 je Stunde sind `8_500_000` (Einheit `h`), CHF 0.45 je Stück sind `45_000`, eine Pauschale von CHF 1’200.00 ist `120_000_000` (Einheit `flat`, Menge 1). Niemand teilt selbst durch 1000: zeigen mit `formatUnitPrice`, lesen mit `parseUnitPrice`.
4. **Betrag einer Zeile:** `lineValue(menge, pricePer1000)` rechnet in Ganzzahlen und rundet **einmal**, kaufmännisch (halbe Rappen weg von null). Stehen Menge und Preis in verschiedenen Einheiten, beide nennen: `lineValue(90, 8_500_000, { quantityUnit: min, priceUnit: h })` ergibt genau 12’750 Rappen; 50 Minuten ergeben 7083, ohne dass die Menge vorher gerundet wird.
5. **Summen über viele Zeilen** (Kalkulation): je Zeile `valueMilli` (Tausendstel-Rappen, Ganzzahl), Ganzzahlen summieren, am Schluss `milliToRappen`. Das kann sich vom Betrag der einzelnen Zeile um höchstens einen Rappen unterscheiden; auf einem Dokument mit Zeilenbeträgen gilt `lineValue` je Zeile und `sumRappen`.
6. **Fehler statt falscher Zahl:** Eine Menge mit vier Nachkommastellen, ein Preis, der keine Ganzzahl ist, oder ein Ergebnis ausserhalb des sicheren Zahlenbereichs wirft `RangeError`. Die Lese-Funktionen (`parse…`) geben bei unklarer Eingabe `null` zurück.
7. **Kalendertage** sind `LocalDate` (`YYYY-MM-DD`, Europe/Zurich), Zeitpunkte `IsoDateTime` (UTC mit `Z`). «Heute» kommt immer von aussen (Uhr als Port in `@onestrand/contract`).
8. **Berechnet, nie gespeichert:** Beträge von Zeilen, Summen und Saldi rechnest du aus Menge und Preis; in der Zeile stehen Menge, Einheit und `pricePer1000`.

## Beispiel

```ts
import { z } from 'zod';
import {
  DEFAULT_CURRENCY, formatMoney, formatQuantity, formatUnitPrice, lineValue,
  PLATFORM_UNITS, QuantitySchema, RappenSchema, sumRappen, syncFields,
} from '@onestrand/core';

// Zeile eines Rapports: Menge, Einheit und Preis; der Betrag wird berechnet.
const ReportLineSchema = z.object({
  ...syncFields,
  quantity: QuantitySchema,
  unit: PLATFORM_UNITS.schema,
  pricePer1000: RappenSchema,
  priceUnit: PLATFORM_UNITS.schema,
});
type ReportLine = z.infer<typeof ReportLineSchema>;

function amount(line: ReportLine) {
  return lineValue(line.quantity, line.pricePer1000, {
    quantityUnit: PLATFORM_UNITS.get(line.unit),
    priceUnit: PLATFORM_UNITS.get(line.priceUnit),
  });
}

const h = PLATFORM_UNITS.get('h');
formatQuantity(1.5, h); // '1.5 h'
formatUnitPrice(8_500_000, h, DEFAULT_CURRENCY); // 'CHF 85.00 / h'
declare const lines: ReportLine[]; // z. B. eine Zeile: 90 min zu CHF 85.00 je Stunde
formatMoney(sumRappen(lines.map(amount)), DEFAULT_CURRENCY); // 'CHF 127.50'
```
