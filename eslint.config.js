// @ts-check
import js from '@eslint/js';
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
};

/** What the pure TypeScript part of a package never imports: UI, databases, Node. */
const NOT_PURE = [
  { name: 'react', message: 'The pure part of a package knows no UI (architecture 3.2, rule 1).' },
  { name: 'react-dom', message: 'The pure part of a package knows no UI (architecture 3.2).' },
  { name: 'dexie', message: 'Storage is reached through ports only (architecture 3.2, rule 1).' },
  { name: 'dexie-react-hooks', message: 'Storage is reached through ports only.' },
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

const NO_INDUSTRY = {
  group: ['**/industries/**', '**/editions/**'],
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
  '(^|\\/)(industries|editions)(\\/|$)',
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

/** Import rules of one platform package, for the files given. */
function platformBoundaries(name, allowed, { pure }) {
  return {
    'no-restricted-imports': [
      'error',
      {
        paths: pure ? NOT_PURE : [],
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
          ...(pure
            ? [
                {
                  regex: '^node:',
                  message: 'The pure part of a package runs without Node (architecture 3.2).',
                },
                {
                  // The same packages through a subpath, such as `react-dom/client`.
                  group: NOT_PURE.map((entry) => `${entry.name}/**`),
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
      'no-restricted-globals': [
        'error',
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
      ],
    },
  },
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
      rules: platformBoundaries(name, allowed, { pure: true }),
    },
  ]),
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
);
