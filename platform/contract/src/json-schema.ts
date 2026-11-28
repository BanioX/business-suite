// Origin: BanioX/Randen packages/core/src/contract/index.ts @ e0f0907 — adapted: only the JSON Schemas, as a function of any contract instead of the fixed sum; access instead of scopes; a schema JSON cannot carry is named with its operation; the check of the schemas of an operation is new
import { z } from 'zod';
import { operationProblems, type OperationProblem } from './conformity';
import type { ContractFragment, Operation, OperationAccess } from './operation';

/** A JSON Schema (draft 2020-12) as plain data. */
export type JsonSchema = z.core.JSONSchema.JSONSchema;

/** One operation as plain data: what an API document and a tool definition are built from. */
export interface OperationJsonSchema {
  name: string;
  kind: 'command' | 'query';
  summary: string;
  access: OperationAccess;
  /** What a caller sends: fields with a default are optional here. */
  input: JsonSchema;
  /** What a caller gets back. */
  output: JsonSchema;
}

type Side = 'input' | 'output';

/** Throws whatever Zod throws for a schema JSON cannot carry (a date object, a transform). */
function sideJsonSchema(operation: Operation, side: Side): JsonSchema {
  return side === 'input'
    ? z.toJSONSchema(operation.input, { io: 'input' })
    : z.toJSONSchema(operation.output);
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * One operation with the JSON Schemas of its input and output. Throws a `TypeError` that names
 * the operation and the side if a schema holds something JSON cannot carry.
 */
export function operationJsonSchema(operation: Operation): OperationJsonSchema {
  const schemaOf = (side: Side): JsonSchema => {
    try {
      return sideJsonSchema(operation, side);
    } catch (error) {
      throw new TypeError(
        `Operation ${operation.name}: the ${side} cannot be expressed as JSON Schema (${reasonOf(error)})`,
        { cause: error },
      );
    }
  };
  const { feature, level, rights } = operation.access;
  return {
    name: operation.name,
    kind: operation.kind,
    summary: operation.summary,
    // A copy: the description is data of its own and cannot change the contract.
    access: rights === undefined ? { feature, level } : { feature, level, rights: [...rights] },
    input: schemaOf('input'),
    output: schemaOf('output'),
  };
}

/**
 * JSON Schema of every operation of a contract, in the order of the contract: what an OpenAPI
 * document and tool definitions are built from (suite ADR-0009; ADR-0005 of the origin: one
 * schema, several formats).
 */
export function contractJsonSchemas(contract: ContractFragment): OperationJsonSchema[] {
  return Object.values(contract).map(operationJsonSchema);
}

/** The fields the input of every operation of a kind must require. */
const BASE_FIELDS = {
  command: ['commandId', 'businessId'],
  query: ['businessId'],
} as const;

const DEFS = '#/$defs/';

/**
 * The schema a reference points to, if it is a definition of the same document
 * (`#/$defs/<id>`). A reference to the document itself (`#`) is not looked up: whenever one is
 * met the root is being looked at, and a reference back adds nothing. A reference out of the
 * document is not followed.
 */
function referenced(root: JsonSchema, ref: string): JsonSchema | undefined {
  if (!ref.startsWith(DEFS)) {
    return undefined;
  }
  // The id is a segment of a JSON Pointer (RFC 6901): «~1» stands for «/», «~0» for «~».
  return root.$defs?.[ref.slice(DEFS.length).replaceAll('~1', '/').replaceAll('~0', '~')];
}

/**
 * True if the JSON Schema demands the field of whatever it accepts: the field is `required`
 * here, in a schema this one refers to, in one part of an `allOf`, or in every branch of an
 * `anyOf` or `oneOf`. A choice without branches and a reference back into a schema that is being
 * looked at demand nothing: in doubt the answer is no, and the operation is reported.
 */
function requiresField(root: JsonSchema, field: string): boolean {
  // The schemas being looked at right now: a reference back into one of them adds nothing.
  const open = new Set<JsonSchema>();
  const requires = (schema: JsonSchema): boolean => {
    if (open.has(schema)) {
      return false;
    }
    open.add(schema);
    const target = schema.$ref === undefined ? undefined : referenced(root, schema.$ref);
    const found =
      schema.required?.includes(field) === true ||
      (target !== undefined && requires(target)) ||
      schema.allOf?.some(requires) === true ||
      [schema.anyOf, schema.oneOf].some(
        (branches) => branches !== undefined && branches.length > 0 && branches.every(requires),
      );
    open.delete(schema);
    return found;
  };
  return requires(root);
}

/**
 * What is wrong with an input that is tried with nothing at all, if anything. JSON Schema cannot
 * say that the whole input may be left out (`.optional()` or `.default()` around it), so the
 * schema itself is asked. One that cannot answer is reported too, not passed.
 */
function nothingProblem(input: z.ZodType): string | undefined {
  try {
    return input.safeParse(undefined).success
      ? 'the input must not take a call that sends nothing: remove .optional() or .default() around the whole input'
      : undefined;
  } catch (error) {
    return `the input could not be tried with nothing: ${reasonOf(error)}`;
  }
}

/**
 * What is wrong with the schemas of an operation, beyond their presence: a schema JSON cannot
 * carry (the contract could not be published, and a result could not be kept in the command
 * log), an input that does not require the base fields of its kind (`commandId` and
 * `businessId` for a command, `businessId` for a query), and an input that may be left out as a
 * whole. This converts both schemas, so it belongs in tests, not at the start of the app.
 *
 * Two kinds of operation do not pass today, and the order that first needs one decides how it
 * is declared: a query that reads the device and no business (the list of businesses on it), and
 * an input that carries bytes (a file), which have no JSON Schema here. See rule 11 of `api.md`.
 *
 * The schemas of something that is not an operation cannot be judged: a value whose form is
 * broken comes back with the problems `operationProblems` finds, and its schemas are looked at
 * once the form is right. So the check never throws and never passes what it could not read.
 */
export function operationSchemaProblems(operation: Operation): OperationProblem[] {
  const form = operationProblems(operation);
  if (form.length > 0) {
    return form;
  }
  const problems: OperationProblem[] = [];
  const problem = (part: Side, message: string) => {
    problems.push({ operation: operation.name, part, message });
  };
  /** The JSON Schema of a side; if it has none, that is reported and nothing comes back. */
  const schemaOf = (side: Side): JsonSchema | undefined => {
    try {
      return sideJsonSchema(operation, side);
    } catch (error) {
      problem(side, `the ${side} cannot be expressed as JSON Schema: ${reasonOf(error)}`);
      return undefined;
    }
  };
  const input = schemaOf('input');
  if (input !== undefined) {
    for (const field of BASE_FIELDS[operation.kind]) {
      if (!requiresField(input, field)) {
        problem(
          'input',
          `the input of a ${operation.kind} must require «${field}»: spread ${operation.kind}Base into its object schema`,
        );
      }
    }
    const nothing = nothingProblem(operation.input);
    if (nothing !== undefined) {
      problem('input', nothing);
    }
  }
  // The output only has to be expressible; it has no base fields.
  schemaOf('output');
  return problems;
}
