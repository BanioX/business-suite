/**
 * What is entered in the register of features (suite ADR-0004; ADR-0022 of the origin). Four
 * levels carry what a business switches and tunes:
 *
 * - industry: the namespace of one industry, such as `facility`; the platform has none;
 * - group: a set of features that belong together and are offered together;
 * - feature: one switch of a business, the thing an operation names in its `access`;
 * - option: a fine setting of one feature, with a type and a default.
 *
 * Around them stand what the setup needs (kinds of business, questions with their answers) and
 * what a device can be dedicated to (device modes). Everything is data without a text: names and
 * sentences live in the language catalogues, under these ids.
 *
 * An id with a namespace (`facility.keys`) belongs to the industry of that name; an id without
 * one belongs to the platform. Nobody enters an id into a namespace that is not their own.
 */

/** The values of `availability`. Today a feature is available, always; a core feature too. */
export const AVAILABILITIES = ['available'] as const;
export type Availability = (typeof AVAILABILITIES)[number];

/** How an option is typed (the default and every stored value must fit). */
export const OPTION_TYPES = [
  'boolean',
  'enum',
  'number',
  'minutes',
  'rappen',
  'time',
  'list',
] as const;
/**
 * - `boolean`: true or false.
 * - `enum`: one of `values`.
 * - `number`: a finite number.
 * - `minutes`: whole minutes, not negative.
 * - `rappen`: money as a whole number of Rappen.
 * - `time`: a time of day `HH:MM`.
 * - `list`: a list of texts.
 */
export type OptionType = (typeof OPTION_TYPES)[number];

export type OptionValue = boolean | number | string | readonly string[];

/** The ids of the levels of the extent, from the least to the most (`custom` is derived). */
export const EXTENTS = ['lean', 'usual', 'all'] as const;
export type Extent = (typeof EXTENTS)[number];

/** The device mode every register has: the device is not dedicated to anything. */
export const DEFAULT_DEVICE_MODE = 'normal';

/**
 * One segment of an id: lower-case letters, digits and single underscores, starting with a
 * letter. The id of an industry, an answer and every part of a longer id has this form.
 */
export const FEATURE_SEGMENT_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/** The key of an option: camel case, starting with a lower-case letter. */
export const OPTION_KEY_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

/** An industry: its id is the namespace of everything it enters. */
export interface IndustryDefinition {
  readonly id: string;
}

/** A group of features, for the catalogue (the «module» of the person, a group in the code). */
export interface FeatureGroupDefinition {
  readonly id: string;
}

export interface FeatureOptionDefinition {
  readonly key: string;
  readonly type: OptionType;
  readonly default: OptionValue;
  /** The allowed values of an `enum`; empty for every other type. */
  readonly values: readonly string[];
}

/** A feature as the register holds it: checked, every default filled in, frozen. */
export interface FeatureDefinition<TId extends string = string> {
  readonly id: TId;
  readonly group: string;
  /** Part of the core: never switched, always on, always available. */
  readonly core: boolean;
  /** Features it cannot work without; resolved through every step, never only one. */
  readonly requires: readonly string[];
  readonly options: readonly FeatureOptionDefinition[];
  readonly availability: Availability;
}

/** A kind of business of an industry: the features it starts with. */
export interface KindDefinition {
  /** `<industry>.<kind>`. */
  readonly id: string;
  readonly on: readonly string[];
}

export interface SetupAnswerDefinition {
  readonly id: string;
  readonly enable: readonly string[];
  readonly disable: readonly string[];
}

/** A question of the setup with the answers it takes and what each answer does. */
export interface SetupQuestionDefinition {
  readonly id: string;
  /** More than one answer allowed. */
  readonly multiple: boolean;
  /** Asked only of businesses of these kinds; empty for every kind. */
  readonly kinds: readonly string[];
  readonly answers: readonly SetupAnswerDefinition[];
}

/** A mode a device can be dedicated to; offered only while its feature is on. */
export interface DeviceModeDefinition {
  readonly id: string;
  readonly feature: string;
}

export interface FeatureOptionInput {
  key: string;
  type: OptionType;
  default: OptionValue;
  /** Required for an `enum`, not allowed for another type. */
  values?: readonly string[];
}

export interface FeatureInput<TId extends string = string> {
  id: TId;
  group: string;
  /** Default false. */
  core?: boolean;
  requires?: readonly string[];
  options?: readonly FeatureOptionInput[];
  /** Default `available`. */
  availability?: Availability;
}

export interface KindInput {
  id: string;
  on?: readonly string[];
}

export interface SetupAnswerInput {
  id: string;
  enable?: readonly string[];
  disable?: readonly string[];
}

export interface SetupQuestionInput {
  id: string;
  /** Default false. */
  multiple?: boolean;
  kinds?: readonly string[];
  answers: readonly SetupAnswerInput[];
}

export interface DeviceModeInput {
  id: string;
  feature: string;
}

/**
 * What a package or an industry enters, as one bag: the platform enters its own, an industry
 * enters its `catalog`, `kinds` and `setup` the same way. Every part is optional.
 */
export interface FeatureEntries<TId extends string = string> {
  industries?: readonly IndustryDefinition[];
  groups?: readonly FeatureGroupDefinition[];
  features?: readonly FeatureInput<TId>[];
  kinds?: readonly KindInput[];
  questions?: readonly SetupQuestionInput[];
  deviceModes?: readonly DeviceModeInput[];
}

/** Every entry of a register in its checked form. */
export interface CheckedEntries {
  readonly industries: readonly IndustryDefinition[];
  readonly groups: readonly FeatureGroupDefinition[];
  readonly features: readonly FeatureDefinition[];
  readonly kinds: readonly KindDefinition[];
  readonly questions: readonly SetupQuestionDefinition[];
  readonly deviceModes: readonly DeviceModeDefinition[];
}

/** The namespace of an id (`facility` for `facility.keys`), `undefined` for an id of the platform. */
export function namespaceOf(id: string): string | undefined {
  const dot = id.indexOf('.');
  return dot === -1 ? undefined : id.slice(0, dot);
}
