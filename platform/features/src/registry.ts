import { checkEntries, NO_ENTRIES } from './check';
import {
  DEFAULT_DEVICE_MODE,
  type CheckedEntries,
  type DeviceModeDefinition,
  type Extent,
  type FeatureDefinition,
  type FeatureEntries,
  type FeatureGroupDefinition,
  type IndustryDefinition,
  type KindDefinition,
  type SetupQuestionDefinition,
} from './entries';
import { FeatureError, type FeatureProblem } from './errors';
import { resolveOptionValues, type ResolvedOptions } from './options';

/**
 * The register of features (suite ADR-0004 and ADR-0009; ADR-0022 of the origin). The platform
 * holds no fixed list: every package and every industry enters its own, an edition puts them
 * together with `createFeatureRegistry`, and `extend` adds more. One register then drives what a
 * business can switch, the setup, the catalogue and the checks, so a feature cannot be forgotten
 * in one of them.
 *
 * A register is a value: it is never changed after creation, `extend` returns a new one. What a
 * business has switched on is a list of feature ids that the person holds; the register only
 * works it out (`resolve`, `switchFeature`) and never stores it.
 */

/** A list of enabled features as it applies: complete, in the order of the register. */
export interface ResolvedFeatures<TId extends string = string> {
  /** Every feature that is on: the core, what was asked for, and everything those need. */
  readonly features: readonly TId[];
  /** Ids that were handed in but the register does not know (a newer version wrote them); keep them when you write the list back. */
  readonly unknown: readonly string[];
}

/** What one switch did. */
export interface SwitchResult<TId extends string = string> extends ResolvedFeatures<TId> {
  /** Features that were off and are on now: the one asked for and what it needs. */
  readonly turnedOn: readonly TId[];
  /** Features that were on and are off now: the one asked for and everything that needs it. */
  readonly turnedOff: readonly TId[];
}

/** What the setup knows: the kinds of business the person chose and the answers they gave. */
export interface SetupInput {
  /** Ids of kinds; a business of several industries has several. */
  readonly kinds: readonly string[];
  /** The answers by id of the question; each is a list of ids of answers (one for a single choice). */
  readonly answers?: Readonly<Record<string, readonly string[]>>;
}

export const ANSWER_PROBLEM_KINDS = [
  'unknown_kind',
  'unknown_question',
  'not_asked',
  'unknown_answer',
  'too_many_answers',
] as const;
/**
 * What is wrong with an input of the setup. A problem never stops the proposal: what is wrong is
 * left out, the rest counts.
 *
 * - `unknown_kind`: the register has no such kind.
 * - `unknown_question`: the register has no such question.
 * - `not_asked`: the question is not asked of the kinds given; its answers do not count.
 * - `unknown_answer`: the question has no such answer.
 * - `too_many_answers`: a question of one choice has several answers; none of them counts.
 */
export type AnswerProblemKind = (typeof ANSWER_PROBLEM_KINDS)[number];

export interface AnswerProblem {
  kind: AnswerProblemKind;
  /** The id of the kind, question or answer concerned. */
  id: string;
  message: string;
}

/**
 * What the setup proposes, one list of features for each extent. Each is complete (nothing
 * needs a feature that is not in it), holds the whole core and is in the order of the register;
 * `lean` is within `usual`, `usual` within `all`.
 */
export interface SetupProposal<TId extends string = string> {
  /** What the chosen kinds start with and nothing more. */
  readonly lean: readonly TId[];
  /** `lean` and what the answers add, minus what the answers switch off. */
  readonly usual: readonly TId[];
  /** Every feature of the register. */
  readonly all: readonly TId[];
  readonly problems: readonly AnswerProblem[];
}

