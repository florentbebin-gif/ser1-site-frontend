import { SimDisclosureButton } from '@/components/ui/sim';

interface CreditHypothesesProps {
  hypothesesOpen: boolean;
  onToggle: () => void;
}

export function CreditHypotheses({ hypothesesOpen, onToggle }: CreditHypothesesProps) {
  return (
    <div className="cv-hypotheses">
      <SimDisclosureButton
        expanded={hypothesesOpen}
        onToggle={onToggle}
        className="cv-hypotheses__toggle"
        labelClosed="Hypothèses et limites"
        labelOpen="Hypothèses et limites"
        controls="credit-hypotheses-panel"
        data-testid="credit-hypotheses-toggle"
      />
      {hypothesesOpen && (
        <ul id="credit-hypotheses-panel">
          <li>Les résultats sont indicatifs et ne constituent pas une offre de prêt.</li>
          <li>Le calcul suppose un taux fixe sur toute la durée du prêt.</li>
          <li>
            L&apos;assurance emprunteur est calculée selon le mode sélectionné (capital initial ou
            restant dû) pour chaque prêt.
          </li>
          <li>
            Les frais de dossier, de garantie et de notaire ne sont pas inclus dans ce simulateur.
          </li>
        </ul>
      )}
    </div>
  );
}
