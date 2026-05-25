import { IconUsers } from '@/icons/ui';
import type { PlacementTmiOption } from '@/hooks/usePlacementSettings';
import type { PlacementClient } from '../utils/normalizers';
import { PlacementNumberField } from './PlacementAmountControls';
import { PlacementSelect as Select } from './PlacementSelect';

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
    <div className="premium-card premium-card--guide sim-card--guide pl-client-card">
      <div className="pl-client-card__header sim-card__header sim-card__header--bleed">
        <div className="pl-client-card__title sim-card__title sim-card__title-row">
          <div className="sim-card__icon">
            <IconUsers />
          </div>
          <span>Profil client</span>
        </div>
        <p className="pl-card-subtitle sim-card__subtitle">
          Paramètres communs aux deux placements
        </p>
      </div>

      <div className="sim-divider" />

      <div className="pl-topgrid premium-grid-4">
        <PlacementNumberField
          label="Âge actuel"
          value={client.ageActuel}
          onChange={(value) => setClient({ ageActuel: value ?? null })}
          unit="ans"
          min={18}
          max={90}
        />
        <Select
          label="TMI actuel"
          value={String(client.tmiEpargne ?? '')}
          onChange={(value) => setClient({ tmiEpargne: parseFloat(value) })}
          options={tmiOptions.map((o) => ({ value: String(o.value), label: o.label }))}
        />
        <Select
          label="TMI retraite"
          value={String(client.tmiRetraite ?? '')}
          onChange={(value) => setClient({ tmiRetraite: parseFloat(value) })}
          options={tmiOptions.map((o) => ({ value: String(o.value), label: o.label }))}
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
