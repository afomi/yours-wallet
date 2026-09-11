import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';

/**
 * Flat config. Three rule families are deliberately set to "warn" so CI stays green
 * while the existing backlog is burned down; promote them to "error" once `bun run lint`
 * reports zero warnings. See docs/linting.md.
 */
export default tseslint.config(
  {
    ignores: ['build/**', 'release/**', 'public/builds/**', 'node_modules/**', '.eslintrc.js'],
  },

  {
    // Stale directives are part of the backlog, not a build failure. Reported as warnings
    // so they can be cleaned up file by file (most point at rules this config turns off).
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },

  // Application source: type-aware linting, browser + extension globals.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        ...globals.webextensions,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Unused variables: allow the _-prefix convention for intentional discards.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // React Hooks correctness. The plugin's own preset sets most of these to "error";
      // they are enumerated here at "warn" instead so the backlog does not break CI.
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/void-use-memo': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/config': 'warn',
      'react-hooks/gating': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/unsupported-syntax': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Promise handling: the rules that catch unawaited wallet operations.
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/require-await': 'warn',
      'no-async-promise-executor': 'warn',
      'require-atomic-updates': 'warn',

      // Carried over from the previous .eslintrc.js.
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      // Not in the three target families, but worth keeping visible. Downgraded from the
      // presets' "error" so the whole backlog reports uniformly as warnings.
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
      '@typescript-eslint/only-throw-error': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      'preserve-caught-error': 'warn',
      'no-useless-assignment': 'warn',
      'prefer-const': 'warn',
      'no-empty': 'warn',

      // Noisy on this codebase and not part of the three target families.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
    },
  },

  // Build and release scripts: same rule families, without type-aware linting.
  {
    files: ['scripts/**/*.ts', 'vite.config*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-async-promise-executor': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      // Downgraded from js.configs.recommended's "error" to keep the whole
      // report uniform: nothing fails until a rule is deliberately promoted.
      'no-empty': 'warn',
      'no-useless-assignment': 'warn',
      'prefer-const': 'warn',
    },
  },

  // Prettier owns formatting; keep ESLint out of it.
  prettier,
);
