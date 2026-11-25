import { CommandError, command, commandBase, type ContractFragment } from '@onestrand/contract';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  NO_ACCESS_PROFILE,
  OWNER_PROFILE,
  contractAccessProblems,
  guardUseCases,
  type AccessContext,
  type AccessRequest,
  type AccessSource,
} from '../src';
import {
  ALL_FEATURES,
  BUSINESS_ID,
  FEATURES,
  FEATURES_ON,
  OTHER_BUSINESS_ID,
  RIGHTS,
  contextOf,
  custom,
  notesContract,
  recordingUseCases,
} from './support';

function guarded(context: AccessContext) {
  const { calls, useCases } = recordingUseCases();
  const source = vi.fn<AccessSource>(() => context);
  return { calls, source, api: guardUseCases(notesContract, useCases, source) };
}

const commandInput = (text = 'a') => ({ commandId: BUSINESS_ID, businessId: BUSINESS_ID, text });
const queryInput = { businessId: BUSINESS_ID };

async function refusal(promise: Promise<unknown>): Promise<CommandError> {
  const error: unknown = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(CommandError);
  return error as CommandError;
}

describe('guardUseCases', () => {
  it('runs an operation of a profile that has the level and returns what the use case returns', async () => {
    const { api, calls } = guarded(contextOf(custom({ customers: 'operate' })));
    expect(await api['notes.add'](commandInput('x'))).toEqual({ count: 1 });
    expect(await api['notes.list'](queryInput)).toEqual({ notes: [] });
    expect(calls).toEqual(['notes.add:x', 'notes.list']);
  });

  it('refuses an operation with a missing right and does not run it', async () => {
    const { api, calls } = guarded(contextOf(custom({ customers: 'manage' }, ['export_delete'])));
    const error = await refusal(api['notes.export']({ ...commandInput() }));
    expect(error.code).toBe('forbidden');
    expect(error.message).toContain('notes.export');
    expect(error.message).toContain('"correct_time"');
    expect(calls).toEqual([]);
  });

  it('refuses an operation with too low a level, command and query alike', async () => {
    const { api, calls } = guarded(contextOf(custom({ customers: 'view' })));
    const command = await refusal(api['notes.add'](commandInput()));
    expect(command.code).toBe('forbidden');
    expect(command.message).toContain(
      'needs the level "operate" in "customers", the profile has "view"',
    );
    expect(await api['notes.list'](queryInput)).toEqual({ notes: [] });
    const query = await refusal(api['muster.visits.list'](queryInput));
    expect(query.code).toBe('forbidden');
    expect(query.message).toContain('the profile has none');
    expect(calls).toEqual(['notes.list']);
  });

  it('refuses a person with no profile in the business for every operation', async () => {
    const { api, calls } = guarded(contextOf(NO_ACCESS_PROFILE));
    for (const run of [
      () => api['notes.add'](commandInput()),
      () => api['notes.list'](queryInput),
      () => api['notes.export'](commandInput()),
      () => api['muster.visits.list'](queryInput),
    ]) {
      expect((await refusal(run())).code).toBe('forbidden');
    }
    expect(calls).toEqual([]);
  });

  it('lets the owner do every operation of a function that is on', async () => {
    const { api, calls } = guarded(
      contextOf(OWNER_PROFILE, FEATURES.resolve(['customers', 'muster.visits']).features),
    );
    await api['notes.add'](commandInput());
    await api['notes.export'](commandInput());
    await api['muster.visits.list'](queryInput);
    expect(calls).toEqual(['notes.add:a', 'notes.export', 'muster.visits.list']);
  });

  it('gives a function that is off no entry, not even to the owner; the others stay open', async () => {
    const { api, calls } = guarded(contextOf(OWNER_PROFILE, FEATURES_ON));
    const error = await refusal(api['muster.visits.list'](queryInput));
    expect(error.code).toBe('forbidden');
    expect(error.message).toContain('"muster.visits" is switched off');
    await api['notes.list'](queryInput);
    expect(calls).toEqual(['notes.list']);
  });

  it('asks the source for the business and the operation of every call', async () => {
    const { api, source } = guarded(contextOf(OWNER_PROFILE));
    await api['notes.list']({ businessId: OTHER_BUSINESS_ID });
    await api['notes.add']({ ...commandInput(), businessId: BUSINESS_ID });
    const requests: AccessRequest[] = source.mock.calls.map(([request]) => request);
    expect(requests.map((request) => [request.operation.name, request.businessId])).toEqual([
      ['notes.list', OTHER_BUSINESS_ID],
      ['notes.add', BUSINESS_ID],
    ]);
    expect(requests[0]?.operation).toBe(notesContract['notes.list']);
  });

  it('takes the context from a source that answers later', async () => {
    const { useCases, calls } = recordingUseCases();
    const api = guardUseCases(notesContract, useCases, () =>
      Promise.resolve(contextOf(custom({ customers: 'view' }))),
    );
    await api['notes.list'](queryInput);
    expect(calls).toEqual(['notes.list']);
  });

  it('decides per call: the profile may change between two calls', async () => {
    let context = contextOf(NO_ACCESS_PROFILE);
    const { useCases, calls } = recordingUseCases();
    const api = guardUseCases(notesContract, useCases, () => context);
    await refusal(api['notes.list'](queryInput));
    context = contextOf(custom({ customers: 'view' }));
    await api['notes.list'](queryInput);
    expect(calls).toEqual(['notes.list']);
  });

  it('does not run the operation when the source fails', async () => {
    const { useCases, calls } = recordingUseCases();
    const api = guardUseCases(notesContract, useCases, () => {
      throw new Error('no person signed in');
    });
    await expect(api['notes.list'](queryInput)).rejects.toThrow('no person signed in');
    expect(calls).toEqual([]);
  });

  it.each([
    ['no input', undefined],
    ['a text', 'x'],
    ['null', null],
    ['an input without businessId', { text: 'a' }],
    ['a businessId that is no text', { businessId: 4 }],
  ])('refuses %s as invalid before it asks anybody', async (_what, input) => {
    const { api, source, calls } = guarded(contextOf(OWNER_PROFILE));
    const error = await refusal(api['notes.add'](input as never));
    expect(error.code).toBe('invalid');
    expect(source).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('returns the same operations, frozen, and leaves the use cases it was given alone', () => {
    const { useCases } = recordingUseCases();
    const before = { ...useCases };
    const api = guardUseCases(notesContract, useCases, () => contextOf(OWNER_PROFILE));
    expect(Object.keys(api)).toEqual(Object.keys(notesContract));
    expect(Object.isFrozen(api)).toBe(true);
    expect(useCases).toEqual(before);
    expect(api['notes.list']).not.toBe(useCases['notes.list']);
  });

  it('refuses at once a contract with an operation that is not well formed', () => {
    const { useCases } = recordingUseCases();
    const broken = {
      ...notesContract,
      'notes.add': { ...notesContract['notes.add'], access: undefined },
    } as unknown as typeof notesContract;
    expect(() => guardUseCases(broken, useCases, () => contextOf(OWNER_PROFILE))).toThrow(
      /notes\.add \(access\)/,
    );
    const typo = {
      'notes.add': command({
        name: 'notes.add',
        summary: 'Adds a note.',
        access: { feature: 'customers', level: 'operate', right: ['wages'] } as never,
        input: z.object({ ...commandBase }),
        output: z.object({}),
      }),
    } as const satisfies ContractFragment;
    expect(() =>
      guardUseCases(typo, { 'notes.add': () => Promise.resolve({}) }, () =>
        contextOf(OWNER_PROFILE),
      ),
    ).toThrow(TypeError);
  });

  it('refuses at once an operation without a use case', () => {
    const { useCases } = recordingUseCases();
    const lacking = Object.fromEntries(
      Object.entries(useCases).filter(([name]) => name !== 'notes.export'),
    );
    expect(() =>
      guardUseCases(notesContract, lacking as unknown as typeof useCases, () =>
        contextOf(OWNER_PROFILE),
      ),
    ).toThrow('The operation notes.export has no use case to guard');
  });

  it('leaves out a use case the contract does not name: it cannot be called through the guard', () => {
    const { useCases } = recordingUseCases();
    const extra = { ...useCases, 'notes.secret': () => Promise.resolve({}) };
    const api = guardUseCases(notesContract, extra, () => contextOf(OWNER_PROFILE));
    expect(Object.keys(api)).not.toContain('notes.secret');
  });
});

describe('contractAccessProblems', () => {
  const known = { features: FEATURES, rights: RIGHTS };

  it('finds nothing where every function and right of every operation is registered', () => {
    expect(contractAccessProblems(notesContract, known)).toEqual([]);
    expect(ALL_FEATURES).toContain('muster.visits');
  });

  it('names the operations whose function or right does not exist, as data', () => {
    const problems = contractAccessProblems(
      {
        ...notesContract,
        'later.thing': command({
          name: 'later.thing',
          summary: 'Does a thing.',
          access: { feature: 'later', level: 'operate', rights: ['wages', 'later_right', 'x_y'] },
          input: z.object({ ...commandBase }),
          output: z.object({}),
        }),
      },
      known,
    );
    expect(problems.map(({ operation, part, id }) => [operation, part, id])).toEqual([
      ['later.thing', 'access.feature', 'later'],
      ['later.thing', 'access.rights', 'later_right'],
      ['later.thing', 'access.rights', 'x_y'],
    ]);
    expect(problems[0]?.message).toContain('"later"');
  });
});
