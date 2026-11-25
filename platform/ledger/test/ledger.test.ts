import { command, commandBase, CommandError, createCommandKit } from '@onestrand/contract';
import { IdSchema, IsoDateTimeSchema, rappen, RappenSchema, type Id } from '@onestrand/core';
import {
  createBackupKit,
  createMemoryStorage,
  createTableRegistry,
  defineTable,
  StorageError,
} from '@onestrand/storage';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z, ZodError } from 'zod';
import {
  canonicalJson,
  createLedger,
  createLedgerReader,
  defineLedger,
  hashedContent,
  ledgerFields,
  LedgerError,
  LedgerStreamSchema,
  type LedgerPayload,
} from '../src';
import {
  accountLedger,
  AccountEntrySchema,
  accountRows,
  createTestLedgers,
  deviceHolding,
  fixedClock,
  hasher,
  notesTable,
  OVERDRAWN,
  REGISTRY,
  sequentialIds,
  sha256OfText,
  statusEntriesTable,
  withField,
  type AccountEntry,
} from './support';

const CHECKSUM = /^[0-9a-f]{64}$/;

/** A payload the types forbid, as code without types could pass it. */
const untyped = (payload: unknown) => payload as LedgerPayload<AccountEntry>;

describe('append', () => {
  it('writes the first entry of a stream', async () => {
    const t = await createTestLedgers();
    const { entry, state } = await t.account.append(t.one.businessId, 'cash', {
      amount: rappen(500),
      text: 'Wechselgeld',
    });
    expect(entry).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/) as string,
      businessId: t.one.businessId,
      stream: 'cash',
      seq: 1,
      hash: expect.stringMatching(CHECKSUM) as string,
      at: t.clock.now(),
      actor: t.one.personId,
      amount: 500,
      text: 'Wechselgeld',
    });
    // The first entry names no entry before it and corrects none: the fields are absent.
    expect(Object.keys(entry).sort()).toEqual(
      ['actor', 'amount', 'at', 'businessId', 'hash', 'id', 'seq', 'stream', 'text'].sort(),
    );
    expect(state).toEqual({ balance: 500, bookings: 1 });
    expect(await t.storage.table('account_entries').get(entry.id)).toEqual(entry);
  });

  it('computes the checksum over the entry as it is stored', async () => {
    const t = await createTestLedgers();
    const { entry } = await t.account.append(t.one.businessId, 'cash', {
      amount: rappen(500),
      text: 'Zürich 😀',
      ref: { kind: 'receipt', id: t.ids.next() },
      tags: ['b', 'a'],
    });
    const stored = await t.storage.table('account_entries').get(entry.id);
    expect(entry.hash).toBe(sha256OfText(hashedContent(stored ?? {})));
  });

  it('chains every further entry to the one before it', async () => {
    const t = await createTestLedgers();
    const first = await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
    const second = await t.account.append(t.one.businessId, 'cash', { amount: rappen(-120) });
    const third = await t.account.append(t.one.businessId, 'cash', { amount: rappen(30) });
    expect(second.entry).toMatchObject({ seq: 2, prevHash: first.entry.hash });
    expect(third.entry).toMatchObject({ seq: 3, prevHash: second.entry.hash });
    expect(third.state).toEqual({ balance: 410, bookings: 3 });
    expect(new Set([first.entry.hash, second.entry.hash, third.entry.hash]).size).toBe(3);
  });

  it('writes the time of the clock and the person of the context', async () => {
    const t = await createTestLedgers();
    const first = await t.account.append(t.one.businessId, 'cash', { amount: rappen(1) });
    t.clock.advance(90);
    const second = await t.account.append(t.one.businessId, 'cash', { amount: rappen(1) });
    expect(first.entry.at).toBe('2026-11-16T08:00:00.000Z');
    expect(second.entry.at).toBe('2026-11-16T09:30:00.000Z');

    const other = createLedger(accountLedger, {
      storage: t.storage,
      hasher,
      clock: t.clock,
      ids: t.ids,
      actor: t.two.personId,
    });
    const third = await other.append(t.one.businessId, 'cash', { amount: rappen(1) });
    expect([first.entry.actor, third.entry.actor]).toEqual([t.one.personId, t.two.personId]);
    expect(third.entry.seq).toBe(3);
  });

  it('gives every stream its own chain', async () => {
    const t = await createTestLedgers();
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
    const bank = await t.account.append(t.one.businessId, 'bank', { amount: rappen(900) });
    const cash = await t.account.append(t.one.businessId, 'cash', { amount: rappen(-200) });
    expect(bank.entry.seq).toBe(1);
    expect(bank.entry).not.toHaveProperty('prevHash');
    expect(bank.state).toEqual({ balance: 900, bookings: 1 });
    expect(cash.entry.seq).toBe(2);
    expect(cash.state).toEqual({ balance: 300, bookings: 2 });
  });

  it('stores what the schema read: text trimmed, a field it does not know left out', async () => {
    const t = await createTestLedgers();
    const { entry } = await t.account.append(
      t.one.businessId,
      'cash',
      untyped({ amount: 500, text: '  Kasse  ', invented: true }),
    );
    expect(entry.text).toBe('Kasse');
    expect(entry).not.toHaveProperty('invented');
    expect(await t.account.verify(t.one.businessId, 'cash')).toMatchObject({ ok: true });
  });

  it('accepts a payload field without a value as no field', async () => {
    const t = await createTestLedgers();
    const { entry } = await t.account.append(
      t.one.businessId,
      'cash',
      untyped({ amount: 5, text: undefined, corrects: undefined }),
    );
    expect(Object.keys(entry)).not.toContain('text');
    expect(Object.keys(entry)).not.toContain('corrects');
  });

  it.each([
    ['a fraction of a Rappen', { amount: 1.5 }],
    ['no amount', {}],
    ['an amount as text', { amount: '500' }],
    ['a text that is empty', { amount: 500, text: ' ' }],
  ])('refuses %s with the error of the schema and writes nothing', async (_what, payload) => {
    const t = await createTestLedgers();
    await expect(t.account.append(t.one.businessId, 'cash', untyped(payload))).rejects.toThrow(
      ZodError,
    );
    expect(await t.account.entries(t.one.businessId, 'cash')).toEqual([]);
    const next = await t.account.append(t.one.businessId, 'cash', { amount: rappen(1) });
    expect(next.entry.seq).toBe(1);
  });

  it.each([
    ['seq', 7],
    ['hash', 'a'.repeat(64)],
    ['prevHash', 'a'.repeat(64)],
    ['id', 'mine'],
    ['businessId', 'other'],
    ['stream', 'bank'],
    ['at', '2020-01-01T00:00:00.000Z'],
    ['actor', 'somebody'],
    ['corrects', 'something'],
  ])('refuses a payload that carries the field %s of the kit', async (field, value) => {
    const t = await createTestLedgers();
    const append = t.account.append(
      t.one.businessId,
      'cash',
      untyped({ amount: 5, [field]: value }),
    );
    await expect(append).rejects.toThrow(LedgerError);
    await expect(append).rejects.toMatchObject({
      code: 'invalid_payload',
      message: expect.stringContaining(field) as string,
    });
    expect(await accountRows(t)).toEqual([]);
  });

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a list', [{ amount: 5 }]],
    ['a text', 'amount'],
    ['a map', new Map([['amount', 5]])],
  ])('refuses %s as a payload', async (_what, payload) => {
    const t = await createTestLedgers();
    await expect(
      t.account.append(t.one.businessId, 'cash', untyped(payload)),
    ).rejects.toMatchObject({ code: 'invalid_payload' });
  });

  it.each(['', 'Cash', 'cash book', '-x', 'x'.repeat(121), 5, undefined])(
    'refuses %j as the key of a stream',
    async (stream) => {
      const t = await createTestLedgers();
      const append = t.account.append(t.one.businessId, stream as string, { amount: rappen(5) });
      await expect(append).rejects.toThrow(LedgerError);
      await expect(append).rejects.toMatchObject({ code: 'invalid_stream' });
      expect(await accountRows(t)).toEqual([]);
    },
  );

  it('refuses a business that has no id', async () => {
    const t = await createTestLedgers();
    await expect(t.account.append('betrieb' as Id, 'cash', { amount: rappen(5) })).rejects.toThrow(
      ZodError,
    );
  });

  it('writes nothing if the rule of the ledger refuses the entry', async () => {
    const t = await createTestLedgers();
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
    const before = await accountRows(t);
    const overdraw = t.account.append(t.one.businessId, 'cash', { amount: rappen(-501) });
    await expect(overdraw).rejects.toThrow(CommandError);
    await expect(overdraw).rejects.toMatchObject({ code: OVERDRAWN });
    expect(await accountRows(t)).toEqual(before);
    // The place in the chain was not used up.
    const next = await t.account.append(t.one.businessId, 'cash', { amount: rappen(-500) });
    expect(next.entry.seq).toBe(2);
    expect(next.state).toEqual({ balance: 0, bookings: 2 });
  });

  it('hands out a copy: changing it changes nothing that is stored', async () => {
    const t = await createTestLedgers();
    const { entry } = await t.account.append(t.one.businessId, 'cash', {
      amount: rappen(500),
      tags: ['a'],
    });
    entry.tags?.push('changed');
    entry.amount = rappen(1);
    expect(await t.account.state(t.one.businessId, 'cash')).toEqual({ balance: 500, bookings: 1 });
    expect(await t.account.verify(t.one.businessId, 'cash')).toMatchObject({ ok: true });
  });
});

