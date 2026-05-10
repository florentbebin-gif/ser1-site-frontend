import { fmtEuroInput } from '../../utils/tresorerieFormatters';

export interface TresoTreasuryStackSegment {
  key: string;
  label: string;
  amount: number;
  widthPct: number;
  className: string;
  pocketId?: string;
}

interface Props {
  segments: TresoTreasuryStackSegment[];
  onEditPocket: (pocketId: string) => void;
}

export function TresoTreasuryStackBar({ segments, onEditPocket }: Props) {
  return (
    <div className="ts-treasury-stack-card">
      <div className="ts-treasury-stack-card__header">
        <strong>Répartition de la trésorerie initiale</strong>
        <span>Montants estimés à partir des allocations saisies</span>
      </div>
      <div className="ts-treasury-stack" aria-label="Répartition de la trésorerie initiale">
        {segments.map(segment => (
          <button
            key={segment.key}
            type="button"
            className={`ts-treasury-stack__segment ${segment.className}`}
            style={{ width: `${segment.widthPct}%` }}
            title={`${segment.label} : ${fmtEuroInput(segment.amount)} €`}
            aria-label={`${segment.label} : ${fmtEuroInput(segment.amount)} €`}
            disabled={!segment.pocketId}
            onClick={() => {
              if (segment.pocketId) onEditPocket(segment.pocketId);
            }}
          >
            <span>{segment.label}</span>
            <strong>{fmtEuroInput(segment.amount)} €</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
