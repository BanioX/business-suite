// The industries of the repository (suite ADR-0004; docs/architektur.md, 3.1): every directory
// `industries/<id>/core` with a package.json is the pure part of the industry `<id>`, and its
// entry `src/index.ts` exports its manifest, made by `defineIndustry`. The guards read them from
// here, so a new industry is read the moment its directory is there, without a line in a guard.
//
// Reading a manifest means running the code of the industry: the guards do it (Vitest runs the
// TypeScript as it is), the plain Node scripts of the tools do not.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { IndustryShape } from './names.ts';

/** The manifest of an industry as far as the tools read it: the names, and the sources of its rule sets. */
export interface IndustryManifest extends IndustryShape {
  readonly ruleSets: readonly { readonly id: string; readonly source: string }[];
}

/** Where the industries live, from the root of the repository. */
export const INDUSTRIES_DIR = 'industries';

/** An industry as the repository holds it. */
export interface IndustryFolder {
  /** The id of the industry: the name of its directory. */
  readonly id: string;
  /** Its pure part, relative to the root: `industries/<id>/core`. */
  readonly core: string;
  /** The entry of its pure part, relative to the root: `industries/<id>/core/src/index.ts`. */
  readonly entry: string;
}

/** The industries of the repository, by id: every `industries/<id>` with a `core/package.json`. */
export function industryFolders(root: string): IndustryFolder[] {
  const base = join(root, INDUSTRIES_DIR);
  if (!existsSync(base)) {
    return [];
  }
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .filter((id) => existsSync(join(base, id, 'core', 'package.json')))
    .sort()
    .map((id) => ({
      id,
      core: `${INDUSTRIES_DIR}/${id}/core`,
      entry: `${INDUSTRIES_DIR}/${id}/core/src/index.ts`,
    }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The manifest an entry exports: the one export that is an industry with the id of its
 * directory. Throws when there is none or more than one, so a guard never reads nothing.
 */
export function manifestOf(exports: unknown, folder: IndustryFolder): IndustryManifest {
  const found = isRecord(exports)
    ? Object.values(exports).filter(
        (value) => isRecord(value) && value.kind === 'industry' && value.id === folder.id,
      )
    : [];
  const [manifest, ...more] = found;
  if (manifest === undefined || more.length > 0) {
    throw new Error(
      `${folder.entry} must export exactly one manifest made by defineIndustry with the id "${folder.id}", found ${String(found.length)}`,
    );
  }
  return manifest as unknown as IndustryManifest;
}

/** Loads the manifest of every industry of the repository, by running its entry. */
export async function loadIndustries(
  root: string,
): Promise<{ folder: IndustryFolder; manifest: IndustryManifest }[]> {
  const loaded: { folder: IndustryFolder; manifest: IndustryManifest }[] = [];
  for (const folder of industryFolders(root)) {
    const exports: unknown = await import(pathToFileURL(join(root, folder.entry)).href);
    loaded.push({ folder, manifest: manifestOf(exports, folder) });
  }
  return loaded;
}