export interface FeatureRegistry<TId extends string = string> {
  readonly industries: readonly IndustryDefinition[];
  readonly groups: readonly FeatureGroupDefinition[];
  readonly features: readonly FeatureDefinition<TId>[];
  readonly kinds: readonly KindDefinition[];
  readonly questions: readonly SetupQuestionDefinition[];
  /** The modes that were entered; `normal` is not among them, every register has it. */
  readonly deviceModes: readonly DeviceModeDefinition[];
  /** The ids of the features in the order of registration. */
  readonly ids: readonly TId[];
  has(id: string): id is TId;
  /** The definition of a feature; throws a `FeatureError` with the code `unknown_feature`. */
  get(id: string): FeatureDefinition<TId>;
  /** The features of a group in the order of registration; none for a group the register does not know. */
  featuresOfGroup(groupId: string): readonly TId[];
  /** A new register with further entries; this one stays as it is. Throws like `createFeatureRegistry`. */
  extend<const TMore extends string>(more: FeatureEntries<TMore>): FeatureRegistry<TId | TMore>;

  /**
   * What the given list means: the core, the features asked for and everything they need, through
   * every step, in the order of the register. Idempotent: what it returns it returns again.
   */
  resolve(enabled: Iterable<string>): ResolvedFeatures<TId>;
  /** Whether a feature is on: a core feature always is. */
  isOn(enabled: Iterable<string>, id: string): boolean;
  /** Everything a feature needs, through every step; what switching it on brings along. Throws `unknown_feature`. */
  requiredFor(id: string): readonly TId[];
  /** Everything that needs a feature, through every step; what switching it off takes along. Throws `unknown_feature`. */
  dependentsOf(id: string): readonly TId[];
  /**
   * Switches one feature. On brings what it needs; off takes along everything that needs it, so
   * the list never holds a feature without its base. Throws `unknown_feature`, and `core_feature`
   * for a core feature, which is never switched.
   */
  switchFeature(enabled: Iterable<string>, id: string, on: boolean): SwitchResult<TId>;

  /** The questions asked of businesses of these kinds, in the order of registration. */
  questionsFor(kinds: readonly string[]): readonly SetupQuestionDefinition[];
  /** The proposal for the extents from kinds and answers. */
  propose(input: SetupInput): SetupProposal<TId>;
  /**
   * Which extent a list of features is: `usual` first, then `lean`, then `all`, so that where two
   * are the same list the usual one is named; `custom` where none is. The extent itself is never stored.
   */
  extentOf(proposal: SetupProposal<TId>, enabled: Iterable<string>): Extent | 'custom';
  /** The modes a device can be dedicated to with these features on: `normal` first. */
  deviceModesFor(enabled: Iterable<string>): readonly string[];
  /** The settings of a feature as they apply; see `ResolvedOptions`. Throws `unknown_feature`. */
  resolveOptions(featureId: string, stored?: unknown): ResolvedOptions;
}

/**
 * What is wrong with entries, without building anything: every problem as data, in the form of
 * each entry and between all of them, together with the ones of `base` if given. The conformity
 * test of an industry calls it; an empty list means a register can be built.
 */
export function featureEntryProblems(
  entries: unknown,
  base?: FeatureRegistry,
): readonly FeatureProblem[] {
  return checkEntries(base === undefined ? NO_ENTRIES : checkedOf(base), entries).problems;
}

/** The entries of a register as they were checked. */
function checkedOf(registry: FeatureRegistry): CheckedEntries {
  return {
    industries: registry.industries,
    groups: registry.groups,
    features: registry.features,
    kinds: registry.kinds,
    questions: registry.questions,
    deviceModes: registry.deviceModes,
  };
}

/**
 * Builds a register from entries. Every entry is checked (see `featureEntryProblems`); the first
 * problem decides the code of the `FeatureError` that is thrown, and it carries all of them.
 * The result is frozen.
 */
export function createFeatureRegistry<const TId extends string>(
  entries: FeatureEntries<TId>,
): FeatureRegistry<TId> {
  return buildRegistry<TId>(NO_ENTRIES, entries);
}

