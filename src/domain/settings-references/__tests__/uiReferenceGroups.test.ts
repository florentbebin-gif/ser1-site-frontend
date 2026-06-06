import { describe, expect, it } from 'vitest';
import settingsReferenceChain from '../chain.json';
import { SETTINGS_UI_REFERENCE_GROUPS } from '../uiReferenceGroups';

interface SettingsReferenceBindingFixture {
  claimKey: string;
  refIds?: string[];
}

function getExpectedRefIds(claimKeys: readonly string[]): string[] {
  return Array.from(
    new Set(
      claimKeys.flatMap((claimKey) => {
        const binding = (settingsReferenceChain as SettingsReferenceBindingFixture[]).find(
          (candidate) => candidate.claimKey === claimKey,
        );
        return binding?.refIds ?? [];
      }),
    ),
  );
}

describe('settings UI reference groups', () => {
  it('restent alignés avec les bindings settings-references', () => {
    for (const group of SETTINGS_UI_REFERENCE_GROUPS) {
      expect([...group.refIds]).toEqual(getExpectedRefIds(group.claimKeys));
    }
  });
});
