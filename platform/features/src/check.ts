import { FEATURE_ID_PATTERN } from '@onestrand/contract';
import {
  AVAILABILITIES,
  DEFAULT_DEVICE_MODE,
  FEATURE_SEGMENT_PATTERN,
  OPTION_KEY_PATTERN,
  OPTION_TYPES,
  namespaceOf,
  type CheckedEntries,
  type DeviceModeDefinition,
  type FeatureDefinition,
  type FeatureGroupDefinition,
  type FeatureOptionDefinition,
  type IndustryDefinition,
  type KindDefinition,
  type OptionType,
  type SetupAnswerDefinition,
  type SetupQuestionDefinition,
} from './entries';
import type { EntryLevel, FeatureProblem, FeatureProblemCode } from './errors';
import { optionAccepts } from './options';

/**
 * Checks of the entries of a register. They work on values of any shape (an entry written
 * without types, a cast, a typo in a key) and return every problem as data, never thrown; what
 * they return as entries is in its checked form: defaults filled in, lists copied, frozen.
 *
 * A problem inside one entry (a bad field) and a problem between entries (an unknown reference,
 * a cycle) are both found in one pass, so a person fixes everything at once.
 */

export const NO_ENTRIES: CheckedEntries = Object.freeze({
  industries: Object.freeze([]),
  groups: Object.freeze([]),
  features: Object.freeze([]),
  kinds: Object.freeze([]),
  questions: Object.freeze([]),
  deviceModes: Object.freeze([]),
});

type Sink = FeatureProblem[];

const UNNAMED = '?';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
  if (value === undefined) {
    return 'nothing';
  }
  if (typeof value === 'string') {
    return `«${value}»`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  return Array.isArray(value) ? 'a list' : `a ${typeof value}`;
}

function report(
  sink: Sink,
  code: FeatureProblemCode,
  level: EntryLevel,
  id: string,
  message: string,
): void {
  sink.push({ code, level, id, message });
}

/** An entry is an object with the fields given and no others: a typo would drop a setting silently. */
function asEntry(
  sink: Sink,
  level: EntryLevel,
  value: unknown,
  fields: readonly string[],
): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    report(sink, 'invalid_entry', level, UNNAMED, `expected an object, got ${describe(value)}`);
    return undefined;
  }
  const id = typeof value.id === 'string' ? value.id : UNNAMED;
  for (const field of Object.keys(value)) {
    if (!fields.includes(field)) {
      report(sink, 'invalid_entry', level, id, `has the unknown field «${field}»`);
    }
  }
  return value;
}

/** The id of an entry, if it has the form; the form is given in words for the message. */
function readId(
  sink: Sink,
  level: EntryLevel,
  entry: Record<string, unknown>,
  pattern: RegExp,
  form: string,
): string | undefined {
  const { id } = entry;
  if (typeof id === 'string' && pattern.test(id)) {
    return id;
  }
  report(sink, 'invalid_entry', level, UNNAMED, `the id must be ${form}, got ${describe(id)}`);
  return undefined;
}

/** A list of ids of one form, each once; nothing is a list with nothing in it. */
function readIds(
  sink: Sink,
  level: EntryLevel,
  id: string,
  field: string,
  value: unknown,
  pattern: RegExp,
): readonly string[] {
  if (value === undefined) {
    return Object.freeze([]);
  }
  if (!Array.isArray(value)) {
    report(sink, 'invalid_entry', level, id, `${field} must be a list, got ${describe(value)}`);
    return Object.freeze([]);
  }
  const kept: string[] = [];
  for (const item of value as unknown[]) {
    if (typeof item !== 'string' || !pattern.test(item)) {
      report(sink, 'invalid_entry', level, id, `${field} lists ${describe(item)}, which is no id`);
    } else if (kept.includes(item)) {
      report(sink, 'invalid_entry', level, id, `${field} lists «${item}» more than once`);
    } else {
      kept.push(item);
    }
  }
  return Object.freeze(kept);
}

