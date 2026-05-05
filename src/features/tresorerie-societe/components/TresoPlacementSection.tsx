/**
 * TresoPlacementSection.tsx — Bloc « Allocation société »
 *
 * Deux poches activables indépendamment :
 * - Poche de revenus (distribution) : revenus bruts intégrés au résultat fiscal
 * - Poche de capitalisation : croissance sans IS annuel, IS à la sortie
 */

import { useState } from 'react';
import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type {
  DistributionPocketInput,
  CapitalisationPocketInput,
  TresoInputs,
} from '../../../engine/tresorerie/types';

interface Props {
  inputs: TresoInputs;
  onDistribution: (v: DistributionPocketInput | undefined) => void;
  onCapitalisation: (v: CapitalisationPocketInput | undefined) => void;
}

const STRATEGIE_OPTIONS = [
  { value: 'tresorerie', label: 'Conserver en trésorerie' },
  { value: 'reinvestir', label: 'Réinvestir' },
  { value: 'distribuer', label: 'Distribuer' },
];

const DESTINATION_OPTIONS = [
  { value: 'tresorerie', label: 'Conserver en trésorerie' },
  { value: 'capitalisation', label: 'Basculer en capitalisation' },
  { value: 'nouvelle_distribution', label: 'Nouvelle souscription distribution' },
];

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
  return isNaN(n) ? 0 : Math.min(n / 100, 1);
}

function fmtPct(n: number): string {
  return ((n || 0) * 100).toFixed(2).replace('.', ',');
}

function parseDuree(v: string): number {
  const clean = v.replace(/\D/g, '');
  return clean === '' ? 0 : Number(clean);
}

// ─── Sous-composant poche distribution ───────────────────────────────────────

