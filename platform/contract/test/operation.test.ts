import { IdSchema, type Id } from '@onestrand/core';
import fc from 'fast-check';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  ACCESS_LEVELS,
  command,
  commandBase,
  OPERATION_NAME_PATTERN,
  query,
  queryBase,
  type AccessLevel,
  type CommandBase,
  type CommandNames,
  type CommandOperation,
  type ContractFragment,
  type Operation,
  type OperationAccess,
  type OperationInput,
  type OperationOutput,
  type QueryBase,
  type QueryNames,
  type QueryOperation,
  type UseCase,
  type UseCasesOf,
} from '../src';
import { customersContract, type Customer, type CustomersContract } from './sample-contract';
import { sequentialIds } from './support';

const input = z.object({ ...commandBase, name: z.string() });
const output = z.object({ done: z.boolean() });
const access: OperationAccess = { feature: 'customers', level: 'operate' };

describe('command and query', () => {
  it('set the kind and keep everything else as it was given', () => {
    const spec = {
      name: 'customers.create',
      summary: 'Creates a customer.',
      access,
      input,
      output,
    };
    const made = command(spec);
    expect(made).toEqual({ ...spec, kind: 'command' });
    expect(made.input).toBe(input);
    expect(made.output).toBe(output);
    expect(made.access).toBe(access);
    // The description that was passed in is not changed.
    expect(spec).not.toHaveProperty('kind');

    const read = query({
      name: 'customers.list',
      summary: 'Lists the customers.',
      access: { feature: 'customers', level: 'view' },
      input: z.object({ ...queryBase }),
      output,
    });
    expect(read.kind).toBe('query');
    expect(read.name).toBe('customers.list');
  });

  it('type the result by its kind and its schemas', () => {
    const made = command({ name: 'customers.create', summary: 'Creates.', access, input, output });
    expectTypeOf(made).toEqualTypeOf<CommandOperation<typeof input, typeof output>>();
    expectTypeOf(made.kind).toEqualTypeOf<'command'>();
    expectTypeOf(made).toExtend<Operation>();
    expectTypeOf(made).not.toExtend<QueryOperation>();

    const read = query({
      name: 'customers.list',
      summary: 'Lists.',
      access,
      input: z.object({ ...queryBase }),
      output,
    });
    expectTypeOf(read.kind).toEqualTypeOf<'query'>();
    expectTypeOf(read).not.toExtend<CommandOperation>();
  });

  it('do not compile without access', () => {
    // @ts-expect-error -- every operation declares the feature and the level it needs
    command({ name: 'customers.create', summary: 'Creates a customer.', input, output });
    query({
      name: 'customers.list',
      summary: 'Lists the customers.',
      input: z.object({ ...queryBase }),
      output,
      // @ts-expect-error -- a level is one of view, operate, manage
      access: { feature: 'customers', level: 'everything' },
    });
    command({
      name: 'customers.create',
      summary: 'Creates a customer.',
      input,
      output,
      // @ts-expect-error -- access without a feature is no access
      access: { level: 'operate' },
    });

    expectTypeOf<Operation>().toHaveProperty('access').toEqualTypeOf<OperationAccess>();
    expectTypeOf<Omit<Operation, 'access'>>().not.toExtend<Operation>();
    expectTypeOf(command).parameter(0).toHaveProperty('access').toEqualTypeOf<OperationAccess>();
    expectTypeOf(query).parameter(0).toHaveProperty('access').toEqualTypeOf<OperationAccess>();
    expectTypeOf<{ feature: string }>().not.toExtend<OperationAccess>();
    expectTypeOf<AccessLevel>().toEqualTypeOf<'view' | 'operate' | 'manage'>();
  });

  it('do not compile without the base fields in the input', () => {
    command({
      name: 'customers.create',
      summary: 'Creates a customer.',
      access,
      // @ts-expect-error -- a command without a commandId could not be repeated safely
      input: z.object({ businessId: IdSchema, name: z.string() }),
      output,
    });
    command({
      name: 'customers.create',
      summary: 'Creates a customer.',
      access,
      // @ts-expect-error -- a command belongs to a business
      input: z.object({ commandId: IdSchema }),
      output,
    });
    command({
      name: 'customers.create',
      summary: 'Creates a customer.',
      access,
      // @ts-expect-error -- the ids of the base are UUIDv7, not any text
      input: z.object({ commandId: z.string(), businessId: z.string() }),
      output,
    });
    query({
      name: 'customers.list',
      summary: 'Lists the customers.',
      access,
      // @ts-expect-error -- a query reads one business
      input: z.object({ text: z.string() }),
      output,
    });
    // A query needs no commandId, and more fields are always fine.
    query({
      name: 'customers.search',
      summary: 'Finds customers by a part of their name.',
      access,
      input: z.object({ ...queryBase, text: z.string() }),
      output,
    });
  });
});

