import { describe, expect, it } from 'vitest';
import { CGP_GLOSSARY_ENTRIES } from './cgpGlossary';

describe('cgpGlossary', () => {
  it('expose un glossaire CGP dense sans valeur fiscale en dur', () => {
    expect(CGP_GLOSSARY_ENTRIES.length).toBeGreaterThanOrEqual(12);
    expect(
      CGP_GLOSSARY_ENTRIES.every((entry) => entry.id && entry.label && entry.description),
    ).toBe(true);
    expect(JSON.stringify(CGP_GLOSSARY_ENTRIES)).not.toMatch(/\b(?:17\.2|12\.8|30|100000|15932)\b/);
  });
});
