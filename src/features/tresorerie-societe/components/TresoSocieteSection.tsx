/**
 * TresoSocieteSection.tsx — Bloc Société + organigramme et modales par élément.
 */

import { useEffect, useState } from 'react';
import { IconBuilding } from '@/icons/ui';
import { SimActionButton } from '@/components/ui/sim';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  AssociateKind,
  CompanyInputV6,
  AssociateInputV6,
  OwnershipRight,
  TresoInputsV6,
} from '@/engine/tresorerie/types';
import { TresoCompanyLoansPanel, TresoCompanySubsidiariesPanel } from './TresoCompanyPanels';
import { TresoAssociateModal } from './societe/TresoAssociateModal';
import { TresoCompanyIdentityPanel } from './societe/TresoCompanyIdentityPanel';
import { TresoOrgChart } from './societe/TresoOrgChart';
import { TresoSubsidiaryModal } from './societe/TresoSubsidiaryModal';
import { getAssociateProfile, getOwnershipTotals } from '@/domain/tresorerie/societeModel';
import { ASSOCIATE_KIND_OPTIONS } from '../utils/tresorerieSocieteOptions';
import { useTresorerieAssociateHandlers } from '../utils/tresorerieAssociateHandlers';
import { fmtEuroInput, parseEuroInput } from '../utils/tresorerieFormatters';

function ownershipRightCode(right: OwnershipRight): string {
  if (right === 'usufruit') return 'US';
  if (right === 'nue_propriete') return 'NP';
  return 'PP';
}

interface Props {
  inputs: TresoInputsV6;
  onChange: (nextInputs: TresoInputsV6) => void;
  onAssociateModalOpenerChange?: (open: ((associateId: string) => void) | null) => void;
}

type PanelKey = 'identite' | 'associes' | 'compte' | 'emprunts' | 'filiales';

const PANEL_OPTIONS: Array<{ key: PanelKey; label: string }> = [
  { key: 'identite', label: 'Identité' },
  { key: 'associes', label: 'Associés' },
  { key: 'compte', label: 'Compte de résultat' },
  { key: 'emprunts', label: 'Emprunts' },
  { key: 'filiales', label: 'Filiales' },
];

