interface PerTransfertCapitalRenteDonutProps {
  capitalShareRate: number;
  capitalNet: string;
  rentNet: string;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function PerTransfertCapitalRenteDonut({
  capitalShareRate,
  capitalNet,
  rentNet,
}: PerTransfertCapitalRenteDonutProps) {
  const capitalShare = clamp01(capitalShareRate);
  const capitalPct = Math.round(capitalShare * 100);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const capitalLength = circumference * capitalShare;
  const rentLength = circumference - capitalLength;

  return (
    <div className="per-transfert-donut" aria-label={`Répartition capital ${capitalPct} %, rente ${100 - capitalPct} %`}>
      <svg viewBox="0 0 90 90" role="img" aria-hidden="true">
        <circle className="per-transfert-donut__track" cx="45" cy="45" r={radius} />
        <circle
          className="per-transfert-donut__capital"
          cx="45"
          cy="45"
          r={radius}
          strokeDasharray={`${capitalLength} ${rentLength}`}
          strokeDashoffset="0"
        />
        <circle
          className="per-transfert-donut__rent"
          cx="45"
          cy="45"
          r={radius}
          strokeDasharray={`${rentLength} ${capitalLength}`}
          strokeDashoffset={-capitalLength}
        />
        <text x="45" y="42" textAnchor="middle" className="per-transfert-donut__value">{capitalPct}%</text>
        <text x="45" y="55" textAnchor="middle" className="per-transfert-donut__label">capital</text>
      </svg>
      <div className="per-transfert-donut__legend">
        <span><i className="is-capital" />Capital {capitalNet}</span>
        <span><i className="is-rent" />Rente {rentNet}</span>
      </div>
    </div>
  );
}
