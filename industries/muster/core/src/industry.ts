import { defineIndustry } from '@onestrand/manifest';
import { musterDemo, musterRuleSets, musterTemplates } from './content';
import { MUSTER_EVENT_TYPES, musterContract } from './contract';
import { MUSTER, musterCatalog, musterRights } from './entries';
import { musterTables } from './model';
import { createMusterUseCases } from './use-cases';

/**
 * The manifest of `muster` (suite ADR-0004, 1): the reference industry, which uses every part of
 * `defineIndustry` once and is the living contract test of the platform. It docks by being listed
 * in an edition; no file of the platform names it.
 *
 * It has no migration: a migration changes the form an older version of a table wrote, and
 * `muster_entries` has had one form only. The first change of its form brings the first one
 * (`migrations: [{ id: 'muster.<name>', table: 'muster_entries', upgrade }]`, and a step of the
 * schema ledger of every edition that has the industry).
 */
export const muster = defineIndustry({
  id: MUSTER,
  tables: musterTables,
  contract: musterContract,
  useCases: createMusterUseCases,
  catalog: musterCatalog,
  rights: musterRights,
  events: MUSTER_EVENT_TYPES,
  templates: musterTemplates,
  ruleSets: musterRuleSets,
  demo: musterDemo,
});
