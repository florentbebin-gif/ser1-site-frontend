import { SimModalShell } from '@/components/ui/sim';
import { TRANSFER_FEE_REGULATION_LINES } from '../constants/regulations';

export function PerTransfertFraisInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <SimModalShell
      title="Frais de transfert sortant"
      subtitle="Règle à contrôler selon la famille du contrat"
      onClose={onClose}
      bodyClassName="sim-info-modal-content"
    >
      <ul className="sim-info-modal-content__list">
        {TRANSFER_FEE_REGULATION_LINES.map((line) => (
          <li key={line.title}>
            <strong>{line.title}</strong>
            <span>{line.body}</span>
          </li>
        ))}
      </ul>
      <p className="sim-info-modal-content__note">
        La valeur saisie dans le simulateur est appliquée au capital acquis avant le transfert.
      </p>
    </SimModalShell>
  );
}
