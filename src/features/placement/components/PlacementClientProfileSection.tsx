import type { PlacementTmiOption } from '@/hooks/usePlacementSettings';
import type { PlacementClient } from '../utils/normalizers';
import { InputNumber, Select } from './inputs';

interface PlacementClientProfileSectionProps {
  client: PlacementClient;
  tmiOptions: PlacementTmiOption[];
  setClient: (_patch: Partial<PlacementClient>) => void;
}

function UsersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
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
            <UsersIcon />
          </div>
          <span>Profil client</span>
        </div>
        <p className="pl-card-subtitle sim-card__subtitle">Paramètres communs aux deux placements</p>
      </div>

      <div className="sim-divider" />

      <div className="pl-topgrid premium-grid-4">
        <InputNumber
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
