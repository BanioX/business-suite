// Origin: BanioX/Randen packages/core/test/application.test.ts @ e0f0907 — adapted: only the test that every command asks for a commandId and every operation for a business, on a sample contract; the rest of the file is new
import {
  BpsSchema,
  CurrencyCodeSchema,
  GtinSchema,
  IdSchema,
  IsoDateTimeSchema,
  LocalDateSchema,
  PLATFORM_UNITS,
  QuantitySchema,
  RappenSchema,
  UUID_V7_PATTERN,
  WeekdaySchema,
  YearMonthSchema,
} from '@onestrand/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  command,
  commandBase,
  contractJsonSchemas,
  fragmentProblems,
  operationJsonSchema,
  operationProblems,
  operationSchemaProblems,
  query,
  queryBase,
  type ContractFragment,
  type Operation,
  type OperationProblem,
  type QueryNames,
  type QueryOperation,
} from '../src';
import { customersContract } from './sample-contract';

const ID = { type: 'string', pattern: UUID_V7_PATTERN.source };
const SOME_ID = '01a3185c-5000-7000-8000-000000000001';
const DRAFT = 'https://json-schema.org/draft/2020-12/schema';
const access = { feature: 'customers', level: 'operate' } as const;
const done = z.object({ done: z.boolean() });

/**
 * An operation put together without the helpers, as a contract without types would hold it:
 * the helpers refuse most of these inputs at compile time.
 */
function loose(kind: 'command' | 'query', input: z.ZodType, output: z.ZodType = done): Operation {
  return { name: 'customers.try', kind, summary: 'Tries a schema.', access, input, output };
}

const messages = (problems: readonly OperationProblem[]) =>
  problems.map((problem) => `${problem.part}: ${problem.message}`);

/** The base fields the input of an operation was found not to require. */
const notRequired = (operation: Operation) =>
  operationSchemaProblems(operation).flatMap(
    ({ message }) => /must require «(\w+)»/.exec(message)?.[1] ?? [],
  );