describe('correct', () => {
  async function booked() {
    const t = await createTestLedgers();
    const first = await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
    const second = await t.account.append(t.one.businessId, 'cash', { amount: rappen(-120) });
    return { t, first: first.entry, second: second.entry };
  }

  it('adds a new entry at the end that names the one it corrects', async () => {
    const { t, first, second } = await booked();
    t.clock.advance(60);
    const { entry, state } = await t.account.correct(t.one.businessId, first.id, {
      amount: rappen(450),
      text: 'Verzählt',
    });
    expect(entry).toMatchObject({
      stream: 'cash',
      seq: 3,
      prevHash: second.hash,
      corrects: first.id,
      amount: 450,
      text: 'Verzählt',
      at: '2026-11-16T09:00:00.000Z',
      actor: t.one.personId,
    });
    expect(entry.id).not.toBe(first.id);
    expect(state).toEqual({ balance: 330, bookings: 2 });
  });

  it('leaves the corrected entry exactly as it was', async () => {
    const { t, first } = await booked();
    const before = canonicalJson(await t.storage.table('account_entries').get(first.id));
    await t.account.correct(t.one.businessId, first.id, { amount: rappen(450) });
    expect(canonicalJson(await t.storage.table('account_entries').get(first.id))).toBe(before);
    const entries = await t.account.entries(t.one.businessId, 'cash');
    expect(entries.map((entry) => entry.amount)).toEqual([500, -120, 450]);
    expect(await t.account.verify(t.one.businessId, 'cash')).toMatchObject({
      ok: true,
      entries: 3,
    });
  });

  it('takes the place of the corrected entry in the state', async () => {
    const t = await createTestLedgers();
    const { businessId } = t.one;
    await t.status.append(businessId, 'job-1', { status: 'planned' });
    const mistake = await t.status.append(businessId, 'job-1', { status: 'planned' });
    await t.status.append(businessId, 'job-1', { status: 'done' });
    const { state } = await t.status.correct(businessId, mistake.entry.id, { status: 'started' });
    expect(state).toEqual({ status: 'done', history: ['planned', 'started', 'done'] });
    expect(await t.status.state(businessId, 'job-1')).toEqual(state);
  });

  it('corrects an entry once; after that the correction is the one to correct', async () => {
    const { t, first } = await booked();
    const correction = await t.account.correct(t.one.businessId, first.id, { amount: rappen(450) });
    const again = t.account.correct(t.one.businessId, first.id, { amount: rappen(400) });
    await expect(again).rejects.toThrow(CommandError);
    await expect(again).rejects.toMatchObject({
      code: 'not_allowed',
      message: expect.stringContaining(correction.entry.id) as string,
    });
    expect(await t.account.entries(t.one.businessId, 'cash')).toHaveLength(3);

    const second = await t.account.correct(t.one.businessId, correction.entry.id, {
      amount: rappen(400),
    });
    expect(second.entry).toMatchObject({ seq: 4, corrects: correction.entry.id });
    expect(second.state).toEqual({ balance: 280, bookings: 2 });
    expect(await t.account.verify(t.one.businessId, 'cash')).toMatchObject({ ok: true });
  });

  it('does not find an entry that is not there', async () => {
    const { t } = await booked();
    const missing = t.account.correct(t.one.businessId, t.ids.next(), { amount: rappen(1) });
    await expect(missing).rejects.toThrow(CommandError);
    await expect(missing).rejects.toMatchObject({ code: 'not_found' });
  });

  it('does not find an entry of another business', async () => {
    const { t, first } = await booked();
    const foreign = t.account.correct(t.two.businessId, first.id, { amount: rappen(1) });
    await expect(foreign).rejects.toMatchObject({ code: 'not_found' });
    expect(await accountRows(t)).toHaveLength(2);
  });

  it('stays in the stream of the entry it corrects', async () => {
    const { t, first } = await booked();
    await t.account.append(t.one.businessId, 'bank', { amount: rappen(900) });
    const { entry } = await t.account.correct(t.one.businessId, first.id, { amount: rappen(450) });
    expect(entry).toMatchObject({ stream: 'cash', seq: 3 });
    expect(await t.account.state(t.one.businessId, 'bank')).toEqual({ balance: 900, bookings: 1 });
  });

  it('writes nothing if the corrected history breaks the rule of the ledger', async () => {
    const { t, first } = await booked();
    const before = await accountRows(t);
    // With 100 instead of 500 in the first place, the 120 taken out afterwards are not there.
    const tooLittle = t.account.correct(t.one.businessId, first.id, { amount: rappen(100) });
    await expect(tooLittle).rejects.toMatchObject({ code: OVERDRAWN });
    expect(await accountRows(t)).toEqual(before);
  });

  it('checks the payload as append does', async () => {
    const { t, first } = await booked();
    await expect(
      t.account.correct(t.one.businessId, first.id, untyped({ amount: 1.5 })),
    ).rejects.toThrow(ZodError);
    await expect(
      t.account.correct(t.one.businessId, first.id, untyped({ amount: 1, seq: 1 })),
    ).rejects.toMatchObject({ code: 'invalid_payload' });
    await expect(
      t.account.correct(t.one.businessId, first.id, untyped(null)),
    ).rejects.toMatchObject({ code: 'invalid_payload' });
    expect(await accountRows(t)).toHaveLength(2);
  });
});

