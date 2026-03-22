import type { SuccessionFiscalSnapshot } from '../successionFiscalContext';

interface SuccessionHypothesesProps {
  hypothesesOpen: boolean;
  attentions: string[];
  fiscalSnapshot: SuccessionFiscalSnapshot;
  onToggle: () => void;
}

export function SuccessionHypotheses({
  hypothesesOpen,
  attentions,
  fiscalSnapshot,
  onToggle,
}: SuccessionHypothesesProps) {
  return (
    <div className="sc-hypotheses">
      <button
        type="button"
        className="sc-hypotheses__toggle"
        onClick={onToggle}
        aria-expanded={hypothesesOpen}
        data-testid="succession-hypotheses-toggle"
      >
        <span className="sc-hypotheses__title">Hypothèses et limites</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`sc-hypotheses__chevron${hypothesesOpen ? ' is-open' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {hypothesesOpen && (
        <ul>
          {attentions.map((warning, index) => (
            <li key={`att-${index}`}>{warning}</li>
          ))}
          <li>Barèmes DMTG et abattements appliqués depuis les paramètres de l&apos;application.</li>
          <li>
            Paramètres transmis au module:
            rappel fiscal donations {fiscalSnapshot.donation.rappelFiscalAnnees} ans,
            AV décès 990 I {fiscalSnapshot.avDeces.primesApres1998.allowancePerBeneficiary} / bénéficiaire,
            AV décès après {fiscalSnapshot.avDeces.agePivotPrimes} ans {fiscalSnapshot.avDeces.apres70ans.globalAllowance} (global).
          </li>
          <li>La lecture civile repose sur le contexte familial, les masses patrimoniales saisies et les dispositions déclarées.</li>
          <li>Les capitaux décès d&apos;assurance-vie et de PER assurance sont ventilés par bénéficiaire à partir des clauses saisies, avec une lecture simplifiée des régimes 990 I / 757 B.</li>
          <li>L&apos;horizon de décès simulé s&apos;applique aux valorisations dépendant de la date du décès, sans décalage calendaire distinct entre le 1er et le 2e décès.</li>
          <li>La chronologie 2 décès repose sur un chaînage simplifié avec warnings sur les cas non couverts.</li>
          <li>La dévolution légale est présentée en lecture civile simplifiée, sans gestion exhaustive des ordres successoraux.</li>
          <li>Les libéralités et avantages matrimoniaux sont qualifiés de façon indicative, sans recalcul automatique des droits dans ce module.</li>
          <li>L&apos;intégration chiffrée fine (rapport civil détaillé, réduction, liquidation notariale) n&apos;est pas encore modélisée.</li>
          <li>Résultat indicatif, à confirmer par une analyse patrimoniale et notariale.</li>
        </ul>
      )}
    </div>
  );
}
