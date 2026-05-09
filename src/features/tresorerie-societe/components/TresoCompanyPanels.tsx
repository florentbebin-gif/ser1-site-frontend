import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type {
  CompanyLoanInput,
  SubsidiaryInput,
} from '../../../engine/tresorerie/types';
import {
  fmtEuroInput,
  fmtRateInput,
  parseEuroInput,
  parseNumberInput,
  parsePctInput,
  parseRateInput,
} from '../utils/tresorerieFormatters';

interface LoansPanelProps {
  loans: CompanyLoanInput[];
  projectionStartYear: number;
  onChange: (loans: CompanyLoanInput[]) => void;
}

interface SubsidiariesPanelProps {
  subsidiaries: SubsidiaryInput[];
  onChange: (subsidiaries: SubsidiaryInput[]) => void;
}

const FINANCED_ASSET_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'scpi', label: 'SCPI' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'autre', label: 'Autre' },
];

function parseSignedEuro(v: string): number {
  const negative = v.trim().startsWith('-');
  const amount = parseEuroInput(v);
  return negative ? -amount : amount;
}

function buildDefaultLoan(index: number, startYear: number): CompanyLoanInput {
  return {
    id: `emprunt-${Date.now()}-${index + 1}`,
    label: `Emprunt société ${index + 1}`,
    principal: 0,
    annualRate: 0,
    durationMonths: 120,
    startDate: `${startYear}-01`,
    existingLoan: false,
    deductibleInterest: true,
  };
}

function buildDefaultSubsidiary(index: number): SubsidiaryInput {
  return {
    id: `filiale-${Date.now()}-${index + 1}`,
    label: `Filiale ${index + 1}`,
    parentEntityId: 'societe',
    ownershipPct: 100,
    displayOrder: index,
    holdingOwnershipPct: 100,
    annualServicesRevenue: 0,
    annualDividends: 0,
    motherDaughterEligible: true,
    fiscalIntegrationEstimateEnabled: false,
    treasuryInitial: 0,
    workingCapitalRequirement: 0,
    distributableReserves: 0,
    servicesSchedule: [],
    dividendsSchedule: [],
  };
}

