/**
 * What a catalogue must say about the registers of an edition. The registers (of functions, of
 * delicate rights) hold ids and no texts; the texts stand in the catalogues under keys that
 * follow one rule from the ids. This file is that rule, and the check that every id has its texts.
 *
 * The rule, from the top of the catalogue (an id keeps its dots: `facility.keys` is one key):
 *
 * | Section | Keys | Texts |
 * | --- | --- | --- |
 * | `modules` | `<module>` | `name`, `summary` |
 * | `features` | `<function>` | `name`, `summary` |
 * | `options` | `<function>`, `<option>` | one text: the name of the option |
 * | `kinds` | `<kind>` | one text: the name of the kind of business |
 * | `questions` | `<question>` | `text`, and under `answers` one text per `<answer>` |
 * | `deviceModes` | `<mode>` | one text; `normal` is always there |
 * | `rights` | `<right>` | `name`, `summary` |
 *
 * The registers come in as the shapes below, which the registers of `@onestrand/features` and
 * `@onestrand/access` have: this package needs neither of them, only their ids.
 */

/** What of a register of functions the texts depend on. */
export interface FeatureRegisterShape {
  readonly groups: readonly { readonly id: string }[];
  readonly features: readonly {
    readonly id: string;
    readonly options: readonly { readonly key: string }[];
  }[];
  readonly kinds: readonly { readonly id: string }[];
  readonly questions: readonly {
    readonly id: string;
    readonly answers: readonly { readonly id: string }[];
  }[];
  /** The modes an industry entered; `normal` is not among them and is always asked for. */
  readonly deviceModes: readonly { readonly id: string }[];
}

/** What of a register of delicate rights the texts depend on. */
export interface RightRegisterShape {
  readonly rights: readonly { readonly id: string }[];
}

/** The mode every register has (the same as `DEFAULT_DEVICE_MODE` of `@onestrand/features`; a test holds them together). */
export const DEVICE_MODE_NORMAL = 'normal';

/** A text a catalogue must hold, by its keys from the top. */
export interface RequiredText {
  readonly keys: readonly string[];
}

function nameAndSummary(keys: readonly string[]): RequiredText[] {
  return [{ keys: [...keys, 'name'] }, { keys: [...keys, 'summary'] }];
}

/**
 * Every text the registers ask for, in the order of the registers: a name and a sentence for each
 * module, function and right, a name for each option, kind and device mode, a text for each
 * question and each answer. Either register may be left out.
 */
export function registerTexts(registers: {
  features?: FeatureRegisterShape;
  rights?: RightRegisterShape;
}): RequiredText[] {
  const { features, rights } = registers;
  const required: RequiredText[] = [];
  if (features !== undefined) {
    for (const group of features.groups) {
      required.push(...nameAndSummary(['modules', group.id]));
    }
    for (const feature of features.features) {
      required.push(...nameAndSummary(['features', feature.id]));
      for (const option of feature.options) {
        required.push({ keys: ['options', feature.id, option.key] });
      }
    }
    for (const kind of features.kinds) {
      required.push({ keys: ['kinds', kind.id] });
    }
    for (const question of features.questions) {
      required.push({ keys: ['questions', question.id, 'text'] });
      for (const answer of question.answers) {
        required.push({ keys: ['questions', question.id, 'answers', answer.id] });
      }
    }
    const modes = [DEVICE_MODE_NORMAL, ...features.deviceModes.map((mode) => mode.id)];
    for (const mode of new Set(modes)) {
      required.push({ keys: ['deviceModes', mode] });
    }
  }
  if (rights !== undefined) {
    for (const right of rights.rights) {
      required.push(...nameAndSummary(['rights', right.id]));
    }
  }
  return required;
}

/** One text for each code under a section: the words of a fixed list (`extents`, `levels`, `errors`, `cantons`). */
export function codeTexts(section: string, codes: readonly string[]): RequiredText[] {
  return codes.map((code) => ({ keys: [section, code] }));
}

export const MISSING_TEXT_RULE = 'missing_text';

/** A text a catalogue should have and does not, as data in the style of the standard tests. */
export interface MissingText {
  rule: typeof MISSING_TEXT_RULE;
  /** What is missing, in English. */
  message: string;
  /** The keys from the top, joined by dots. */
  path: string;
  /** The keys, so an id with a dot in it stays whole. */
  keys: readonly string[];
}

/**
 * Every required text the catalogue does not hold as a text that says something: the key is
 * missing, or there is a record, a message function or an empty text instead. The catalogue to
 * give is the one an edition puts together (`mergeCatalogues`, or the resolved catalogue of one
 * language). A test expects `[]` for the language that must be complete.
 */
export function missingTexts(catalogue: unknown, required: readonly RequiredText[]): MissingText[] {
  return required.flatMap(({ keys }) => {
    let at: unknown = catalogue;
    for (const key of keys) {
      at =
        typeof at === 'object' && at !== null && Object.hasOwn(at, key)
          ? (at as Record<string, unknown>)[key]
          : undefined;
    }
    if (typeof at === 'string' && at.trim() !== '') {
      return [];
    }
    const path = keys.join('.');
    return [
      {
        rule: MISSING_TEXT_RULE,
        message: `The catalogue has no text at ${path}.`,
        path,
        keys,
      },
    ];
  });
}
