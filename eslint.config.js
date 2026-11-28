// @ts-check
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Layers of the platform (docs/architektur.md, 3.2): a package imports only the packages listed
 * for it. A platform package that is missing here may import no other platform package, so a new
 * package gets its line on purpose. Industries and editions are never listed: the platform
 * imports no industry.
 */
const PLATFORM_LAYERS = {
  core: [],
  contract: ['core'],
  storage: ['core', 'contract'],
  ledger: ['core', 'contract', 'storage'],
  testing: ['core', 'contract', 'storage'],
  features: ['contract'],
  access: ['contract', 'storage', 'features'],
  business: ['core', 'contract', 'storage', 'features', 'access'],
  i18n: [],
  manifest: ['core', 'contract', 'storage', 'features', 'access', 'business', 'i18n'],
  'web-data': ['core', 'contract', 'storage', 'business', 'manifest'],
  // The kit draws and speaks: numbers and dates of the core, its catalogue through i18n. It knows
  // no data, no rights and no device; those reach a page through the hooks of the shell.
  ui: ['core', 'i18n'],
  // The device: ports and the logic over the browser in `src/`, the checksum of a signature
  // through the storage. Its React part (`src/web/`) has a line of its own in REACT_PARTS.
  'web-device': ['core', 'storage'],
};

/**
 * The packages of the layer «Browser» (docs/architektur.md, 3.2), by name and not by pattern, each
 * with the globals it may reach. Everything else a pure package may not reach stays closed for them
 * too, and so do UI, Node and every import rule of the pure part: such a package differs from a pure
 * one in these globals only. A new browser package is a decision made in three places: here, in the
 * test of the boundaries (tools/test/lint-boundaries.test.ts), and in the purity check of its own
 * `tsconfig.src.json` (the DOM types).
 *
 * The code still takes the outside world as a parameter wherever it can; the global is only the
 * default (`function open(factory = indexedDB)`).
 */
const BROWSER_PACKAGES = {
  'web-data': ['indexedDB', 'localStorage', 'navigator', 'crypto'],
  // Share, print, download, camera, pictures, wake lock, badge, clipboard: all built in one file
  // (`createBrowserDevice`) and handed to the rest of the package as the port `Device`.
  'web-device': ['window', 'document', 'navigator', 'crypto'],
};

/**
 * The packages of the layer «React» (docs/architektur.md, 3.2): their whole `src/` is React. Each
 * is held to the rules of a pure package with three differences: it imports React and its icons
 * (`REACT_IMPORTS`), it reaches the globals named for it and no others, and the rules of the
 * hooks of React apply. `window` and `document` are for focus, timers and the modal dialog; no
 * storage, no network, no crypto: the kit has no side effects (its own test proves it), and what
 * leaves the screen goes through the shell and the packages of the layer «Browser». A new React
 * package is a decision made in three places: here, in tools/test/lint-boundaries.test.ts, and in
 * the purity check of its `tsconfig.src.json` (DOM and JSX, no Node).
 */
const REACT_PACKAGES = {
  ui: ['window', 'document'],
};

/**
 * The React parts of packages of the layer «Browser»: `src/web/`, published as
 * `@onestrand/<name>/web`. The rest of `src/` stays a browser package, held to its rules, and
 * imports nothing from `src/web/`, so the logic runs and is tested without React. The React part
 * is held to the rules of a React package with its own layers and globals: it imports the logic of
 * its package by relative path, the kit (`ui`) and the packages named here. A new React part is a
 * decision made in three places: here, in tools/test/lint-boundaries.test.ts, and in the purity
 * check of the package's `tsconfig.src.json` (DOM and JSX, no Node).
 */
const REACT_PARTS = {
  'web-device': { layers: ['core', 'i18n', 'storage', 'ui'], reach: ['window', 'document'] },
};

/** The React part of a package: every file of code under its `src/web/`. */
function reactPartFiles(name) {
  return `platform/${name}/src/web/**/${CODE}`;
}

/** What a React package imports that a pure one never does. `react-dom` stays closed: mounting the app is the edition's job. */
const REACT_IMPORTS = ['react', 'lucide-react'];

/** The globals the pure part of a package never reaches: the browser's and Node's. */
const PURE_RESTRICTED_GLOBALS = [
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'fetch',
  'navigator',
  'process',
  'Buffer',
  'crypto',
];

