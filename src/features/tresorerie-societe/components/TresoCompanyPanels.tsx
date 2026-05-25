import { SimActionButton } from '@/components/ui/sim';
import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type { CompanyLoanInput, SubsidiaryInput } from '../../../engine/tresorerie/types';
import {
  fmtEuroInput,
  fmtRateInput,
  parseEuroInput,
  parseNumberInput,
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
  onConfigure?: (subsidiaryId: string) => void;
}

const FINANCED_ASSET_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'scpi', label: 'SCPI' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'autre', label: 'Autre' },
];

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
    holdingOwnershipPct: 100,
    motherDaughterEligible: true,
    fiscalIntegrationEstimateEnabled: false,
    treasuryInitial: 0,
    workingCapitalRequirement: 0,
    distributableReserves: 0,
    servicesSchedule: [],
    dividendsSchedule: [],
  };
}

function subsidiaryParentLabel(
  subsidiaries: SubsidiaryInput[],
  subsidiary: SubsidiaryInput,
): string {
  const parentId = subsidiary.parentEntityId ?? 'societe';
  if (parentId === 'societe') return 'Société mère';
  return subsidiaries.find((candidate) => candidate.id === parentId)?.label ?? 'Filiale parente';
}

export function TresoCompanyLoansPanel({ loans, projectionStartYear, onChange }: LoansPanelProps) {
  const updateLoan = (loanId: string, patch: Partial<CompanyLoanInput>) => {
    onChange(loans.map((loan) => (loan.id === loanId ? { ...loan, ...patch } : loan)));
  };

  const removeLoan = (loanId: string) => {
    onChange(loans.filter((loan) => loan.id !== loanId));
  };

  return (
    <div className="ts-modal-stack">
      {loans.map((loan, index) => (
        <div key={loan.id} className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>{loan.label || `Emprunt société ${index + 1}`}</strong>
            <SimActionButton
              variant="delete"
              mode="text"
              label="Supprimer"
              ariaLabel={`Supprimer ${loan.label || `emprunt société ${index + 1}`}`}
              danger
              onClick={() => removeLoan(loan.id)}
            />
          </div>

          <div className="ts-modal-grid">
            <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={loan.label}
                onChange={(event) => updateLoan(loan.id, { label: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell label="Nature actif" className="ts-field" rowClassName="ts-field__row">
              <SimSelect
                value={loan.financedAssetKind ?? ''}
                onChange={(value) =>
                  updateLoan(loan.id, {
                    financedAssetKind: value
                      ? (value as CompanyLoanInput['financedAssetKind'])
                      : undefined,
                  })
                }
                options={FINANCED_ASSET_OPTIONS}
                ariaLabel={`Nature actif ${index + 1}`}
              />
            </SimFieldShell>

            <SimFieldShell
              label="Capital emprunté"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(loan.principal)}
                onChange={(event) =>
                  updateLoan(loan.id, { principal: parseEuroInput(event.target.value) })
                }
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Taux annuel" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={fmtRateInput(loan.annualRate)}
                onChange={(event) =>
                  updateLoan(loan.id, { annualRate: parseRateInput(event.target.value) })
                }
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>

            <SimFieldShell label="Durée" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={loan.durationMonths || ''}
                onChange={(event) =>
                  updateLoan(loan.id, { durationMonths: parseNumberInput(event.target.value) })
                }
              />
              <span className="sim-field__unit ts-unit">mois</span>
            </SimFieldShell>

            <SimFieldShell label="Date de début" className="ts-field" rowClassName="ts-field__row">
              <input
                type="month"
                className="sim-field__control ts-input-month"
                value={loan.startDate}
                onChange={(event) => updateLoan(loan.id, { startDate: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell label="Actif financé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={loan.financedAssetLabel ?? ''}
                onChange={(event) =>
                  updateLoan(loan.id, { financedAssetLabel: event.target.value })
                }
              />
            </SimFieldShell>

            <SimFieldShell
              label="Rendement actif"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={fmtRateInput(loan.financedAssetReturnRate)}
                onChange={(event) =>
                  updateLoan(loan.id, {
                    financedAssetReturnRate: parseRateInput(event.target.value),
                  })
                }
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>

            <SimFieldShell
              label="Délai de jouissance"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={loan.enjoymentDelayMonths ?? ''}
                onChange={(event) =>
                  updateLoan(loan.id, {
                    enjoymentDelayMonths: parseNumberInput(event.target.value),
                  })
                }
              />
              <span className="sim-field__unit ts-unit">mois</span>
            </SimFieldShell>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={loan.existingLoan}
                onChange={(event) => updateLoan(loan.id, { existingLoan: event.target.checked })}
              />
              Emprunt existant
            </label>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={loan.deductibleInterest}
                onChange={(event) =>
                  updateLoan(loan.id, { deductibleInterest: event.target.checked })
                }
              />
              Intérêts déductibles
            </label>
          </div>
        </div>
      ))}

      <SimActionButton
        variant="add"
        mode="text"
        label="Ajouter un emprunt"
        className="ts-inline-action"
        onClick={() => onChange([...loans, buildDefaultLoan(loans.length, projectionStartYear)])}
      />
    </div>
  );
}

export function TresoCompanySubsidiariesPanel({
  subsidiaries,
  onChange,
  onConfigure,
}: SubsidiariesPanelProps) {
  const removeSubsidiary = (subsidiaryId: string) => {
    onChange(subsidiaries.filter((subsidiary) => subsidiary.id !== subsidiaryId));
  };

  const addSubsidiary = () => {
    const subsidiary = buildDefaultSubsidiary(subsidiaries.length);
    onChange([...subsidiaries, subsidiary]);
    onConfigure?.(subsidiary.id);
  };

  return (
    <div className="ts-modal-stack">
      {subsidiaries.map((subsidiary, index) => (
        <div key={subsidiary.id} className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>{subsidiary.label || `Filiale ${index + 1}`}</strong>
            <div className="ts-card-actions">
              <SimActionButton
                variant="edit"
                mode="text"
                label="Paramétrer"
                ariaLabel={`Paramétrer ${subsidiary.label || `filiale ${index + 1}`}`}
                onClick={() => onConfigure?.(subsidiary.id)}
              />
              <SimActionButton
                variant="delete"
                mode="text"
                label="Supprimer"
                ariaLabel={`Supprimer ${subsidiary.label || `filiale ${index + 1}`}`}
                danger
                onClick={() => removeSubsidiary(subsidiary.id)}
              />
            </div>
          </div>

          <div className="ts-company-snapshot">
            <span>{subsidiaryParentLabel(subsidiaries, subsidiary)}</span>
            <span>{subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct} % détenu</span>
            <span>Cession {subsidiary.disposal?.year ?? 'non prévue'}</span>
          </div>
        </div>
      ))}

      <SimActionButton
        variant="add"
        mode="text"
        label="Ajouter une filiale"
        className="ts-inline-action"
        onClick={addSubsidiary}
      />
    </div>
  );
}
