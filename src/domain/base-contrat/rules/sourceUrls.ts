import { getOptionalLegalReference } from '@/domain/legal-references';
import type { RuleSource } from './types';

export function resolveRuleSourceUrl(source: RuleSource): string | undefined {
  if (source.refId) {
    return getOptionalLegalReference(source.refId)?.officialUrl ?? source.url;
  }

  return source.url;
}
