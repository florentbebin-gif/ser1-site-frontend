/**
 * TresoCreditSection.tsx — Bloc « Crédits »
 *
 * Deux crédits activables indépendamment :
 * - Crédit IR : l'associé emprunte à titre personnel, remboursé via dividendes nets
 * - Crédit IS : la société emprunte (SCPI, immo), intérêts déductibles
 *
 * V1 : PFU uniquement pour le crédit IR — option barème hors scope V1.
 */

import { useState } from 'react';
import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import type {
  CreditIrPocketInput,
  CreditIsPocketInput,
  TresoInputs,
} from '../../../engine/tresorerie/types';

interface Props {
  inputs: TresoInputs;
  onCreditIR: (v: CreditIrPocketInput | undefined) => void;
  onCreditIS: (v: CreditIsPocketInput | undefined) => void;
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
  return isNaN(n) ? 0 : n / 100;
}

function fmtPct(n: number): string {
  return ((n || 0) * 100).toFixed(2).replace('.', ',');
}

function parseDuree(v: string): number {
  const clean = v.replace(/\D/g, '');
  return clean === '' ? 0 : Number(clean);
}

const DEFAULT_CREDIT_IR: CreditIrPocketInput = {
  actif: true,
  capital: 0,
  taux: 0.035,
  dureeMois: 180,
  dateDebut: `${new Date().getFullYear()}-01`,
};

const DEFAULT_CREDIT_IS: CreditIsPocketInput = {
  actif: true,
  capitalEmprunte: 200000,
  taux: 0.04,
  dureeMois: 240,
  dateDeblocage: `${new Date().getFullYear()}-01`,
  actifFinance: 'SCPI',
  rendementActifFinance: 0.05,
  delaiJouissanceMois: 6,
  interetsDeductibles: true,
};

// ─── Formulaire crédit IR ─────────────────────────────────────────────────────

