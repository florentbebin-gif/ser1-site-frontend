/**
 * TresoCCASection.tsx — Bloc « Compte courant d'associé »
 *
 * Saisie : CCA initial, apport annuel, durée de la phase active.
 */

import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import type { TresoInputs } from '../../../engine/tresorerie/types';

interface Props {
  inputs: TresoInputs;
  onChange: (patch: Partial<TresoInputs>) => void;
}

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

export function TresoCCASection({ inputs, onChange }: Props) {
  const isNewco = inputs.typeCreation === 'newco';

  return (
    <div className="premium-card ts-section">
      <div className="ts-section__header">
        <span className="sim-card__icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <h2 className="ts-section__title">Compte courant d'associé</h2>
          <p className="ts-section__subtitle">
            {isNewco
              ? 'Apport initial + apports annuels récurrents'
              : 'CCA existant + apports annuels complémentaires'}
          </p>
        </div>
      </div>
      <div className="ts-section__divider" />

      <div className="ts-fields">

        {/* CCA initial */}
        <SimFieldShell
          label={isNewco ? 'Apport initial en C/CA' : 'CCA existant (solde actuel)'}
          className="ts-field"
          rowClassName="ts-field__row"
        >
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmt(inputs.ccaInitial)}
            onChange={e => onChange({ ccaInitial: parseEuro(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        {/* Apport annuel */}
        <SimFieldShell label="Apport annuel en C/CA" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmt(inputs.apportAnnuelCCA)}
            onChange={e => onChange({ apportAnnuelCCA: parseEuro(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        {/* Durée phase active */}
        <SimFieldShell label="Durée de la phase active" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={inputs.dureeActiveAns || ''}
            onChange={e => onChange({ dureeActiveAns: parseDuree(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">ans</span>
        </SimFieldShell>

      </div>

      <p className="ts-section__note">
        Le remboursement du C/CA n'est pas soumis au PFU — il diminue le passif CCA uniquement.
      </p>
    </div>
  );
}
