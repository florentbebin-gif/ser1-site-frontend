/**
 * TresoSocieteSection.tsx — Bloc Société + organigramme et modales par élément.
 */

import { useState } from 'react';
import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimModalShell } from '../../../components/ui/sim/SimModalShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type {
  AssociateKind,
  CompanyInputV5,
  AssociateInputV5,
  TresoInputsV5,
} from '../../../engine/tresorerie/types';
import {
  TresoCompanyLoansPanel,
  TresoCompanySubsidiariesPanel,
} from './TresoCompanyPanels';
import { TresoAssociateModal } from './societe/TresoAssociateModal';
import { TresoCompanyIdentityPanel } from './societe/TresoCompanyIdentityPanel';
import { TresoOrgChart } from './societe/TresoOrgChart';
import { TresoSubsidiaryModal } from './societe/TresoSubsidiaryModal';
import {
  getAssociateProfile,
  getOwnershipTotals,
} from '../utils/tresorerieSocieteModel';
import { ASSOCIATE_KIND_OPTIONS } from '../utils/tresorerieSocieteOptions';
import {
  syncSelectedProfile,
  useTresorerieAssociateHandlers,
} from '../utils/tresorerieAssociateHandlers';
import {
  fmtEuroInput,
  parseEuroInput,
  parsePctInput,
} from '../utils/tresorerieFormatters';

interface Props {
  inputs: TresoInputsV5;
  onChange: (nextInputs: TresoInputsV5) => void;
}

type PanelKey = 'identite' | 'associes' | 'compte' | 'emprunts' | 'filiales';

const PANEL_OPTIONS: Array<{ key: PanelKey; label: string }> = [
  { key: 'identite', label: 'Identité' },
  { key: 'associes', label: 'Associés' },
  { key: 'compte', label: 'Compte de résultat' },
  { key: 'emprunts', label: 'Emprunts' },
  { key: 'filiales', label: 'Filiales' },
];

export function TresoSocieteSection({ inputs, onChange }: Props) {
  const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
  const [associateModalId, setAssociateModalId] = useState<string | null>(null);
  const [subsidiaryModalId, setSubsidiaryModalId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelKey>('identite');

  const { company } = inputs;
  const {
    selectedAssociateId,
    setSelectedAssociate,
    updateAssociate,
    addAssociate,
    removeAssociate,
  } = useTresorerieAssociateHandlers(inputs, onChange);
  const activeAssociateModal = company.associates.find(associate => associate.id === associateModalId);
  const activeSubsidiaryModal = company.subsidiaries.find(subsidiary => subsidiary.id === subsidiaryModalId);
  const ownershipTotals = getOwnershipTotals(company.associates);
  const projectionStartYear = company.projectionStartYear ?? new Date().getFullYear();
  const incomeStatement = company.incomeStatement ?? {
    annualRevenue: 0,
    annualStructureCosts: company.annualStructureCosts,
    workingCapitalRequirement: 0,
  };

  const patchInputs = (nextInputs: TresoInputsV5) => onChange(nextInputs);

  const patchCompany = (patch: Partial<CompanyInputV5>) => {
    patchInputs({ ...inputs, company: { ...company, ...patch } });
  };

  const patchProjectionStartYear = (nextProjectionStartYear: number) => {
    const associates = company.associates.map(associate => ({
      ...associate,
      profile: associate.profile
        ? { ...associate.profile, projectionStartYear: nextProjectionStartYear }
        : associate.profile,
    }));
    const nextInputs = {
      ...inputs,
      company: {
        ...company,
        projectionStartYear: nextProjectionStartYear,
        associates,
      },
    };
    patchInputs(syncSelectedProfile(selectedAssociateId, associates, nextInputs));
  };

  const patchIncomeStatement = (patch: Partial<typeof incomeStatement>) => {
    const nextIncomeStatement = { ...incomeStatement, ...patch };
    patchCompany({
      incomeStatement: nextIncomeStatement,
      annualStructureCosts: nextIncomeStatement.annualStructureCosts,
    });
  };

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
              {lot.right === 'pleine_propriete' ? (
                <p className="ts-field-note">
                  Droits économiques identiques au capital en pleine propriété.
                </p>
              ) : (
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
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="ts-text-btn"
        onClick={addAssociate}
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
    if (activePanel === 'identite') {
      return (
        <TresoCompanyIdentityPanel
          company={company}
          projectionStartYear={projectionStartYear}
          onCompanyChange={patchCompany}
          onProjectionStartYearChange={patchProjectionStartYear}
        />
      );
    }
    if (activePanel === 'associes') return renderAssociesPanel();
    if (activePanel === 'compte') return renderComptePanel();
    if (activePanel === 'emprunts') {
      return (
          <TresoCompanyLoansPanel
            loans={company.loans}
          projectionStartYear={projectionStartYear}
            onChange={loans => patchCompany({ loans })}
          />
      );
    }
    if (activePanel === 'filiales') {
      return (
        <TresoCompanySubsidiariesPanel
          subsidiaries={company.subsidiaries}
          onChange={subsidiaries => patchCompany({ subsidiaries })}
          onConfigure={subsidiaryId => {
            setCompanyModalOpen(false);
            setSubsidiaryModalId(subsidiaryId);
          }}
        />
      );
    }
    return (
      <TresoCompanyIdentityPanel
        company={company}
        projectionStartYear={projectionStartYear}
        onCompanyChange={patchCompany}
        onProjectionStartYearChange={patchProjectionStartYear}
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
        onAssociateClick={associateId => {
          setSelectedAssociate(associateId);
          setAssociateModalId(associateId);
        }}
        onSubsidiaryClick={subsidiaryId => setSubsidiaryModalId(subsidiaryId)}
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
          subtitle="Identité, associés, compte de résultat, emprunts et filiales"
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
          subsidiaries={company.subsidiaries}
          fallbackProfile={getAssociateProfile(inputs, activeAssociateModal)}
          onChange={patch => updateAssociate(activeAssociateModal.id, patch as Partial<AssociateInputV5>)}
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
