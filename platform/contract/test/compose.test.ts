import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  COMPOSE_PROBLEM_CODES,
  ComposeError,
  command,
  commandBase,
  composeContract,
  composeProblems,
  fragmentProblems,
  query,
  queryBase,
  type ContractFragment,
  type ContractPart,
} from '../src';
import { customersContract } from './sample-contract';

const notesContract = {
  'notes.add': command({
    name: 'notes.add',
    summary: 'Adds a note.',
    access: { feature: 'notes', level: 'operate' },
    input: z.object({ ...commandBase, text: z.string() }),
    output: z.object({}),
  }),
  'notes.list': query({
    name: 'notes.list',
    summary: 'Lists the notes.',
    access: { feature: 'notes', level: 'view' },
    input: z.object({ ...queryBase }),
    output: z.object({ texts: z.array(z.string()) }),
  }),
} as const satisfies ContractFragment;

/** A second owner of an operation that `notes` already has. */
const alsoNotes = {
  'notes.add': command({
    name: 'notes.add',
    summary: 'Adds a note, the other way.',
    access: { feature: 'other', level: 'operate' },
    input: z.object({ ...commandBase }),
    output: z.object({}),
  }),
} as const satisfies ContractFragment;

describe('composeContract', () => {
  it('puts the fragments together by operation name', () => {
    const contract = composeContract([
      { source: 'customers', fragment: customersContract },
      { source: 'notes', fragment: notesContract },
    ] as const);
    expect(Object.keys(contract)).toEqual([
      'customers.create',
      'customers.remove',
      'customers.list',
      'customers.get',
      'notes.add',
      'notes.list',
    ]);
    // The operations are those of the fragments, not copies.
    expect(contract['notes.add']).toBe(notesContract['notes.add']);
    expect(fragmentProblems(contract)).toEqual([]);
    expect(Object.isFrozen(contract)).toBe(true);
  });

  it('knows every operation by type when the parts are written out', () => {
    const contract = composeContract([
      { source: 'customers', fragment: customersContract },
      { source: 'notes', fragment: notesContract },
    ] as const);
    expectTypeOf(contract['notes.add'].kind).toEqualTypeOf<'command'>();
    expectTypeOf(contract['customers.get'].kind).toEqualTypeOf<'query'>();
    expectTypeOf(contract).not.toHaveProperty('notes.remove');
    expect(Object.hasOwn(contract, 'notes.remove')).toBe(false);
  });

  it('is a plain fragment for a list that is not known one by one', () => {
    const parts: ContractPart[] = [{ source: 'notes', fragment: notesContract }];
    expectTypeOf(composeContract(parts)).toEqualTypeOf<Readonly<ContractFragment>>();
  });

  it('gives an empty contract for no parts', () => {
    expect(composeContract([])).toEqual({});
    expect(composeProblems([])).toEqual([]);
  });

  it('fails when two parts bring the same operation, and names both', () => {
    const parts = [
      { source: 'notes', fragment: notesContract },
      { source: 'other', fragment: alsoNotes },
    ] as const;
    expect(() => composeContract(parts)).toThrow(ComposeError);
    try {
      composeContract(parts);
      expect.unreachable('the composer accepted a duplicate');
    } catch (error) {
      expect(error).toBeInstanceOf(ComposeError);
      const { code, problems, message } = error as ComposeError;
      expect(code).toBe('duplicate_operation');
      expect(problems).toEqual([
        expect.objectContaining({
          code: 'duplicate_operation',
          operation: 'notes.add',
          sources: ['notes', 'other'],
        }),
      ]);
      expect(message).toContain('"notes"');
      expect(message).toContain('"other"');
    }
  });

  it('names every owner of an operation that three parts bring, once', () => {
    const problems = composeProblems([
      { source: 'a', fragment: alsoNotes },
      { source: 'b', fragment: alsoNotes },
      { source: 'c', fragment: alsoNotes },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.sources).toEqual(['a', 'b', 'c']);
  });

  it('finds an operation that is not well formed, with its owner and the part that is wrong', () => {
    const withoutAccess = Object.fromEntries(
      Object.entries(notesContract['notes.add']).filter(([field]) => field !== 'access'),
    );
    const problems = composeProblems([
      { source: 'notes', fragment: { 'notes.add': withoutAccess } },
    ] as unknown);
    expect(problems).toEqual([
      expect.objectContaining({
        code: 'invalid_operation',
        operation: 'notes.add',
        sources: ['notes'],
        part: 'access',
      }),
    ]);
    expect(() =>
      composeContract([{ source: 'notes', fragment: { 'notes.add': withoutAccess } }] as never),
    ).toThrow(expect.objectContaining({ code: 'invalid_operation' }));
  });

  it('refuses a key that is not the name of the operation', () => {
    const problems = composeProblems([
      { source: 'notes', fragment: { 'notes.other': notesContract['notes.add'] } },
    ]);
    expect(problems.map((problem) => [problem.code, problem.part])).toEqual([
      ['invalid_operation', 'key'],
    ]);
  });

  it.each([
    ['no list', 'notes'],
    ['a part that is no record', ['notes']],
    ['a part without a source', [{ fragment: notesContract }]],
    ['a part with an empty source', [{ source: '  ', fragment: notesContract }]],
    ['a source that is no text', [{ source: 3, fragment: notesContract }]],
    ['a fragment that is no record', [{ source: 'notes', fragment: [notesContract] }]],
    ['no fragment', [{ source: 'notes' }]],
  ])('refuses %s', (_name, parts) => {
    const problems = composeProblems(parts);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((problem) => problem.code === 'invalid_part')).toBe(true);
    expect(() => composeContract(parts as never)).toThrow(
      expect.objectContaining({ code: 'invalid_part' }),
    );
  });

  it('lists every problem at once, the first decides the code', () => {
    const problems = composeProblems([
      { source: 'notes', fragment: notesContract },
      { source: 'other', fragment: alsoNotes },
      { source: '', fragment: notesContract },
    ]);
    expect(problems.map((problem) => problem.code)).toEqual([
      'invalid_part',
      'duplicate_operation',
    ]);
    expect(() =>
      composeContract([
        { source: 'notes', fragment: notesContract },
        { source: 'other', fragment: alsoNotes },
        { source: '', fragment: notesContract },
      ]),
    ).toThrow(expect.objectContaining({ code: 'invalid_part' }));
  });

  it('keeps the list of codes as documented', () => {
    expect(COMPOSE_PROBLEM_CODES).toEqual([
      'invalid_part',
      'invalid_operation',
      'duplicate_operation',
    ]);
  });

  it('does not change the fragments', () => {
    const before = Object.keys(notesContract);
    composeContract([{ source: 'notes', fragment: notesContract }] as const);
    expect(Object.keys(notesContract)).toEqual(before);
    expect(Object.isFrozen(notesContract)).toBe(false);
  });
});
