import type { Clock, IdGenerator } from '@onestrand/contract';
import { addDays, type Id } from '@onestrand/core';
import type { FeatureRegistry } from '@onestrand/features';
import type { AnyUseCases } from '@onestrand/manifest';
import { musterDemo, STAFF_PROFILE } from './content';
import { KEEPS_JOURNAL_QUESTION, MUSTER } from './entries';

/**
 * Lays out the demo business of `muster` through the operations of the contract, as a person
 * would with the app: nothing is written past the use cases, so the demo passes the same guard,
 * the same schemas and the same events as real work. The demo of the manifest says what the
 * business is called and which kind it is; what it holds beyond that is made here.
 *
 * Call it on a running edition that has `muster` (`startEdition(…).useCases`), started with a
 * fresh `actor`: `business.create` makes that person the owner of the new business.
 */

/** What laying out the demo needs besides the use cases. */
export interface DemoPorts {
  readonly ids: IdGenerator;
  readonly clock: Clock;
  /** The register of functions of the edition: the demo starts with the usual extent. */
  readonly features: FeatureRegistry;
}

/**
 * The entries of the demo journal, counted back from today. The titles are typed data of the
 * invented business, made-up names like «Betrieb Muster»: never a text of the app, never
 * translated (suite ADR-0007, getippte Daten).
 */
export const MUSTER_DEMO_ENTRIES = [
  { daysAgo: 1, title: 'Eintrag Muster' },
  { daysAgo: 0, title: 'Eintrag Beispiel' },
] as const;

/** The made-up letterhead of the demo business. */
export const MUSTER_DEMO_LETTERHEAD = {
  name: musterDemo.businessName,
  street: 'Musterweg 12',
  postalCode: '8000',
  city: 'Beispielstadt',
  country: 'CH',
} as const;

export async function layOutMusterDemo(
  useCases: AnyUseCases,
  ports: DemoPorts,
): Promise<{ readonly businessId: Id }> {
  const call = (name: string, input: Readonly<Record<string, unknown>>): Promise<unknown> => {
    const useCase = useCases[name];
    if (useCase === undefined) {
      return Promise.reject(
        new TypeError(`The edition has no operation ${name}: is "${MUSTER}" one of its parts?`),
      );
    }
    return useCase({ commandId: ports.ids.next(), ...input });
  };
  const businessId = ports.ids.next();
  const { usual } = ports.features.propose({
    kinds: musterDemo.kinds,
    answers: { [KEEPS_JOURNAL_QUESTION]: ['yes'] },
  });
  await call('business.create', {
    businessId,
    name: musterDemo.businessName,
    ownerName: musterDemo.ownerName,
    industries: [MUSTER],
    kinds: musterDemo.kinds,
    features: usual,
  });
  await call('business.update', { businessId, canton: 'ZH', letterhead: MUSTER_DEMO_LETTERHEAD });
  for (const name of musterDemo.people) {
    await call('business.people.add', { businessId, name, profile: STAFF_PROFILE });
  }
  const today = ports.clock.today();
  for (const { daysAgo, title } of MUSTER_DEMO_ENTRIES) {
    await call('muster.entries.add', { businessId, on: addDays(today, -daysAgo), title });
  }
  return { businessId };
}
