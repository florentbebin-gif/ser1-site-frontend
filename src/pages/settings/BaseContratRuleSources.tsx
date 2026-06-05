import { resolveRuleSourceUrl } from '@/domain/base-contrat/rules/sourceUrls';
import type { RuleSource } from '@/domain/base-contrat/rules';

export function RuleSourcesList({ sources }: { sources: RuleSource[] }) {
  return (
    <ul className="settings-reference-rule-meta__list">
      {sources.map((source) => {
        const sourceUrl = resolveRuleSourceUrl(source);

        return (
          <li key={`${source.label}-${source.refId ?? source.url ?? 'source-sans-url'}`}>
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            ) : (
              <span>{source.label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