describe('reading', () => {
  it('returns the entries of a stream in the order of the chain, however they are stored', async () => {
    const t = await createTestLedgers();
    for (const amount of [500, -100, 20, 7]) {
      await t.account.append(t.one.businessId, 'cash', { amount: rappen(amount) });
    }
    const device = await deviceHolding((await accountRows(t)).reverse());
    const entries = await device.account.entries(t.one.businessId, 'cash');
    expect(entries.map((entry) => entry.seq)).toEqual([1, 2, 3, 4]);
    expect(entries.map((entry) => entry.amount)).toEqual([500, -100, 20, 7]);
  });

  it('knows the streams of a business, sorted, and of no other', async () => {
    const t = await createTestLedgers();
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(1) });
    await t.account.append(t.one.businessId, 'bank', { amount: rappen(1) });
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(1) });
    await t.account.append(t.two.businessId, 'safe', { amount: rappen(1) });
    expect(await t.account.streams(t.one.businessId)).toEqual(['bank', 'cash']);
    expect(await t.account.streams(t.two.businessId)).toEqual(['safe']);
    expect(await t.status.streams(t.one.businessId)).toEqual([]);
  });

  it('has the initial state and no entries for a stream nobody wrote to', async () => {
    const t = await createTestLedgers();
    expect(await t.account.entries(t.one.businessId, 'cash')).toEqual([]);
    expect(await t.account.state(t.one.businessId, 'cash')).toEqual({ balance: 0, bookings: 0 });
    expect(await t.account.verify(t.one.businessId, 'cash')).toEqual({ ok: true, entries: 0 });
    expect(await t.account.verifyAll(t.one.businessId)).toEqual({
      ok: true,
      entries: 0,
      heads: {},
    });
  });

  it('computes the state anew at every call and stores it nowhere', async () => {
    const t = await createTestLedgers();
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(-200) });
    const rows = await accountRows(t);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(Object.keys(row)).not.toContain('balance');
    }
    expect(await t.account.state(t.one.businessId, 'cash')).toEqual({ balance: 300, bookings: 2 });
    expect(await t.storage.table('status_entries').ofBusiness(t.one.businessId)).toEqual([]);
  });

  it('reads with a reader that cannot write', async () => {
    const t = await createTestLedgers();
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
    const reader = createLedgerReader(accountLedger, { storage: t.storage, hasher });
    expect(Object.keys(reader).sort()).toEqual([
      'entries',
      'state',
      'streams',
      'verify',
      'verifyAll',
    ]);
    expect(await reader.state(t.one.businessId, 'cash')).toEqual({ balance: 500, bookings: 1 });
    expect(await reader.verify(t.one.businessId, 'cash')).toMatchObject({ ok: true, entries: 1 });
  });
});

