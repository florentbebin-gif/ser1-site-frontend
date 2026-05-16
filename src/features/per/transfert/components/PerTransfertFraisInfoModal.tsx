import { SimModalShell } from '@/components/ui/sim';
import { TRANSFER_FEE_REGULATION_LINES } from '../constants/regulations';

export function PerTransfertFraisInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <SimModalShell
      title="Frais de transfert sortant"
      subtitle="Règle à contrôler selon la famille du contrat"
      onClose={onClose}
    >
      <ul className="per-transfert-modal-list">
        {TRANSFER_FEE_REGULATION_LINES.map((line) => (
          <li key={line.title}>
            <strong>{line.title}</strong>
            <span>{line.body}</span>
          </li>
        ))}
      </ul>
      <p className="per-transfert-modal-note">
        La valeur saisie dans le simulateur est appliquée au capital acquis avant le transfert.
      </p>
    </SimModalShell>
  );
}
