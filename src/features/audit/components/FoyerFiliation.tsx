/**
 * FoyerFiliation — schéma de filiation premium dérivé du dossier F1.
 *
 * SVG autonome (connecteurs en courbes de Bézier, pastilles de largeur égale,
 * avatars vectoriels {@link FoyerAvatarArt}). Lecture seule : seuls les membres
 * réellement présents dans le dossier sont rendus. Le mode compact ajoute un
 * marqueur visuel pour distinguer les enfants communs des enfants d'une union
 * précédente sans introduire de calcul métier.
 */

import { useId, type ReactElement } from 'react';

import type { AuditLandingMember } from '../auditLandingViewModel';

import { FoyerAvatarClipDef } from './FoyerAvatarArt';
import { buildFiliationLayout } from './FoyerFiliationLayout';
import { FiliationPill } from './FoyerFiliationParts';

interface FoyerFiliationProps {
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  enfants: AuditLandingMember[];
  proches?: AuditLandingMember[];
  hasData: boolean;
  mode?: 'landing' | 'compact';
}

export function FoyerFiliation({
  principal,
  conjoint,
  enfants,
  proches = [],
  hasData,
  mode = 'landing',
}: FoyerFiliationProps): ReactElement {
  const clipId = useId();
  const isCompact = mode === 'compact';

  if (!hasData) {
    return <p className="audit-tile__empty">Filiation à renseigner</p>;
  }

  const layout = buildFiliationLayout({ principal, conjoint, enfants, proches, mode });

  return (
    <svg
      className={`audit-fil audit-fil--${mode}`}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Schéma de filiation du foyer"
    >
      <defs>
        <FoyerAvatarClipDef clipId={clipId} />
      </defs>

      {layout.edges.map((edge) => (
        <path key={edge.key} className={edge.className} d={edge.d} />
      ))}

      {layout.nodes.map((node) => (
        <FiliationPill
          key={node.memberId}
          node={node}
          y={node.y}
          width={layout.pillWidth}
          height={layout.pillHeight}
          clipId={clipId}
          compact={isCompact}
        />
      ))}
    </svg>
  );
}

export default FoyerFiliation;