function buildRegistry<TId extends string>(
  base: CheckedEntries,
  input: unknown,
): FeatureRegistry<TId> {
  const { entries, problems } = checkEntries(base, input);
  const [first] = problems;
  if (first !== undefined) {
    const found = problems.map((problem) => `${problem.level} ${problem.id}: ${problem.message}`);
    throw new FeatureError(
      first.code,
      `The entries of the feature register are not well formed: ${found.join('; ')}`,
      problems,
    );
  }
  return registryOf<TId>(entries);
}

function sameMembers(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

function registryOf<TId extends string>(entries: CheckedEntries): FeatureRegistry<TId> {
  // The entries passed the checks, so every feature id is one of `TId`.
  const features = Object.freeze([...entries.features]) as readonly FeatureDefinition<TId>[];
  const ids = Object.freeze(features.map((feature) => feature.id));
  const byId = new Map<string, FeatureDefinition<TId>>(features.map((f) => [f.id, f]));
  const coreIds = features.filter((feature) => feature.core).map((feature) => feature.id);

  const inOrder = (members: ReadonlySet<string>): TId[] => ids.filter((id) => members.has(id));

  const known = (id: string): FeatureDefinition<TId> => {
    const feature = byId.get(id);
    if (feature === undefined) {
      throw new FeatureError(
        'unknown_feature',
        `Unknown feature ${JSON.stringify(id)}; registered: ${ids.join(', ')}`,
      );
    }
    return feature;
  };

  // Through every step; the checks ruled out cycles, so the walk ends.
  const requiredIds = new Map<string, ReadonlySet<string>>();
  const requiredOf = (id: string): ReadonlySet<string> => {
    const done = requiredIds.get(id);
    if (done !== undefined) {
      return done;
    }
    const all = new Set<string>();
    for (const required of known(id).requires) {
      all.add(required);
      for (const deeper of requiredOf(required)) {
        all.add(deeper);
      }
    }
    requiredIds.set(id, all);
    return all;
  };
  const dependentsSet = (id: string): ReadonlySet<string> =>
    new Set(ids.filter((other) => requiredOf(other).has(id)));

  const resolve = (enabled: Iterable<string>): ResolvedFeatures<TId> => {
    const wanted = new Set<string>(coreIds);
    const unknown: string[] = [];
    for (const id of enabled) {
      if (byId.has(id)) {
        wanted.add(id);
        for (const required of requiredOf(id)) {
          wanted.add(required);
        }
      } else if (!unknown.includes(id)) {
        unknown.push(id);
      }
    }
    return Object.freeze({
      features: Object.freeze(inOrder(wanted)),
      unknown: Object.freeze(unknown),
    });
  };

  const questionsFor = (kinds: readonly string[]): readonly SetupQuestionDefinition[] =>
    entries.questions.filter(
      (question) =>
        question.kinds.length === 0 || question.kinds.some((kind) => kinds.includes(kind)),
    );

  const propose = (input: SetupInput): SetupProposal<TId> => {
    const problems: AnswerProblem[] = [];
    const kinds = new Map(entries.kinds.map((kind) => [kind.id, kind]));
    const chosen: KindDefinition[] = [];
    for (const id of input.kinds) {
      const kind = kinds.get(id);
      if (kind === undefined) {
        problems.push({ kind: 'unknown_kind', id, message: `the register has no kind «${id}»` });
      } else if (!chosen.includes(kind)) {
        chosen.push(kind);
      }
    }
    const asked = questionsFor(chosen.map((kind) => kind.id));
    const questions = new Map(entries.questions.map((question) => [question.id, question]));
    const enable = new Set<string>();
    const disable = new Set<string>();
    for (const [questionId, given] of Object.entries(input.answers ?? {})) {
      const question = questions.get(questionId);
      if (question === undefined) {
        problems.push({
          kind: 'unknown_question',
          id: questionId,
          message: `the register has no question «${questionId}»`,
        });
        continue;
      }
      if (!asked.includes(question)) {
        problems.push({
          kind: 'not_asked',
          id: questionId,
          message: `the question «${questionId}» is not asked of these kinds`,
        });
        continue;
      }
      const answers = new Map(question.answers.map((answer) => [answer.id, answer]));
      const taken = [...new Set(given)].flatMap((answerId) => {
        const answer = answers.get(answerId);
        if (answer === undefined) {
          problems.push({
            kind: 'unknown_answer',
            id: answerId,
            message: `the question «${questionId}» has no answer «${answerId}»`,
          });
          return [];
        }
        return [answer];
      });
      if (!question.multiple && taken.length > 1) {
        problems.push({
          kind: 'too_many_answers',
          id: questionId,
          message: `the question «${questionId}» takes one answer, got ${String(taken.length)}`,
        });
        continue;
      }
      for (const answer of taken) {
        answer.enable.forEach((id) => enable.add(id));
        answer.disable.forEach((id) => disable.add(id));
      }
    }
    // Off wins over on: what an answer switches off goes, with everything that needs it.
    const removed = new Set<string>(disable);
    for (const id of disable) {
      dependentsSet(id).forEach((dependent) => removed.add(dependent));
    }
    const start = new Set(chosen.flatMap((kind) => kind.on));
    const without = (members: readonly TId[]): readonly TId[] =>
      Object.freeze(members.filter((id) => !removed.has(id)));
    return Object.freeze({
      lean: without(resolve(start).features),
      usual: without(resolve([...start, ...enable]).features),
      all: ids,
      problems: Object.freeze(problems),
    });
  };

  const registry: FeatureRegistry<TId> = {
    industries: Object.freeze([...entries.industries]),
    groups: Object.freeze([...entries.groups]),
    features,
    kinds: Object.freeze([...entries.kinds]),
    questions: Object.freeze([...entries.questions]),
    deviceModes: Object.freeze([...entries.deviceModes]),
    ids,
    has: (id): id is TId => byId.has(id),
    get: known,
    featuresOfGroup: (groupId) =>
      Object.freeze(ids.filter((id) => byId.get(id)?.group === groupId)),
    extend: <const TMore extends string>(more: FeatureEntries<TMore>) =>
      buildRegistry<TId | TMore>(entries, more),
    resolve,
    isOn: (enabled, id) => resolve(enabled).features.some((on) => on === id),
    requiredFor: (id) => {
      known(id);
      return Object.freeze(inOrder(requiredOf(id)));
    },
    dependentsOf: (id) => {
      known(id);
      return Object.freeze(inOrder(dependentsSet(id)));
    },
    switchFeature: (enabled, id, on) => {
      const feature = known(id);
      if (feature.core) {
        throw new FeatureError(
          'core_feature',
          `The feature ${JSON.stringify(id)} is part of the core and is never switched`,
        );
      }
      const before = resolve(enabled);
      const taken = new Set<string>(dependentsSet(id));
      taken.add(id);
      const after = on
        ? resolve([...before.features, id])
        : { features: before.features.filter((other) => !taken.has(other)) };
      const nowOn = new Set<string>(after.features);
      const wasOn = new Set<string>(before.features);
      return Object.freeze({
        features: Object.freeze(after.features),
        unknown: before.unknown,
        turnedOn: Object.freeze(after.features.filter((other) => !wasOn.has(other))),
        turnedOff: Object.freeze(before.features.filter((other) => !nowOn.has(other))),
      });
    },
    questionsFor: (kinds) => Object.freeze(questionsFor(kinds)),
    propose,
    extentOf: (proposal, enabled) => {
      const current = resolve(enabled).features;
      const order: readonly Extent[] = ['usual', 'lean', 'all'];
      return order.find((extent) => sameMembers(proposal[extent], current)) ?? 'custom';
    },
    deviceModesFor: (enabled) => {
      const on = new Set<string>(resolve(enabled).features);
      return Object.freeze([
        DEFAULT_DEVICE_MODE,
        ...entries.deviceModes.filter((mode) => on.has(mode.feature)).map((mode) => mode.id),
      ]);
    },
    resolveOptions: (featureId, stored) => resolveOptionValues(known(featureId).options, stored),
  };
  return Object.freeze(registry);
}
