import { getOptionalLegalReference } from '@/domain/legal-references';
import type { LegalReferenceId } from '@/domain/legal-references';
import type { ReactElement } from 'react';
import '@/styles/legal-references.css';

interface LegalRefLinkProps {
  id: LegalReferenceId;
  className?: string;
}

interface LegalRefListProps {
  ids: readonly LegalReferenceId[];
  className?: string;
}

export function LegalRefLink({ id, className = '' }: LegalRefLinkProps): ReactElement {
  const reference = getOptionalLegalReference(id);
  const classNames = ['legal-ref-link', className].filter(Boolean).join(' ');

  if (!reference) {
    return (
      <span className="legal-ref-link legal-ref-link--missing">Référence inconnue : {id}</span>
    );
  }

  return (
    <a className={classNames} href={reference.officialUrl} target="_blank" rel="noreferrer">
      {reference.articleOrSection ?? reference.label}
    </a>
  );
}

export function LegalRefList({ ids, className = '' }: LegalRefListProps): ReactElement {
  const classNames = ['legal-ref-list', className].filter(Boolean).join(' ');

  return (
    <ul className={classNames}>
      {ids.map((id) => (
        <li key={id}>
          <LegalRefLink id={id} />
        </li>
      ))}
    </ul>
  );
}