function readOption(
  sink: Sink,
  featureId: string,
  value: unknown,
): FeatureOptionDefinition | undefined {
  const bad = (message: string) => {
    report(sink, 'invalid_option', 'feature', featureId, message);
  };
  if (!isRecord(value)) {
    bad(`an option must be an object, got ${describe(value)}`);
    return undefined;
  }
  const { key, type, values } = value;
  for (const field of Object.keys(value)) {
    if (!['key', 'type', 'default', 'values'].includes(field)) {
      bad(`an option has the unknown field «${field}»`);
    }
  }
  if (typeof key !== 'string' || !OPTION_KEY_PATTERN.test(key)) {
    bad(`the key of an option must be camel case, got ${describe(key)}`);
    return undefined;
  }
  if (typeof type !== 'string' || !(OPTION_TYPES as readonly string[]).includes(type)) {
    bad(`the option «${key}» needs a type of ${OPTION_TYPES.join(', ')}, got ${describe(type)}`);
    return undefined;
  }
  const optionType = type as OptionType;
  let allowed: readonly string[] = Object.freeze([]);
  if (optionType === 'enum') {
    if (
      !Array.isArray(values) ||
      values.length === 0 ||
      !(values as unknown[]).every((item) => typeof item === 'string' && item !== '') ||
      new Set(values as unknown[]).size !== values.length
    ) {
      bad(`the enum option «${key}» needs a list of values: texts, each once, at least one`);
    } else {
      allowed = Object.freeze([...(values as string[])]);
    }
  } else if (values !== undefined) {
    bad(`the option «${key}» has values, which only an enum takes`);
  }
  const definition = { type: optionType, values: allowed };
  if (!optionAccepts(definition, value.default)) {
    bad(`the default of the option «${key}» does not fit its type ${optionType}`);
    return undefined;
  }
  return Object.freeze({
    key,
    type: optionType,
    default: Array.isArray(value.default)
      ? Object.freeze([...(value.default as string[])])
      : (value.default as FeatureOptionDefinition['default']),
    values: allowed,
  });
}

function readFeature(sink: Sink, value: unknown): FeatureDefinition | undefined {
  const entry = asEntry(sink, 'feature', value, [
    'id',
    'group',
    'core',
    'requires',
    'options',
    'availability',
  ]);
  if (entry === undefined) {
    return undefined;
  }
  const id = readId(
    sink,
    'feature',
    entry,
    FEATURE_ID_PATTERN,
    'one or two segments of lower-case words joined by a dot',
  );
  if (id === undefined) {
    return undefined;
  }
  const { group, core, availability, options } = entry;
  if (typeof group !== 'string' || !FEATURE_ID_PATTERN.test(group)) {
    report(
      sink,
      'invalid_entry',
      'feature',
      id,
      `group must be the id of a group, got ${describe(group)}`,
    );
  }
  if (core !== undefined && typeof core !== 'boolean') {
    report(
      sink,
      'invalid_entry',
      'feature',
      id,
      `core must be true or false, got ${describe(core)}`,
    );
  }
  if (
    availability !== undefined &&
    !(AVAILABILITIES as readonly unknown[]).includes(availability)
  ) {
    report(
      sink,
      'invalid_availability',
      'feature',
      id,
      `availability must be ${AVAILABILITIES.join(' or ')}, got ${describe(availability)}`,
    );
  }
  const checkedOptions: FeatureOptionDefinition[] = [];
  if (options !== undefined) {
    if (Array.isArray(options)) {
      for (const option of options as unknown[]) {
        const checked = readOption(sink, id, option);
        if (checked === undefined) {
          continue;
        }
        if (checkedOptions.some((other) => other.key === checked.key)) {
          report(
            sink,
            'invalid_option',
            'feature',
            id,
            `the option «${checked.key}» is declared twice`,
          );
        } else {
          checkedOptions.push(checked);
        }
      }
    } else {
      report(
        sink,
        'invalid_entry',
        'feature',
        id,
        `options must be a list, got ${describe(options)}`,
      );
    }
  }
  return Object.freeze({
    id,
    group: typeof group === 'string' ? group : UNNAMED,
    core: core === true,
    requires: readIds(sink, 'feature', id, 'requires', entry.requires, FEATURE_ID_PATTERN),
    options: Object.freeze(checkedOptions),
    availability: 'available' as const,
  });
}

