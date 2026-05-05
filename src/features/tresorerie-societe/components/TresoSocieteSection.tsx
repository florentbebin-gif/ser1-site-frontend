/**
 * TresoSocieteSection.tsx — Bloc Société + organigramme et modale bilan.
 */

import { useState } from 'react';
import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimModalShell } from '../../../components/ui/sim/SimModalShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type {
  AssociateInput,
  AssociateRole,
  CompanyInput,
  OwnershipRight,
  TresoInputsV2,
} from '../../../engine/tresorerie/types';
import {
  TresoCompanyLoansPanel,
  TresoCompanyRemunerationsPanel,
  TresoCompanySubsidiariesPanel,
} from './TresoCompanyPanels';

interface Props {
  inputs: TresoInputsV2;
  onChange: (nextInputs: TresoInputsV2) => void;
}

type PanelKey = 'identite' | 'associes' | 'bilan' | 'emprunts' | 'filiales' | 'remunerations';

const TYPE_OPTIONS = [
  { value: 'newco', label: 'Société à créer' },
  { value: 'existante', label: 'Société existante' },
];

const LEGAL_FORM_OPTIONS = [
  { value: 'sas', label: 'SAS' },
  { value: 'sc', label: 'SC' },
  { value: 'sarl', label: 'SARL' },
  { value: 'autre', label: 'Autre' },
];

const OWNERSHIP_OPTIONS: Array<{ value: OwnershipRight; label: string }> = [
  { value: 'pleine_propriete', label: 'Pleine propriété' },
  { value: 'usufruit', label: 'Usufruit' },
  { value: 'nue_propriete', label: 'Nue-propriété' },
];

const ROLE_OPTIONS: Array<{ value: AssociateRole; label: string }> = [
  { value: 'gerant_tns', label: 'Gérant TNS' },
  { value: 'cogerant_tns', label: 'Cogérant TNS' },
  { value: 'pdg', label: 'PDG' },
  { value: 'dg', label: 'DG' },
  { value: 'associe_sans_statut', label: 'Associé sans statut' },
  { value: 'salarie', label: 'Salarié' },
];

const PANEL_OPTIONS: Array<{ key: PanelKey; label: string }> = [
  { key: 'identite', label: 'Identité' },
  { key: 'associes', label: 'Associés' },
  { key: 'bilan', label: 'Bilan' },
  { key: 'emprunts', label: 'Emprunts' },
  { key: 'filiales', label: 'Filiales' },
  { key: 'remunerations', label: 'Rémunérations & TNS' },
];

function fmt(n: number): string {
  return Math.round(n || 0).toLocaleString('fr-FR');
}

