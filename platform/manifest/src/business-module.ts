import {
  BUSINESS_EVENT_TYPES,
  businessContract,
  businessFeatureEntries,
  businessRightEntries,
  businessTables,
  createBusinessUseCases,
} from '@onestrand/business';
import { defineModule } from './part';

/**
 * The module every edition has: the business, its people and its functions. The edition puts it
 * first, so the guard of the use cases has a source (`createAccessSource` reads the businesses and
 * the people it holds) and the backup has the schema of the business row. Nobody lists it in
 * `modules`; listing it again is a `duplicate_part`.
 */
export const businessModule = defineModule({
  id: 'business',
  tables: businessTables,
  contract: businessContract,
  useCases: ({ ctx, features, rights }) => createBusinessUseCases(ctx, { features, rights }),
  catalog: businessFeatureEntries,
  rights: businessRightEntries,
  events: BUSINESS_EVENT_TYPES,
});
