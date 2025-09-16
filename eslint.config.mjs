import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        confirm: 'readonly',

        // DOM types
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        Document: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',

        // WebExtensions
        browser: 'readonly',

        // Node.js globals (for background scripts)
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        AbortController: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-inner-declarations': 'warn',
    },
  },
  {
    files: ['test/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly',
        expect: 'readonly',
      },
    },
  },
  prettier,
  {
    ignores: [
      'dist/**',
      'web-ext-artifacts/**',
      '.web-ext-artifacts/**',
      'coverage/**',
      'node_modules/**',
      '*.min.js',
      'src/vendor/**',
      'src/ui/old-backup/**',
      'src/ui/vendor/**',
      'commitlint.config.js',
    ],
  },
];
