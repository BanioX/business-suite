// Origin: BanioX/Randen packages/core/src/contract/events.ts @ e0f0907 — adapted: import paths, comments
import { IdSchema, IsoDateTimeSchema } from '@onestrand/core';
import { z } from 'zod';

/**
 * A domain event (suite ADR-0009; ADR-0005 of the origin): the fact that something changed, with
 * who and when. Every command appends at least one. The type is `<thing>.<what_happened>` in the
 * past tense (`customer.created`, `facility_key.issued`), the payload carries ids and small
 * facts, never whole rows and never files.
 */
export const DomainEventSchema = z.object({
  id: IdSchema,
  type: z.string().regex(/^[a-z][a-z_]*\.[a-z][a-z_]*$/, 'Expected thing.what_happened'),
  version: z.literal(1),
  businessId: IdSchema,
  actor: IdSchema,
  at: IsoDateTimeSchema,
  payload: z.record(z.string(), z.unknown()),
});
export type DomainEvent = z.infer<typeof DomainEventSchema>;
