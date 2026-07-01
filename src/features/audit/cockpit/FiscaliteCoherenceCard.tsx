import type { ReactElement } from 'react';

import { IconInfo } from '@/icons/ui';

import { AuditCardHead, AuditSurfaceCard, formatEuro } from './auditCockpitShared';
import type { AuditFiscalCoherence } from './auditIrAdapter';

export function FiscaliteCoherenceCard({
  coherence,
}: {
  coherence: AuditFiscalCoherence;
}): ReactElement {
  return (
    <AuditSurfaceCard
      className="audit-fiscal-coherence"
      ariaLabelledby="audit-fiscal-coherence-title"
    >
      <AuditCardHead
        icon={<IconInfo />}
        title="Cohérence avis fiscal"
        titleId="audit-fiscal-coherence-title"
      />

      <dl className="audit-fiscal-lines">
        <CoherenceLine
          label="Parts foyer indicatives"
          value={formatParts(coherence.indicativeParts)}
          warning={coherence.partsMismatch}
        />
        <CoherenceLine
          label="Parts saisies avis"
          value={formatParts(coherence.enteredParts)}
          warning={coherence.partsMismatch}
        />
        <CoherenceLine
          label="IR déclaré"
          value={coherence.hasDeclaredIr ? formatEuro(coherence.declaredIr) : 'Non renseigné'}
        />
        <CoherenceLine
          label="IR estimé"
          value={coherence.hasEstimate ? formatEuro(coherence.estimatedIr) : 'À calculer'}
        />
        <CoherenceLine
          label="Écart"
          value={formatDelta(coherence)}
          warning={coherence.hasIrDelta}
        />
      </dl>

      {coherence.requiresReview ? (
        <p className="audit-fiscal-coherence__notice">
          Écart à vérifier avec les données de l’avis.
        </p>
      ) : (
        <p className="audit-fiscal-coherence__notice" data-tone="ok">
          Avis fiscal et estimation alignés à ce stade.
        </p>
      )}
    </AuditSurfaceCard>
  );
}

function CoherenceLine({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning?: boolean;
}): ReactElement {
  return (
    <div className="audit-fiscal-line" data-warning={warning ? 'true' : undefined}>
      <dt className="audit-fiscal-line__label">{label}</dt>
      <dd className="audit-fiscal-line__value">{value}</dd>
    </div>
  );
}

function formatParts(value: number | null): string {
  if (value == null) return 'Non renseigné';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
}

function formatDelta(coherence: AuditFiscalCoherence): string {
  if (!coherence.hasDeclaredIr) return 'Avis non renseigné';
  if (!coherence.hasEstimate) return 'À calculer';
  if (!coherence.hasIrDelta) return '0 €';
  const sign = coherence.irDelta > 0 ? '+' : '−';
  return `${sign} ${formatEuro(Math.abs(coherence.irDelta))}`;
}
