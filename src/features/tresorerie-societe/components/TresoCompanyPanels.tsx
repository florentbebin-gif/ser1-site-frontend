import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type {
  AssociateInput,
  AssociateRole,
  CompanyLoanInput,
  SubsidiaryInput,
} from '../../../engine/tresorerie/types';

interface LoansPanelProps {
  loans: CompanyLoanInput[];
  projectionStartYear: number;
  onChange: (loans: CompanyLoanInput[]) => void;
}

interface SubsidiariesPanelProps {
  subsidiaries: SubsidiaryInput[];
  onChange: (subsidiaries: SubsidiaryInput[]) => void;
}

interface RemunerationsPanelProps {
  associates: AssociateInput[];
  onChange: (associateId: string, patch: Partial<AssociateInput>) => void;
}

const FINANCED_ASSET_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'scpi', label: 'SCPI' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'autre', label: 'Autre' },
];

const ROLE_LABELS: Record<AssociateRole, string> = {
  gerant_tns: 'Gérant TNS',
  cogerant_tns: 'Cogérant TNS',
  pdg: 'PDG',
  dg: 'DG',
  associe_sans_statut: 'Associé sans statut',
  salarie: 'Salarié',
};

function fmt(n: number | undefined): string {
  return Math.round(n || 0).toLocaleString('fr-FR');
}

function fmtPct(rate: number | undefined): string {
  return rate == null ? '' : String(Math.round(rate * 100));
}

function parseEuro(v: string): number {
  const clean = v.replace(/\s/g, '').replace(/\D/g, '');
  return clean === '' ? 0 : Math.min(Number(clean), 999_999_999);
}

function parseSignedEuro(v: string): number {
  const negative = v.trim().startsWith('-');
  const amount = parseEuro(v);
  return negative ? -amount : amount;
}

function parseNumber(v: string): number {
  const clean = v.replace(/[^\d]/g, '');
  return clean === '' ? 0 : Number(clean);
}

function parsePct(v: string): number {
  const clean = v.replace(',', '.').replace(/[^\d.]/g, '');
  if (clean === '') return 0;
  return Math.min(Number(clean), 100);
}

function parseRate(v: string): number {
  return parsePct(v) / 100;
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
    holdingOwnershipPct: 100,
    annualServicesRevenue: 0,
    annualDividends: 0,
    motherDaughterEligible: true,
    fiscalIntegrationEstimateEnabled: false,
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
                value={fmt(loan.principal)}
                onChange={event => updateLoan(loan.id, { principal: parseEuro(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Taux annuel" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={fmtPct(loan.annualRate)}
                onChange={event => updateLoan(loan.id, { annualRate: parseRate(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>

            <SimFieldShell label="Durée" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={loan.durationMonths || ''}
                onChange={event => updateLoan(loan.id, { durationMonths: parseNumber(event.target.value) })}
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
                value={fmtPct(loan.financedAssetReturnRate)}
                onChange={event => updateLoan(loan.id, {
                  financedAssetReturnRate: parseRate(event.target.value),
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
                  enjoymentDelayMonths: parseNumber(event.target.value),
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
            <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={subsidiary.label}
                onChange={event => updateSubsidiary(subsidiary.id, { label: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell label="Détention holding" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={String(subsidiary.holdingOwnershipPct)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  holdingOwnershipPct: parsePct(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>

            <SimFieldShell label="Prestations annuelles" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmt(subsidiary.annualServicesRevenue)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  annualServicesRevenue: parseEuro(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Dividendes annuels" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmt(subsidiary.annualDividends)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  annualDividends: parseEuro(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Résultat intégré estimé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmt(subsidiary.estimatedFiscalResult)}
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
                  disposalYear: parseNumber(event.target.value) || undefined,
                })}
              />
            </SimFieldShell>

            <SimFieldShell label="Prix de cession estimé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmt(subsidiary.estimatedDisposalPrice)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  estimatedDisposalPrice: parseEuro(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Base fiscale" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmt(subsidiary.taxBasis)}
                onChange={event => updateSubsidiary(subsidiary.id, {
                  taxBasis: parseEuro(event.target.value),
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

export function TresoCompanyRemunerationsPanel({
  associates,
  onChange,
}: RemunerationsPanelProps) {
  return (
    <div className="ts-modal-stack">
      {associates.map(associate => (
        <div key={associate.id} className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>{associate.label}</strong>
            <span>{ROLE_LABELS[associate.roles[0]] ?? 'Associé'}</span>
          </div>
          <div className="ts-modal-grid">
            <SimFieldShell label="Coût annuel rémunération" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmt(associate.remunerationAnnualCost)}
                onChange={event => onChange(associate.id, {
                  remunerationAnnualCost: parseEuro(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Fin de rémunération" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={associate.remunerationEndYear ?? ''}
                onChange={event => onChange(associate.id, {
                  remunerationEndYear: parseNumber(event.target.value) || undefined,
                })}
              />
              <span className="sim-field__unit ts-unit">année</span>
            </SimFieldShell>

            <SimFieldShell label="Charges TNS manuelles" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={fmtPct(associate.socialChargesManualRate)}
                onChange={event => onChange(associate.id, {
                  socialChargesManualRate: parseRate(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>
          </div>
        </div>
      ))}
    </div>
  );
}
