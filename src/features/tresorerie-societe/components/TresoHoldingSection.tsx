/**
 * TresoHoldingSection.tsx — Bloc « Holding avec filiale »
 *
 * Activable via un toggle. Si actif : saisie des paramètres
 * HoldingParticipationInput avec garde-fous BOFiP.
 *
 * Source légale : BOI-IS-BASE-10-10-10-10 §101-103.
 * L'utilisateur confirme l'éligibilité — SER1 applique sans valider juridiquement.
 */

import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import type { HoldingParticipationInput, TresoInputs } from '../../../engine/tresorerie/types';

interface Props {
  inputs: TresoInputs;
  onHolding: (v: HoldingParticipationInput | undefined) => void;
}

function fmt(n: number): string {
  return Math.round(n || 0).toLocaleString('fr-FR');
}

function parseEuro(v: string): number {
  const clean = v.replace(/\s/g, '').replace(/\D/g, '');
  return clean === '' ? 0 : Math.min(Number(clean), 999_999_999);
}

function parsePct(v: string): number {
  const clean = v.replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

function parseDuree(v: string): number {
  const clean = v.replace(/\D/g, '');
  return clean === '' ? 0 : Number(clean);
}

const DEFAULT_HOLDING: HoldingParticipationInput = {
  actif: true,
  regimeMereFilleEligible: false,
  regimeGroupeFiscal: false,
  tauxDetention: 100,
  dureeConservationTitresAns: 2,
  dividendesFiliales: 20000,
  datePremierDividende: `${new Date().getFullYear()}-01`,
};

export function TresoHoldingSection({ inputs, onHolding }: Props) {
  const holding = inputs.holding;
  const isActive = holding?.actif === true;

  function toggleActive() {
    if (isActive) {
      onHolding(undefined);
    } else {
      onHolding(inputs.holding ?? DEFAULT_HOLDING);
    }
  }

  function update(patch: Partial<HoldingParticipationInput>) {
    if (!holding) return;
    onHolding({ ...holding, ...patch });
  }

  const showWarningDetention = holding?.regimeMereFilleEligible && (holding.tauxDetention ?? 0) < 5;
  const showWarningDuree = holding?.regimeMereFilleEligible && (holding.dureeConservationTitresAns ?? 0) < 2;

  return (
    <div className="premium-card ts-section">
      <div className="ts-section__header">
        <span className="sim-card__icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2L4 6h3v6h2V6h3L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <h2 className="ts-section__title">Holding avec filiale</h2>
          <p className="ts-section__subtitle">Régime mère-fille — dividendes de filiales</p>
        </div>
      </div>
      <div className="ts-section__divider" />

      {/* Toggle principal */}
      <div className="ts-pocket">
        <button
          type="button"
          className={`ts-pocket__toggle${isActive ? ' is-open' : ''}`}
          onClick={toggleActive}
          aria-expanded={isActive}
        >
          <span className="ts-pocket__toggle-label">
            {isActive ? '▼' : '▶'} Cas holding avec filiale
            {isActive && holding && (
              <span className="ts-pocket__badge">
                {fmt(holding.dividendesFiliales)} €/an
              </span>
            )}
          </span>
          {!isActive && <span className="ts-pocket__cta">+ Activer</span>}
        </button>

        {isActive && holding && (
          <div className="ts-pocket-form">
            <div className="ts-fields">

              <SimFieldShell label="Dividendes filiales annuels" className="ts-field" rowClassName="ts-field__row">
                <input type="text" inputMode="numeric" className="sim-field__control"
                  value={fmt(holding.dividendesFiliales)}
                  onChange={e => update({ dividendesFiliales: parseEuro(e.target.value) })}
                />
                <span className="sim-field__unit ts-unit">€</span>
              </SimFieldShell>

              <SimFieldShell label="Taux de détention" className="ts-field" rowClassName="ts-field__row">
                <input type="text" className="sim-field__control"
                  value={holding.tauxDetention ?? 0}
                  onChange={e => update({ tauxDetention: parsePct(e.target.value) })}
                />
                <span className="sim-field__unit ts-unit">%</span>
              </SimFieldShell>

              <SimFieldShell label="Durée de conservation des titres" className="ts-field" rowClassName="ts-field__row">
                <input type="text" inputMode="numeric" className="sim-field__control"
                  value={holding.dureeConservationTitresAns ?? ''}
                  onChange={e => update({ dureeConservationTitresAns: parseDuree(e.target.value) })}
                />
                <span className="sim-field__unit ts-unit">ans</span>
              </SimFieldShell>

              <div className="ts-field ts-field--toggle">
                <label className="ts-toggle-label">
                  <input type="checkbox"
                    checked={holding.regimeMereFilleEligible}
                    onChange={e => update({ regimeMereFilleEligible: e.target.checked })}
                  />
                  Régime mère-fille éligible (QPFC 5 %)
                </label>
              </div>

              {holding.regimeMereFilleEligible && (
                <div className="ts-field ts-field--toggle">
                  <label className="ts-toggle-label">
                    <input type="checkbox"
                      checked={holding.regimeGroupeFiscal}
                      onChange={e => update({ regimeGroupeFiscal: e.target.checked })}
                    />
                    Groupe fiscal intégré (QPFC 1 %)
                  </label>
                </div>
              )}

              <SimFieldShell label="Date du premier dividende" className="ts-field" rowClassName="ts-field__row">
                <input type="month" className="sim-field__control ts-input-month"
                  value={holding.datePremierDividende ?? ''}
                  onChange={e => update({ datePremierDividende: e.target.value })}
                />
              </SimFieldShell>

            </div>

            {/* Garde-fous BOFiP */}
            {showWarningDetention && (
              <div className="ts-warning" role="alert">
                ⚠ Le taux de détention minimum est de 5 % (BOI-IS-BASE-10-10-10-10 §101).
              </div>
            )}
            {showWarningDuree && (
              <div className="ts-warning" role="alert">
                ⚠ La durée minimale de détention est de 2 ans (BOI-IS-BASE-10-10-10-10 §103).
              </div>
            )}

            <p className="ts-section__note">
              SER1 applique l'option cochée sans valider juridiquement l'éligibilité.
              Conditions à vérifier dans les hypothèses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