function readKind(sink: Sink, value: unknown): KindDefinition | undefined {
  const entry = asEntry(sink, 'kind', value, ['id', 'on']);
  if (entry === undefined) {
    return undefined;
  }
  const id = readId(sink, 'kind', entry, FEATURE_ID_PATTERN, '`<industry>.<kind>`');
  if (id === undefined) {
    return undefined;
  }
  if (namespaceOf(id) === undefined) {
    report(
      sink,
      'invalid_entry',
      'kind',
      id,
      'a kind belongs to an industry: its id is `<industry>.<kind>`',
    );
  }
  return Object.freeze({
    id,
    on: readIds(sink, 'kind', id, 'on', entry.on, FEATURE_ID_PATTERN),
  });
}

function readAnswer(
  sink: Sink,
  questionId: string,
  value: unknown,
): SetupAnswerDefinition | undefined {
  const entry = asEntry(sink, 'question', value, ['id', 'enable', 'disable']);
  if (entry === undefined) {
    return undefined;
  }
  const { id } = entry;
  if (typeof id !== 'string' || !FEATURE_SEGMENT_PATTERN.test(id)) {
    report(
      sink,
      'invalid_entry',
      'question',
      questionId,
      `the id of an answer must be a lower-case word, got ${describe(id)}`,
    );
    return undefined;
  }
  const where = questionId;
  return Object.freeze({
    id,
    enable: readIds(
      sink,
      'question',
      where,
      `the answer «${id}» enable`,
      entry.enable,
      FEATURE_ID_PATTERN,
    ),
    disable: readIds(
      sink,
      'question',
      where,
      `the answer «${id}» disable`,
      entry.disable,
      FEATURE_ID_PATTERN,
    ),
  });
}

function readQuestion(sink: Sink, value: unknown): SetupQuestionDefinition | undefined {
  const entry = asEntry(sink, 'question', value, ['id', 'multiple', 'kinds', 'answers']);
  if (entry === undefined) {
    return undefined;
  }
  const id = readId(
    sink,
    'question',
    entry,
    FEATURE_ID_PATTERN,
    'one or two segments of lower-case words joined by a dot',
  );
  if (id === undefined) {
    return undefined;
  }
  if (entry.multiple !== undefined && typeof entry.multiple !== 'boolean') {
    report(
      sink,
      'invalid_entry',
      'question',
      id,
      `multiple must be true or false, got ${describe(entry.multiple)}`,
    );
  }
  const answers: SetupAnswerDefinition[] = [];
  if (!Array.isArray(entry.answers) || entry.answers.length === 0) {
    report(
      sink,
      'invalid_entry',
      'question',
      id,
      'answers must be a list with at least one answer',
    );
  } else {
    for (const item of entry.answers as unknown[]) {
      const answer = readAnswer(sink, id, item);
      if (answer === undefined) {
        continue;
      }
      if (answers.some((other) => other.id === answer.id)) {
        report(
          sink,
          'invalid_entry',
          'question',
          id,
          `the answer «${answer.id}» is listed more than once`,
        );
      } else {
        answers.push(answer);
      }
    }
  }
  return Object.freeze({
    id,
    multiple: entry.multiple === true,
    kinds: readIds(sink, 'question', id, 'kinds', entry.kinds, FEATURE_ID_PATTERN),
    answers: Object.freeze(answers),
  });
}

function readMode(sink: Sink, value: unknown): DeviceModeDefinition | undefined {
  const entry = asEntry(sink, 'device_mode', value, ['id', 'feature']);
  if (entry === undefined) {
    return undefined;
  }
  const id = readId(
    sink,
    'device_mode',
    entry,
    FEATURE_ID_PATTERN,
    'one or two segments of lower-case words joined by a dot',
  );
  if (id === undefined) {
    return undefined;
  }
  if (id === DEFAULT_DEVICE_MODE) {
    report(
      sink,
      'invalid_entry',
      'device_mode',
      id,
      'the id «normal» is the mode every register has and cannot be entered',
    );
  }
  const { feature } = entry;
  if (typeof feature !== 'string' || !FEATURE_ID_PATTERN.test(feature)) {
    report(
      sink,
      'invalid_entry',
      'device_mode',
      id,
      `feature must be the id of a feature, got ${describe(feature)}`,
    );
    return undefined;
  }
  return Object.freeze({ id, feature });
}

function readList<TEntry>(
  sink: Sink,
  level: EntryLevel,
  name: string,
  value: unknown,
  read: (item: unknown) => TEntry | undefined,
): readonly TEntry[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    report(sink, 'invalid_entry', level, UNNAMED, `${name} must be a list, got ${describe(value)}`);
    return [];
  }
  return (value as unknown[]).flatMap((item) => {
    const entry = read(item);
    return entry === undefined ? [] : [entry];
  });
}