describe('verify', () => {
  async function written() {
    const t = await createTestLedgers();
    for (const amount of [500, -100, 20]) {
      await t.account.append(t.one.businessId, 'cash', { amount: rappen(amount) });
    }
    await t.account.append(t.one.businessId, 'bank', { amount: rappen(900) });
    return { t, rows: await accountRows(t) };
  }

  it('says ok, how many entries the chain has and where it ends', async () => {
    const { t, rows } = await written();
    const last = rows.find((row) => row.stream === 'cash' && row.seq === 3);
    expect(await t.account.verify(t.one.businessId, 'cash')).toEqual({
      ok: true,
      entries: 3,
      head: { seq: 3, hash: last?.hash },
    });
  });

  it('says where and why a chain breaks when an entry was changed', async () => {
    const { t, rows } = await written();
    const changed = rows.map((row) =>
      row.stream === 'cash' && row.seq === 2 ? { ...row, amount: rappen(-10) } : row,
    );
    const device = await deviceHolding(changed);
    const result = await device.account.verify(t.one.businessId, 'cash');
    expect(result).toEqual({
      ok: false,
      entries: 3,
      problems: [
        {
          kind: 'hash',
          businessId: t.one.businessId,
          stream: 'cash',
          position: 2,
          id: changed.find((row) => row.stream === 'cash' && row.seq === 2)?.id,
          message: expect.any(String) as string,
        },
      ],
    });
    // The other stream of the business is not touched by it.
    expect(await device.account.verify(t.one.businessId, 'bank')).toMatchObject({ ok: true });
  });

  it('still reads the state of a damaged chain: verify judges, state does not', async () => {
    const { t, rows } = await written();
    const device = await deviceHolding(
      rows.filter((row) => !(row.stream === 'cash' && row.seq === 2)),
    );
    expect(await device.account.verify(t.one.businessId, 'cash')).toMatchObject({ ok: false });
    expect(await device.account.state(t.one.businessId, 'cash')).toEqual({
      balance: 520,
      bookings: 2,
    });
  });

  it('keeps writing after the last entry of a damaged chain', async () => {
    const { t, rows } = await written();
    const device = await deviceHolding(
      rows.filter((row) => !(row.stream === 'cash' && row.seq === 2)),
    );
    const { entry } = await device.account.append(t.one.businessId, 'cash', { amount: rappen(1) });
    expect(entry.seq).toBe(4);
    const result = await device.account.verify(t.one.businessId, 'cash');
    expect(result.ok ? [] : result.problems.map((problem) => problem.position)).toEqual([2, 2]);
  });

  it('checks a chain against an anchor noted earlier', async () => {
    const { t, rows } = await written();
    const noted = await t.account.verify(t.one.businessId, 'cash');
    const anchor = noted.ok ? noted.head : undefined;
    expect(anchor).toBeDefined();

    // More entries afterwards do not disturb the anchor.
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(5) });
    expect(await t.account.verify(t.one.businessId, 'cash', anchor)).toMatchObject({
      ok: true,
      entries: 4,
    });

    // The last entry cut off: the chain alone holds together, the anchor shows the loss.
    const cut = await deviceHolding(
      rows.filter((row) => !(row.stream === 'cash' && row.seq === 3)),
    );
    expect(await cut.account.verify(t.one.businessId, 'cash')).toMatchObject({
      ok: true,
      entries: 2,
    });
    const result = await cut.account.verify(t.one.businessId, 'cash', anchor);
    expect(result).toMatchObject({
      ok: false,
      problems: [{ kind: 'anchor', stream: 'cash', position: 3 }],
    });
  });

  it('checks every chain of a business at once', async () => {
    const { t, rows } = await written();
    await t.account.append(t.two.businessId, 'cash', { amount: rappen(1) });
    const head = (stream: string, seq: number) => {
      const row = rows.find((entry) => entry.stream === stream && entry.seq === seq);
      return { seq, hash: row?.hash };
    };
    expect(await t.account.verifyAll(t.one.businessId)).toEqual({
      ok: true,
      entries: 4,
      heads: { bank: head('bank', 1), cash: head('cash', 3) },
    });
    expect(await t.account.verifyAll(t.two.businessId)).toMatchObject({ ok: true, entries: 1 });
  });

  it('finds a row that names no stream only in the check of the whole business', async () => {
    const { t, rows } = await written();
    const lost = rows.map((row) => (row.stream === 'bank' ? withField(row, 'stream', 5) : row));
    const device = await deviceHolding(lost);
    expect(await device.account.streams(t.one.businessId)).toEqual(['cash']);
    expect(await device.account.verify(t.one.businessId, 'cash')).toMatchObject({ ok: true });
    expect(await device.account.verify(t.one.businessId, 'bank')).toEqual({ ok: true, entries: 0 });
    const result = await device.account.verifyAll(t.one.businessId);
    expect(result).toMatchObject({ ok: false, entries: 4, problems: [{ kind: 'entry' }] });
  });

  it('reports a changed entry in the check of the whole business too', async () => {
    const { t, rows } = await written();
    const device = await deviceHolding(
      rows.map((row) => (row.stream === 'bank' ? { ...row, text: 'Nachgetragen' } : row)),
    );
    expect(await device.account.verifyAll(t.one.businessId)).toMatchObject({
      ok: false,
      problems: [{ kind: 'hash', stream: 'bank', position: 1 }],
    });
  });
});