describe('base fields', () => {
  it('are UUIDv7 ids, also after parsing', () => {
    const ids = sequentialIds();
    const commandId = ids.next();
    const businessId = ids.next();
    const ofCommand = z.object(commandBase);
    const ofQuery = z.object(queryBase);
    expect(ofCommand.parse({ commandId, businessId })).toEqual({ commandId, businessId });
    expect(ofQuery.parse({ businessId })).toEqual({ businessId });
    expect(ofCommand.safeParse({ commandId: 'abc', businessId }).success).toBe(false);
    expect(ofCommand.safeParse({ businessId }).success).toBe(false);
    expect(ofQuery.safeParse({}).success).toBe(false);
    expect(Object.keys(commandBase)).toEqual(['commandId', 'businessId']);
    expect(Object.keys(queryBase)).toEqual(['businessId']);

    expectTypeOf<z.output<typeof ofCommand>>().toEqualTypeOf<CommandBase>();
    expectTypeOf<z.output<typeof ofQuery>>().toEqualTypeOf<QueryBase>();
    expectTypeOf<CommandBase>().toExtend<QueryBase>();
    expectTypeOf<CommandBase['commandId']>().toEqualTypeOf<Id>();
  });
});

describe('access levels', () => {
  it('are listed lowest first', () => {
    expect(ACCESS_LEVELS).toEqual(['view', 'operate', 'manage']);
  });
});

describe('the name of an operation', () => {
  it.each([
    'customers.create',
    'business.get',
    'facility.keys.issue',
    'facility.keys.moves.list',
    'teamTime.clockIn',
    'a.b',
    'jobs2.reports.sign',
  ])('accepts %s', (name) => {
    expect(OPERATION_NAME_PATTERN.test(name)).toBe(true);
  });

  it.each([
    ['one segment', 'customers'],
    ['five segments', 'a.b.c.d.e'],
    ['an empty name', ''],
    ['an empty segment', 'customers..create'],
    ['a dot at the start', '.customers.create'],
    ['a dot at the end', 'customers.create.'],
    ['an upper-case start', 'Customers.create'],
    ['an upper-case start of a later segment', 'customers.Create'],
    ['a digit at the start of a segment', 'customers.2create'],
    ['an underscore', 'customers.create_one'],
    ['a hyphen', 'customers.create-one'],
    ['a blank', 'customers. create'],
    ['a line break at the end', 'customers.create\n'],
    ['an accent', 'customers.creaté'],
    ['a slash', 'customers/create'],
  ])('refuses %s', (_what, name) => {
    expect(OPERATION_NAME_PATTERN.test(name)).toBe(false);
  });

  it('agrees with the rule written out, for any text', () => {
    const segment = /^[a-z][a-zA-Z0-9]*$/;
    const byRule = (name: string) => {
      const segments = name.split('.');
      return segments.length >= 2 && segments.length <= 4 && segments.every((s) => segment.test(s));
    };
    const piece = fc.stringMatching(/^[a-zA-Z0-9_\n -]{0,6}$/);
    fc.assert(
      fc.property(fc.array(piece, { minLength: 0, maxLength: 6 }), (pieces) => {
        const name = pieces.join('.');
        expect(OPERATION_NAME_PATTERN.test(name)).toBe(byRule(name));
      }),
    );
    fc.assert(
      fc.property(fc.string(), (name) => {
        expect(OPERATION_NAME_PATTERN.test(name)).toBe(byRule(name));
      }),
    );
  });
});

