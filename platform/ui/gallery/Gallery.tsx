import { localDate, rappen, type LocalDate, type Rappen } from '@onestrand/core';
import {
  CalendarClock,
  CircleCheck,
  ClipboardList,
  Plus,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  DateField,
  EmptyState,
  GroupedList,
  IconButton,
  KpiGrid,
  ListRow,
  MoneyField,
  Notice,
  NumberField,
  PageHeader,
  QuantityField,
  Section,
  SegmentedControl,
  SelectField,
  Sheet,
  StatTile,
  StatusChip,
  Switch,
  TextField,
  TimeField,
  ToastProvider,
  UiProvider,
  useToast,
} from '../src/index';

/** The day the gallery counts from: fixed, so the pictures stay the same. */
const TODAY = localDate('2026-11-28');

type Interval = 'weekly' | 'monthly';
type Period = 'day' | 'week' | 'month';

function Buttons() {
  const toast = useToast();
  return (
    <Section title="Knöpfe" hint="Eine Hauptaktion je Seite, die anderen ruhiger.">
      <Card>
        <div className="flex flex-wrap gap-2">
          <Button icon={Plus}>Erfassen</Button>
          <Button variant="secondary">Abbrechen</Button>
          <Button variant="quiet">Mehr anzeigen</Button>
          <Button variant="danger" icon={Trash2}>
            Löschen
          </Button>
          <Button busy>Sichern</Button>
          <Button disabled variant="secondary">
            Nicht möglich
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              toast({ text: 'Einsatz gesichert.', tone: 'ok' });
            }}
          >
            Meldung zeigen
          </Button>
        </div>
      </Card>
    </Section>
  );
}

function Fields() {
  const [name, setName] = useState('Treppenhaus Ost');
  const [people, setPeople] = useState<number | null>(2);
  const [amount, setAmount] = useState<Rappen | null>(rappen(18_000));
  const [hours, setHours] = useState<number | null>(2500);
  const [start, setStart] = useState<string | null>('07:45');
  const [day, setDay] = useState<LocalDate | null>(localDate('2026-12-01'));
  const [interval, setInterval] = useState<Interval | null>('weekly');
  const [keys, setKeys] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [period, setPeriod] = useState<Period>('week');
  return (
    <Section title="Felder" hint="Jedes Feld mit Beschriftung, Hinweis und Fehler.">
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Name des Objekts" value={name} onChange={setName} required />
          <NumberField label="Personen" value={people} onChange={setPeople} suffix="Personen" />
          <MoneyField
            label="Betrag"
            value={amount}
            onChange={setAmount}
            hint="Ohne Mehrwertsteuer."
          />
          <QuantityField label="Dauer" unit="h" value={hours} onChange={setHours} />
          <TimeField label="Beginn" value={start} onChange={setStart} />
          <DateField
            label="Nächster Einsatz"
            value={day}
            onChange={setDay}
            presets={[
              { label: 'morgen', days: 1 },
              { label: 'in einer Woche', days: 7 },
            ]}
          />
          <SelectField
            label="Rhythmus"
            options={[
              { value: 'weekly', label: 'Jede Woche' },
              { value: 'monthly', label: 'Jeden Monat' },
            ]}
            value={interval}
            onChange={setInterval}
            optional
          />
          <TextField
            label="E-Mail"
            type="email"
            value="hauswart@"
            onChange={() => undefined}
            error="Diese Adresse ist nicht vollständig. Prüfe den Teil nach dem @."
          />
          <SegmentedControl
            label="Zeitraum"
            options={[
              { value: 'day', label: 'Tag' },
              { value: 'week', label: 'Woche' },
              { value: 'month', label: 'Monat' },
            ]}
            value={period}
            onChange={setPeriod}
          />
          <div>
            <Checkbox
              label="Schlüssel abgegeben"
              description="Beim Hauswart, gegen Unterschrift."
              checked={keys}
              onChange={setKeys}
            />
            <Switch
              label="Erinnerungen"
              description="Am Vorabend eines Einsatzes."
              checked={reminders}
              onChange={setReminders}
            />
          </div>
        </div>
      </Card>
    </Section>
  );
}

