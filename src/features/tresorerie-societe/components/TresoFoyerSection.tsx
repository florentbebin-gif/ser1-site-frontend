/**
 * TresoFoyerSection.tsx — Bloc Foyer du parcours Trésorerie société.
 */

import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type { AssociateInput, TresoInputsV2 } from '../../../engine/tresorerie/types';

interface Props {
  inputs: TresoInputsV2;
  onChange: (nextInputs: TresoInputsV2) => void;
}

function fmt(n: number): string {
  return Math.round(n || 0).toLocaleString('fr-FR');
}

function parseEuro(v: string): number {
  const clean = v.replace(/\s/g, '').replace(/\D/g, '');
  return clean === '' ? 0 : Math.min(Number(clean), 999_999_999);
}

function parseNumber(v: string): number {
  const clean = v.replace(/\D/g, '');
  return clean === '' ? 0 : Number(clean);
}

function associateQualifiers(associate: AssociateInput): string {
  const roles = associate.roles
    .map(role => {
      if (role === 'gerant_tns') return 'TNS';
      if (role === 'cogerant_tns') return 'cogérant TNS';
      if (role === 'pdg') return 'PDG';
      if (role === 'dg') return 'DG';
      if (role === 'salarie') return 'salarié';
      return 'associé';
    })
    .join(', ');
  const rights = associate.ownershipLots
    .map(lot => {
      if (lot.right === 'usufruit') return 'US';
      if (lot.right === 'nue_propriete') return 'NP';
      return 'PP';
    })
    .join('/');
  return [roles, rights].filter(Boolean).join(' · ');
}

export function TresoFoyerSection({ inputs, onChange }: Props) {
  const v2 = inputs;

  const patchV2 = (nextV2: TresoInputsV2) => {
    onChange(nextV2);
  };

  const patchFoyer = (foyerPatch: Partial<TresoInputsV2['foyer']>) => {
    patchV2({ ...v2, foyer: { ...v2.foyer, ...foyerPatch } });
  };

  const options = v2.company.associates.map((associate, index) => ({
    value: associate.id,
    label: `${associate.label || `Associé ${index + 1}`} (${associateQualifiers(associate)})`,
  }));

  return (
    <div className="premium-card ts-section">
      <div className="ts-section__header">
        <span className="sim-card__icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 15a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <h2 className="ts-section__title">Foyer</h2>
          <p className="ts-section__subtitle">Personne étudiée, besoin de revenus et horizon</p>
        </div>
      </div>
      <div className="ts-section__divider" />

      <div className="ts-fields">
        <SimFieldShell label="Associé étudié" className="ts-field" rowClassName="ts-field__row">
          <SimSelect
            value={v2.foyer.selectedAssociateId}
            onChange={value => patchFoyer({ selectedAssociateId: value })}
            options={options}
            ariaLabel="Associé étudié"
          />
        </SimFieldShell>

        <SimFieldShell label="Âge actuel" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={v2.foyer.currentAge || ''}
            onChange={event => patchFoyer({ currentAge: parseNumber(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">ans</span>
        </SimFieldShell>

        <SimFieldShell label="Âge de retraite" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={v2.foyer.retirementAge || ''}
            onChange={event => patchFoyer({ retirementAge: parseNumber(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">ans</span>
        </SimFieldShell>

        <SimFieldShell label="Besoin annuel net" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmt(v2.foyer.annualIncomeNeed)}
            onChange={event => patchFoyer({ annualIncomeNeed: parseEuro(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <SimFieldShell label="Début projection" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={v2.foyer.projectionStartYear || ''}
            onChange={event => patchFoyer({ projectionStartYear: parseNumber(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">année</span>
        </SimFieldShell>
      </div>
    </div>
  );
}