function readSimple<TEntry extends { id: string }>(
  sink: Sink,
  level: EntryLevel,
  pattern: RegExp,
  form: string,
): (item: unknown) => TEntry | undefined {
  return (item) => {
    const entry = asEntry(sink, level, item, ['id']);
    if (entry === undefined) {
      return undefined;
    }
    const id = readId(sink, level, entry, pattern, form);
    return id === undefined ? undefined : (Object.freeze({ id }) as TEntry);
  };
}

/** Reads the bag of entries one package or industry brings. */
function readBag(sink: Sink, input: unknown): CheckedEntries {
  if (!isRecord(input)) {
    report(
      sink,
      'invalid_entry',
      'feature',
      UNNAMED,
      `the entries must be an object, got ${describe(input)}`,
    );
    return NO_ENTRIES;
  }
  for (const field of Object.keys(input)) {
    if (
      !['industries', 'groups', 'features', 'kinds', 'questions', 'deviceModes'].includes(field)
    ) {
      report(
        sink,
        'invalid_entry',
        'feature',
        UNNAMED,
        `the entries have the unknown part «${field}»`,
      );
    }
  }
  return {
    industries: readList<IndustryDefinition>(
      sink,
      'industry',
      'industries',
      input.industries,
      readSimple(sink, 'industry', FEATURE_SEGMENT_PATTERN, 'a lower-case word'),
    ),
    groups: readList<FeatureGroupDefinition>(
      sink,
      'group',
      'groups',
      input.groups,
      readSimple(
        sink,
        'group',
        FEATURE_ID_PATTERN,
        'one or two segments of lower-case words joined by a dot',
      ),
    ),
    features: readList(sink, 'feature', 'features', input.features, (item) =>
      readFeature(sink, item),
    ),
    kinds: readList(sink, 'kind', 'kinds', input.kinds, (item) => readKind(sink, item)),
    questions: readList(sink, 'question', 'questions', input.questions, (item) =>
      readQuestion(sink, item),
    ),
    deviceModes: readList(sink, 'device_mode', 'deviceModes', input.deviceModes, (item) =>
      readMode(sink, item),
    ),
  };
}

function duplicates(sink: Sink, level: EntryLevel, ids: readonly string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      report(
        sink,
        'duplicate_id',
        level,
        id,
        `the id «${id}» is entered twice on the level ${level}`,
      );
    }
    seen.add(id);
  }
}

