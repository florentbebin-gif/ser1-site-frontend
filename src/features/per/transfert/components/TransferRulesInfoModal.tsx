import { SimModalShell } from '@/components/ui/sim';
import { TYPE_LABELS, type BaseCgRetraiteContractType } from '@/data/basecg';
import { TRANSFER_RULES_BY_TYPE } from '../constants/regulations';

interface TransferRulesInfoModalProps {
  onClose: () => void;
}

const ORDERED_TYPES: BaseCgRetraiteContractType[] = [
  'PERIN',
  'PERP',
  'MADELIN',
  'PER_POINTS',
  'ARTICLE83',
  'PEROB',
  'PERCO',
  'PERECO',
  'AUTRE',
];

export function TransferRulesInfoModal({ onClose }: TransferRulesInfoModalProps) {
  return (
    <SimModalShell
      title="Règles de transfert vers un PER individuel"
      subtitle="Synthèse issue des règles L224-40 et des notices contractuelles à vérifier."
      onClose={onClose}
      footer={
        <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={onClose}>
          Fermer
        </button>
      }
    >
      <ul className="per-transfert-rules-list">
        {ORDERED_TYPES.map((type) => {
          const rule = TRANSFER_RULES_BY_TYPE[type];
          return (
            <li
              key={type}
              className={`per-transfert-rules-list__item per-transfert-rules-list__item--${rule.rule}`}
            >
              <strong>{TYPE_LABELS[type]}</strong>
              <span>{rule.label}</span>
              <p>{rule.details}</p>
              <small>{rule.legalRef}</small>
            </li>
          );
        })}
      </ul>
    </SimModalShell>
  );
}
