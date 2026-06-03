import { SimModalShell } from '@/components/ui/sim';

export function RentRevaluationInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <SimModalShell
      title="Revalorisation d'une rente"
      subtitle="Pourquoi le taux technique compte"
      onClose={onClose}
      modalClassName="sim-modal--lg"
      bodyClassName="sim-info-modal-content"
    >
      <p>
        Une rente servie par un assureur peut être revalorisée chaque année selon les résultats du
        fonds en euros ou du régime. Si un taux technique a déjà majoré la rente initiale, la
        revalorisation future est généralement réduite d'autant.
      </p>
      <p>
        Exemple simple : avec une performance nette de 3 % et un taux technique de 1 %, la
        revalorisation annuelle observée peut être proche de 2 %. Le champ du simulateur doit donc
        refléter la hausse future attendue de la rente versée, pas la performance brute du fonds.
      </p>
    </SimModalShell>
  );
}
