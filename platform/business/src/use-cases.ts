import {
  NO_ACCESS_PROFILE,
  OWNER_PROFILE,
  profileChangeProblems,
  profileProblems,
  type Profile,
} from '@onestrand/access';
import {
  CommandError,
  createCommandKit,
  type CommandContext,
  type UseCasesOf,
} from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import { optionAccepts, type FeatureRegistry } from '@onestrand/features';
import { alive, requireRow, type BusinessStore, type ModuleStorage } from '@onestrand/storage';
import { businessContract } from './contract';
import { isRecord, unknownFields, withUnknownIds } from './loose';
import {
  BankAccountSchema,
  BusinessSchema,
  LetterheadSchema,
  peopleTable,
  type Business,
  type Person,
} from './model';
import { leavesNoOwner, profileOfActor } from './people';

/**
 * What the use cases of the business need from the storage: its tables, files, logs and
 * transaction (`ModuleStorage`) and the businesses of the device with the full model.
 */
export type BusinessStorage = ModuleStorage & { readonly businesses: BusinessStore<Business> };

/** The context of a command, with a storage that holds businesses and people. */
export type BusinessContext = CommandContext & { readonly storage: BusinessStorage };

/**
 * The registers the use cases ask: which functions, kinds and industries exist (and what a
 * function needs and offers), and which delicate rights exist. A `FeatureRegistry` and a
 * `RightRegistry` fit.
 */
export interface BusinessRegisters {
  readonly features: FeatureRegistry;
  readonly rights: { has(id: string): boolean };
}

const LETTERHEAD_FIELDS = Object.keys(LetterheadSchema.shape);
const BANK_FIELDS = Object.keys(BankAccountSchema.shape);

const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * The use cases of the business and its people. They are as strict as the contract and the
 * registers say, and as loose as a stored row may be: what a newer version wrote (fields,
 * functions, options, kinds) is kept when a row is written back, and nothing is checked against
 * the register that a person did not just ask for.
 *
 * The rights of the person acting are the business of the guard (`guardUseCases` of
 * `@onestrand/access`, fed by `createAccessSource`). What the use cases enforce themselves is
 * what no guard can see: that a profile does not give or take more than the person acting holds,
 * and that the business keeps an owner.
 */
