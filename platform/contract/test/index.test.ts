import { describe, expect, it } from 'vitest';
import * as contract from '../src';

/**
 * The public surface, name by name. The storage and every module build on it: a name that
 * disappears or appears here is a decision, not an accident. Types are not listed; `tsc` guards
 * them where they are used.
 */
describe('@onestrand/contract', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(contract).sort()).toEqual([
      'ACCESS_LEVELS',
      'COMPOSE_PROBLEM_CODES',
      'CommandError',
      'ComposeError',
      'DomainEventSchema',
      'FEATURE_ID_PATTERN',
      'NAMESPACED_ERROR_CODE_PATTERN',
      'OPERATION_NAME_PATTERN',
      'PLATFORM_ERROR_CODES',
      'RIGHT_ID_PATTERN',
      'assertOperation',
      'command',
      'commandBase',
      'composeContract',
      'composeProblems',
      'contractJsonSchemas',
      'createCommandKit',
      'fragmentProblems',
      'isCommandErrorCode',
      'operationJsonSchema',
      'operationProblems',
      'operationSchemaProblems',
      'query',
      'queryBase',
    ]);
  });

  it('holds no fixed sum of operations: the contract of an edition is put together later', () => {
    const fixed = Object.entries(contract).filter(
      ([, value]) =>
        typeof value === 'object' && Object.values(value).some((entry) => 'kind' in Object(entry)),
    );
    expect(fixed).toEqual([]);
  });
});
