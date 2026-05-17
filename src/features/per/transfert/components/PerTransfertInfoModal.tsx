import { SimModalShell } from '@/components/ui/sim';

export type PerTransfertInfoKind =
  | 'subscriptionDate'
  | 'annualPayment'
  | 'interestsQuotePart'
  | 'quotient'
  | 'fractionalCapital'
  | 'prefonValues';

interface PerTransfertInfoModalProps {
  kind: PerTransfertInfoKind;
  onClose: () => void;
}

const INFO_CONTENT: Record<
  PerTransfertInfoKind,
  { title: string; subtitle?: string; body: string[] }
> = {
  subscriptionDate: {
    title: 'Date de souscription',
    body: [
      'Information optionnelle, utile pour contrôler les frais sortants et les garanties anciennes : taux minimum garanti, table de mortalité ou taux technique garantis à l’adhésion.',
    ],
  },
  annualPayment: {
    title: 'Versement annuel actuel',
    body: [
      'Ce montant alimente uniquement le scénario Conserver jusqu’à l’âge de liquidation. Les versements cessent ensuite en phase de liquidation.',
    ],
  },
  interestsQuotePart: {
    title: 'Quote-part « Dont intérêts »',
    body: [
      'La quote-part des intérêts ou produits sert à ventiler le capital entre principal et gains pour la fiscalité de sortie.',
      'À défaut de précision par l’assureur sortant, vérifier le dernier relevé détaillé ou demander la ventilation à la compagnie. SER1 ne déduit pas de barème automatique dans cette version.',
    ],
  },
  quotient: {
    title: 'Système du quotient',
    subtitle: 'Article 163-0 A du CGI',
    body: [
      'La sortie en capital peut relever du régime des revenus exceptionnels. Le système du quotient lisse l’effet du barème progressif, sous conditions et avec une validation fiscale à mener au cas par cas.',
      'SER1 affiche une lecture indicative : le CGP doit confirmer l’option dans le contexte fiscal complet du foyer.',
    ],
  },
  fractionalCapital: {
    title: 'Capital fractionné',
    body: [
      'Tous les contrats n’autorisent pas librement un horizon de fractionnement. Certaines notices limitent la durée, les modalités de revalorisation ou les périodicités.',
      'Exemple Préfon : les modalités de fractionnement doivent être vérifiées dans la notice applicable et le relevé client.',
    ],
  },
  prefonValues: {
    title: 'Valeurs Préfon',
    body: [
      'La notice locale prouve au 1er janvier 2025 une valeur d’acquisition de 1,9413 € et une valeur de service de 0,09963 €.',
      'La valeur 0,10219 € est préremplie comme hypothèse utilisateur au 1er janvier 2026, non prouvée par la notice locale et à confirmer par annexe 2026.',
      'Les poches C0, C1, C1 bis, C2 et C3 sont saisies séparément pour conserver une trace du devoir de conseil.',
    ],
  },
};

export function PerTransfertInfoModal({ kind, onClose }: PerTransfertInfoModalProps) {
  const content = INFO_CONTENT[kind];

  return (
    <SimModalShell
      title={content.title}
      subtitle={content.subtitle}
      onClose={onClose}
      footer={
        <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={onClose}>
          Compris
        </button>
      }
    >
      <div className="per-transfert-modal-copy">
        {content.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </SimModalShell>
  );
}
