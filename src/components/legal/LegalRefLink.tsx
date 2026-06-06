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

interface LegalRefInlineListProps {
  ids: readonly LegalReferenceId[];
  label?: string;
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

  const title = `${reference.articleOrSection ?? reference.label} — ouvre la référence officielle dans un nouvel onglet`;

  return (
    <a
      className={classNames}
      href={reference.officialUrl}
      target="_blank"
      rel="noreferrer"
      title={title}
    >
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

export function LegalRefInlineList({
  ids,
  label = 'Références :',
  className = '',
}: LegalRefInlineListProps): ReactElement {
  const classNames = ['legal-ref-inline-list', className].filter(Boolean).join(' ');

  return (
    <span className={classNames}>
      <span className="legal-ref-inline-list__label">{label}</span>
      <span className="legal-ref-inline-list__items">
        {ids.map((id) => (
          <LegalRefLink key={id} id={id} />
        ))}
      </span>
    </span>
  );
}
