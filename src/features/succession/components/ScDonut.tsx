const SC_DONUT_R = 27;
const SC_DONUT_CIRC = 2 * Math.PI * SC_DONUT_R;

export default function ScDonut({
  transmis,
  droits,
}: {
  transmis: number;
  droits: number;
}) {
  const total = transmis + droits;

  if (total <= 0) {
    return (
      <svg width="68" height="68" viewBox="0 0 68 68" className="sc-synth-donut" aria-hidden="true">
        <circle cx={34} cy={34} r={SC_DONUT_R} fill="none" stroke="var(--color-c8)" strokeWidth="9" />
      </svg>
    );
  }

  const netLen = (transmis / total) * SC_DONUT_CIRC;
  const droitsLen = SC_DONUT_CIRC - netLen;

  return (
    <svg
      width="68"
      height="68"
      viewBox="0 0 68 68"
      className="sc-synth-donut"
      aria-hidden="true"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle cx={34} cy={34} r={SC_DONUT_R} fill="none" stroke="var(--color-c8)" strokeWidth="9" />
      <circle
        cx={34}
        cy={34}
        r={SC_DONUT_R}
        fill="none"
        stroke="var(--color-c5)"
        strokeWidth="9"
        strokeDasharray={`${netLen} ${SC_DONUT_CIRC}`}
        strokeDashoffset="0"
        strokeLinecap="butt"
      />
      <circle
        cx={34}
        cy={34}
        r={SC_DONUT_R}
        fill="none"
        stroke="var(--color-c6)"
        strokeWidth="9"
        strokeDasharray={`${droitsLen} ${SC_DONUT_CIRC}`}
        strokeDashoffset={`${-netLen}`}
        strokeLinecap="butt"
      />
    </svg>
  );
}
