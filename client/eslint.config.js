import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import functional from 'eslint-plugin-functional'
import unicorn from 'eslint-plugin-unicorn'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    // Relax functional rules in test files — imperative mocks and setup are fine
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'functional/immutable-data': 'off',
    },
  },
  {
    files: ['src/components/**/*.tsx'],
      rules: {
      'functional/no-mixed-types': 'off',
      },
  },
  {
    files: ['src/state/**/*.tsx'],
    rules: {
      'functional/no-mixed-types': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      // Strict + type-checked: catches unsafe any, unnecessary conditions,
      // unhandled promise rejections, etc. Stylistic for consistency.
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylistic,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      functional.configs['lite'],
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        // projectService auto-discovers tsconfig files in the project hierarchy
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { unicorn },
    rules: {
      // ---- TypeScript: explicit type import/export separation ----
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      // Exhaustiveness is the main payoff of discriminated unions
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // ---- Functional: tune for React reality ----
      // Event handlers and effects are inherently expression/void — allow them
      'functional/no-expression-statements': 'off',
      'functional/no-return-void': 'off',
      // Throwing at app boundaries (entry point, error boundaries) is fine
      'functional/no-throw-statements': 'off',
      // Classes have no place in a functional-core codebase
      'functional/no-classes': 'error',

      // ---- Unicorn: high-signal quality rules ----
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-ternary': ['error', 'only-single-line'],
      'unicorn/no-negated-condition': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/no-useless-spread': 'error',

      // ---- Some more stylistic stuff ----
      '@/semi': ['error', 'always'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-in-parens': ['error', 'never'],
    },
  },
  {
    files: ['src/features/atlas/atlas-color-picker.ts'],
    rules: {
      'functional/no-classes': 'off',
      'functional/no-class-inheritance': 'off',
      'functional/prefer-immutable-types': 'off',
      'functional/immutable-data': 'off',
    },
  },
])
