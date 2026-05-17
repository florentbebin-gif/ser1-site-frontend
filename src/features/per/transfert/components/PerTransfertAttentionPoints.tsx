import { useMemo } from 'react';
import type { BaseCgRetraiteContract } from '@/data/basecg';
import { buildPerTransfertAttentionPoints } from '../utils/attentionPoints';

interface PerTransfertAttentionPointsProps {
  contract: BaseCgRetraiteContract | null;
  subscriptionDate: string;
  extraWarnings?: string[];
}

export function PerTransfertAttentionPoints({
  contract,
  subscriptionDate,
  extraWarnings = [],
}: PerTransfertAttentionPointsProps) {
  const points = useMemo(
    () => buildPerTransfertAttentionPoints(contract, { subscriptionDate }),
    [contract, subscriptionDate],
  );

  return (
    <section className="per-transfert-attention" aria-label="Points d’attention">
      <h4>Points d’attention</h4>
      <ul>
        {points.map((point) => (
          <li key={`${point.label}-${point.detail}`} className={`per-transfert-attention__item per-transfert-attention__item--${point.level}`}>
            <strong>{point.label}</strong>
            <span>{point.detail}</span>
          </li>
        ))}
        {extraWarnings.map((warning) => (
          <li key={warning} className="per-transfert-attention__item per-transfert-attention__item--warning">
            <strong>Point moteur</strong>
            <span>{warning}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
