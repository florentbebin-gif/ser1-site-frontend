import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';
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
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Color governance rules (warn during migration, upgrade to error after cleanup)
      'ser1-colors/no-hardcoded-colors': 'warn',
      'ser1-colors/use-semantic-colors': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.test.{js,ts,jsx,tsx}'],
    rules: {
      'no-console': 'off',
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
      'src/pptx/theme/semanticColors.ts',
      'src/pptx/theme/getPptxThemeFromUiSettings.ts',
      'src/utils/paletteGenerator.ts',
      'src/pages/Settings.jsx', // Définitions des thèmes prédéfinis
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