/** What a function throws, or undefined if it returns. */
function thrownBy(run: () => unknown): unknown {
  try {
    run();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe('contractJsonSchemas', () => {
  it('describes every operation in the order of the contract', () => {
    const schemas = contractJsonSchemas(customersContract);
    expect(schemas.map((schema) => [schema.name, schema.kind])).toEqual([
      ['customers.create', 'command'],
      ['customers.remove', 'command'],
      ['customers.list', 'query'],
      ['customers.get', 'query'],
    ]);
    expect(contractJsonSchemas({})).toEqual([]);
  });

  it('gives name, kind, summary, access and both schemas of an operation', () => {
    expect(contractJsonSchemas(customersContract)[1]).toEqual({
      name: 'customers.remove',
      kind: 'command',
      summary: 'Removes a customer that no document refers to.',
      access: { feature: 'customers', level: 'manage', rights: ['export_delete'] },
      input: {
        $schema: DRAFT,
        type: 'object',
        properties: { commandId: ID, businessId: ID, customerId: ID },
        required: ['commandId', 'businessId', 'customerId'],
      },
      output: { $schema: DRAFT, type: 'object', properties: {}, additionalProperties: false },
    });
  });

  it('describes the input as the caller sends it and the output as it comes back', () => {
    const [, , list] = contractJsonSchemas(customersContract);
    // A field with a default may be left out by the caller.
    expect(list?.input).toEqual({
      $schema: DRAFT,
      type: 'object',
      properties: { businessId: ID, includeRemoved: { type: 'boolean', default: false } },
      required: ['businessId'],
    });
    expect(list?.output).toMatchObject({
      type: 'object',
      required: ['customers'],
      properties: {
        customers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'businessId', 'name', 'createdAt', 'updatedAt'],
            properties: { id: ID, name: { type: 'string', minLength: 1, maxLength: 120 } },
          },
        },
      },
    });
  });

  it('carries the base fields as required in every operation', () => {
    for (const { name, kind, input } of contractJsonSchemas(customersContract)) {
      expect(input.required, name).toContain('businessId');
      if (kind === 'command') {
        expect(input.required, name).toContain('commandId');
      } else {
        expect(input.required, name).not.toContain('commandId');
      }
    }
  });

  it('is plain data: it survives JSON and is detached from the contract', () => {
    const schemas = contractJsonSchemas(customersContract);
    expect(JSON.parse(JSON.stringify(schemas))).toEqual(schemas);
    const remove = schemas[1];
    expect(remove?.access).toEqual(customersContract['customers.remove'].access);
    expect(remove?.access).not.toBe(customersContract['customers.remove'].access);
    expect(remove?.access.rights).not.toBe(customersContract['customers.remove'].access.rights);
    // An operation without rights gets none, not an empty list.
    expect(schemas[0]?.access).toEqual({ feature: 'customers', level: 'operate' });
    expect(schemas[0]?.access).not.toHaveProperty('rights');
  });

  it('expresses the field schemas of the platform', () => {
    const row = z.object({
      id: IdSchema,
      quantity: QuantitySchema,
      unit: PLATFORM_UNITS.schema,
      pricePer1000: RappenSchema,
      day: LocalDateSchema,
      at: IsoDateTimeSchema,
      month: YearMonthSchema,
      share: BpsSchema,
      currency: CurrencyCodeSchema,
      weekday: WeekdaySchema,
      code: GtinSchema.optional(),
    });
    const { input, output } = operationJsonSchema(
      command({
        name: 'jobs.lines.add',
        summary: 'Adds a line to a report.',
        access: { feature: 'jobs', level: 'operate' },
        input: z.object({ ...commandBase, line: row }),
        output: z.object({ line: row }),
      }),
    );
    expect(input.properties).toHaveProperty('line');
    expect(output.properties?.line).toMatchObject({
      type: 'object',
      properties: {
        quantity: { type: 'number', minimum: 0 },
        unit: { type: 'string', enum: PLATFORM_UNITS.ids },
        pricePer1000: { type: 'integer' },
        day: { type: 'string', format: 'date' },
        at: { type: 'string', format: 'date-time' },
        share: { type: 'integer', minimum: 0, maximum: 10_000 },
      },
    });
    expect((output.properties?.line as { required: string[] }).required).not.toContain('code');
  });

  it('names the operation and the side when a schema cannot be expressed', () => {
    const contract: ContractFragment = {
      'customers.create': customersContract['customers.create'],
      'customers.try': loose('query', z.object({ ...queryBase, since: z.date() })),
    };
    expect(() => contractJsonSchemas(contract)).toThrow(TypeError);
    expect(() => contractJsonSchemas(contract)).toThrow(
      'Operation customers.try: the input cannot be expressed as JSON Schema (Date cannot be represented in JSON Schema)',
    );
    const lengthOf = z.string().transform((text) => text.length);
    expect(() =>
      operationJsonSchema(loose('query', z.object({ ...queryBase }), z.object({ n: lengthOf }))),
    ).toThrow(/^Operation customers\.try: the output cannot be expressed as JSON Schema \(/);
    // What Zod threw is kept as the cause.
    const thrown = thrownBy(() => operationJsonSchema(loose('query', z.bigint())));
    expect(thrown).toBeInstanceOf(TypeError);
    expect(thrown).toMatchObject({
      cause: { message: 'BigInt cannot be represented in JSON Schema' },
    });
  });

  it('reports a schema that fails with something other than an error', () => {
    // A fresh one each time: a lazy schema asks its getter only once.
    const failing = () =>
      z.lazy((): z.ZodType => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- the case under test: code that throws a text
        throw 'no schema yet';
      });
    expect(() => operationJsonSchema(loose('query', failing()))).toThrow(
      'Operation customers.try: the input cannot be expressed as JSON Schema (no schema yet)',
    );
    expect(messages(operationSchemaProblems(loose('query', failing(), failing())))).toEqual([
      'input: the input cannot be expressed as JSON Schema: no schema yet',
      'output: the output cannot be expressed as JSON Schema: no schema yet',
    ]);
  });
});