function CreditIRForm({
  value,
  onChange,
}: {
  value: CreditIrPocketInput;
  onChange: (v: CreditIrPocketInput) => void;
}) {
  return (
    <div className="ts-pocket-form">
      <p className="ts-section__note ts-note--info">
        Crédit personnel de l'associé — remboursé via dividendes nets de PFU.
        V1 : fiscalité PFU uniquement.
      </p>
      <div className="ts-fields">

        <SimFieldShell label="Capital emprunté" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={fmt(value.capital)}
            onChange={e => onChange({ ...value, capital: parseEuro(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <SimFieldShell label="Taux annuel" className="ts-field" rowClassName="ts-field__row">
          <input type="text" className="sim-field__control"
            value={fmtPct(value.taux)}
            onChange={e => onChange({ ...value, taux: parsePct(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">%</span>
        </SimFieldShell>

        <SimFieldShell label="Durée" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={value.dureeMois || ''}
            onChange={e => onChange({ ...value, dureeMois: parseDuree(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">mois</span>
        </SimFieldShell>

        <SimFieldShell label="Date de début" className="ts-field" rowClassName="ts-field__row">
          <input type="month" className="sim-field__control ts-input-month"
            value={value.dateDebut ?? ''}
            onChange={e => onChange({ ...value, dateDebut: e.target.value })}
          />
        </SimFieldShell>

      </div>
    </div>
  );
}

// ─── Formulaire crédit IS ─────────────────────────────────────────────────────

function CreditISForm({
  value,
  onChange,
}: {
  value: CreditIsPocketInput;
  onChange: (v: CreditIsPocketInput) => void;
}) {
  return (
    <div className="ts-pocket-form">
      <p className="ts-section__note ts-note--info">
        Emprunt de la société IS — intérêts déductibles du résultat fiscal.
      </p>
      <div className="ts-fields">

        <SimFieldShell label="Capital emprunté" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={fmt(value.capitalEmprunte)}
            onChange={e => onChange({ ...value, capitalEmprunte: parseEuro(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <SimFieldShell label="Taux annuel" className="ts-field" rowClassName="ts-field__row">
          <input type="text" className="sim-field__control"
            value={fmtPct(value.taux)}
            onChange={e => onChange({ ...value, taux: parsePct(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">%</span>
        </SimFieldShell>

        <SimFieldShell label="Durée" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={value.dureeMois || ''}
            onChange={e => onChange({ ...value, dureeMois: parseDuree(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">mois</span>
        </SimFieldShell>

        <SimFieldShell label="Date de déblocage" className="ts-field" rowClassName="ts-field__row">
          <input type="month" className="sim-field__control ts-input-month"
            value={value.dateDeblocage ?? ''}
            onChange={e => onChange({ ...value, dateDeblocage: e.target.value })}
          />
        </SimFieldShell>

        <SimFieldShell label="Actif financé" className="ts-field" rowClassName="ts-field__row"
          hint="Ex : SCPI, immobilier professionnel…"
        >
          <input type="text" className="sim-field__control ts-input-left"
            value={value.actifFinance ?? ''}
            onChange={e => onChange({ ...value, actifFinance: e.target.value })}
          />
        </SimFieldShell>

        <SimFieldShell label="Rendement actif financé" className="ts-field" rowClassName="ts-field__row">
          <input type="text" className="sim-field__control"
            value={fmtPct(value.rendementActifFinance ?? 0)}
            onChange={e => onChange({ ...value, rendementActifFinance: parsePct(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">%</span>
        </SimFieldShell>

        <SimFieldShell label="Délai de jouissance" className="ts-field" rowClassName="ts-field__row">
          <input type="text" inputMode="numeric" className="sim-field__control"
            value={value.delaiJouissanceMois ?? 0}
            onChange={e => onChange({ ...value, delaiJouissanceMois: parseDuree(e.target.value) })}
          />
          <span className="sim-field__unit ts-unit">mois</span>
        </SimFieldShell>

      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function TresoCreditSection({ inputs, onCreditIR, onCreditIS }: Props) {
  const [irOpen, setIrOpen] = useState(!!inputs.creditIR?.actif);
  const [isOpen, setIsOpen] = useState(!!inputs.creditIS?.actif);

  function toggleIR() {
    if (irOpen) {
      onCreditIR(undefined);
      setIrOpen(false);
    } else {
      onCreditIR(inputs.creditIR ?? DEFAULT_CREDIT_IR);
      setIrOpen(true);
    }
  }

  function toggleIS() {
    if (isOpen) {
      onCreditIS(undefined);
      setIsOpen(false);
    } else {
      onCreditIS(inputs.creditIS ?? DEFAULT_CREDIT_IS);
      setIsOpen(true);
    }
  }

  return (
    <div className="premium-card ts-section">
      <div className="ts-section__header">
        <span className="sim-card__icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="4" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 8h6M8 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <h2 className="ts-section__title">Crédits</h2>
          <p className="ts-section__subtitle">Crédit IR associé et crédit IS société</p>
        </div>
      </div>
      <div className="ts-section__divider" />

      {/* Crédit IR */}
      <div className="ts-pocket">
        <button
          type="button"
          className={`ts-pocket__toggle${irOpen ? ' is-open' : ''}`}
          onClick={toggleIR}
          aria-expanded={irOpen}
        >
          <span className="ts-pocket__toggle-label">
            {irOpen ? '▼' : '▶'} Crédit IR — emprunt de l'associé
            {inputs.creditIR && (
              <span className="ts-pocket__badge">
                {fmt(inputs.creditIR.capital)} €
              </span>
            )}
          </span>
          {!irOpen && <span className="ts-pocket__cta">+ Ajouter</span>}
        </button>

        {irOpen && inputs.creditIR && (
          <CreditIRForm value={inputs.creditIR} onChange={onCreditIR} />
        )}
      </div>

      {/* Crédit IS */}
      <div className="ts-pocket">
        <button
          type="button"
          className={`ts-pocket__toggle${isOpen ? ' is-open' : ''}`}
          onClick={toggleIS}
          aria-expanded={isOpen}
        >
          <span className="ts-pocket__toggle-label">
            {isOpen ? '▼' : '▶'} Crédit IS — emprunt de la société
            {inputs.creditIS && (
              <span className="ts-pocket__badge">
                {fmt(inputs.creditIS.capitalEmprunte)} €
              </span>
            )}
          </span>
          {!isOpen && <span className="ts-pocket__cta">+ Ajouter</span>}
        </button>

        {isOpen && inputs.creditIS && (
          <CreditISForm value={inputs.creditIS} onChange={onCreditIS} />
        )}
      </div>
    </div>
  );
}
