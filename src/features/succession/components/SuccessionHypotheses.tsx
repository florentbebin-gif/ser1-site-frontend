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
    <div className="sc-hypotheses">
      <SimDisclosureButton
        expanded={hypothesesOpen}
        onToggle={onToggle}
        className="sc-hypotheses__toggle"
        labelClosed="Hypothèses et limites"
        labelOpen="Hypothèses et limites"
        controls="succession-hypotheses-panel"
        data-testid="succession-hypotheses-toggle"
      />
      {hypothesesOpen && (
        <ul id="succession-hypotheses-panel">
          {assumptions.map((assumption, index) => (
            <li key={`assumption-${index}`}>{assumption}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
