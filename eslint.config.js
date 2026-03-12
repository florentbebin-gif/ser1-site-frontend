import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import ser1ColorsPlugin from './tools/eslint-plugin-ser1-colors/index.js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'ser1-colors': ser1ColorsPlugin,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Color governance rules (strict mode)
      'ser1-colors/no-hardcoded-colors': 'error',
      'ser1-colors/use-semantic-colors': 'error',
      // God-file detection (PR-D Phase 5A)
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // TypeScript-specific rules (PR-D Phase 5A)
  // Replaces no-unused-vars with the TS-aware version to avoid false positives
  // on type annotation parameter names, interface augmentations, etc.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.test.{js,ts,jsx,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['tests/e2e/**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Source of truth files - colors are defined here
  {
    files: [
      'src/settings/theme.ts',
      'src/styles/semanticColors.ts',
      'src/pptx/theme/getPptxThemeFromUiSettings.ts',
      'src/utils/paletteGenerator.ts',
      'src/pages/Settings.tsx', // Définitions des thèmes prédéfinis
      'src/pptx/export/demoExport.ts', // Thème démo pour tests
      'src/components/ui/SessionExpiredBanner.tsx', // Fallback colors (session expired = no theme)
    ],
    rules: {
      'ser1-colors/no-hardcoded-colors': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts', 'tools/eslint-plugin-ser1-colors/**'],
  },
];
