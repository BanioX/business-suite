export {
  EDITION_PARTS,
  EditionError,
  MANIFEST_PROBLEM_CODES,
  ManifestError,
  type EditionPart,
  type EditionProblem,
  type ManifestPart,
  type ManifestProblem,
  type ManifestProblemCode,
} from './errors';
export type {
  DemoDefinition,
  DemoInput,
  MigrationDefinition,
  MigrationInput,
  PlainRecord,
  RuleSetDefinition,
  RuleSetInput,
  TemplateDefinition,
  TemplateInput,
} from './entries';
export {
  INDUSTRY_ID_PATTERN,
  defineIndustry,
  defineModule,
  industryProblems,
  moduleProblems,
  type AnyUseCases,
  type Industry,
  type IndustryInput,
  type Module,
  type ModuleInput,
  type UseCaseEnvironment,
  type UseCaseFactory,
} from './part';
export { businessModule } from './business-module';
export { defineEdition, editionInputProblems, type Edition, type EditionInput } from './edition';
export {
  composeEdition,
  editionProblems,
  startEdition,
  type ComposedEdition,
  type EditionRuntime,
  type RunningEdition,
} from './compose';
export {
  SLOT_IDS,
  SLOT_PAGES,
  availableSlotEntries,
  type SectionSlotEntry,
  type SlotEntries,
  type SlotEntry,
  type SlotId,
  type SlotPage,
} from './slots';
