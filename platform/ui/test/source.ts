import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** The root of the package. */
export const PACKAGE_ROOT = join(import.meta.dirname, '..');

/** A file of the package: its path from the root of the package (`src/Button.tsx`) and its text. */
export interface PackageFile {
  path: string;
  code: string;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') {
      return [];
    }
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/** Every file under the given directories of the package, sorted by path. */
export function packageFiles(...dirs: string[]): PackageFile[] {
  return dirs
    .flatMap((dir) => walk(join(PACKAGE_ROOT, dir)))
    .map((path) => ({
      path: relative(PACKAGE_ROOT, path).split('\\').join('/'),
      code: readFileSync(path, 'utf8'),
    }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
