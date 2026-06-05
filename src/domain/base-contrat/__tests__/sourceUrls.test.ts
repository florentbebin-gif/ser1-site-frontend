import { describe, expect, it } from 'vitest';
import { CATALOG } from '../catalog';
import { getRules } from '../rules';
import { resolveRuleSourceUrl } from '../rules/sourceUrls';
import { getLegalReference, getOptionalLegalReference } from '@/domain/legal-references';

describe('sources juridiques Base-Contrat', () => {
  it('résout une source refId via legal-references', () => {
    expect(resolveRuleSourceUrl({ label: 'Art. 990 I CGI', refId: 'cgi-990-i' })).toBe(
      getLegalReference('cgi-990-i').officialUrl,
    );
  });

  it('conserve une URL libre quand aucun refId officiel ne la remplace', () => {
    const sourceUrl = 'https://www.service-public.fr/particuliers/vosdroits/F15274';

    expect(resolveRuleSourceUrl({ label: 'Service-Public', url: sourceUrl })).toBe(sourceUrl);
    expect(
      resolveRuleSourceUrl({
        label: 'Source de repli',
        refId: 'reference-inconnue',
        url: sourceUrl,
      }),
    ).toBe(sourceUrl);
  });

  it('référence uniquement des refId existants et rend leur URL officielle', () => {
    const failures: string[] = [];

    for (const product of CATALOG) {
      for (const audience of ['pp', 'pm'] as const) {
        const rules = getRules(product.id, audience);
        const blocks = [...rules.constitution, ...rules.sortie, ...rules.deces];

        for (const block of blocks) {
          for (const source of block.sources ?? []) {
            if (!source.refId) continue;

            const reference = getOptionalLegalReference(source.refId);
            if (!reference) {
              failures.push(
                `${product.id}/${audience}/${block.title}: refId inconnu ${source.refId}`,
              );
              continue;
            }

            const resolvedUrl = resolveRuleSourceUrl(source);
            if (resolvedUrl !== reference.officialUrl) {
              failures.push(
                `${product.id}/${audience}/${block.title}: ${source.refId} résout ${resolvedUrl}`,
              );
            }
          }
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