describe('inside a command', () => {
  const book = command({
    name: 'account.book',
    summary: 'Books an amount on an account.',
    access: { feature: 'account', level: 'operate' },
    input: z.object({ ...commandBase, stream: LedgerStreamSchema, amount: RappenSchema }),
    output: z.object({ entryId: IdSchema, balance: RappenSchema }),
  });

  async function setup() {
    const t = await createTestLedgers();
    const kit = createCommandKit({
      storage: t.storage,
      clock: t.clock,
      ids: t.ids,
      actor: t.one.personId,
    });
    const run = (raw: z.input<typeof book.input>, fail = false) => {
      const input = book.input.parse(raw);
      return kit.runCommand(book, input, async () => {
        const { entry, state } = await t.account.append(input.businessId, input.stream, {
          amount: input.amount,
        });
        await kit.emit(input.businessId, 'account_entry.booked', { entryId: entry.id });
        if (fail) {
          throw new CommandError('invalid', 'Something after the booking went wrong');
        }
        return { entryId: entry.id, balance: state.balance };
      });
    };
    return { t, run };
  }

  it('is booked once, however often the command is sent', async () => {
    const { t, run } = await setup();
    const input = {
      commandId: t.ids.next(),
      businessId: t.one.businessId,
      stream: 'cash',
      amount: 500,
    };
    const first = await run(input);
    const again = await run(input);
    expect(again).toEqual(first);
    expect(await t.account.entries(t.one.businessId, 'cash')).toHaveLength(1);
    expect(await t.storage.events.ofBusiness(t.one.businessId)).toHaveLength(1);
  });

  it('is undone together with the command that fails after it', async () => {
    const { t, run } = await setup();
    const input = {
      commandId: t.ids.next(),
      businessId: t.one.businessId,
      stream: 'cash',
      amount: 500,
    };
    await expect(run(input, true)).rejects.toMatchObject({ code: 'invalid' });
    expect(await accountRows(t)).toEqual([]);
    expect(await t.storage.events.ofBusiness(t.one.businessId)).toEqual([]);
    // The same command can be sent again and now books.
    const done = await run(input);
    expect(done.balance).toBe(500);
    expect(await t.account.verify(t.one.businessId, 'cash')).toMatchObject({
      ok: true,
      entries: 1,
    });
  });

  it('fails the command if the rule of the ledger refuses the entry', async () => {
    const { t, run } = await setup();
    const input = {
      commandId: t.ids.next(),
      businessId: t.one.businessId,
      stream: 'cash',
      amount: -1,
    };
    await expect(run(input)).rejects.toMatchObject({ code: OVERDRAWN });
    expect(await accountRows(t)).toEqual([]);
    expect(await t.storage.commands.find(input.commandId)).toBeUndefined();
  });

  it('joins a transaction that is running and goes with it', async () => {
    const t = await createTestLedgers();
    const outer = t.storage.transaction(async () => {
      await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
      await t.account.append(t.one.businessId, 'cash', { amount: rappen(-100) });
      throw new Error('the outer transaction fails');
    });
    await expect(outer).rejects.toThrow('the outer transaction fails');
    expect(await accountRows(t)).toEqual([]);
  });
});

