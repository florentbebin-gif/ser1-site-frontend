import type { ReactElement } from 'react';

import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import { getOptionalLegalReference, type LegalReferenceId } from '@/domain/legal-references';
import type { MementoLexiconTerm } from '@/domain/settings-memento/lexicon';
import type { MementoEntry } from '@/domain/settings-memento/types';

import {
  getEntrySourceVisibleReferenceIds,
  hasEntryReferencesRenderedBySection,
} from './mementoReferenceDedup';
import { MEMENTO_STATUS_LABELS } from './mementoStatusLabels';

type MementoReadableEntryProps =
  | {
      kind: 'entry';
      entry: MementoEntry;
      showReferences?: boolean;
    }
  | {
      kind: 'lexicon';
      term: MementoLexiconTerm;
      showReferences?: boolean;
    };

function isKnownReferenceId(referenceId: LegalReferenceId): boolean {
  return getOptionalLegalReference(referenceId) !== undefined;
}

function visibleReferenceIds(refIds: readonly LegalReferenceId[]): LegalReferenceId[] {
  return refIds.filter(isKnownReferenceId);
}

export function MementoReferenceLinks({
  refIds,
}: {
  refIds: readonly LegalReferenceId[];
}): ReactElement | null {
  const references = visibleReferenceIds(refIds);

  if (references.length === 0) return null;

  return (
    <p className="settings-memento-readable-entry__references">
      <LegalRefInlineList ids={references} />
    </p>
  );
}

const MEMENTO_LEXICON_SOURCE_LABELS: Record<MementoLexiconTerm['status'], string> = {
  sourced: 'C1 - Source qualité : lexique sourcé',
  a_verifier: 'C1 - Source qualité : lexique à relire',
};

function ReferenceFallback({
  refIds,
  claimKeys,
  hasReferencesRenderedElsewhere = false,
}: {
  refIds: readonly LegalReferenceId[];
  claimKeys?: readonly string[];
  hasReferencesRenderedElsewhere?: boolean;
}): ReactElement | null {
  if (visibleReferenceIds(refIds).length > 0) return null;
  if (hasReferencesRenderedElsewhere) return null;
  if (claimKeys && claimKeys.length > 0) {
    return (
      <p className="settings-memento-readable-entry__references">
        Source rattachée par preuve qualifiée.
      </p>
    );
  }
  return <p className="settings-memento-readable-entry__references">Références à qualifier.</p>;
}

export function MementoEntrySources({
  entry,
  showStatus,
}: {
  entry: MementoEntry;
  showStatus: boolean;
}): ReactElement {
  const visibleRefIds = getEntrySourceVisibleReferenceIds(entry);
  const hasReferencesRenderedElsewhere = hasEntryReferencesRenderedBySection(entry);

  return (
    <article className="settings-memento-source-entry">
      <div className="settings-memento-source-entry__header">
        <h5>{entry.label}</h5>
        {showStatus ? (
          <span className={`settings-memento-status settings-memento-status--${entry.status}`}>
            {MEMENTO_STATUS_LABELS[entry.status]}
          </span>
        ) : null}
      </div>
      <MementoReferenceLinks refIds={visibleRefIds} />
      <ReferenceFallback
        refIds={visibleRefIds}
        claimKeys={entry.claimKeys}
        hasReferencesRenderedElsewhere={hasReferencesRenderedElsewhere}
      />
    </article>
  );
}

export function MementoLexiconSources({
  term,
  showStatus,
}: {
  term: MementoLexiconTerm;
  showStatus: boolean;
}): ReactElement {
  return (
    <article className="settings-memento-source-entry">
      <div className="settings-memento-source-entry__header">
        <h5>{term.term}</h5>
        {showStatus ? (
          <span className={`settings-memento-status settings-memento-status--${term.status}`}>
            {MEMENTO_LEXICON_SOURCE_LABELS[term.status]}
          </span>
        ) : null}
      </div>
      <MementoReferenceLinks refIds={term.refIds} />
      <ReferenceFallback refIds={term.refIds} />
    </article>
  );
}

export default function MementoReadableEntry(props: MementoReadableEntryProps): ReactElement {
  if (props.kind === 'lexicon') {
    const showReferences = props.showReferences ?? true;

    return (
      <article className="settings-memento-readable-entry settings-memento-readable-entry--lexicon">
        <div className="settings-memento-readable-entry__header">
          <h5>{props.term.term}</h5>
        </div>
        <p>{props.term.shortDefinition}</p>
        {showReferences ? <MementoReferenceLinks refIds={props.term.refIds} /> : null}
      </article>
    );
  }

  const showReferences = props.showReferences ?? true;

  return (
    <article className="settings-memento-readable-entry">
      <div className="settings-memento-readable-entry__header">
        <h5>{props.entry.label}</h5>
      </div>
      <p>{props.entry.description}</p>
      {showReferences ? <MementoReferenceLinks refIds={props.entry.refIds} /> : null}
    </article>
  );
}