/** What the pure TypeScript part of a package never imports: UI, databases, Node. */
const NOT_PURE = [
  { name: 'react', message: 'The pure part of a package knows no UI (architecture 3.2, rule 1).' },
  { name: 'react-dom', message: 'The pure part of a package knows no UI (architecture 3.2).' },
  { name: 'dexie', message: 'Storage is reached through ports only (architecture 3.2, rule 1).' },
  { name: 'dexie-react-hooks', message: 'Storage is reached through ports only.' },
  { name: 'lucide-react', message: 'The pure part of a package knows no UI (architecture 3.2).' },
];

/**
 * Every file of code, whatever its extension: a `.tsx` or a `.mjs` put somewhere by mistake is
 * held to the same rules as a `.ts`, not let through.
 */
const CODE = '*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}';

/** The pure part of a platform package: every file of code under its `src/`. */
function pureFiles(name) {
  return `platform/${name}/src/**/${CODE}`;
}

/**
 * The scope of the packages of the industries (`industries/<id>/core` is `@onestrand-industry/<id>`).
 * It lies outside `@onestrand/`, so no rule written for the platform's own packages lets an
 * industry through by accident; every rule below names it.
 */
const INDUSTRY_SCOPE = '@onestrand-industry';

const NO_INDUSTRY = {
  group: ['**/industries/**', '**/editions/**', `${INDUSTRY_SCOPE}/*`, `${INDUSTRY_SCOPE}/**`],
  message: 'The platform imports no industry and no edition (architecture 3.2, rule 2).',
};

/**
 * `import('…')` is no import statement, so `no-restricted-imports` does not see it. This selector
 * does, for a place an import must never reach whatever its form. (The third form, the type
 * `import('…').Thing`, is refused everywhere by `consistent-type-imports` below.)
 */
function dynamicImportOf(pattern, message) {
  return { selector: `ImportExpression[source.value=/${pattern}/]`, message };
}

const NO_INDUSTRY_DYNAMIC = dynamicImportOf(
  `(^|\\/)(industries|editions)(\\/|$)|^${INDUSTRY_SCOPE}\\/`,
  NO_INDUSTRY.message,
);

/**
 * The pure part imports with import statements only. So the rules above see every import, and
 * none slips past them as `import('…')`.
 */
const STATIC_IMPORTS_ONLY = [
  'error',
  {
    selector: 'ImportExpression',
    message:
      'The pure part of a package imports with import statements only, so the import rules see every import.',
  },
];

/**
 * Import rules of one platform package, for the files given. `react` opens React and its icons
 * (a React package, or the React part of a package); `extra` adds patterns of its own.
 */
function platformBoundaries(name, allowed, { pure, react = name in REACT_PACKAGES, extra = [] }) {
  // A React package is pure in everything but React itself.
  const notPure = react
    ? NOT_PURE.filter((entry) => !REACT_IMPORTS.includes(entry.name))
    : NOT_PURE;
  return {
    'no-restricted-imports': [
      'error',
      {
        paths: pure ? notPure : [],
        patterns: [
          {
            // Every platform package except the layers below this one. Its own name is
            // forbidden too: inside a package, files import each other by relative path.
            group: ['@onestrand/*', ...allowed.map((layer) => `!@onestrand/${layer}`)],
            message: `@onestrand/${name} may import only: ${allowed.map((layer) => `@onestrand/${layer}`).join(', ') || 'no other platform package'} (architecture 3.2).`,
          },
          {
            group: ['@onestrand/*/*', '!@onestrand/*/web', '!@onestrand/*/testing'],
            message: 'Import the public entry of a package, never a file inside it.',
          },
          NO_INDUSTRY,
          {
            // A relative path that climbs out of the package or reaches into another one.
            regex: '^(\\.\\./)+(.*/)?(platform|tools|src|test|node_modules)(/|$)',
            message: 'Stay inside the package: other packages are imported by their name.',
          },
          ...extra,
          ...(pure
            ? [
                {
                  regex: '^node:',
                  message: 'The pure part of a package runs without Node (architecture 3.2).',
                },
                {
                  // The same packages through a subpath, such as `react-dom/client`.
                  group: notPure.map((entry) => `${entry.name}/**`),
                  message:
                    'The pure part of a package knows no UI and no database (architecture 3.2).',
                },
                {
                  group: ['@onestrand/*/web'],
                  message: 'The pure part of a package imports no React part (architecture 3.2).',
                },
              ]
            : []),
        ],
      },
    ],
    ...(pure ? { 'no-restricted-syntax': STATIC_IMPORTS_ONLY } : {}),
  };
}