describe('several businesses on one device', () => {
  it('keeps their chains apart, also for a stream of the same name', async () => {
    const t = await createTestLedgers();
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
    const other = await t.account.append(t.two.businessId, 'cash', { amount: rappen(70) });
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(-100) });
    expect(other.entry.seq).toBe(1);
    expect(other.entry).not.toHaveProperty('prevHash');
    expect(await t.account.state(t.one.businessId, 'cash')).toEqual({ balance: 400, bookings: 2 });
    expect(await t.account.state(t.two.businessId, 'cash')).toEqual({ balance: 70, bookings: 1 });
    const entries = await t.account.entries(t.two.businessId, 'cash');
    expect(entries.map((entry) => entry.businessId)).toEqual([t.two.businessId]);
  });

  it('leaves the chain of one business whole when the other is removed', async () => {
    const t = await createTestLedgers();
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
    await t.account.append(t.two.businessId, 'cash', { amount: rappen(70) });
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(-100) });
    const before = await t.account.verify(t.one.businessId, 'cash');
    await t.storage.purge(t.two.businessId);
    expect(await t.account.verify(t.one.businessId, 'cash')).toEqual(before);
    expect(await t.account.entries(t.two.businessId, 'cash')).toEqual([]);
    expect(await t.account.state(t.two.businessId, 'cash')).toEqual({ balance: 0, bookings: 0 });
  });
});