function Lists() {
  return (
    <Section title="Einsätze" titleStyle="group" action={{ label: 'Alle', href: '#einsaetze' }}>
      <GroupedList>
        <ListRow
          title="Treppenhaus Ost"
          subtitle="Dienstag, 08:00 bis 10:30"
          icon={CalendarClock}
          trailing={<StatusChip tone="accent">Geplant</StatusChip>}
          href="#ost"
        />
        <ListRow
          title="Büro Nord"
          subtitle="Montag, erledigt"
          icon={CircleCheck}
          iconTone="ok"
          trailing={<StatusChip tone="ok">Rapport unterschrieben</StatusChip>}
          href="#nord"
        />
        <ListRow
          title="Lager West"
          subtitle="Rapport fehlt seit 3 Tagen"
          icon={ClipboardList}
          iconTone="bad"
          trailing={<StatusChip tone="bad">Fehlt</StatusChip>}
          href="#west"
        />
      </GroupedList>
    </Section>
  );
}

function Figures() {
  return (
    <Section title="Kennzahlen">
      <KpiGrid>
        <StatTile label="Offen" unit="CHF" value="4’820.00" hint="3 Rechnungen" tone="warn" />
        <StatTile label="Stunden diese Woche" value="38.5" tone="ok" />
        <StatTile label="Einsätze heute" value="4" href="#heute" />
      </KpiGrid>
    </Section>
  );
}

function Notices() {
  return (
    <Section title="Hinweise">
      <div className="grid gap-3">
        <Notice title="Sicherung fällig">
          Die letzte Sicherung ist 9 Tage alt. Sichere die Daten auf ein zweites Gerät.
        </Notice>
        <Notice tone="ok" title="Alles gesichert" variant="row" />
        <Notice tone="warn" title="Ferien im Dezember">
          Zwei Anträge überschneiden sich mit Einsätzen.
        </Notice>
        <Notice tone="bad" title="Rapport fehlt">
          Ohne Rapport lässt sich der Einsatz nicht verrechnen.
        </Notice>
        <Card variant="hint">Ein Tipp in der ruhigen Fläche des Akzents.</Card>
      </div>
    </Section>
  );
}

function Dialogs() {
  const toast = useToast();
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <Section title="Dialoge">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setSheet(true);
          }}
        >
          Einsatz verschieben
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            setConfirm(true);
          }}
        >
          Einsatz löschen
        </Button>
      </div>
      <Sheet
        open={sheet}
        onClose={() => {
          setSheet(false);
        }}
        title="Einsatz verschieben"
        footer={
          <Button
            fullWidth
            onClick={() => {
              setSheet(false);
            }}
          >
            Verschieben
          </Button>
        }
      >
        <p className="text-muted">Treppenhaus Ost, Dienstag, 08:00.</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => {
            toast({ text: 'Einsatz vorgemerkt.', tone: 'ok' });
          }}
        >
          Vormerken
        </Button>
      </Sheet>
      <ConfirmDialog
        open={confirm}
        tone="danger"
        title="Einsatz löschen?"
        text="Der Einsatz wird gelöscht. Die erfassten Zeiten bleiben."
        confirmLabel="Löschen"
        onConfirm={() => {
          setConfirm(false);
        }}
        onCancel={() => {
          setConfirm(false);
        }}
      />
    </Section>
  );
}

/** Every component of the kit on one page, in the example theme of S-27. */
export function Gallery() {
  return (
    <UiProvider today={TODAY}>
      <ToastProvider>
        <main className="mx-auto max-w-3xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-16 md:px-8">
          <PageHeader
            title="Bausteine"
            subtitle="Das Kit der Plattform im Beispiel nach S-27"
            corner={<IconButton icon={Settings} label="Einstellungen" />}
            actions={<Button icon={Plus}>Erfassen</Button>}
          />
          <div className="grid gap-8">
            <Figures />
            <Lists />
            <Buttons />
            <Fields />
            <Notices />
            <Section title="Leere Liste">
              <EmptyState
                icon={Users}
                title="Noch keine Kundschaft"
                text="Erfasse die erste Kundschaft, dann steht sie hier."
                action={<Button icon={Plus}>Kundschaft erfassen</Button>}
              />
            </Section>
            <Dialogs />
          </div>
        </main>
      </ToastProvider>
    </UiProvider>
  );
}
