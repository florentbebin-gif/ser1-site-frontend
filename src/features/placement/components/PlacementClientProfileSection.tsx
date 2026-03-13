import type { PlacementTmiOption } from '@/hooks/usePlacementSettings';
import type { PlacementClient } from '../utils/normalizers';
import { InputNumber, Select } from './inputs';

interface PlacementClientProfileSectionProps {
  client: PlacementClient;
  tmiOptions: PlacementTmiOption[];
  setClient: (_patch: Partial<PlacementClient>) => void;
}

export function PlacementClientProfileSection({
  client,
  tmiOptions,
  setClient,
}: PlacementClientProfileSectionProps) {
  return (
    <div className="pl-ir-table-wrapper premium-card premium-section">
      <div className="pl-section-title premium-section-title">Profil client</div>
      <div className="pl-topgrid premium-grid-4">
        <InputNumber
          label="Âge actuel"
          value={client.ageActuel}
          onChange={(value) => setClient({ ageActuel: value })}
          unit="ans"
          min={18}
          max={90}
        />
        <Select
          label="TMI actuel"
          value={client.tmiEpargne}
          onChange={(value) => setClient({ tmiEpargne: parseFloat(value) })}
          options={tmiOptions}
        />
        <Select
          label="TMI retraite"
          value={client.tmiRetraite}
          onChange={(value) => setClient({ tmiRetraite: parseFloat(value) })}
          options={tmiOptions}
        />
        <Select
          label="Situation"
          value={client.situation}
          onChange={(value) => setClient({ situation: value })}
          options={[
            { value: 'single', label: 'Célibataire' },
            { value: 'couple', label: 'Marié / Pacsé' },
          ]}
        />
      </div>
    </div>
  );
}