describe('the set-up', () => {
  it('fails at once on a storage that does not hold the table of the ledger', () => {
    const registry = createTableRegistry([statusEntriesTable, notesTable]);
    const ports = { hasher, clock: fixedClock(), ids: sequentialIds() };
    const storage = createMemoryStorage(registry, ports);
    const context = { storage, ...ports, actor: ports.ids.next() };
    expect(() => createLedger(accountLedger, context)).toThrow(StorageError);
    expect(() => createLedger(accountLedger, context)).toThrow(
      expect.objectContaining({ code: 'unknown_table' }),
    );
    expect(() => createLedgerReader(accountLedger, context)).toThrow(
      expect.objectContaining({ code: 'unknown_table' }),
    );
  });

  it('refuses a schema that rewrites a field the ledger writes', async () => {
    const elsewhen = IsoDateTimeSchema.parse('2000-01-01T00:00:00.000Z');
    const schema = z.object({
      ...ledgerFields,
      at: IsoDateTimeSchema.transform(() => elsewhen),
      amount: RappenSchema,
    });
    const table = defineTable({
      name: 'rewriting_entries',
      schema,
      indexes: [],
      sensitivity: 'normal',
      sync: 'ledger',
      appendOnly: true,
    });
    const ledger = defineLedger({
      table,
      initial: 0,
      reduce: (total: number, entry: z.output<typeof schema>) => total + entry.amount,
    });
    const ports = { hasher, clock: fixedClock(), ids: sequentialIds() };
    const storage = createMemoryStorage(createTableRegistry([table]), ports);
    const businessId = ports.ids.next();
    const kit = createLedger(ledger, { storage, ...ports, actor: ports.ids.next() });
    const append = kit.append(businessId, 'cash', { amount: rappen(5) });
    await expect(append).rejects.toThrow(LedgerError);
    await expect(append).rejects.toMatchObject({
      code: 'invalid_definition',
      message: expect.stringContaining('"at"') as string,
    });
    expect(await storage.table(table).ofBusiness(businessId)).toEqual([]);
  });
});

