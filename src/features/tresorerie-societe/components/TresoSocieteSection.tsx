/**
 * TresoSocieteSection.tsx — Bloc Société + organigramme et modales par élément.
 */

import { useState } from 'react';
import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimModalShell } from '../../../components/ui/sim/SimModalShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type {
  AssociateInput,
  AssociateKind,
  CompanyInput,
  CompanyKind,
  LegalForm,
  TresoInputsV3,
} from '../../../engine/tresorerie/types';
import {
  TresoCompanyLoansPanel,
  TresoCompanyRemunerationsPanel,
  TresoCompanySubsidiariesPanel,
} from './TresoCompanyPanels';
import { TresoAssociateModal } from './societe/TresoAssociateModal';
import { TresoOrgChart } from './societe/TresoOrgChart';
import { TresoSubsidiaryModal } from './societe/TresoSubsidiaryModal';
import {
  COMPANY_KIND_CODES,
  COMPANY_KIND_LABELS,
  getAssociateProfile,
  getOwnershipTotals,
  getSelectedAssociateId,
} from '../utils/tresorerieSocieteModel';
import {
  fmtEuroInput,
  parseEuroInput,
  parsePctInput,
} from '../utils/tresorerieFormatters';

interface Props {
  inputs: TresoInputsV3;
  onChange: (nextInputs: TresoInputsV3) => void;
}

type PanelKey = 'identite' | 'associes' | 'compte' | 'emprunts' | 'filiales' | 'remunerations';

const TYPE_OPTIONS = [
  { value: 'newco', label: 'Société à créer' },
  { value: 'existante', label: 'Société existante' },
];

const LEGAL_FORM_OPTIONS: Array<{ value: LegalForm; label: string }> = [
  { value: 'sas', label: 'SAS' },
  { value: 'sc', label: 'SC' },
  { value: 'sarl', label: 'SARL' },
  { value: 'sa', label: 'SA' },
  { value: 'selarl', label: 'SELARL' },
  { value: 'spfpl', label: 'SPFPL' },
  { value: 'selas', label: 'SELAS' },
  { value: 'autre', label: 'Autre' },
];

const COMPANY_KIND_OPTIONS: Array<{ value: CompanyKind; label: string }> =
  (Object.keys(COMPANY_KIND_LABELS) as CompanyKind[]).map(kind => ({
    value: kind,
    label: `${COMPANY_KIND_LABELS[kind]} (${COMPANY_KIND_CODES[kind]})`,
  }));

const ASSOCIATE_KIND_OPTIONS: Array<{ value: AssociateKind; label: string }> = [
  { value: 'pp', label: 'Associé PP' },
  { value: 'pm', label: 'Associé PM' },
];

const PANEL_OPTIONS: Array<{ key: PanelKey; label: string }> = [
  { key: 'identite', label: 'Identité' },
  { key: 'associes', label: 'Associés' },
  { key: 'compte', label: 'Compte de résultat' },
  { key: 'emprunts', label: 'Emprunts' },
  { key: 'filiales', label: 'Filiales' },
  { key: 'remunerations', label: 'Rémunérations & TNS' },
];

function buildDefaultAssociate(index: number, inputs: TresoInputsV3): AssociateInput {
  const profile = getAssociateProfile(inputs);
  return {
    id: `associe-${Date.now()}-${index + 1}`,
    label: `Associé ${index + 1}`,
    kind: 'pp',
    profile,
    ownershipLots: [{ right: 'pleine_propriete', capitalPct: 0, economicRightsPct: 0 }],
    roles: ['associe_sans_statut'],
    ccaInitial: 0,
    ccaAnnualContribution: 0,
    cca: {
      currentBalance: 0,
      exceptionalContributions: [],
      annualContribution: {
        amount: 0,
        startYear: profile.projectionStartYear,
        endYear: profile.projectionStartYear,
      },
      remunerationRate: 0,
    },
    remunerationAnnualCost: 0,
  };
}

