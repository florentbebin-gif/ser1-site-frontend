/**
 * TresoSocieteSection.tsx — Bloc « Société et foyer »
 *
 * Saisie : type NEWCO/existante, âge actuel, horizon retraite,
 * besoin de revenus, frais de structure, trésorerie initiale (existante).
 */

import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type { TresoInputs } from '../../../engine/tresorerie/types';

interface Props {
  inputs: TresoInputs;
  onChange: (patch: Partial<TresoInputs>) => void;
}

const TYPE_OPTIONS = [
  { value: 'newco', label: 'Société à créer (NEWCO)' },
  { value: 'existante', label: 'Société existante' },
];

function fmt(n: number): string {
  return Math.round(n || 0).toLocaleString('fr-FR');
}

function parseEuro(v: string): number {
  const clean = v.replace(/\s/g, '').replace(/\D/g, '');
  return clean === '' ? 0 : Math.min(Number(clean), 999_999_999);
}

function parseDuree(v: string): number {
  const clean = v.replace(/\D/g, '');
  return clean === '' ? 0 : Number(clean);
}

export function TresoSocieteSection({ inputs, onChange }: Props) {
  const isExistante = inputs.typeCreation === 'existante';

  return (
    <div className="premium-card ts-section">
      <div className="ts-section__header">
        <span className="sim-card__icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="7" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <h2 className="ts-section__title">Société et foyer</h2>
          <p className="ts-section__subtitle">Situation patrimoniale et horizon de retraite</p>
        </div>
      </div>
      <div className="ts-section__divider" />

      <div className="ts-fields">

        {/* Type de société */}
        <SimFieldShell label="Type de société" className="ts-field" rowClassName="ts-field__row">
          <SimSelect
            value={inputs.typeCreation}
            onChange={v => onChange({ typeCreation: v as 'newco' | 'existante' })}
            options={TYPE_OPTIONS}
            ariaLabel="Type de société"
          />
        </SimFieldShell>

        {/* Âge actuel */}
        <SimFieldShell label="Âge actuel" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={inputs.ageActuel || ''}
            onChange={e => onChange({ ageActuel: parseDuree(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">ans</span>
        </SimFieldShell>

        {/* Âge de retraite */}
        <SimFieldShell label="Âge de retraite" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={inputs.ageRetraite || ''}
            onChange={e => onChange({ ageRetraite: parseDuree(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">ans</span>
        </SimFieldShell>

        {/* Besoin de revenus */}
        <SimFieldShell label="Besoin annuel net à la retraite" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmt(inputs.besoinsRetraiteAnnuels)}
            onChange={e => onChange({ besoinsRetraiteAnnuels: parseEuro(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        {/* Frais structure */}
        <SimFieldShell label="Frais annuels de structure" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmt(inputs.fraisStructureAnnuels)}
            onChange={e => onChange({ fraisStructureAnnuels: parseEuro(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        {/* Trésorerie initiale — existante uniquement */}
        {isExistante && (
          <SimFieldShell label="Trésorerie existante" className="ts-field" rowClassName="ts-field__row">
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={fmt(inputs.tresorerieInitiale ?? 0)}
              onChange={e => onChange({ tresorerieInitiale: parseEuro(e.target.value) })}
            />
            <span className="sim-field__unit ts-unit">€</span>
          </SimFieldShell>
        )}

        {/* Réserves initiales — existante uniquement */}
        {isExistante && (
          <SimFieldShell label="Réserves existantes" className="ts-field" rowClassName="ts-field__row">
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={fmt(inputs.reservesInitiales ?? 0)}
              onChange={e => onChange({ reservesInitiales: parseEuro(e.target.value) })}
            />
            <span className="sim-field__unit ts-unit">€</span>
          </SimFieldShell>
        )}

      </div>
    </div>
  );
}
