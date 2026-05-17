import { useState } from 'react';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import { COMPANY_KIND_OPTIONS, LEGAL_FORM_OPTIONS } from '../../utils/tresorerieSocieteOptions';
import type { CompanyInputV6, CompanyKind, LegalForm } from '@/engine/tresorerie/types';
import { fmtEuroInput, parseEuroInput } from '../../utils/tresorerieFormatters';
import { hasDemembrement } from '../../utils/tresorerieSocieteModel';
import { TresoCompanyFinancialsModal } from './TresoCompanyFinancialsModal';

interface TresoCompanyIdentityPanelProps {
  company: CompanyInputV6;
  onCompanyChange: (patch: Partial<CompanyInputV6>) => void;
}

export function TresoCompanyIdentityPanel({
  company,
  onCompanyChange,
}: TresoCompanyIdentityPanelProps) {
  const [isFinancialsOpen, setFinancialsOpen] = useState(false);
  const showReserveAttributionRule = hasDemembrement(company.associates);
  // Défaut métier : sans choix explicite, on considère que l'usufruitier appréhende les réserves
  // (clé via droits économiques). L'utilisateur peut le désactiver pour modéliser l'application
  // stricte du principe Cass. com. 27 mai 2015 (réserves attachées au NP).
  const usufructuaryReserveAttribution = company.usufructuaryReserveAttribution !== false;

  return (
    <>
      <div className="ts-identity-panel">
        <div className="ts-panel-toolbar">
          <span>Identité</span>
          <button
            type="button"
            className="ts-icon-btn"
            aria-label="Ouvrir les paramètres financiers de la société"
            onClick={() => setFinancialsOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 5.5A2.5 2.5 0 108 10.5 2.5 2.5 0 008 5.5z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M8 1.5v2M8 12.5v2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M1.5 8h2M12.5 8h2M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="ts-modal-grid">
          <SimFieldShell
            label="Libellé de la société principale"
            className="ts-field"
            rowClassName="ts-field__row"
          >
            <input
              type="text"
              className="sim-field__control ts-input-left"
              value={company.label ?? ''}
              onChange={(event) => onCompanyChange({ label: event.target.value })}
            />
          </SimFieldShell>

          <SimFieldShell label="Forme sociale" className="ts-field" rowClassName="ts-field__row">
            <SimSelect
              value={company.legalForm}
              onChange={(value) => onCompanyChange({ legalForm: value as LegalForm })}
              options={LEGAL_FORM_OPTIONS}
              ariaLabel="Forme sociale"
            />
          </SimFieldShell>

          <SimFieldShell label="Type société" className="ts-field" rowClassName="ts-field__row">
            <SimSelect
              value={company.companyKind ?? 'holding_patrimoniale'}
              onChange={(value) => onCompanyChange({ companyKind: value as CompanyKind })}
              options={COMPANY_KIND_OPTIONS}
              ariaLabel="Type société"
            />
          </SimFieldShell>

          <SimFieldShell
            label="Trésorerie initiale"
            className="ts-field"
            rowClassName="ts-field__row"
          >
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={fmtEuroInput(company.treasuryInitial)}
              onChange={(event) =>
                onCompanyChange({ treasuryInitial: parseEuroInput(event.target.value) })
              }
            />
            <span className="sim-field__unit ts-unit">€</span>
          </SimFieldShell>
        </div>

        {showReserveAttributionRule && (
          <div className="ts-reserve-attribution">
            <label className="ts-toggle-label">
              <input
                type="checkbox"
                checked={usufructuaryReserveAttribution}
                onChange={(event) =>
                  onCompanyChange({ usufructuaryReserveAttribution: event.target.checked })
                }
              />
              L’usufruitier appréhende les réserves démembrées
            </label>
            <p className="ts-note--info ts-reserve-attribution__note">
              Sauf convention ou statuts contraires : les réserves accumulées en cours de
              démembrement appartiennent au nue-propriétaire (Cass. com. 27 mai 2015 n°14-16.246).
              Si l’usufruitier les perçoit en distribution, il en bénéficie sous forme de
              quasi-usufruit avec dette de restitution. À valider avec votre conseil juridique.{' '}
              {usufructuaryReserveAttribution
                ? 'Réserves distribuables : reparties selon les droits économiques.'
                : 'Réserves distribuables : reparties uniquement aux associés en pleine propriété.'}
            </p>
          </div>
        )}
      </div>

      {isFinancialsOpen ? (
        <TresoCompanyFinancialsModal
          company={company}
          onChange={onCompanyChange}
          onClose={() => setFinancialsOpen(false)}
        />
      ) : null}
    </>
  );
}
