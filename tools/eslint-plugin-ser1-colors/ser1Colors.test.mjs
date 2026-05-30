import { RuleTester } from 'eslint';
import { test } from 'node:test';
import plugin from './index.js';

const rule = plugin.rules['no-hardcoded-colors'];

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

test('ser1-colors/no-hardcoded-colors applique la policy partagee', () => {
  tester.run('no-hardcoded-colors', rule, {
    valid: [
      {
        code: "const background = 'var(--surface-card)';",
        filename: 'C:/repo/src/components/Card.tsx',
      },
      {
        code: "const palette = '#996600';",
        filename: 'C:/repo/src/settings/presets.ts',
      },
      {
        code: "const palette = '#0E1426';",
        filename: 'C:/repo/src/components/Card.test.ts',
      },
      {
        code: "const stroke = 'var(--color-c5)';",
        filename: 'C:/repo/src/pages/settings/SettingsDesignSystemColorPreview.tsx',
      },
    ],
    invalid: [
      {
        code: "const warning = '#996600';",
        filename: 'C:/repo/src/components/Card.tsx',
        errors: [{ messageId: 'noHardcodedColor' }],
      },
      {
        code: "const background = 'rgba(0, 0, 0, 0.5)';",
        filename: 'C:/repo/src/components/Card.tsx',
        errors: [{ messageId: 'noHardcodedColor' }],
      },
      {
        code: "const background = 'var(--color-c4)';",
        filename: 'C:/repo/src/components/Card.tsx',
        errors: [{ messageId: 'noRawThemeVar' }],
      },
    ],
  });
});