function DistributionForm({
  value,
  onChange,
  isExistante,
}: {
  value: DistributionPocketInput;
  onChange: (v: DistributionPocketInput) => void;
  isExistante: boolean;
}) {
  return (
    <div className="ts-pocket-form">
      <div className="ts-fields">

        <SimFieldShell label="Capital investi" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={fmt(value.montant)}
            onChange={e => onChange({ ...value, montant: parseEuro(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <SimFieldShell label="Rendement annuel distribué" className="ts-field" rowClassName="ts-field__row">
          <input type="text" className="sim-field__control"
            value={fmtPct(value.rendementDistribue)}
            onChange={e => onChange({ ...value, rendementDistribue: parsePct(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">%</span>
        </SimFieldShell>

        <SimFieldShell label="Date de souscription" className="ts-field" rowClassName="ts-field__row">
          <input type="month" className="sim-field__control ts-input-month"
            value={value.dateSouscription ?? ''}
            onChange={e => onChange({ ...value, dateSouscription: e.target.value })}
          />
        </SimFieldShell>

        <SimFieldShell label="Délai de jouissance" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={value.delaiJouissanceMois ?? 0}
            onChange={e => onChange({ ...value, delaiJouissanceMois: parseDuree(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">mois</span>
        </SimFieldShell>

        <SimFieldShell label="Durée du placement" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={value.dureeAns ?? ''}
            onChange={e => onChange({ ...value, dureeAns: parseDuree(e.target.value) || undefined })}
          />
          <span className="sim-field__unit ts-unit">ans</span>
        </SimFieldShell>

        <SimFieldShell label="Stratégie revenus" className="ts-field" rowClassName="ts-field__row">
          <SimSelect
            value={value.strategieRevenus ?? 'tresorerie'}
            onChange={v => onChange({ ...value, strategieRevenus: v as DistributionPocketInput['strategieRevenus'] })}
            options={STRATEGIE_OPTIONS}
            ariaLabel="Stratégie revenus"
          />
        </SimFieldShell>

        <div className="ts-field ts-field--toggle">
          <label className="ts-toggle-label">
            <input type="checkbox"
              checked={value.repetitionAuTerme ?? false}
              onChange={e => onChange({ ...value, repetitionAuTerme: e.target.checked })}
            />
            Répéter le placement au terme
          </label>
        </div>

        {value.repetitionAuTerme ? null : (
          <SimFieldShell label="Destination au terme" className="ts-field" rowClassName="ts-field__row">
            <SimSelect
              value={value.destinationAuTerme ?? 'tresorerie'}
              onChange={v => onChange({ ...value, destinationAuTerme: v as DistributionPocketInput['destinationAuTerme'] })}
              options={DESTINATION_OPTIONS}
              ariaLabel="Destination au terme"
            />
          </SimFieldShell>
        )}

        {isExistante && (
          <SimFieldShell label="Taux de revalorisation" className="ts-field" rowClassName="ts-field__row">
            <input type="text" className="sim-field__control"
              value={fmtPct(value.tauxRevalorisation ?? 0)}
              onChange={e => onChange({ ...value, tauxRevalorisation: parsePct(e.target.value) })}
            />
            <span className="sim-field__unit ts-unit">%</span>
          </SimFieldShell>
        )}

      </div>
    </div>
  );
}

// ─── Sous-composant poche capitalisation ─────────────────────────────────────

function CapitalisationForm({
  value,
  onChange,
  isExistante,
}: {
  value: CapitalisationPocketInput;
  onChange: (v: CapitalisationPocketInput) => void;
  isExistante: boolean;
}) {
  return (
    <div className="ts-pocket-form">
      <div className="ts-fields">

        <SimFieldShell label="Capital investi initial" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={fmt(value.montant)}
            onChange={e => onChange({ ...value, montant: parseEuro(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <SimFieldShell label="Rendement annuel de capitalisation" className="ts-field" rowClassName="ts-field__row">
          <input type="text" className="sim-field__control"
            value={fmtPct(value.rendementAnnuel)}
            onChange={e => onChange({ ...value, rendementAnnuel: parsePct(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">%</span>
        </SimFieldShell>

        <SimFieldShell label="Durée du placement" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={value.dureeAns ?? ''}
            onChange={e => onChange({ ...value, dureeAns: parseDuree(e.target.value) || undefined })}
          />
          <span className="sim-field__unit ts-unit">ans</span>
        </SimFieldShell>

        <div className="ts-field ts-field--toggle">
          <label className="ts-toggle-label">
            <input type="checkbox"
              checked={value.rachatAuTerme !== false}
              onChange={e => onChange({ ...value, rachatAuTerme: e.target.checked })}
            />
            Rachat total au terme
          </label>
        </div>

        <div className="ts-field ts-field--toggle">
          <label className="ts-toggle-label">
            <input type="checkbox"
              checked={value.repetitionAuTerme ?? false}
              onChange={e => onChange({ ...value, repetitionAuTerme: e.target.checked })}
            />
            Répéter le placement au terme
          </label>
        </div>

        {isExistante && (
          <>
            <SimFieldShell label="Valeur actuelle du placement" className="ts-field" rowClassName="ts-field__row">
              <input type="text" inputMode="numeric" className="sim-field__control"
                value={fmt(value.valeurActuelle ?? 0)}
                onChange={e => onChange({ ...value, valeurActuelle: parseEuro(e.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>
            <SimFieldShell label="Capital investi historique" className="ts-field" rowClassName="ts-field__row"
              hint="Requis pour calculer l'IS latent sur la plus-value"
            >
              <input type="text" inputMode="numeric" className="sim-field__control"
                value={fmt(value.capitalInvestiHistorique ?? 0)}
                onChange={e => onChange({ ...value, capitalInvestiHistorique: parseEuro(e.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>
          </>
        )}

      </div>
      <p className="ts-section__note">
        Aucun IS annuel — IS payable uniquement à la sortie sur la plus-value nette.
      </p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

const DEFAULT_DISTRIBUTION: DistributionPocketInput = {
  montant: 200000,
  rendementDistribue: 0.05,
  dateSouscription: `${new Date().getFullYear()}-01`,
  delaiJouissanceMois: 0,
  dureeAns: 20,
  strategieRevenus: 'tresorerie',
  repetitionAuTerme: false,
};

const DEFAULT_CAPITALISATION: CapitalisationPocketInput = {
  montant: 200000,
  rendementAnnuel: 0.04,
  dureeAns: 15,
  rachatAuTerme: true,
  repetitionAuTerme: false,
};

export function TresoPlacementSection({ inputs, onDistribution, onCapitalisation }: Props) {
  const [distribOpen, setDistribOpen] = useState(!!inputs.distribution);
  const [capiOpen, setCapiOpen] = useState(!!inputs.capitalisation);
  const isExistante = inputs.typeCreation === 'existante';

  function toggleDistrib() {
    if (distribOpen) {
      onDistribution(undefined);
      setDistribOpen(false);
    } else {
      onDistribution(inputs.distribution ?? DEFAULT_DISTRIBUTION);
      setDistribOpen(true);
    }
  }

  function toggleCapi() {
    if (capiOpen) {
      onCapitalisation(undefined);
      setCapiOpen(false);
    } else {
      onCapitalisation(inputs.capitalisation ?? DEFAULT_CAPITALISATION);
      setCapiOpen(true);
    }
  }

  return (
    <div className="premium-card ts-section">
      <div className="ts-section__header">
        <span className="sim-card__icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 12L6 8l3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <h2 className="ts-section__title">Allocation société</h2>
          <p className="ts-section__subtitle">Poches de placement internes à la société IS</p>
        </div>
      </div>
      <div className="ts-section__divider" />

      {/* Poche distribution */}
      <div className="ts-pocket">
        <button
          type="button"
          className={`ts-pocket__toggle${distribOpen ? ' is-open' : ''}`}
          onClick={toggleDistrib}
          aria-expanded={distribOpen}
        >
          <span className="ts-pocket__toggle-label">
            {distribOpen ? '▼' : '▶'} Poche de revenus
            {inputs.distribution && (
              <span className="ts-pocket__badge">
                {fmt(inputs.distribution.montant)} €
              </span>
            )}
          </span>
          {!distribOpen && (
            <span className="ts-pocket__cta">+ Paramétrer</span>
          )}
        </button>

        {distribOpen && inputs.distribution && (
          <DistributionForm
            value={inputs.distribution}
            onChange={onDistribution}
            isExistante={isExistante}
          />
        )}
      </div>

      {/* Poche capitalisation */}
      <div className="ts-pocket">
        <button
          type="button"
          className={`ts-pocket__toggle${capiOpen ? ' is-open' : ''}`}
          onClick={toggleCapi}
          aria-expanded={capiOpen}
        >
          <span className="ts-pocket__toggle-label">
            {capiOpen ? '▼' : '▶'} Poche de capitalisation
            {inputs.capitalisation && (
              <span className="ts-pocket__badge">
                {fmt(inputs.capitalisation.montant)} €
              </span>
            )}
          </span>
          {!capiOpen && (
            <span className="ts-pocket__cta">+ Paramétrer</span>
          )}
        </button>

        {capiOpen && inputs.capitalisation && (
          <CapitalisationForm
            value={inputs.capitalisation}
            onChange={onCapitalisation}
            isExistante={isExistante}
          />
        )}
      </div>
    </div>
  );
}
