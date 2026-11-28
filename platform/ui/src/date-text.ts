// Origin: BanioX/Randen apps/web/src/ui/date-text.ts @ e0f0907 — adapted: the words come in as a parameter (the catalogue of UiProvider), weekdays and months by named keys; a typed ISO date keeps its form; a month without a day is no date
import { daysBetween, type LocalDate } from '@onestrand/core';
import type { UiMessages } from './messages';

function groupDigits(digits: string): string {
  let text = digits.slice(0, 2);
  if (digits.length > 2) {
    text += `.${digits.slice(2, 4)}`;
  }
  if (digits.length > 4) {
    text += `.${digits.slice(4, 8)}`;
  }
  return text;
}

/** True when the first four digits can be a day and a month (`2011`), false for a year (`2026`). */
function startsWithDayAndMonth(digits: string): boolean {
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

/**
 * Typing helper for the date field: digits typed without separators get dots automatically
 * (`201126` → `20.11.26`). As soon as someone types a separator themselves (`6.11.`, `11.2026`),
 * the text is left exactly as typed and parsed as is.
 *
 * An ISO date typed by keyboard (`2026-11-20`) keeps its form: four digits that cannot be a day
 * and a month are a year, and a `-` typed after dots of this helper takes the dots back out.
 */
export function nextDateText(
  previous: string,
  raw: string,
  autoFormatting: boolean,
): { text: string; autoFormatting: boolean } {
  if (raw === '') {
    return { text: '', autoFormatting: true };
  }
  const appended = raw.length === previous.length + 1 && raw.startsWith(previous);
  const typedChar = appended ? raw.slice(-1) : '';
  if (appended && typedChar === '-' && autoFormatting) {
    // The dots were ours, the dash is the person's: an ISO date on its way (`2012-`).
    return { text: `${previous.replace(/\./g, '')}-`, autoFormatting: false };
  }
  if (appended && !/\d/.test(typedChar)) {
    return { text: raw, autoFormatting: false };
  }
  if (autoFormatting && /^[\d.]*$/.test(raw)) {
    const digits = raw.replace(/\./g, '');
    if (digits.length >= 4 && !startsWithDayAndMonth(digits)) {
      return { text: digits, autoFormatting: false };
    }
    return { text: groupDigits(digits), autoFormatting: true };
  }
  return { text: raw, autoFormatting: /^\d*$/.test(raw) };
}

/**
 * True for a month without a day: `11.2026`, `11/26`. The reader of the core takes it as the end
 * of that month (a label says «bis 11.2026»), but a date field asks for a day.
 */
export function isMonthOnly(text: string): boolean {
  const parts = text
    .trim()
    .replace(/[.:/\-\s]+$/, '')
    .split(/[.:/\-\s]+/)
    .filter((part) => part !== '');
  if (parts.length !== 2) {
    return false;
  }
  const [, second = ''] = parts;
  const value = Number(second);
  return !(second.length <= 2 && value >= 1 && value <= 12);
}

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

/**
 * «Fr, 20. Nov. 2026». Built from the catalogue, not from the device: the same words on every
 * device and in every test, whatever language data the browser ships.
 */
export function describeDate(date: LocalDate, texts: UiMessages['date']): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? 'sun';
  const monthKey = MONTHS[month - 1] ?? 'jan';
  return `${texts.weekdays[weekday]}, ${String(day)}. ${texts.months[monthKey]} ${String(year)}`;
}

/** «heute», «morgen», «in 6 Tagen», «in 7 Wochen», «in 6 Monaten», «vor 2 Tagen». */
export function describeRelative(
  date: LocalDate,
  today: LocalDate,
  texts: UiMessages['date'],
): string {
  const days = daysBetween(today, date);
  const t = texts.relative;
  if (days === 0) {
    return t.today;
  }
  if (days === 1) {
    return t.tomorrow;
  }
  if (days === -1) {
    return t.yesterday;
  }
  const abs = Math.abs(days);
  let amount: string;
  if (abs < 14) {
    amount = t.days(abs);
  } else if (abs < 61) {
    amount = t.weeks(Math.round(abs / 7));
  } else if (abs < 730) {
    amount = t.months(Math.round(abs / 30.44));
  } else {
    amount = t.years(Math.round(abs / 365.25));
  }
  return days > 0 ? t.future(amount) : t.past(amount);
}