function parseEuro(v: string): number {
  const clean = v.replace(/\s/g, '').replace(/\D/g, '');
  return clean === '' ? 0 : Math.min(Number(clean), 999_999_999);
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

function getPrimaryAssociate(company: CompanyInput): AssociateInput | undefined {
  return company.associates[0];
}

function roleLabel(role: AssociateRole | undefined): string {
  return ROLE_OPTIONS.find(option => option.value === role)?.label ?? 'Associé';
}

export function TresoSocieteSection({ inputs, onChange }: Props) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey>('identite');
  const v2 = inputs;

  const { company } = v2;
  const primaryAssociate = getPrimaryAssociate(company);
  const primaryRole = primaryAssociate?.roles[0] ?? 'associe_sans_statut';
  const totalCca = company.associates.reduce(
    (sum, associate) => sum + associate.ccaInitial + associate.ccaAnnualContribution,
    0,
  );

  const patchV2 = (nextV2: TresoInputsV2) => {
    onChange(nextV2);
  };

  const patchCompany = (patch: Partial<CompanyInput>) => {
    patchV2({ ...v2, company: { ...company, ...patch } });
  };

  const updateAssociate = (
    associateId: string,
    patch: Partial<AssociateInput>,
  ) => {
    const associates = company.associates.map(associate =>
      associate.id === associateId ? { ...associate, ...patch } : associate,
    );
    patchCompany({ associates });
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
          onChange={value => patchCompany({ legalForm: value as CompanyInput['legalForm'] })}
          options={LEGAL_FORM_OPTIONS}
          ariaLabel="Forme sociale"
        />
      </SimFieldShell>

      <SimFieldShell label="Capital social" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmt(company.shareCapital)}
          onChange={event => patchCompany({ shareCapital: parseEuro(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>

      <SimFieldShell label="Prime d’émission" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmt(company.sharePremium)}
          onChange={event => patchCompany({ sharePremium: parseEuro(event.target.value) })}
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
          capitalPct: 100,
          economicRightsPct: 100,
        };
        return (
          <div key={associate.id} className="ts-associate-card">
            <div className="ts-associate-card__header">
              <strong>{associate.label || `Associé ${index + 1}`}</strong>
              <span>{roleLabel(associate.roles[0])}</span>
            </div>
            <div className="ts-modal-grid">
              <SimFieldShell label="Libellé anonyme" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  className="sim-field__control ts-input-left"
                  value={associate.label}
                  onChange={event => updateAssociate(associate.id, { label: event.target.value })}
                />
              </SimFieldShell>

              <SimFieldShell label="Qualité" className="ts-field" rowClassName="ts-field__row">
                <SimSelect
                  value={associate.roles[0] ?? 'associe_sans_statut'}
                  onChange={value => updateAssociate(associate.id, { roles: [value as AssociateRole] })}
                  options={ROLE_OPTIONS}
                  ariaLabel="Qualité de l’associé"
                />
              </SimFieldShell>

              <SimFieldShell label="Droit" className="ts-field" rowClassName="ts-field__row">
                <SimSelect
                  value={lot.right}
                  onChange={value => updateAssociate(associate.id, {
                    ownershipLots: [{ ...lot, right: value as OwnershipRight }],
                  })}
                  options={OWNERSHIP_OPTIONS}
                  ariaLabel="Droit détenu"
                />
              </SimFieldShell>

              <SimFieldShell label="% capital" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="decimal"
                  className="sim-field__control"
                  value={String(lot.capitalPct)}
                  onChange={event => updateAssociate(associate.id, {
                    ownershipLots: [{ ...lot, capitalPct: parsePct(event.target.value) }],
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
                    ownershipLots: [{ ...lot, economicRightsPct: parsePct(event.target.value) }],
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
            {
              id: `associe-${company.associates.length + 1}`,
              label: `Associé ${company.associates.length + 1}`,
              ownershipLots: [{ right: 'pleine_propriete', capitalPct: 0, economicRightsPct: 0 }],
              roles: ['associe_sans_statut'],
              ccaInitial: 0,
              ccaAnnualContribution: 0,
              remunerationAnnualCost: 0,
            },
          ],
        })}
      >
        Ajouter un associé
      </button>
    </div>
  );

  const renderBilanPanel = () => (
    <div className="ts-balance-grid">
      <div className="ts-balance-panel">
        <h3>Actif</h3>
        <SimFieldShell label="Trésorerie existante" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmt(company.treasuryInitial)}
            onChange={event => patchCompany({ treasuryInitial: parseEuro(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>
      </div>

      <div className="ts-balance-panel">
        <h3>Passif</h3>
        <SimFieldShell label="Réserves" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmt(company.reservesInitial)}
            onChange={event => patchCompany({ reservesInitial: parseEuro(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        {primaryAssociate && (
          <>
            <SimFieldShell label="CCA initial" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmt(primaryAssociate.ccaInitial)}
                onChange={event => updateAssociate(
                  primaryAssociate.id,
                  { ccaInitial: parseEuro(event.target.value) },
                )}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Apport annuel CCA" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmt(primaryAssociate.ccaAnnualContribution)}
                onChange={event => updateAssociate(
                  primaryAssociate.id,
                  { ccaAnnualContribution: parseEuro(event.target.value) },
                )}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Fin des apports" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={primaryAssociate.ccaContributionEndYear ?? ''}
                onChange={event => {
                  const endYear = parseNumber(event.target.value);
                  updateAssociate(
                    primaryAssociate.id,
                    { ccaContributionEndYear: endYear || undefined },
                  );
                }}
              />
              <span className="sim-field__unit ts-unit">année</span>
            </SimFieldShell>
          </>
        )}
      </div>
    </div>
  );

  const renderActivePanel = () => {
    if (activePanel === 'identite') return renderIdentitePanel();
    if (activePanel === 'associes') return renderAssociesPanel();
    if (activePanel === 'bilan') return renderBilanPanel();
    if (activePanel === 'emprunts') {
      return (
        <TresoCompanyLoansPanel
          loans={company.loans}
          projectionStartYear={v2.foyer.projectionStartYear}
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
          <p className="ts-section__subtitle">Structure, associés, bilan et flux de trésorerie</p>
        </div>
      </div>
      <div className="ts-section__divider" />

      <button
        type="button"
        className="ts-org-node"
        onClick={() => setModalOpen(true)}
        aria-label="Paramétrer la société"
      >
        <span className="ts-org-node__label">
          {company.creationType === 'newco' ? 'Société à créer' : 'Société existante'}
        </span>
        <strong>{LEGAL_FORM_OPTIONS.find(option => option.value === company.legalForm)?.label}</strong>
        <span className="ts-org-node__meta">
          {company.associates.length} associé{company.associates.length > 1 ? 's' : ''} · {roleLabel(primaryRole)}
        </span>
      </button>

      <div className="ts-company-snapshot" aria-label="Synthèse société">
        <span>Trésorerie {fmt(company.treasuryInitial)} €</span>
        <span>Réserves {fmt(company.reservesInitial)} €</span>
        <span>CCA {fmt(totalCca)} €</span>
      </div>

      {isModalOpen && (
        <SimModalShell
          title="Paramétrer la société"
          subtitle="Bilan, associés, emprunts, filiales et rémunérations"
          onClose={() => setModalOpen(false)}
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
    </div>
  );
}
