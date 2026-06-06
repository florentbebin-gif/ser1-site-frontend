import chainData from './chain.json';
import type { SettingsReferenceBinding } from './types';

export const SETTINGS_REFERENCE_CHAIN = chainData as readonly SettingsReferenceBinding[];

export function listSettingsReferenceBindings(
  pagePath?: string,
  chain: readonly SettingsReferenceBinding[] = SETTINGS_REFERENCE_CHAIN,
): SettingsReferenceBinding[] {
  if (!pagePath) return [...chain];
  return chain.filter((binding) => binding.pagePath === pagePath);
}