describe('a ledger in a backup', () => {
  const LaterSchema = AccountEntrySchema.extend({ later: z.string().optional() });
  const laterTable = defineTable({
    name: 'account_entries',
    schema: LaterSchema,
    indexes: [['stream', 'seq']],
    sensitivity: 'internal',
    sync: 'ledger',
    appendOnly: true,
  });
  const laterRegistry = createTableRegistry([laterTable, statusEntriesTable, notesTable]);
  const laterLedger = defineLedger({
    table: laterTable,
    initial: 0,
    reduce: (total: number, entry: z.output<typeof LaterSchema>) => total + entry.amount,
  });

  it('comes back with every chain whole, also with a field this version does not know', async () => {
    // A device with a newer version of the app: its entries carry a field more.
    const ports = { hasher, clock: fixedClock(), ids: sequentialIds(100_000) };
    const newer = createMemoryStorage(laterRegistry, ports);
    const businessId = ports.ids.next();
    const now = ports.clock.now();
    await newer.businesses.add({
      id: businessId,
      name: 'Betrieb Muster',
      createdAt: now,
      updatedAt: now,
    });
    const kit = createLedger(laterLedger, { storage: newer, ...ports, actor: ports.ids.next() });
    await kit.append(businessId, 'cash', { amount: rappen(500), later: 'von morgen' });
    const second = await kit.append(businessId, 'cash', { amount: rappen(-100) });
    await kit.correct(businessId, second.entry.id, { amount: rappen(-90), later: 'auch' });
    const format = { format: 'sample-backup', version: 1, hasher };
    const document = await createBackupKit({ ...format, registry: laterRegistry }).exportBackup(
      newer,
      businessId,
      { clock: ports.clock },
    );

    // This version reads the file with its own, older schema and writes the rows back.
    const backups = createBackupKit({ ...format, registry: REGISTRY });
    const check = await backups.checkBackup(JSON.parse(JSON.stringify(document)));
    expect(check.preview.problems).toEqual([]);
    const older = await createTestLedgers();
    if (check.backup !== undefined) {
      await backups.restoreBackup(older.storage, check.backup);
    }
    const entries = await older.account.entries(businessId, 'cash');
    expect(entries.map((entry) => (entry as { later?: string }).later)).toEqual([
      'von morgen',
      undefined,
      'auch',
    ]);
    expect(await older.account.verifyAll(businessId)).toMatchObject({ ok: true, entries: 3 });
    expect(await older.account.state(businessId, 'cash')).toEqual({ balance: 410, bookings: 2 });
    // And it goes on writing on the chain it brought back.
    const next = await older.account.append(businessId, 'cash', { amount: rappen(1) });
    expect(next.entry.seq).toBe(4);
    expect(await older.account.verify(businessId, 'cash')).toMatchObject({ ok: true, entries: 4 });
  });
});

describe('the package without the globals of a runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes, corrects, folds and checks a chain', async () => {
    const t = await createTestLedgers();
    const globals = [
      'crypto',
      'TextEncoder',
      'TextDecoder',
      'btoa',
      'atob',
      'structuredClone',
      'Buffer',
      'process',
    ];
    for (const name of globals) {
      vi.stubGlobal(name, undefined);
    }
    // Nothing is asserted in here: the test runner itself may need what was taken away.
    const run = async () => {
      const first = await t.account.append(t.one.businessId, 'cash', {
        amount: rappen(500),
        text: 'Zürich 😀',
      });
      await t.account.correct(t.one.businessId, first.entry.id, { amount: rappen(450) });
      return {
        state: await t.account.state(t.one.businessId, 'cash'),
        check: await t.account.verifyAll(t.one.businessId),
      };
    };
    const result = await run().catch((error: unknown) => ({ problem: String(error) }));
    vi.unstubAllGlobals();
    expect(result).toMatchObject({
      state: { balance: 450, bookings: 1 },
      check: { ok: true, entries: 2 },
    });
  });
});
