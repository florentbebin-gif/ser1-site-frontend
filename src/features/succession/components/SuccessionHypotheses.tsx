import { SimDisclosureButton } from '@/components/ui/sim';

interface SuccessionHypothesesProps {
  hypothesesOpen: boolean;
  assumptions: string[];
  onToggle: () => void;
}

export function SuccessionHypotheses({
  hypothesesOpen,
  assumptions,
  onToggle,
}: SuccessionHypothesesProps) {
  return (
    <div className="sim-hypotheses sc-hypotheses">
      <SimDisclosureButton
        expanded={hypothesesOpen}
        onToggle={onToggle}
        className="sim-hypotheses__toggle"
        labelClosed={`Hypothèses et limites — ${assumptions.length} repères succession`}
        labelOpen="Masquer les hypothèses et limites"
        controls="succession-hypotheses-panel"
        data-testid="succession-hypotheses-toggle"
      />
      {hypothesesOpen && (
        <ul id="succession-hypotheses-panel" className="sim-hypotheses__body">
          {assumptions.map((assumption, index) => (
            <li key={`assumption-${index}`}>{assumption}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
