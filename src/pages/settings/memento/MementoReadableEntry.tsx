import type { ReactElement } from 'react';

import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import { getOptionalLegalReference, type LegalReferenceId } from '@/domain/legal-references';
import type { MementoLexiconTerm } from '@/domain/settings-memento/lexicon';
import type { MementoEntry } from '@/domain/settings-memento/types';
import { getOptionalSimulatorDefinition } from '@/domain/simulators/registry';

import { MEMENTO_LEXICON_PRUDENCE_LABELS, MEMENTO_PRUDENCE_LABELS } from './mementoDisplayPlan';

type MementoReadableEntryProps =
  | {
      kind: 'entry';
      entry: MementoEntry;
      showStatus: boolean;
    }
  | {
      kind: 'lexicon';
      term: MementoLexiconTerm;
      showStatus: boolean;
    };

function isUsableReferenceId(referenceId: LegalReferenceId): boolean {
  const reference = getOptionalLegalReference(referenceId);
  if (!reference) return false;
  return !reference.officialUrl.toLowerCase().includes('.pdf');
}

function usableReferenceIds(refIds: readonly LegalReferenceId[]): LegalReferenceId[] {
  return refIds.filter(isUsableReferenceId);
}

function ReferenceLinks({ refIds }: { refIds: readonly LegalReferenceId[] }): ReactElement | null {
  const references = usableReferenceIds(refIds);

  if (references.length === 0) return null;

  return (
    <p className="settings-memento-readable-entry__references">
      <LegalRefInlineList ids={references} />
    </p>
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
          {props.showStatus && prudence ? <span>{prudence}</span> : null}
        </div>
        <p>{props.term.shortDefinition}</p>
        <ReferenceLinks refIds={props.term.refIds} />
      </article>
    );
  }

  const prudence = MEMENTO_PRUDENCE_LABELS[props.entry.status];

  return (
    <article className="settings-memento-readable-entry">
      <div className="settings-memento-readable-entry__header">
        <h5>{props.entry.label}</h5>
        {props.showStatus && prudence ? <span>{prudence}</span> : null}
      </div>
      <p>{props.entry.description}</p>
      <SimulatorLinks entry={props.entry} />
      <ReferenceLinks refIds={props.entry.refIds} />
    </article>
  );
}