export function createBusinessUseCases(
  ctx: BusinessContext,
  { features, rights }: BusinessRegisters,
): UseCasesOf<typeof businessContract> {
  const { storage, ids, clock, actor } = ctx;
  const { emit, runCommand, stamps } = createCommandKit(ctx);
  const people = storage.table(peopleTable);
  const industryIds: ReadonlySet<string> = new Set(features.industries.map(({ id }) => id));
  const kindIds: ReadonlySet<string> = new Set(features.kinds.map(({ id }) => id));
  const known = { features, rights };

  async function readBusiness(businessId: Id): Promise<Business> {
    const row = await storage.businesses.get(businessId);
    if (row === undefined) {
      throw new CommandError('not_found', `Business ${businessId} not found`);
    }
    return BusinessSchema.parse(row);
  }

  /** Writes the row of the business with a new `updatedAt`; what the schema does not know stays. */
  async function writeBusiness(next: Record<string, unknown>): Promise<Business> {
    const business = BusinessSchema.parse({ ...next, updatedAt: clock.now() });
    await storage.businesses.put(business);
    return business;
  }

  function refuseUnknown(what: string, wanted: readonly string[], registered: ReadonlySet<string>) {
    const unknown = wanted.filter((id) => !registered.has(id));
    if (unknown.length > 0) {
      throw new CommandError(
        'invalid',
        `The register of functions has no ${what} ${unknown.join(', ')}`,
      );
    }
  }

  /** What stands in the way of the person acting setting the profile `current` to `next`: the rules of passing on. */
  async function passingReasons(businessId: Id, current: Profile, next: Profile) {
    const actingProfile = await profileOfActor(storage, businessId, actor);
    return profileChangeProblems(actingProfile, current, next).map((p) => `${p.code} ${p.id}`);
  }

  /** Functions and rights the registers do not know that `next` names and `current` did not (a profile of a newer version stays as it is). */
  function unknownReasons(current: Profile, next: Profile) {
    const had = new Set(profileProblems(current, known).map((p) => `${p.code} ${p.id}`));
    return profileProblems(next, known)
      .map((p) => `${p.code} ${p.id}`)
      .filter((reason) => !had.has(reason));
  }

  function refuseProfile(reasons: readonly string[]) {
    if (reasons.length > 0) {
      throw new CommandError(
        'business.profile_refused',
        `The profile cannot be set: ${reasons.join(', ')}`,
      );
    }
  }

  /** The register switches the function; what it would refuse is a mistake of the caller, told before as a `CommandError`. */
  function switched(list: readonly string[], featureId: string, on: boolean) {
    if (!features.ids.includes(featureId)) {
      throw new CommandError('invalid', `The register of functions has no function ${featureId}`);
    }
    if (features.get(featureId).core) {
      throw new CommandError(
        'not_allowed',
        `The function ${featureId} is core and is never switched`,
      );
    }
    return features.switchFeature(list, featureId, on);
  }

  async function readPerson(businessId: Id, personId: Id): Promise<Person> {
    return requireRow(people, businessId, personId, 'Person');
  }

  async function writePerson(person: Person): Promise<Person> {
    await people.put(person);
    return person;
  }

  const create = businessContract['business.create'];
  const get = businessContract['business.get'];
  const update = businessContract['business.update'];
  const switchFeature = businessContract['business.features.switch'];
  const setOption = businessContract['business.features.setOption'];
  const addPerson = businessContract['business.people.add'];
  const updatePerson = businessContract['business.people.update'];
  const setActive = businessContract['business.people.setActive'];
  const listPeople = businessContract['business.people.list'];

  return {
    'business.create': async (raw) => {
      const input = create.input.parse(raw);
      return runCommand(create, input, async () => {
        const { businessId } = input;
        if ((await storage.businesses.get(businessId)) !== undefined) {
          throw new CommandError('invalid', `Business ${businessId} exists already`);
        }
        if ((await people.get(actor)) !== undefined) {
          throw new CommandError('invalid', `Person ${actor} belongs to a business already`);
        }
        refuseUnknown('industry', input.industries, industryIds);
        refuseUnknown('kind', input.kinds, kindIds);
        const resolved = features.resolve(input.features);
        if (resolved.unknown.length > 0) {
          throw new CommandError(
            'invalid',
            `The register of functions has no function ${resolved.unknown.join(', ')}`,
          );
        }
        const business = BusinessSchema.parse({
          id: businessId,
          name: input.name,
          ...stamps(),
          industries: input.industries,
          kinds: input.kinds,
          features: resolved.features,
        });
        const owner: Person = {
          id: actor,
          businessId,
          name: input.ownerName,
          profile: OWNER_PROFILE,
          active: true,
          ...stamps(),
        };
        await storage.businesses.add(business);
        await people.add(owner);
        await emit(businessId, 'business.created', { ownerId: owner.id });
        await emit(businessId, 'person.created', { personId: owner.id, owner: true });
        return { business, owner };
      });
    },

    'business.get': async (raw) => {
      const input = get.input.parse(raw);
      return { business: await readBusiness(input.businessId) };
    },

    'business.update': async (raw) => {
      const input = update.input.parse(raw);
      return runCommand(update, input, async () => {
        const { businessId } = input;
        const stored = await readBusiness(businessId);
        const next: Record<string, unknown> = { ...stored };
        const changed: string[] = [];
        const set = (field: string, value: unknown) => {
          if (value === null) {
            Reflect.deleteProperty(next, field);
          } else {
            next[field] = value;
          }
          changed.push(field);
        };
        if (input.name !== undefined) {
          set('name', input.name);
        }
        if (input.canton !== undefined) {
          set('canton', input.canton);
        }
        if (input.vatMethod !== undefined) {
          set('vatMethod', input.vatMethod);
        }
        if (input.letterhead !== undefined) {
          set(
            'letterhead',
            input.letterhead === null
              ? null
              : { ...unknownFields(stored.letterhead, LETTERHEAD_FIELDS), ...input.letterhead },
          );
        }
        if (input.bank !== undefined) {
          set(
            'bank',
            input.bank === null
              ? null
              : { ...unknownFields(stored.bank, BANK_FIELDS), ...input.bank },
          );
        }
        if (input.industries !== undefined) {
          refuseUnknown('industry', input.industries, industryIds);
          set(
            'industries',
            withUnknownIds(input.industries, stored.industries, (id) => industryIds.has(id)),
          );
        }
        if (input.kinds !== undefined) {
          refuseUnknown('kind', input.kinds, kindIds);
          set(
            'kinds',
            withUnknownIds(input.kinds, stored.kinds, (id) => kindIds.has(id)),
          );
        }
        const business = await writeBusiness(next);
        await emit(businessId, 'business.updated', { fields: changed });
        return { business };
      });
    },

    'business.features.switch': async (raw) => {
      const input = switchFeature.input.parse(raw);
      return runCommand(switchFeature, input, async () => {
        const { businessId, featureId, on } = input;
        const stored = await readBusiness(businessId);
        const result = switched(stored.features, featureId, on);
        const business = await writeBusiness({
          ...stored,
          features: [...result.features, ...result.unknown],
        });
        await emit(businessId, 'feature.switched', {
          featureId,
          on,
          turnedOn: [...result.turnedOn],
          turnedOff: [...result.turnedOff],
        });
        return {
          business,
          turnedOn: [...result.turnedOn],
          turnedOff: [...result.turnedOff],
        };
      });
    },

    'business.features.setOption': async (raw) => {
      const input = setOption.input.parse(raw);
      return runCommand(setOption, input, async () => {
        const { businessId, featureId, key, value } = input;
        if (!features.ids.includes(featureId)) {
          throw new CommandError(
            'invalid',
            `The register of functions has no function ${featureId}`,
          );
        }
        const option = features.get(featureId).options.find((candidate) => candidate.key === key);
        if (option === undefined) {
          throw new CommandError('invalid', `The function ${featureId} has no option ${key}`);
        }
        if (!optionAccepts(option, value)) {
          throw new CommandError(
            'invalid',
            `The value does not fit the option ${featureId} ${key} (${option.type})`,
          );
        }
        const stored = await readBusiness(businessId);
        const values = stored.options[featureId];
        const business = await writeBusiness({
          ...stored,
          options: {
            ...stored.options,
            [featureId]: { ...(isRecord(values) ? values : {}), [key]: value },
          },
        });
        await emit(businessId, 'feature.option_set', { featureId, key });
        return { business };
      });
    },

    'business.people.add': async (raw) => {
      const input = addPerson.input.parse(raw);
      return runCommand(addPerson, input, async () => {
        const { businessId } = input;
        await readBusiness(businessId);
        refuseProfile([
          ...unknownReasons(NO_ACCESS_PROFILE, input.profile),
          ...(await passingReasons(businessId, NO_ACCESS_PROFILE, input.profile)),
        ]);
        const person: Person = {
          id: ids.next(),
          businessId,
          name: input.name,
          profile: input.profile,
          active: true,
          ...stamps(),
        };
        await people.add(person);
        await emit(businessId, 'person.created', { personId: person.id });
        return { person };
      });
    },

    'business.people.update': async (raw) => {
      const input = updatePerson.input.parse(raw);
      return runCommand(updatePerson, input, async () => {
        const { businessId } = input;
        const stored = await readPerson(businessId, input.personId);
        const changed: string[] = [];
        let next: Person = { ...stored, updatedAt: clock.now() };
        if (input.name !== undefined) {
          next = { ...next, name: input.name };
          changed.push('name');
        }
        if (input.profile !== undefined) {
          // An owner cannot be changed (`owner_fixed`), so no owner is lowered here: the last
          // one cannot be lost by a change of profile.
          refuseProfile([
            ...unknownReasons(stored.profile, input.profile),
            ...(await passingReasons(businessId, stored.profile, input.profile)),
          ]);
          next = { ...next, profile: input.profile };
          changed.push('profile');
        }
        const person = await writePerson(next);
        await emit(businessId, 'person.updated', { personId: person.id, fields: changed });
        return { person };
      });
    },

    'business.people.setActive': async (raw) => {
      const input = setActive.input.parse(raw);
      return runCommand(setActive, input, async () => {
        const { businessId, active } = input;
        const stored = await readPerson(businessId, input.personId);
        // Taking a person out of action takes away their whole profile, and bringing them back
        // gives it: the same rules of passing on apply, for the owner too.
        refuseProfile(await passingReasons(businessId, NO_ACCESS_PROFILE, stored.profile));
        const next: Person = { ...stored, active, updatedAt: clock.now() };
        if (leavesNoOwner(alive(await people.ofBusiness(businessId)), next)) {
          throw new CommandError('business.last_owner', 'The business keeps one active owner');
        }
        const person = await writePerson(next);
        await emit(businessId, active ? 'person.reactivated' : 'person.deactivated', {
          personId: person.id,
        });
        return { person };
      });
    },

    'business.people.list': async (raw) => {
      const input = listPeople.input.parse(raw);
      await readBusiness(input.businessId);
      return { people: alive(await people.ofBusiness(input.businessId)).sort(byId) };
    },
  };
}