/**
 * The industries (suite ADR-0004, «Was eine Branche nicht darf»; docs/architektur.md, 3.2). An
 * industry lies in `industries/<id>/`; its pure part, `industries/<id>/core`, is the package
 * `@onestrand-industry/<id>` and is held to the rules of the pure part of the platform: no UI, no
 * database, no Node, no browser global, import statements only. On top of that:
 *
 * - it imports the platform by the public entry of a package, never a file inside one, and only
 *   packages of the pure layers: not the layer «Browser» (`BROWSER_PACKAGES`) and not the test kit;
 * - it imports no other industry, by path or by name, and itself only by relative path;
 * - it imports no edition: the edition lists the industry, never the other way round.
 *
 * The React part (`industries/<id>/web`) gets its rules with W0-03.
 */
function industryCoreFiles(part) {
  return `industries/*/core/${part}/**/${CODE}`;
}

/** Platform packages the pure part of an industry never imports: the browser layer and the test kit. */
const NOT_FOR_INDUSTRY_CORE = [...Object.keys(BROWSER_PACKAGES), 'testing'];

const NO_OTHER_INDUSTRY = {
  group: ['**/industries/**', `${INDUSTRY_SCOPE}/*`, `${INDUSTRY_SCOPE}/**`],
  message:
    'An industry imports no other industry, and its own files by relative path (suite ADR-0004).',
};

const NO_EDITION = {
  group: ['**/editions/**'],
  message: 'An industry imports no edition: the edition lists the industry (suite ADR-0004, 2).',
};

const NO_OTHER_INDUSTRY_DYNAMIC = dynamicImportOf(
  `(^|\\/)(industries|editions)(\\/|$)|^${INDUSTRY_SCOPE}\\/`,
  'An industry imports no other industry and no edition (suite ADR-0004).',
);

