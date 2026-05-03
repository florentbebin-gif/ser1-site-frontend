import React from 'react';
import { SimModalShell } from '@/components/ui/sim';
import type { PlafondMadelinDetail } from '../../../../engine/per';

interface PerMadelinInfoModalProps {
  declarant1?: PlafondMadelinDetail;
  declarant2?: PlafondMadelinDetail;
  isCouple: boolean;
  onClose: () => void;
}

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

function MadelinDetailCard({
  label,
  detail,
}: {
  label: string;
  detail?: PlafondMadelinDetail;
}): React.ReactElement | null {
  if (!detail) {
    return null;
  }

  const hasBaseTns = detail.assietteVersement > 0 || detail.assietteReport > 0;

  const rows = [
    ['Assiette de versement (art. 41 DN bis)', detail.assietteVersement],
    ['Assiette de report 2042 (§340)', detail.assietteReport],
    ['Enveloppe 15 % de versement', detail.enveloppe15Versement],
    ['Enveloppe 15 % de report 2042', detail.enveloppe15Report],
    ['Enveloppe 10 % commune', detail.enveloppe10],
    ['Consommation 10 % Art. 83', detail.consommation10.art83],
    ['Consommation 10 % PERCO / PERECO', detail.consommation10.perco],
    ['Consommation 10 % Madelin retraite', detail.consommation10.madelinRetraite],
    ['Consommation 10 % PER 154 bis', detail.consommation10.per154bis],
    ['Reste enveloppe 15 % versement', detail.reste15Versement],
    ['Reste enveloppe 15 % report', detail.reste15Report],
    ['Reste enveloppe 10 %', detail.reste10],
    ['Réintégration à opérer', detail.surplusAReintegrer],
  ];

  return (
    <div className="premium-card-compact per-madelin-modal-card">
      <div className="per-summary-card-head">
        <p className="premium-section-title">PER 154 bis</p>
        <h4 className="per-summary-card-title">{label}</h4>
      </div>

      <div className="per-summary-breakdown-list">
        {!hasBaseTns ? (
          <div className="per-summary-breakdown-row per-summary-breakdown-row--muted">
            <span>Aucune base TNS saisie</span>
          </div>
        ) : (
          rows.map(([rowLabel, value]) => (
            <div key={rowLabel} className="per-summary-breakdown-row">
              <span>{rowLabel}</span>
              <strong>{fmtCurrency(Number(value))}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function PerMadelinInfoModal({
  declarant1,
  declarant2,
  isCouple,
  onClose,
}: PerMadelinInfoModalProps): React.ReactElement {
  return (
    <SimModalShell
      title="Détail du calcul Madelin 154 bis"
      subtitle="Deux assiettes distinctes : versement (art. 41 DN bis = BIC + art.62 + cotisations Madelin) pour les enveloppes de l’année ; report 2042 (BOI-IR-BASE-20-50-20 §340 = BIC + art.62 bruts, sans abattement) pour la fraction reportable."
      onClose={onClose}
      modalClassName="per-madelin-modal"
      bodyClassName="per-madelin-modal__body"
    >
      <div className={`per-summary-breakdown-grid ${isCouple ? 'is-couple' : ''}`}>
        <MadelinDetailCard label="Déclarant 1" detail={declarant1} />
        {isCouple && <MadelinDetailCard label="Déclarant 2" detail={declarant2} />}
      </div>
    </SimModalShell>
  );
}