export function TresoCompanyLoansPanel({
  loans,
  projectionStartYear,
  onChange,
}: LoansPanelProps) {
  const updateLoan = (loanId: string, patch: Partial<CompanyLoanInput>) => {
    onChange(loans.map(loan => loan.id === loanId ? { ...loan, ...patch } : loan));
  };

  const removeLoan = (loanId: string) => {
    onChange(loans.filter(loan => loan.id !== loanId));
  };

  return (
    <div className="ts-modal-stack">
      {loans.map((loan, index) => (
        <div key={loan.id} className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>{loan.label || `Emprunt société ${index + 1}`}</strong>
            <button type="button" className="ts-text-btn" onClick={() => removeLoan(loan.id)}>
              Supprimer
            </button>
          </div>

          <div className="ts-modal-grid">
            <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={loan.label}
                onChange={event => updateLoan(loan.id, { label: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell label="Nature actif" className="ts-field" rowClassName="ts-field__row">
              <SimSelect
                value={loan.financedAssetKind ?? ''}
                onChange={value => updateLoan(loan.id, {
                  financedAssetKind: value
                    ? value as CompanyLoanInput['financedAssetKind']
                    : undefined,
                })}
                options={FINANCED_ASSET_OPTIONS}
                ariaLabel={`Nature actif ${index + 1}`}
              />
            </SimFieldShell>

            <SimFieldShell label="Capital emprunté" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(loan.principal)}
                onChange={event => updateLoan(loan.id, { principal: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Taux annuel" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={fmtRateInput(loan.annualRate)}
                onChange={event => updateLoan(loan.id, { annualRate: parseRateInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>

            <SimFieldShell label="Durée" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={loan.durationMonths || ''}
                onChange={event => updateLoan(loan.id, { durationMonths: parseNumberInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">mois</span>
            </SimFieldShell>

            <SimFieldShell label="Date de début" className="ts-field" rowClassName="ts-field__row">
              <input
                type="month"
                className="sim-field__control ts-input-month"
                value={loan.startDate}
                onChange={event => updateLoan(loan.id, { startDate: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell label="Actif financé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={loan.financedAssetLabel ?? ''}
                onChange={event => updateLoan(loan.id, { financedAssetLabel: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell label="Rendement actif" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={fmtRateInput(loan.financedAssetReturnRate)}
                onChange={event => updateLoan(loan.id, {
                  financedAssetReturnRate: parseRateInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>

            <SimFieldShell label="Délai de jouissance" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={loan.enjoymentDelayMonths ?? ''}
                onChange={event => updateLoan(loan.id, {
                  enjoymentDelayMonths: parseNumberInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">mois</span>
            </SimFieldShell>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={loan.existingLoan}
                onChange={event => updateLoan(loan.id, { existingLoan: event.target.checked })}
              />
              Emprunt existant
            </label>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={loan.deductibleInterest}
                onChange={event => updateLoan(loan.id, { deductibleInterest: event.target.checked })}
              />
              Intérêts déductibles
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="ts-text-btn"
        onClick={() => onChange([...loans, buildDefaultLoan(loans.length, projectionStartYear)])}
      >
        Ajouter un emprunt
      </button>
    </div>
  );
}

export function TresoCompanySubsidiariesPanel({
  subsidiaries,
  onChange,
}: SubsidiariesPanelProps) {
  const updateSubsidiary = (subsidiaryId: string, patch: Partial<SubsidiaryInput>) => {
    onChange(subsidiaries.map(subsidiary =>
      subsidiary.id === subsidiaryId ? { ...subsidiary, ...patch } : subsidiary,
    ));
  };

  const removeSubsidiary = (subsidiaryId: string) => {
    onChange(subsidiaries.filter(subsidiary => subsidiary.id !== subsidiaryId));
  };

  return (
    <div className="ts-modal-stack">
      {subsidiaries.map((subsidiary, index) => (
        <div key={subsidiary.id} className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>{subsidiary.label || `Filiale ${index + 1}`}</strong>
            <button
              type="button"
              className="ts-text-btn"
              onClick={() => removeSubsidiary(subsidiary.id)}
            >
              Supprimer
            </button>
          </div>

          <div className="ts-modal-grid">
            <SimFieldShell label="Position" className="ts-field" rowClassName="ts-field__row">
              <SimSelect
                value={subsidiary.parentEntityId ?? 'societe'}
                onChange={value => updateSubsidiary(subsidiary.id, { parentEntityId: value })}
                options={[
                  { value: 'societe', label: 'Sous la société mère' },
                  ...subsidiaries
                    .filter(candidate => candidate.id !== subsidiary.id)
                    .map(candidate => ({ value: candidate.id, label: `Sous ${candidate.label}` })),
                ]}
                ariaLabel={`Position filiale ${index + 1}`}
              />
            </SimFieldShell>

            <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={subsidiary.label}
                onChange={event => updateSubsidiary(subsidiary.id, { label: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell label="Détention" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={String(subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct)}
                onChange={event => {
                  const ownershipPct = parsePctInput(event.target.value);
                  updateSubsidiary(subsidiary.id, { ownershipPct, holdingOwnershipPct: ownershipPct });
                }}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>

            <SimFieldShell label="Détenteur affiché" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={(subsidiary.parentEntityId ?? 'societe') === 'societe'
                  ? 'Société mère'
                  : subsidiaries.find(candidate => candidate.id === subsidiary.parentEntityId)?.label ?? 'Filiale parente'}
                readOnly
              />
            </SimFieldShell>

            <SimFieldShell label="Prestations annuelles vers la mère" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.annualServicesRevenue)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  annualServicesRevenue: parseEuroInput(event.target.value),
                  servicesSchedule: [{
                    amount: parseEuroInput(event.target.value),
                    startYear: subsidiary.servicesSchedule?.[0]?.startYear ?? new Date().getFullYear(),
                    endYear: subsidiary.servicesSchedule?.[0]?.endYear,
                  }],
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Dividendes annuels vers la mère" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.annualDividends)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  annualDividends: parseEuroInput(event.target.value),
                  dividendsSchedule: [{
                    amount: parseEuroInput(event.target.value),
                    startYear: subsidiary.dividendsSchedule?.[0]?.startYear ?? new Date().getFullYear(),
                    endYear: subsidiary.dividendsSchedule?.[0]?.endYear,
                  }],
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Trésorerie de la filiale" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.treasuryInitial)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  treasuryInitial: parseEuroInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="BFR filiale" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.workingCapitalRequirement)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  workingCapitalRequirement: parseEuroInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Réserves distribuables" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.distributableReserves)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  distributableReserves: parseEuroInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Résultat intégré estimé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.estimatedFiscalResult)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  estimatedFiscalResult: parseSignedEuro(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Année de cession" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={subsidiary.disposalYear ?? ''}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  disposalYear: parseNumberInput(event.target.value) || undefined,
                })}
              />
            </SimFieldShell>

            <SimFieldShell label="Prix de cession estimé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.estimatedDisposalPrice)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  estimatedDisposalPrice: parseEuroInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Base fiscale" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.taxBasis)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  taxBasis: parseEuroInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={subsidiary.motherDaughterEligible}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  motherDaughterEligible: event.target.checked,
                })}
              />
              Régime mère-fille éligible
            </label>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={subsidiary.fiscalIntegrationEstimateEnabled}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  fiscalIntegrationEstimateEnabled: event.target.checked,
                })}
              />
              Estimation déclarative d’intégration fiscale
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="ts-text-btn"
        onClick={() => onChange([...subsidiaries, buildDefaultSubsidiary(subsidiaries.length)])}
      >
        Ajouter une filiale
      </button>
    </div>
  );
}
