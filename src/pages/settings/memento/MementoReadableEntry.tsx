import type { ReactElement } from 'react';

import { getOptionalLegalReference, type LegalReferenceId } from '@/domain/legal-references';
import type { MementoLexiconTerm } from '@/domain/settings-memento/lexicon';
import type { MementoEntry } from '@/domain/settings-memento/types';
import { getOptionalSimulatorDefinition } from '@/domain/simulators/registry';

import { MEMENTO_LEXICON_PRUDENCE_LABELS, MEMENTO_PRUDENCE_LABELS } from './mementoDisplayPlan';

type MementoReadableEntryProps =
  | {
      kind: 'entry';
      entry: MementoEntry;
    }
  | {
      kind: 'lexicon';
      term: MementoLexiconTerm;
    };

function referenceLabel(referenceId: LegalReferenceId): {
  href: string;
  label: string;
} | null {
  const reference = getOptionalLegalReference(referenceId);
  if (!reference) return null;
  if (reference.officialUrl.toLowerCase().includes('.pdf')) return null;

  return {
    href: reference.officialUrl,
    label: reference.articleOrSection
      ? `${reference.label} (${reference.articleOrSection})`
      : reference.label,
  };
}

function SourceLinks({ refIds }: { refIds: readonly LegalReferenceId[] }): ReactElement | null {
  const references = refIds
    .map((refId) => referenceLabel(refId))
    .filter((reference): reference is { href: string; label: string } => reference !== null);

  if (references.length === 0) return null;

  return (
    <div className="settings-memento-readable-entry__sources" aria-label="Sources officielles">
      <span>Sources officielles</span>
      <div>
        {references.map((reference) => (
          <a
            key={`${reference.href}-${reference.label}`}
            href={reference.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {reference.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function SimulatorLinks({ entry }: { entry: MementoEntry }): ReactElement | null {
  const simulatorLabels = entry.relatedSimulatorIds
    .map((simulatorId) => getOptionalSimulatorDefinition(simulatorId)?.shortLabel)
    .filter((label): label is string => Boolean(label));

  if (simulatorLabels.length === 0) return null;

  return (
    <p className="settings-memento-readable-entry__used-by">
      <span>Utilisé par</span> {simulatorLabels.join(', ')}
    </p>
  );
}

export default function MementoReadableEntry(props: MementoReadableEntryProps): ReactElement {
  if (props.kind === 'lexicon') {
    const prudence = MEMENTO_LEXICON_PRUDENCE_LABELS[props.term.status];

    return (
      <article className="settings-memento-readable-entry settings-memento-readable-entry--lexicon">
        <div className="settings-memento-readable-entry__header">
          <h5>{props.term.term}</h5>
          {prudence ? <span>{prudence}</span> : null}
        </div>
        <p>{props.term.shortDefinition}</p>
        <SourceLinks refIds={props.term.refIds} />
      </article>
    );
  }

  const prudence = MEMENTO_PRUDENCE_LABELS[props.entry.status];

  return (
    <article className="settings-memento-readable-entry">
      <div className="settings-memento-readable-entry__header">
        <h5>{props.entry.label}</h5>
        {prudence ? <span>{prudence}</span> : null}
      </div>
      <p>{props.entry.description}</p>
      <SimulatorLinks entry={props.entry} />
      <SourceLinks refIds={props.entry.refIds} />
    </article>
  );
}