/** Problems between the entries: ids that repeat, references that lead nowhere, cycles. */
function crossCheck(sink: Sink, all: CheckedEntries): void {
  duplicates(
    sink,
    'industry',
    all.industries.map((entry) => entry.id),
  );
  duplicates(
    sink,
    'group',
    all.groups.map((entry) => entry.id),
  );
  duplicates(
    sink,
    'feature',
    all.features.map((entry) => entry.id),
  );
  duplicates(
    sink,
    'kind',
    all.kinds.map((entry) => entry.id),
  );
  duplicates(
    sink,
    'question',
    all.questions.map((entry) => entry.id),
  );
  duplicates(
    sink,
    'device_mode',
    all.deviceModes.map((entry) => entry.id),
  );

  const industries = new Set(all.industries.map((entry) => entry.id));
  const groups = new Set(all.groups.map((entry) => entry.id));
  const features = new Map<string, FeatureDefinition>();
  for (const feature of all.features) {
    if (!features.has(feature.id)) {
      features.set(feature.id, feature);
    }
  }
  const kinds = new Set(all.kinds.map((entry) => entry.id));

  /** An id with a namespace needs the industry of that name. */
  const industryOf = (level: EntryLevel, id: string): void => {
    const namespace = namespaceOf(id);
    if (namespace !== undefined && !industries.has(namespace)) {
      report(sink, 'unknown_reference', level, id, `the industry «${namespace}» is not registered`);
    }
  };

  /** A feature named by an entry: it exists, and the entry may know it (never across industries). */
  const feature = (
    level: EntryLevel,
    id: string,
    target: string,
  ): FeatureDefinition | undefined => {
    const found = features.get(target);
    if (found === undefined) {
      report(sink, 'unknown_reference', level, id, `the feature «${target}» is not registered`);
      return undefined;
    }
    const own = namespaceOf(id);
    const other = namespaceOf(target);
    if (other !== undefined && other !== own) {
      report(
        sink,
        'foreign_dependency',
        level,
        id,
        `«${id}» names «${target}» of the industry «${other}»: an entry knows the platform and its own industry only`,
      );
    }
    return found;
  };

  for (const entry of all.groups) {
    industryOf('group', entry.id);
  }

  for (const entry of all.features) {
    industryOf('feature', entry.id);
    if (!groups.has(entry.group)) {
      report(
        sink,
        'unknown_reference',
        'feature',
        entry.id,
        `the group «${entry.group}» is not registered`,
      );
    } else if (namespaceOf(entry.group) !== namespaceOf(entry.id)) {
      report(
        sink,
        'wrong_namespace',
        'feature',
        entry.id,
        `«${entry.id}» is in the group «${entry.group}», whose namespace is not its own`,
      );
    }
    for (const required of entry.requires) {
      const target = feature('feature', entry.id, required);
      if (target !== undefined && entry.core && !target.core) {
        report(
          sink,
          'invalid_core',
          'feature',
          entry.id,
          `the core feature «${entry.id}» needs «${required}», which can be switched off`,
        );
      }
    }
  }

  for (const entry of all.features) {
    if (reaches(features, entry.id, entry.id)) {
      report(
        sink,
        'requires_cycle',
        'feature',
        entry.id,
        `the feature «${entry.id}» needs itself, directly or through others`,
      );
    }
  }

  for (const entry of all.kinds) {
    industryOf('kind', entry.id);
    for (const on of entry.on) {
      feature('kind', entry.id, on);
    }
  }

  for (const entry of all.questions) {
    industryOf('question', entry.id);
    for (const kind of entry.kinds) {
      if (!kinds.has(kind)) {
        report(
          sink,
          'unknown_reference',
          'question',
          entry.id,
          `the kind «${kind}» is not registered`,
        );
      } else if (namespaceOf(kind) !== namespaceOf(entry.id)) {
        report(
          sink,
          'foreign_dependency',
          'question',
          entry.id,
          `«${entry.id}» is asked of the kind «${kind}», which is not of its own industry`,
        );
      }
    }
    for (const answer of entry.answers) {
      for (const id of answer.enable) {
        feature('question', entry.id, id);
      }
      for (const id of answer.disable) {
        if (feature('question', entry.id, id)?.core === true) {
          report(
            sink,
            'invalid_core',
            'question',
            entry.id,
            `the answer «${answer.id}» would switch off the core feature «${id}»`,
          );
        }
      }
    }
  }

  for (const entry of all.deviceModes) {
    industryOf('device_mode', entry.id);
    feature('device_mode', entry.id, entry.feature);
  }
}

/** Whether `target` can be reached from `from` by following `requires` (at least one step). */
function reaches(
  features: ReadonlyMap<string, FeatureDefinition>,
  from: string,
  target: string,
): boolean {
  const seen = new Set<string>();
  const queue = [...(features.get(from)?.requires ?? [])];
  for (let next = queue.pop(); next !== undefined; next = queue.pop()) {
    if (next === target) {
      return true;
    }
    if (!seen.has(next)) {
      seen.add(next);
      queue.push(...(features.get(next)?.requires ?? []));
    }
  }
  return false;
}

/** The result of checking new entries on top of the ones a register holds. */
export interface CheckedResult {
  /** The register's entries and the new ones, in this order. Meaningful only if there is no problem. */
  entries: CheckedEntries;
  problems: FeatureProblem[];
}

/**
 * Checks `input` as the entries to add to `base` and returns the entries of both, together with
 * every problem: in the form of an entry and between all entries, the old and the new.
 */
export function checkEntries(base: CheckedEntries, input: unknown): CheckedResult {
  const problems: Sink = [];
  const added = readBag(problems, input);
  const entries: CheckedEntries = {
    industries: [...base.industries, ...added.industries],
    groups: [...base.groups, ...added.groups],
    features: [...base.features, ...added.features],
    kinds: [...base.kinds, ...added.kinds],
    questions: [...base.questions, ...added.questions],
    deviceModes: [...base.deviceModes, ...added.deviceModes],
  };
  crossCheck(problems, entries);
  return { entries, problems };
}
