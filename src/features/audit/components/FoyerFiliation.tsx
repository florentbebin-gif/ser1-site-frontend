/**
 * FoyerFiliation — schéma de filiation compact, dérivé du dossier F1.
 *
 * Rendu HTML/CSS premium (nœuds + connecteurs), sans dépendance au moteur
 * succession. Lecture seule : il n'affiche que les membres réellement présents
 * dans le dossier (principal, conjoint, enfants).
 */

import type { ReactElement } from 'react';

import type { AuditLandingFiliation } from '../auditLandingViewModel';

interface FoyerFiliationProps {
  filiation: AuditLandingFiliation;
}

export function FoyerFiliation({ filiation }: FoyerFiliationProps): ReactElement {
  if (!filiation.hasData) {
    return <p className="audit-filiation__empty">Filiation à renseigner</p>;
  }

  const { principal, conjoint, enfants } = filiation;

  return (
    <div className="audit-filiation" aria-hidden="true">
      <div className="audit-filiation__couple">
        {principal && <FiliationNode label={principal.label} variant="principal" />}
        {conjoint && (
          <>
            <span className="audit-filiation__bond" />
            <FiliationNode label={conjoint.label} variant="conjoint" />
          </>
        )}
      </div>

      {enfants.length > 0 && (
        <>
          <span className="audit-filiation__trunk" />
          <div className="audit-filiation__enfants">
            {enfants.map((enfant) => (
              <FiliationNode key={enfant.id} label={enfant.label} variant="enfant" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface FiliationNodeProps {
  label: string;
  variant: 'principal' | 'conjoint' | 'enfant';
}

function FiliationNode({ label, variant }: FiliationNodeProps): ReactElement {
  return <span className={`audit-filiation__node audit-filiation__node--${variant}`}>{label}</span>;
}

export default FoyerFiliation;
