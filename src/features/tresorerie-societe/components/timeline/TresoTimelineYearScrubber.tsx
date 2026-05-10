import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { parseNumberInput } from '../../utils/tresorerieFormatters';

interface TresoTimelineYearScrubberProps {
  projectionStartYear: number;
  selectedAssociateAge?: number;
  onChange: (year: number) => void;
}

export function TresoTimelineYearScrubber({
  projectionStartYear,
  selectedAssociateAge,
  onChange,
}: TresoTimelineYearScrubberProps) {
  return (
    <div className="ts-timeline-year">
      <SimFieldShell
        label="Début de projection"
        className="ts-field"
        rowClassName="ts-field__row"
        controlId="ts-timeline-start-year"
        hint={selectedAssociateAge != null ? `Âge de l’associé sélectionné : ${selectedAssociateAge} ans` : undefined}
      >
        <input
          id="ts-timeline-start-year"
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={projectionStartYear}
          onChange={event => onChange(parseNumberInput(event.target.value))}
        />
      </SimFieldShell>
    </div>
  );
}