export function TresoSocieteSection({ inputs, onChange, onAssociateModalOpenerChange }: Props) {
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
  const activeAssociateModal = company.associates.find(
    (associate) => associate.id === associateModalId,
  );
  const activeSubsidiaryModal = company.subsidiaries.find(
    (subsidiary) => subsidiary.id === subsidiaryModalId,
  );
  const ownershipTotals = getOwnershipTotals(company.associates);
  const projectionStartYear = company.projectionStartYear ?? new Date().getFullYear();
  const incomeStatement = company.incomeStatement ?? {
    annualRevenue: 0,
    annualStructureCosts: company.annualStructureCosts,
    workingCapitalRequirement: 0,
  };

  const patchInputs = (nextInputs: TresoInputsV6) => onChange(nextInputs);

  const patchCompany = (patch: Partial<CompanyInputV6>) => {
    patchInputs({ ...inputs, company: { ...company, ...patch } });
  };

  const patchIncomeStatement = (patch: Partial<typeof incomeStatement>) => {
    const nextIncomeStatement = { ...incomeStatement, ...patch };
    patchCompany({
      incomeStatement: nextIncomeStatement,
      annualStructureCosts: nextIncomeStatement.annualStructureCosts,
    });
  };

  useEffect(() => {
    const handleOpenSocietyPanel = (event: Event) => {
      const detail = (event as CustomEvent<PanelKey>).detail;
      const nextPanel = PANEL_OPTIONS.some((panel) => panel.key === detail) ? detail : 'identite';
      setActivePanel(nextPanel);
      setCompanyModalOpen(true);
    };

    window.addEventListener('ts:open-society-panel', handleOpenSocietyPanel);
    return () => window.removeEventListener('ts:open-society-panel', handleOpenSocietyPanel);
  }, []);

  useEffect(() => {
    if (!onAssociateModalOpenerChange) return undefined;
    const openAssociateModal = (associateId: string) => {
      setSelectedAssociate(associateId);
      setAssociateModalId(associateId);
    };
    onAssociateModalOpenerChange(openAssociateModal);
    return () => onAssociateModalOpenerChange(null);
  }, [onAssociateModalOpenerChange, setSelectedAssociate]);

  const renderAssociesPanel = () => (
    <div className="ts-modal-stack">
      {company.associates.map((associate, index) => {
        const lotsSummary =
          associate.ownershipLots.length > 0
            ? associate.ownershipLots
                .map(
                  (lot) =>
                    `${Math.round((lot.capitalPct || lot.economicRightsPct) * 100) / 100} % ${ownershipRightCode(lot.right)}`,
                )
                .join(' + ')
            : '—';
        return (
          <div key={associate.id} className="ts-associate-card">
            <div className="ts-associate-card__header">
              <strong>{associate.label || `Associé ${index + 1}`}</strong>
              <div className="ts-card-actions">
                <SimActionButton
                  variant="edit"
                  mode="text"
                  label="Paramétrer"
                  ariaLabel={`Paramétrer ${associate.label || `associé ${index + 1}`}`}
                  onClick={() => setAssociateModalId(associate.id)}
                />
                <SimActionButton
                  variant="delete"
                  mode="text"
                  label="Supprimer"
                  ariaLabel={`Supprimer ${associate.label || `associé ${index + 1}`}`}
                  danger
                  disabled={company.associates.length <= 1}
                  onClick={() => removeAssociate(associate.id)}
                />
              </div>
            </div>
            <div className="ts-modal-grid ts-modal-grid--two">
              <SimFieldShell
                label="Type d’associé"
                className="ts-field"
                rowClassName="ts-field__row"
              >
                <SimSelect
                  value={associate.kind ?? 'pp'}
                  onChange={(value) =>
                    updateAssociate(associate.id, { kind: value as AssociateKind })
                  }
                  options={ASSOCIATE_KIND_OPTIONS}
                  ariaLabel={`Type ${associate.label}`}
                />
              </SimFieldShell>
              <SimFieldShell label="Détention" className="ts-field" rowClassName="ts-field__row">
                <span className="sim-field__readonly ts-field-summary">{lotsSummary}</span>
              </SimFieldShell>
            </div>
            <p className="ts-field-note">
              La répartition multi-lots (PP, usufruit, nue-propriété) se règle depuis « Paramétrer
              ».
            </p>
          </div>
        );
      })}

      <SimActionButton
        variant="add"
        mode="text"
        label="Ajouter un associé"
        className="ts-inline-action"
        onClick={addAssociate}
      />
    </div>
  );

  const renderComptePanel = () => (
    <div className="ts-modal-grid">
      <SimFieldShell
        label="Chiffre d’affaires annuel"
        className="ts-field"
        rowClassName="ts-field__row"
      >
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(incomeStatement.annualRevenue)}
          onChange={(event) =>
            patchIncomeStatement({ annualRevenue: parseEuroInput(event.target.value) })
          }
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>
      <SimFieldShell
        label="Coûts de structure annuels"
        className="ts-field"
        rowClassName="ts-field__row"
      >
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(incomeStatement.annualStructureCosts)}
          onChange={(event) =>
            patchIncomeStatement({ annualStructureCosts: parseEuroInput(event.target.value) })
          }
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>
      <SimFieldShell label="BFR" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(incomeStatement.workingCapitalRequirement)}
          onChange={(event) =>
            patchIncomeStatement({ workingCapitalRequirement: parseEuroInput(event.target.value) })
          }
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
      return <TresoCompanyIdentityPanel company={company} onCompanyChange={patchCompany} />;
    }
    if (activePanel === 'associes') return renderAssociesPanel();
    if (activePanel === 'compte') return renderComptePanel();
    if (activePanel === 'emprunts') {
      return (
        <TresoCompanyLoansPanel
          loans={company.loans}
          projectionStartYear={projectionStartYear}
          onChange={(loans) => patchCompany({ loans })}
        />
      );
    }
    if (activePanel === 'filiales') {
      return (
        <TresoCompanySubsidiariesPanel
          subsidiaries={company.subsidiaries}
          onChange={(subsidiaries) => patchCompany({ subsidiaries })}
          onConfigure={(subsidiaryId) => {
            setCompanyModalOpen(false);
            setSubsidiaryModalId(subsidiaryId);
          }}
        />
      );
    }
    return <TresoCompanyIdentityPanel company={company} onCompanyChange={patchCompany} />;
  };

  return (
    <div className="premium-card premium-card--guide sim-card--guide ts-section">
      <div className="ts-section__header sim-card__header sim-card__header--bleed">
        <span className="sim-card__icon">
          <IconBuilding />
        </span>
        <div className="ts-section__header-text">
          <h2 className="ts-section__title sim-card__title">Société</h2>
          <p className="ts-section__subtitle sim-card__subtitle">
            Associés, société et filiales paramétrables depuis le schéma
          </p>
        </div>
      </div>
      <div className="ts-section__divider sim-divider" />

      <TresoOrgChart
        company={company}
        selectedAssociateId={selectedAssociateId}
        onCompanyClick={() => setCompanyModalOpen(true)}
        onAssociateClick={(associateId) => {
          setSelectedAssociate(associateId);
          setAssociateModalId(associateId);
        }}
        onSubsidiaryClick={(subsidiaryId) => setSubsidiaryModalId(subsidiaryId)}
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
          modalClassName="ts-company-modal sim-modal--lg"
          bodyClassName="ts-company-modal__body"
          footer={
            <button
              type="button"
              className="sim-modal-btn sim-modal-btn--primary"
              onClick={() => setCompanyModalOpen(false)}
            >
              Fermer
            </button>
          }
        >
          <div className="ts-modal-panels sim-modal-layout--with-nav">
            <nav
              className="ts-modal-tabs sim-modal-section-nav sim-modal-layout__nav"
              aria-label="Rubriques de la société"
            >
              {PANEL_OPTIONS.map((panel) => (
                <button
                  key={panel.key}
                  type="button"
                  className={`sim-modal-section-nav__item${activePanel === panel.key ? ' is-active' : ''}`}
                  onClick={() => setActivePanel(panel.key)}
                >
                  {panel.label}
                </button>
              ))}
            </nav>

            <div className="ts-modal-panel sim-modal-layout__content">{renderActivePanel()}</div>
          </div>
        </SimModalShell>
      )}

      {activeAssociateModal && (
        <TresoAssociateModal
          associate={activeAssociateModal}
          fallbackProfile={getAssociateProfile(inputs, activeAssociateModal)}
          onChange={(patch) =>
            updateAssociate(activeAssociateModal.id, patch as Partial<AssociateInputV6>)
          }
          onClose={() => setAssociateModalId(null)}
        />
      )}

      {activeSubsidiaryModal && (
        <TresoSubsidiaryModal
          company={company}
          subsidiary={activeSubsidiaryModal}
          onChange={(patch) =>
            patchCompany({
              subsidiaries: company.subsidiaries.map((subsidiary) =>
                subsidiary.id === activeSubsidiaryModal.id
                  ? { ...subsidiary, ...patch }
                  : subsidiary,
              ),
            })
          }
          onClose={() => setSubsidiaryModalId(null)}
        />
      )}
    </div>
  );
}
