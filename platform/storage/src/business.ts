import { IdSchema, IsoDateTimeSchema, nameSchema } from '@onestrand/core';
import { z } from 'zod';

/**
 * The least a business is, for the storage: an id, a name and its two time stamps. A device
 * holds several businesses (suite ADR-0005, 8), and every row, event, file and entry of the
 * command log belongs to exactly one of them.
 *
 * The schema is loose on purpose: fields it does not name are kept as they are. The full model
 * of a business (currency, settings, switched-on functions) belongs to the business module,
 * which extends this schema; the storage must carry such a row without knowing it.
 */
export const BusinessBaseSchema = z.looseObject({
  id: IdSchema,
  name: nameSchema(120),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type BusinessBase = z.infer<typeof BusinessBaseSchema>;
