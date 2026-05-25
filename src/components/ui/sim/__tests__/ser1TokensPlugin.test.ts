import { Linter } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { describe, expect, it } from 'vitest';
import ser1TokensPlugin from '../../../../../tools/eslint-plugin-ser1-tokens/index.js';

function verify(code: string, ruleName: string, options: Record<string, unknown> = {}) {
  const linter = new Linter({ configType: 'flat' });

  return linter.verify(
    code,
    [
      {
        files: ['**/*.{tsx,ts}'],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          parser: tsParser,
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
        plugins: {
          'ser1-tokens': ser1TokensPlugin,
        },
        rules: {
          [`ser1-tokens/${ruleName}`]: ['warn', options],
        },
      },
    ],
    { filename: 'src/components/Fixture.tsx' },
  );
}

describe('eslint-plugin-ser1-tokens', () => {
  it('émet un avertissement sur un espacement inline hardcodé', () => {
    const messages = verify(
      'const Demo = () => <div style={{ padding: 12 }} />;',
      'no-hardcoded-spacing',
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]?.severity).toBe(1);
    expect(messages[0]?.ruleId).toBe('ser1-tokens/no-hardcoded-spacing');
  });

  it('accepte les tokens de fondation dans les styles inline', () => {
    const messages = verify(
      'const Demo = () => <div style={{ gap: "var(--space-3)" }} />;',
      'no-hardcoded-spacing',
    );

    expect(messages).toHaveLength(0);
  });

  it('respecte l allowlist de baseline', () => {
    const messages = verify(
      'const Demo = () => <div style={{ padding: 12 }} />;',
      'no-hardcoded-spacing',
      {
        allowlist: ['no-hardcoded-spacing:padding:12'],
      },
    );

    expect(messages).toHaveLength(0);
  });

  it('détecte les transitions inline hardcodées', () => {
    const messages = verify(
      'const Demo = () => <div style={{ transition: "opacity 220ms ease" }} />;',
      'no-hardcoded-transition',
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]?.ruleId).toBe('ser1-tokens/no-hardcoded-transition');
  });
});