function industryBoundaries({ pure }) {
  return {
    'no-restricted-imports': [
      'error',
      {
        paths: pure
          ? [
              ...NOT_PURE,
              ...NOT_FOR_INDUSTRY_CORE.map((name) => ({
                name: `@onestrand/${name}`,
                message:
                  name === 'testing'
                    ? 'The test kit belongs in tests, never in what an industry ships.'
                    : `@onestrand/${name} belongs to the layer «Browser»; the pure part of an industry runs without a browser (architecture 3.2).`,
              })),
            ]
          : [],
        patterns: [
          {
            group: pure
              ? ['@onestrand/*/*']
              : ['@onestrand/*/*', '!@onestrand/*/web', '!@onestrand/*/testing'],
            message: pure
              ? 'The pure part of an industry imports the public entry of a platform package: no file inside it and no React part.'
              : 'Import the public entry of a package, never a file inside it.',
          },
          NO_OTHER_INDUSTRY,
          NO_EDITION,
          pure
            ? {
                // Out of `src` into the tests, the web part or anything beside the package.
                regex:
                  '^(\\.\\./)+(.*/)?(industries|platform|editions|tools|core|web|src|test|node_modules)(/|$)',
                message: 'Stay inside the package: other packages are imported by their name.',
              }
            : {
                regex: '^(\\.\\./){2,}',
                message: 'Stay inside the package: other packages are imported by their name.',
              },
          ...(pure
            ? [
                {
                  regex: '^node:',
                  message: 'The pure part of an industry runs without Node (architecture 3.2).',
                },
                {
                  group: NOT_PURE.map((entry) => `${entry.name}/**`),
                  message:
                    'The pure part of an industry knows no UI and no database (architecture 3.2).',
                },
              ]
            : []),
        ],
      },
    ],
    'no-restricted-syntax': pure
      ? STATIC_IMPORTS_ONLY
      : [
          'error',
          NO_OTHER_INDUSTRY_DYNAMIC,
          dynamicImportOf(
            '^@onestrand\\/[^\\/]+\\/(?!(web|testing)$)',
            'Import the public entry of a package, never a file inside it.',
          ),
          dynamicImportOf(
            '^(\\.\\.\\/){2,}',
            'Stay inside the package: other packages are imported by their name.',
          ),
        ],
  };
}

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/coverage/',
      '**/playwright-report/',
      '**/test-results/',
      '**/dev-dist/',
      '**/.previews/',
      '.claude/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // A leading underscore marks a parameter that is there for the signature only.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    // The tools run on Node and print their results.
    files: ['tools/**/*.{ts,mjs}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
  {
    // The pure TypeScript part of every platform package stays free of browser and Node APIs,
    // so the same logic runs in the browser, in tests and later on a server.
    files: [pureFiles('*')],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-globals': ['error', ...PURE_RESTRICTED_GLOBALS],
    },
  },
  // The packages of the layers «Browser» and «React» reach the globals named for them, and no others.
  ...Object.entries({ ...BROWSER_PACKAGES, ...REACT_PACKAGES }).map(([name, reach]) => ({
    files: [pureFiles(name)],
    rules: {
      'no-restricted-globals': [
        'error',
        ...PURE_RESTRICTED_GLOBALS.filter((global) => !reach.includes(global)),
      ],
    },
  })),
  {
    // Whatever stands under `platform/` and whatever form the import has: no industry and no
    // edition. The blocks below replace these two rules for the pure part and for the tests of
    // a package, each with its own, stricter list; this one holds for everything else (the
    // configuration of a package, a directory that has no rules of its own yet).
    files: [`platform/**/${CODE}`],
    rules: {
      'no-restricted-imports': ['error', { patterns: [NO_INDUSTRY] }],
      'no-restricted-syntax': ['error', NO_INDUSTRY_DYNAMIC],
    },
  },
  // Layers: the pure part of a package. Lint does not hold the tests of a package to the
  // layers (they may use Node and the package's own devDependencies); there pnpm does, which
  // links only the packages a package.json declares.
  ...Object.entries(PLATFORM_LAYERS).flatMap(([name, allowed]) => [
    {
      files: [pureFiles(name)],
      rules: platformBoundaries(name, allowed, {
        pure: true,
        // The part of a package beside its React part never reaches into it.
        extra:
          name in REACT_PARTS
            ? [
                {
                  regex: '^\\.{1,2}/(.*/)?web(/|$)',
                  message:
                    'The logic of a package imports no React part, so it runs without React (architecture 3.2).',
                },
              ]
            : [],
      }),
    },
  ]),
  // The React part of a package of the layer «Browser»: its own layers, React, and its globals.
  ...Object.entries(REACT_PARTS).map(([name, { layers, reach }]) => ({
    files: [reactPartFiles(name)],
    rules: {
      ...platformBoundaries(name, layers, { pure: true, react: true }),
      'no-restricted-globals': [
        'error',
        ...PURE_RESTRICTED_GLOBALS.filter((global) => !reach.includes(global)),
      ],
    },
  })),
  {
    // A platform package without a line in PLATFORM_LAYERS imports no other platform package.
    files: [pureFiles('*')],
    ignores: Object.keys(PLATFORM_LAYERS).map((name) => `platform/${name}/**`),
    rules: platformBoundaries('<new package>', [], { pure: true }),
  },
  {
    // Tests of the platform: no industry, no edition, no file inside another package. A test
    // may load a module of its own package with `import('…')`, so here the same three places
    // are closed for that form too.
    files: [`platform/*/test/**/${CODE}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@onestrand/*/*', '!@onestrand/*/web', '!@onestrand/*/testing'],
              message: 'Import the public entry of a package, never a file inside it.',
            },
            NO_INDUSTRY,
            {
              regex: '^(\\.\\./){2,}',
              message: 'Stay inside the package: other packages are imported by their name.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        NO_INDUSTRY_DYNAMIC,
        dynamicImportOf(
          '^@onestrand\\/[^\\/]+\\/(?!(web|testing)$)',
          'Import the public entry of a package, never a file inside it.',
        ),
        dynamicImportOf(
          '^(\\.\\.\\/){2,}',
          'Stay inside the package: other packages are imported by their name.',
        ),
      ],
    },
  },
  {
    // Whatever stands under `industries/` (a configuration, a part without rules of its own
    // yet): no edition, in any form. The blocks below replace this for the core of an industry.
    files: [`industries/**/${CODE}`],
    rules: {
      'no-restricted-imports': ['error', { patterns: [NO_EDITION] }],
      'no-restricted-syntax': [
        'error',
        dynamicImportOf('(^|\\/)editions(\\/|$)', NO_EDITION.message),
      ],
    },
  },
  {
    // The pure part of an industry: the globals of neither the browser nor Node.
    files: [industryCoreFiles('src')],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-globals': ['error', ...PURE_RESTRICTED_GLOBALS],
      ...industryBoundaries({ pure: true }),
    },
  },
  {
    // The tests of an industry run on Node and may use the test kit; they stay in their package
    // and reach no other industry and no edition, in any form.
    files: [industryCoreFiles('test')],
    rules: industryBoundaries({ pure: false }),
  },
  {
    // The rules of the hooks of React, wherever a React package keeps code: its sources, its
    // tests and its gallery.
    files: [...Object.keys(REACT_PACKAGES), ...Object.keys(REACT_PARTS)].map(
      (name) => `platform/${name}/**/${CODE}`,
    ),
    extends: [reactHooks.configs.flat.recommended],
  },
);