describe('operationSchemaProblems', () => {
  it('finds nothing in operations declared with command and query', () => {
    for (const operation of Object.values(customersContract)) {
      expect(operationSchemaProblems(operation), operation.name).toEqual([]);
    }
  });

  it('reports a command whose input does not require the base fields', () => {
    expect(operationSchemaProblems(loose('command', z.object({ name: z.string() })))).toEqual([
      {
        operation: 'customers.try',
        part: 'input',
        message:
          'the input of a command must require «commandId»: spread commandBase into its object schema',
      },
      {
        operation: 'customers.try',
        part: 'input',
        message:
          'the input of a command must require «businessId»: spread commandBase into its object schema',
      },
    ]);
    // The base of a query is not enough for a command.
    expect(messages(operationSchemaProblems(loose('command', z.object({ ...queryBase }))))).toEqual(
      [
        'input: the input of a command must require «commandId»: spread commandBase into its object schema',
      ],
    );
    // A field that may be left out is not required.
    const optional = z.object({ ...commandBase, commandId: IdSchema.optional() });
    expect(operationSchemaProblems(loose('command', optional))).toHaveLength(1);
    const withDefault = z.object({ ...commandBase }).partial();
    expect(operationSchemaProblems(loose('command', withDefault))).toHaveLength(2);
  });

  it('reports a query whose input does not require the business', () => {
    expect(operationSchemaProblems(loose('query', z.object({ text: z.string() })))).toEqual([
      {
        operation: 'customers.try',
        part: 'input',
        message:
          'the input of a query must require «businessId»: spread queryBase into its object schema',
      },
    ]);
    expect(operationSchemaProblems(loose('query', z.object({ ...queryBase })))).toEqual([]);
    // A query needs no commandId, and may carry one.
    expect(operationSchemaProblems(loose('query', z.object({ ...commandBase })))).toEqual([]);
  });

  it('reports an input that may be left out as a whole', () => {
    // JSON Schema shows the object and its required fields; that the call may send nothing at
    // all is only known to the schema itself.
    const optional = z.object({ ...commandBase }).optional();
    expect(operationJsonSchema(loose('command', optional)).input.required).toEqual([
      'commandId',
      'businessId',
    ]);
    expect(operationSchemaProblems(loose('command', optional))).toEqual([
      {
        operation: 'customers.try',
        part: 'input',
        message:
          'the input must not take a call that sends nothing: remove .optional() or .default() around the whole input',
      },
    ]);
    const ids = z.object({ ...queryBase });
    const withDefault = ids.default({ businessId: IdSchema.parse(SOME_ID) });
    expect(messages(operationSchemaProblems(loose('query', withDefault)))).toEqual([
      'input: the input must not take a call that sends nothing: remove .optional() or .default() around the whole input',
    ]);
    // After the base fields, if both are wrong.
    expect(
      operationSchemaProblems(loose('query', z.object({ text: z.string() }).optional())),
    ).toMatchObject([
      { message: expect.stringContaining('must require «businessId»') as unknown },
      { message: expect.stringContaining('sends nothing') as unknown },
    ]);
    // «Or null» is a branch of a choice and found there; an empty object is not nothing.
    expect(operationSchemaProblems(loose('query', ids.nullable()))).toHaveLength(1);
    expect(operationSchemaProblems(loose('query', ids.partial()))).toHaveLength(1);
  });

  it('reports an input that cannot say without waiting whether it takes nothing', () => {
    const waiting = z.preprocess((value) => Promise.resolve(value), z.object({ ...commandBase }));
    expect(messages(operationSchemaProblems(loose('command', waiting)))).toEqual([
      'input: the input could not be tried with nothing: Encountered Promise during synchronous parse. Use .parseAsync() instead.',
    ]);
  });

  it('reports an input that is no object at all', () => {
    expect(operationSchemaProblems(loose('query', z.string()))).toHaveLength(1);
    expect(notRequired(loose('query', z.string()))).toEqual(['businessId']);
    expect(
      operationSchemaProblems(loose('query', z.array(z.object({ ...queryBase })))),
    ).toHaveLength(1);
    // What takes anything requires nothing, and takes nothing too.
    expect(notRequired(loose('query', z.unknown()))).toEqual(['businessId']);
    expect(notRequired(loose('command', z.unknown()))).toEqual(['commandId', 'businessId']);
    expect(operationSchemaProblems(loose('command', z.unknown()))).toHaveLength(3);
  });

  it('looks into every branch of a choice', () => {
    const byName = z.object({ ...commandBase, name: z.string() });
    const byNumber = z.object({ ...commandBase, number: z.number() });
    expect(operationSchemaProblems(loose('command', z.union([byName, byNumber])))).toEqual([]);
    // One branch without the business: a caller could pick it.
    const without = z.object({ commandId: IdSchema, number: z.number() });
    expect(messages(operationSchemaProblems(loose('command', z.union([byName, without]))))).toEqual(
      [
        'input: the input of a command must require «businessId»: spread commandBase into its object schema',
      ],
    );
    // A choice by a tag is a `oneOf`.
    const tagged = z.discriminatedUnion('by', [
      byName.extend({ by: z.literal('name') }),
      byNumber.extend({ by: z.literal('number') }),
    ]);
    expect(operationJsonSchema(loose('command', tagged)).input).toHaveProperty('oneOf');
    expect(operationSchemaProblems(loose('command', tagged))).toEqual([]);
    const taggedWithout = z.discriminatedUnion('by', [
      byName.extend({ by: z.literal('name') }),
      without.extend({ by: z.literal('number') }),
    ]);
    expect(operationSchemaProblems(loose('command', taggedWithout))).toHaveLength(1);
    // «Or nothing» is a branch too.
    expect(
      operationSchemaProblems(loose('query', z.object({ ...queryBase }).nullable())),
    ).toHaveLength(1);
  });

  it('looks into both parts of a combination', () => {
    const base = z.object({ ...commandBase });
    const extras = z.record(z.string(), z.unknown());
    expect(operationJsonSchema(loose('command', base.and(extras))).input).toHaveProperty('allOf');
    expect(operationSchemaProblems(loose('command', base.and(extras)))).toEqual([]);
    expect(operationSchemaProblems(loose('command', extras.and(base)))).toEqual([]);
    // Neither part asks for the fields.
    expect(operationSchemaProblems(loose('command', extras.and(extras)))).toHaveLength(2);
    // A combination of two choices: one part has the base in every branch.
    const both = z
      .union([base, base.extend({ name: z.string() })])
      .and(z.union([z.object({ a: z.string() }), z.object({ b: z.string() })]));
    expect(operationSchemaProblems(loose('command', both))).toEqual([]);
  });

  it('follows references inside the document', () => {
    // A schema registered under an id is referred to, not written out.
    const registered = z.object({ ...commandBase, name: z.string() }).meta({ id: 'CreateInput' });
    expect(operationJsonSchema(loose('command', registered)).input).toMatchObject({
      $ref: '#/$defs/CreateInput',
    });
    expect(operationSchemaProblems(loose('command', registered))).toEqual([]);
    // An id with the two characters a JSON Pointer escapes.
    const odd = z.object({ ...commandBase }).meta({ id: 'customers/create~input' });
    expect(operationJsonSchema(loose('command', odd)).input.$ref).toBe(
      '#/$defs/customers~1create~0input',
    );
    expect(operationSchemaProblems(loose('command', odd))).toEqual([]);
    // An id that holds «~1» as written: the tilde is unescaped last, or it would turn into «/».
    const tilde = z.object({ ...commandBase }).meta({ id: 'input~1' });
    expect(operationJsonSchema(loose('command', tilde)).input.$ref).toBe('#/$defs/input~01');
    expect(operationSchemaProblems(loose('command', tilde))).toEqual([]);
    const registeredWithout = z.object({ name: z.string() }).meta({ id: 'OtherInput' });
    expect(operationSchemaProblems(loose('command', registeredWithout))).toHaveLength(2);
    // A tree refers to itself further down; its root still carries the business.
    interface Node {
      businessId: string;
      children: Node[];
    }
    const node: z.ZodType<Node> = z.lazy(() =>
      z.object({ businessId: IdSchema, children: z.array(node) }),
    );
    expect(operationSchemaProblems(loose('query', node))).toEqual([]);
  });

  it('reads a definition again for every branch that refers to it', () => {
    const shared = z.object({ ...commandBase }).meta({ id: 'SharedBase' });
    const choice = z.union([
      shared.and(z.object({ name: z.string() })),
      shared.and(z.object({ number: z.number() })),
    ]);
    expect(operationJsonSchema(loose('command', choice)).input).toMatchObject({
      anyOf: [
        { allOf: [{ $ref: '#/$defs/SharedBase' }, { required: ['name'] }] },
        { allOf: [{ $ref: '#/$defs/SharedBase' }, { required: ['number'] }] },
      ],
    });
    // The second branch gets the same answer as the first, not «seen already».
    expect(operationSchemaProblems(loose('command', choice))).toEqual([]);
    expect(operationSchemaProblems(loose('command', z.union([shared, shared])))).toEqual([]);
  });

  it('takes a choice without branches as requiring nothing', () => {
    const empty = z.unknown().meta({ anyOf: [] });
    expect(operationJsonSchema(loose('query', empty)).input).toMatchObject({ anyOf: [] });
    expect(notRequired(loose('query', empty))).toEqual(['businessId']);
  });

  it('does not run in circles on a schema that refers to itself', () => {
    const self: z.ZodType = z.lazy(() => z.union([self, z.object({ ...queryBase })]));
    expect(operationJsonSchema(loose('query', self)).input).toMatchObject({
      anyOf: [{ $ref: '#' }, { type: 'object' }],
    });
    // The reference back adds no requirement of its own, so the choice does not require it.
    expect(notRequired(loose('query', self))).toEqual(['businessId']);
    // Zod itself runs in circles on such a schema; that is reported, not thrown.
    expect(messages(operationSchemaProblems(loose('query', self)))[1]).toMatch(
      /^input: the input could not be tried with nothing: /,
    );
  });

  it('does not follow a reference out of the document', () => {
    const elsewhere = z.unknown().meta({ $ref: 'https://example.invalid/input.json' });
    expect(operationJsonSchema(loose('query', elsewhere)).input.$ref).toBe(
      'https://example.invalid/input.json',
    );
    expect(notRequired(loose('query', elsewhere))).toEqual(['businessId']);
    const missing = z.unknown().meta({ $ref: '#/$defs/Nowhere' });
    expect(notRequired(loose('query', missing))).toEqual(['businessId']);
    // A reference elsewhere whose end is the id of a definition here is still one elsewhere.
    const shared = z.object({ ...queryBase }).meta({ id: 'SharedBase' });
    const lookalike = z.object({ nested: shared.optional() }).meta({ $ref: 'other://SharedBase' });
    expect(operationJsonSchema(loose('query', lookalike)).input).toMatchObject({
      $ref: 'other://SharedBase',
      $defs: { SharedBase: { required: ['businessId'] } },
    });
    expect(operationSchemaProblems(loose('query', lookalike))).toHaveLength(1);
  });

  it.each([
    ['a date object', z.object({ ...commandBase, since: z.date() }), 'Date cannot be represented'],
    ['a big integer', z.object({ ...commandBase, n: z.bigint() }), 'BigInt cannot be represented'],
    ['a map', z.object({ ...commandBase, m: z.map(z.string(), z.string()) }), 'Map cannot be'],
  ])('reports an input with %s once, without guessing at its fields', (_what, input, reason) => {
    const problems = operationSchemaProblems(loose('command', input));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ operation: 'customers.try', part: 'input' });
    expect(problems[0]?.message).toContain('the input cannot be expressed as JSON Schema: ');
    expect(problems[0]?.message).toContain(reason);
  });

  it('reports an output JSON cannot carry, so no result is lost in the command log', () => {
    const input = z.object({ ...commandBase });
    const lengthOf = z.string().transform((text) => text.length);
    expect(messages(operationSchemaProblems(loose('command', input, z.void())))).toEqual([
      'output: the output cannot be expressed as JSON Schema: Void cannot be represented in JSON Schema',
    ]);
    expect(
      operationSchemaProblems(loose('command', input, z.object({ n: lengthOf }))),
    ).toMatchObject([{ part: 'output' }]);
    // A transform is fine in an input: what the caller sends is still plain data.
    expect(
      operationSchemaProblems(loose('command', z.object({ ...commandBase, n: lengthOf }))),
    ).toEqual([]);
    // Both sides at once.
    expect(
      operationSchemaProblems(loose('command', z.date(), z.undefined())).map(({ part }) => part),
    ).toEqual(['input', 'output']);
  });

  it('is a second check: the form of these operations is fine', () => {
    expect(operationProblems(loose('command', z.object({ name: z.string() })))).toEqual([]);
    expect(operationProblems(loose('query', z.string(), z.void()))).toEqual([]);
  });

  it('reports a broken form instead of failing on it or passing it', () => {
    const input = z.object({ ...commandBase });
    // Neither a command nor a query: there are no base fields to ask for.
    const otherKind = { ...loose('command', input), kind: 'mutation' } as unknown as Operation;
    expect(messages(operationSchemaProblems(otherKind))).toEqual([
      'kind: kind must be «command» or «query», got «mutation»',
    ]);
    // Nothing to convert.
    const noSchemas = {
      ...loose('command', input),
      input: { type: 'object', required: ['commandId', 'businessId'] },
      output: undefined,
    } as unknown as Operation;
    expect(operationSchemaProblems(noSchemas)).toEqual(operationProblems(noSchemas));
    expect(operationSchemaProblems(noSchemas).map(({ part }) => part)).toEqual(['input', 'output']);
    expect(operationSchemaProblems(null as unknown as Operation)).toEqual([
      { operation: '?', part: 'operation', message: 'expected an operation, got null' },
    ]);
    expect(operationSchemaProblems({} as unknown as Operation).length).toBeGreaterThan(0);
    // The form comes first: the schemas are looked at once it is right.
    const twoThings = { ...loose('command', z.object({ name: z.string() })), summary: '' };
    expect(operationSchemaProblems(twoThings).map(({ part }) => part)).toEqual(['summary']);
    expect(
      operationSchemaProblems({ ...twoThings, summary: 'Tries a schema.' }).map(({ part }) => part),
    ).toEqual(['input', 'input']);
  });

  it('does not pass a query that reads the device and no business', () => {
    // Written without the helper, which asks for the business by type. Its form is fine and it
    // can stand in a fragment; only this check reports it, until the order that needs such a
    // query decides how one is declared.
    const listBusinesses = {
      name: 'device.businesses.list',
      kind: 'query',
      summary: 'Lists the businesses on this device.',
      access: { feature: 'device', level: 'view' },
      input: z.object({}),
      output: z.object({ businessIds: z.array(IdSchema) }),
    } as const satisfies QueryOperation;
    const fragment = { 'device.businesses.list': listBusinesses } as const;
    expectTypeOf<QueryNames<typeof fragment>>().toEqualTypeOf<'device.businesses.list'>();
    expect(fragmentProblems(fragment)).toEqual([]);
    expect(messages(operationSchemaProblems(listBusinesses))).toEqual([
      'input: the input of a query must require «businessId»: spread queryBase into its object schema',
    ]);
  });

  it('does not pass an input that carries bytes', () => {
    // A file travels as bytes, and bytes have no JSON Schema: open until files go through an
    // operation.
    const bytes = z.instanceof(Uint8Array);
    const store = loose('command', z.object({ ...commandBase, bytes }));
    expect(operationProblems(store)).toEqual([]);
    expect(messages(operationSchemaProblems(store))).toEqual([
      'input: the input cannot be expressed as JSON Schema: Custom types cannot be represented in JSON Schema',
    ]);
  });

  it('agrees with the types of command and query', () => {
    // What compiles through the helpers has the base fields, whatever else it carries.
    const operation = query({
      name: 'customers.search',
      summary: 'Finds customers by a part of their name.',
      access: { feature: 'customers', level: 'view' },
      input: z.object({ ...queryBase, text: z.string().trim().min(1) }),
      output: z.object({ ids: z.array(IdSchema) }),
    });
    expect(operationSchemaProblems(operation)).toEqual([]);
  });
});