describe('types over a contract', () => {
  type Create = CustomersContract['customers.create'];
  type List = CustomersContract['customers.list'];

  it('give the input before parsing and the output after', () => {
    // Ids go in as plain text and come out branded.
    expectTypeOf<OperationInput<Create>>().toEqualTypeOf<{
      commandId: string;
      businessId: string;
      name: string;
    }>();
    expectTypeOf<OperationOutput<Create>>().toEqualTypeOf<{ customer: Customer }>();
    expectTypeOf<OperationOutput<Create>['customer']['id']>().toEqualTypeOf<Id>();
    // A field with a default may be left out by the caller.
    expectTypeOf<OperationInput<List>>().toEqualTypeOf<{
      businessId: string;
      includeRemoved?: boolean | undefined;
    }>();
    expectTypeOf<OperationOutput<List>>().toEqualTypeOf<{ customers: Customer[] }>();
  });

  it('type a use case by its operation', () => {
    expectTypeOf<UseCase<Create>>().toEqualTypeOf<
      (input: OperationInput<Create>) => Promise<OperationOutput<Create>>
    >();
    expectTypeOf<UseCase<Create>>().parameter(0).toHaveProperty('commandId');
    expectTypeOf<UseCase<List>>().returns.resolves.toEqualTypeOf<{ customers: Customer[] }>();
  });

  it('ask for a use case of every operation', () => {
    type UseCases = UseCasesOf<CustomersContract>;
    expectTypeOf<keyof UseCases>().toEqualTypeOf<
      'customers.create' | 'customers.remove' | 'customers.list' | 'customers.get'
    >();
    expectTypeOf<UseCases['customers.create']>().toEqualTypeOf<UseCase<Create>>();
    expectTypeOf<UseCases['customers.list']>().toEqualTypeOf<UseCase<List>>();

    const remove: UseCase<CustomersContract['customers.remove']> = () => Promise.resolve({});
    const list: UseCase<List> = () => Promise.resolve({ customers: [] });
    const get: UseCase<CustomersContract['customers.get']> = () =>
      Promise.reject(new Error('not needed here'));
    // @ts-expect-error -- customers.create has no use case: an operation left out does not compile
    const incomplete: UseCases = {
      'customers.remove': remove,
      'customers.list': list,
      'customers.get': get,
    };
    expect(Object.keys(incomplete)).toHaveLength(3);
    // @ts-expect-error -- the use case of a query cannot stand in for the one of a command
    const swapped: UseCases['customers.create'] = list;
    expect(swapped).toBe(list);
  });

  it('tell commands from queries by name', () => {
    expectTypeOf<CommandNames<CustomersContract>>().toEqualTypeOf<
      'customers.create' | 'customers.remove'
    >();
    expectTypeOf<QueryNames<CustomersContract>>().toEqualTypeOf<
      'customers.list' | 'customers.get'
    >();
    // An operation whose kind is not known by type is neither: declare it with command or query.
    const untyped: Operation = customersContract['customers.list'];
    const loose = {
      'customers.create': customersContract['customers.create'],
      'customers.other': untyped,
    };
    expect(Object.keys(loose)).toEqual(['customers.create', 'customers.other']);
    expectTypeOf<CommandNames<typeof loose>>().toEqualTypeOf<'customers.create'>();
    expectTypeOf<QueryNames<typeof loose>>().toEqualTypeOf<never>();
    expectTypeOf<CommandNames<ContractFragment>>().toEqualTypeOf<never>();
    // The names at runtime match the names by type.
    const commands = Object.values(customersContract)
      .filter((operation) => operation.kind === 'command')
      .map((operation) => operation.name);
    expect(commands).toEqual(['customers.create', 'customers.remove']);
  });

  it('follow a sum of fragments put together by spreading', () => {
    const jobsContract = {
      'jobs.reports.sign': command({
        name: 'jobs.reports.sign',
        summary: 'Signs a report, which locks it.',
        access: { feature: 'jobs', level: 'operate' },
        input: z.object({ ...commandBase, reportId: IdSchema }),
        output: z.object({ signed: z.boolean() }),
      }),
      'jobs.reports.list': query({
        name: 'jobs.reports.list',
        summary: 'Lists the reports of the business.',
        access: { feature: 'jobs', level: 'view' },
        input: z.object({ ...queryBase }),
        output: z.object({ reportIds: z.array(IdSchema) }),
      }),
    } as const satisfies ContractFragment;
    const sum = { ...customersContract, ...jobsContract };
    type Sum = typeof sum;
    expect(Object.keys(sum)).toHaveLength(6);
    expectTypeOf(sum).toExtend<ContractFragment>();
    expectTypeOf<CommandNames<Sum>>().toEqualTypeOf<
      'customers.create' | 'customers.remove' | 'jobs.reports.sign'
    >();
    expectTypeOf<QueryNames<Sum>>().toEqualTypeOf<
      'customers.list' | 'customers.get' | 'jobs.reports.list'
    >();
    expectTypeOf<keyof UseCasesOf<Sum>>().toEqualTypeOf<keyof Sum>();
    expectTypeOf<OperationOutput<Sum['jobs.reports.sign']>>().toEqualTypeOf<{ signed: boolean }>();
    // The same as a type only, without a value.
    type Both = CustomersContract & typeof jobsContract;
    expectTypeOf<CommandNames<Both>>().toEqualTypeOf<CommandNames<Sum>>();
    expectTypeOf<UseCasesOf<Both>['jobs.reports.list']>().toEqualTypeOf<
      UseCase<Sum['jobs.reports.list']>
    >();
  });

  it('work in code that knows the contract only as a type parameter', async () => {
    // What a dispatcher and a wrapper around every use case are made of.
    function call<TContract extends ContractFragment, TName extends keyof TContract & string>(
      contract: TContract,
      useCases: UseCasesOf<TContract>,
      name: TName,
      input: OperationInput<TContract[TName]>,
    ): Promise<OperationOutput<TContract[TName]>> {
      expect(Object.keys(contract)).toContain(name);
      return useCases[name](input);
    }
    const useCases: UseCasesOf<CustomersContract> = {
      'customers.create': () => Promise.reject(new Error('not needed here')),
      'customers.remove': () => Promise.resolve({}),
      'customers.list': () => Promise.resolve({ customers: [] }),
      'customers.get': () => Promise.reject(new Error('not needed here')),
    };
    const businessId: string = sequentialIds().next();
    const listed = call(customersContract, useCases, 'customers.list', { businessId });
    expectTypeOf(listed).toEqualTypeOf<Promise<{ customers: Customer[] }>>();
    expect(await listed).toEqual({ customers: [] });
    const refused = [
      // @ts-expect-error -- the input belongs to the operation that is named
      () => call(customersContract, useCases, 'customers.list', { customerId: businessId }),
      // @ts-expect-error -- a name the contract does not hold
      () => call(customersContract, useCases, 'customers.rename', { businessId }),
    ];
    // Declared only: the compiler is the one who refuses them.
    expect(refused).toHaveLength(2);
  });

  it('accept a fragment as a contract', () => {
    expectTypeOf(customersContract).toExtend<ContractFragment>();
    for (const [key, operation] of Object.entries(customersContract)) {
      expect(operation.name).toBe(key);
    }
  });
});