export function TresoSocieteSection({ inputs, onChange }: Props) {
  const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
  const [associateModalId, setAssociateModalId] = useState<string | null>(null);
  const [subsidiaryModalId, setSubsidiaryModalId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelKey>('identite');

  const { company } = inputs;
  const selectedAssociateId = getSelectedAssociateId(inputs);
  const selectedAssociate = company.associates.find(associate => associate.id === selectedAssociateId)
    ?? company.associates[0];
  const activeAssociateModal = company.associates.find(associate => associate.id === associateModalId);
  const activeSubsidiaryModal = company.subsidiaries.find(subsidiary => subsidiary.id === subsidiaryModalId);
  const ownershipTotals = getOwnershipTotals(company.associates);
  const incomeStatement = company.incomeStatement ?? {
    annualRevenue: 0,
    annualStructureCosts: company.annualStructureCosts,
    workingCapitalRequirement: 0,
  };

  const patchInputs = (nextInputs: TresoInputsV3) => onChange(nextInputs);

  const patchCompany = (patch: Partial<CompanyInput>) => {
    patchInputs({ ...inputs, company: { ...company, ...patch } });
  };

  const syncSelectedProfile = (
    associateId: string,
    associates: AssociateInput[],
    nextInputs: TresoInputsV3,
  ): TresoInputsV3 => {
    const associate = associates.find(item => item.id === associateId);
    if (associate?.kind === 'pp' && associate.profile) {
      return {
        ...nextInputs,
        foyer: {
          ...nextInputs.foyer,
          selectedAssociateId: associateId,
          ...associate.profile,
        },
      };
    }
    return {
      ...nextInputs,
      foyer: {
        ...nextInputs.foyer,
        selectedAssociateId: associateId,
      },
    };
  };

  const setSelectedAssociate = (associateId: string) => {
    patchInputs(syncSelectedProfile(associateId, company.associates, {
      ...inputs,
      selectedAssociateId: associateId,
    }));
  };

  const updateAssociate = (associateId: string, patch: Partial<AssociateInput>) => {
    const associates = company.associates.map(associate =>
      associate.id === associateId ? { ...associate, ...patch } : associate,
    );
    const nextInputs = {
      ...inputs,
      company: { ...company, associates },
    };
    patchInputs(syncSelectedProfile(selectedAssociateId, associates, nextInputs));
  };

  const removeAssociate = (associateId: string) => {
    if (company.associates.length <= 1) return;
    const associates = company.associates.filter(associate => associate.id !== associateId);
    const nextSelectedId = associates.some(associate => associate.id === selectedAssociateId)
      ? selectedAssociateId
      : associates[0].id;
    const nextInputs = {
      ...inputs,
      selectedAssociateId: nextSelectedId,
      company: { ...company, associates },
    };
    patchInputs(syncSelectedProfile(nextSelectedId, associates, nextInputs));
  };

  const patchIncomeStatement = (patch: Partial<typeof incomeStatement>) => {
    const nextIncomeStatement = { ...incomeStatement, ...patch };
    patchCompany({
      incomeStatement: nextIncomeStatement,
      annualStructureCosts: nextIncomeStatement.annualStructureCosts,
    });
  };

  const renderIdentitePanel = () => (
    <div className="ts-modal-grid">
      <SimFieldShell label="Type de société" className="ts-field" rowClassName="ts-field__row">
        <SimSelect
          value={company.creationType}
          onChange={value => patchCompany({ creationType: value as CompanyInput['creationType'] })}
          options={TYPE_OPTIONS}
          ariaLabel="Type de société"
        />
      </SimFieldShell>

      <SimFieldShell label="Forme sociale" className="ts-field" rowClassName="ts-field__row">
        <SimSelect
          value={company.legalForm}
          onChange={value => patchCompany({ legalForm: value as LegalForm })}
          options={LEGAL_FORM_OPTIONS}
          ariaLabel="Forme sociale"
        />
      </SimFieldShell>

      <SimFieldShell label="Type société" className="ts-field" rowClassName="ts-field__row">
        <SimSelect
          value={company.companyKind ?? 'holding_patrimoniale'}
          onChange={value => patchCompany({ companyKind: value as CompanyKind })}
          options={COMPANY_KIND_OPTIONS}
          ariaLabel="Type société"
        />
      </SimFieldShell>

      <SimFieldShell label="Capital social" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(company.shareCapital)}
          onChange={event => patchCompany({ shareCapital: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>

      <SimFieldShell label="Prime d’émission" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(company.sharePremium)}
          onChange={event => patchCompany({ sharePremium: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>

      <SimFieldShell label="Trésorerie initiale" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(company.treasuryInitial)}
          onChange={event => patchCompany({ treasuryInitial: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>

      <SimFieldShell label="Réserves initiales" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(company.reservesInitial)}
          onChange={event => patchCompany({ reservesInitial: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>

      <label className="ts-toggle-label ts-modal-toggle">
        <input
          type="checkbox"
          checked={company.reducedCorporateTaxEligible}
          onChange={event => patchCompany({ reducedCorporateTaxEligible: event.target.checked })}
        />
        Éligible au taux réduit d’IS
      </label>
    </div>
  );

  const renderAssociesPanel = () => (
    <div className="ts-modal-stack">
      {company.associates.map((associate, index) => {
        const lot = associate.ownershipLots[0] ?? {
          right: 'pleine_propriete' as const,
          capitalPct: 0,
          economicRightsPct: 0,
        };
        return (
          <div key={associate.id} className="ts-associate-card">
            <div className="ts-associate-card__header">
              <strong>{associate.label || `Associé ${index + 1}`}</strong>
              <div className="ts-card-actions">
                <button type="button" className="ts-text-btn" onClick={() => setAssociateModalId(associate.id)}>
                  Paramétrer
                </button>
                <button
                  type="button"
                  className="ts-text-btn"
                  disabled={company.associates.length <= 1}
                  onClick={() => removeAssociate(associate.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
            <div className="ts-modal-grid">
              <SimFieldShell label="Type d’associé" className="ts-field" rowClassName="ts-field__row">
                <SimSelect
                  value={associate.kind ?? 'pp'}
                  onChange={value => updateAssociate(associate.id, { kind: value as AssociateKind })}
                  options={ASSOCIATE_KIND_OPTIONS}
                  ariaLabel={`Type ${associate.label}`}
                />
              </SimFieldShell>
              <SimFieldShell label="% capital" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="decimal"
                  className="sim-field__control"
                  value={String(lot.capitalPct)}
                  onChange={event => updateAssociate(associate.id, {
                    ownershipLots: [{ ...lot, capitalPct: parsePctInput(event.target.value) }],
                  })}
                />
                <span className="sim-field__unit ts-unit">%</span>
              </SimFieldShell>
              <SimFieldShell label="% économique" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="decimal"
                  className="sim-field__control"
                  value={String(lot.economicRightsPct)}
                  onChange={event => updateAssociate(associate.id, {
                    ownershipLots: [{ ...lot, economicRightsPct: parsePctInput(event.target.value) }],
                  })}
                />
                <span className="sim-field__unit ts-unit">%</span>
              </SimFieldShell>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="ts-text-btn"
        onClick={() => patchCompany({
          associates: [
            ...company.associates,
            buildDefaultAssociate(company.associates.length, inputs),
          ],
        })}
      >
        Ajouter un associé
      </button>
    </div>
  );

  const renderComptePanel = () => (
    <div className="ts-modal-grid">
      <SimFieldShell label="Chiffre d’affaires annuel" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(incomeStatement.annualRevenue)}
          onChange={event => patchIncomeStatement({ annualRevenue: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>
      <SimFieldShell label="Coûts de structure annuels" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(incomeStatement.annualStructureCosts)}
          onChange={event => patchIncomeStatement({ annualStructureCosts: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>
      <SimFieldShell label="BFR" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(incomeStatement.workingCapitalRequirement)}
          onChange={event => patchIncomeStatement({ workingCapitalRequirement: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>
      <p className="ts-note--info">
        Le BFR protège la trésorerie minimale avant balayage vers les poches de placement.
      </p>
    </div>
  );

  const renderActivePanel = () => {
    if (activePanel === 'identite') return renderIdentitePanel();
    if (activePanel === 'associes') return renderAssociesPanel();
    if (activePanel === 'compte') return renderComptePanel();
    if (activePanel === 'emprunts') {
      return (
        <TresoCompanyLoansPanel
          loans={company.loans}
          projectionStartYear={getAssociateProfile(inputs, selectedAssociate).projectionStartYear}
          onChange={loans => patchCompany({ loans })}
        />
      );
    }
    if (activePanel === 'filiales') {
      return (
        <TresoCompanySubsidiariesPanel
          subsidiaries={company.subsidiaries}
          onChange={subsidiaries => patchCompany({ subsidiaries })}
        />
      );
    }
    return (
      <TresoCompanyRemunerationsPanel
        associates={company.associates}
        onChange={updateAssociate}
      />
    );
  };

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
          <h2 className="ts-section__title">Société</h2>
          <p className="ts-section__subtitle">Associés, société et filiales paramétrables depuis le schéma</p>
        </div>
      </div>
      <div className="ts-section__divider" />

      <TresoOrgChart
        company={company}
        selectedAssociateId={selectedAssociateId}
        onCompanyClick={() => setCompanyModalOpen(true)}
        onAssociateClick={associate => {
          setSelectedAssociate(associate.id);
          setAssociateModalId(associate.id);
        }}
        onSubsidiaryClick={subsidiary => setSubsidiaryModalId(subsidiary.id)}
      />

      <div className="ts-org-alerts" aria-live="polite">
        {ownershipTotals.capitalPct > 100 && (
          <p className="ts-warning">Détention capital supérieure à 100 %</p>
        )}
        {ownershipTotals.economicRightsPct > 100 && (
          <p className="ts-warning">Droits économiques supérieurs à 100 %</p>
        )}
      </div>

      {isCompanyModalOpen && (
        <SimModalShell
          title="Paramétrer la société"
          subtitle="Identité, associés, compte de résultat, emprunts, filiales et rémunérations"
          onClose={() => setCompanyModalOpen(false)}
          modalClassName="ts-company-modal"
          bodyClassName="ts-company-modal__body"
        >
          <div className="ts-modal-panels">
            <nav className="ts-modal-tabs" aria-label="Rubriques de la société">
              {PANEL_OPTIONS.map(panel => (
                <button
                  key={panel.key}
                  type="button"
                  className={`ts-modal-tab${activePanel === panel.key ? ' is-active' : ''}`}
                  onClick={() => setActivePanel(panel.key)}
                >
                  {panel.label}
                </button>
              ))}
            </nav>

            <div className="ts-modal-panel">
              {renderActivePanel()}
            </div>
          </div>
        </SimModalShell>
      )}

      {activeAssociateModal && (
        <TresoAssociateModal
          associate={activeAssociateModal}
          fallbackProfile={getAssociateProfile(inputs, activeAssociateModal)}
          onChange={patch => updateAssociate(activeAssociateModal.id, patch)}
          onClose={() => setAssociateModalId(null)}
        />
      )}

      {activeSubsidiaryModal && (
        <TresoSubsidiaryModal
          company={company}
          subsidiary={activeSubsidiaryModal}
          onChange={patch => patchCompany({
            subsidiaries: company.subsidiaries.map(subsidiary =>
              subsidiary.id === activeSubsidiaryModal.id ? { ...subsidiary, ...patch } : subsidiary,
            ),
          })}
          onClose={() => setSubsidiaryModalId(null)}
        />
      )}
    </div>
  );
}
