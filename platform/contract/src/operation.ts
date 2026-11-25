// Origin: BanioX/Randen packages/core/src/contract/operation.ts @ e0f0907 — adapted: access (feature, level, rights) instead of scopes; one technical summary instead of two languages; base fields required by type; name pattern; import paths
import { IdSchema, type Id } from '@onestrand/core';
import type { z } from 'zod';

/**
 * How far a person may go inside one function of the app, lowest first: `view` reads, `operate`
 * does the daily work, `manage` sets it up. «Nothing» is not a level an operation can ask for:
 * whoever may call an operation at all has at least `view`.
 */
export const ACCESS_LEVELS = ['view', 'operate', 'manage'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/**
 * What a person needs to call an operation. It is data at the operation, not code in a screen:
 * one wrapper around the use cases enforces it, and the same data later filters what is sent to
 * another device.
 */
export interface OperationAccess {
  /** Id of the function in the feature register, e.g. `customers` or `facility.keys`. */
  feature: string;
  level: AccessLevel;
  /** Delicate rights the person needs on top of the level, e.g. `wages` or `export_delete`. */
  rights?: readonly string[];
}

/**
 * The name of an operation: `<namespace>.<verb>` or `<namespace>.<area>.<verb>`, two to four
 * segments joined by a dot. A segment starts with a lower-case letter and holds letters and
 * digits only: `customers.create`, `facility.keys.issue`.
 */
export const OPERATION_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*){1,3}$/;

/**
 * The id of a function in the feature register: one or two segments, each lower-case letters,
 * digits and single underscores starting with a letter, joined by a dot. One segment is a
 * function of the platform (`customers`, `team_time`); two are a function of an industry, the
 * first segment being its namespace (`facility.keys`, suite ADR-0004). `@onestrand/features`
 * builds its register on this form, so `access.feature` and the register cannot drift apart.
 */
export const FEATURE_ID_PATTERN =
  /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*(?:\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*)?$/;

/**
 * One operation of the contract (suite ADR-0009; ADR-0005 of the origin): a named command or
 * query with Zod schemas for input and output. The app calls exactly these; the same schemas can
 * later generate a REST API and tools for AI assistants.
 */
export interface Operation<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
> {
  /** See `OPERATION_NAME_PATTERN`. The key of the operation in its fragment equals the name. */
  name: string;
  kind: 'command' | 'query';
  /**
   * What the operation does, in English and for a technical reader: it becomes the description
   * of an API endpoint or of a tool. It is never shown in the app; texts of the app live in the
   * language catalogues.
   */
  summary: string;
  /** Required: an operation that does not say what it needs must not typecheck. */
  access: OperationAccess;
  input: TInput;
  output: TOutput;
}

/** An operation that changes data. */
export type CommandOperation<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
> = Operation<TInput, TOutput> & { kind: 'command' };

/** An operation that only reads. */
export type QueryOperation<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
> = Operation<TInput, TOutput> & { kind: 'query' };

/** Every command: an id that makes repeating it harmless, and the business it changes. */
export const commandBase = { commandId: IdSchema, businessId: IdSchema };
/** Every query: the business it reads. */
export const queryBase = { businessId: IdSchema };

/** The base fields of a command once its input is parsed. */
export interface CommandBase {
  commandId: Id;
  businessId: Id;
}
/** The base field of a query once its input is parsed. */
export interface QueryBase {
  businessId: Id;
}

/**
 * Declares a command. The input schema must carry the base fields (spread `commandBase` into
 * it): a command without a `commandId` could not be repeated safely, and one without a
 * `businessId` would belong to no business.
 */
export function command<TInput extends z.ZodType<CommandBase>, TOutput extends z.ZodType>(
  operation: Omit<Operation<TInput, TOutput>, 'kind'>,
): CommandOperation<TInput, TOutput> {
  return { ...operation, kind: 'command' };
}

/** Declares a query. The input schema must carry `businessId` (spread `queryBase` into it). */
export function query<TInput extends z.ZodType<QueryBase>, TOutput extends z.ZodType>(
  operation: Omit<Operation<TInput, TOutput>, 'kind'>,
): QueryOperation<TInput, TOutput> {
  return { ...operation, kind: 'query' };
}

/**
 * A part of the contract owned by one module or one industry: its operations by name. The sum
 * of all fragments is put together per edition; no fixed sum lives in the platform.
 */
export type ContractFragment = Readonly<Record<string, Operation>>;
