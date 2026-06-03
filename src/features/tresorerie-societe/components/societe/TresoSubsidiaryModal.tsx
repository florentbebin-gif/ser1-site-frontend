import { useState } from 'react';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  RuntimeCompanyInput,
  SubsidiaryDisposalInput,
  SubsidiaryDisposalRegime,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
import { TresoSubsidiarySchedulesEditor } from './TresoSubsidiarySchedulesEditor';
import {
  fmtEuroInput,
  parseEuroInput,
  parseNumberInput,
  parsePctInput,
} from '../../utils/tresorerieFormatters';

interface TresoSubsidiaryModalProps {
  company: RuntimeCompanyInput;
  subsidiary: SubsidiaryInput;
  onChange: (patch: Partial<SubsidiaryInput>) => void;
  onClose: () => void;
}

const DISPOSAL_REGIME_OPTIONS: Array<{ value: SubsidiaryDisposalRegime; label: string }> = [
  { value: 'auto', label: 'Auto selon détention et durée' },
  { value: 'pvlt', label: 'Régime PVLT titres de participation' },
  { value: 'standard', label: 'Régime standard' },
];

function parentLabel(company: RuntimeCompanyInput, parentId: string | undefined): string {
  if (!parentId || parentId === 'societe') return company.label || 'Société mère';
  return (
    company.subsidiaries.find((subsidiary) => subsidiary.id === parentId)?.label ??
    'Filiale parente'
  );
}

function defaultDisposal(subsidiary: SubsidiaryInput): SubsidiaryDisposalInput {
  return (
    subsidiary.disposal ?? {
      year: undefined,
      estimatedPrice: 0,
      taxBasis: 0,
      fees: 0,
      regime: 'auto',
    }
  );
}

export function TresoSubsidiaryModal({
  company,
  subsidiary,
  onChange,
  onClose,
}: TresoSubsidiaryModalProps) {
  const [showDisposalInfo, setShowDisposalInfo] = useState(false);
  const parentOptions = [
    { value: 'societe', label: 'Sous la société mère' },
    ...company.subsidiaries
      .filter((candidate) => candidate.id !== subsidiary.id)
      .map((candidate) => ({ value: candidate.id, label: `Sous ${candidate.label}` })),
  ];
  const parentId = subsidiary.parentEntityId ?? 'societe';
  const projectionYear =
    company.associates[0]?.profile?.projectionStartYear ?? new Date().getFullYear();
  const disposal = defaultDisposal(subsidiary);

  const patchDisposal = (patch: Partial<SubsidiaryDisposalInput>) => {
    const nextDisposal = { ...disposal, ...patch };
    onChange({ disposal: nextDisposal });
  };

  return (
    <SimModalShell
      title="Paramétrer la filiale"
      subtitle={`${parentLabel(company, parentId)} détient ${subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct} %`}
      onClose={onClose}
      modalClassName="ts-company-modal sim-modal--lg"
      bodyClassName="ts-company-modal__body"
      footer={
        <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={onClose}>
          Fermer
        </button>
      }
    >
      <div className="ts-modal-stack">
        <div className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Identité et détention</strong>
            <span>La mère est déduite du schéma</span>
          </div>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={subsidiary.label}
                onChange={(event) => onChange({ label: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell
              label="Position dans le schéma"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <SimSelect
                value={parentId}
                onChange={(value) => onChange({ parentEntityId: value })}
                options={parentOptions}
                ariaLabel="Position de la filiale"
              />
            </SimFieldShell>

            <SimFieldShell
              label="Détenteur affiché"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={parentLabel(company, parentId)}
                readOnly
              />
            </SimFieldShell>

            <SimFieldShell label="% de détention" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={String(subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct)}
                onChange={(event) => {
                  const ownershipPct = parsePctInput(event.target.value);
                  onChange({ ownershipPct, holdingOwnershipPct: ownershipPct });
                }}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>
          </div>
        </div>

        <div className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Trésorerie filiale</strong>
            <span>Potentiel de remontée vers la mère</span>
          </div>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell
              label="Trésorerie de la filiale"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.treasuryInitial)}
                onChange={(event) =>
                  onChange({ treasuryInitial: parseEuroInput(event.target.value) })
                }
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="BFR filiale" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.workingCapitalRequirement)}
                onChange={(event) =>
                  onChange({ workingCapitalRequirement: parseEuroInput(event.target.value) })
                }
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell
              label="Réserves distribuables"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.distributableReserves)}
                onChange={(event) =>
                  onChange({ distributableReserves: parseEuroInput(event.target.value) })
                }
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={subsidiary.motherDaughterEligible}
                onChange={(event) => onChange({ motherDaughterEligible: event.target.checked })}
              />
              Régime mère-fille éligible
            </label>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={subsidiary.fiscalIntegrationEstimateEnabled}
                onChange={(event) =>
                  onChange({ fiscalIntegrationEstimateEnabled: event.target.checked })
                }
              />
              Estimation déclarative d’intégration fiscale
            </label>
          </div>
        </div>

        <div className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Paliers de flux vers la mère</strong>
            <span>Montants par périodes successives</span>
          </div>
          <TresoSubsidiarySchedulesEditor
            servicesSchedule={subsidiary.servicesSchedule}
            dividendsSchedule={subsidiary.dividendsSchedule}
            projectionYear={projectionYear}
            onChange={onChange}
          />
        </div>

        <div className="ts-associate-card">
          <div className="ts-associate-card__header ts-associate-card__header--with-action">
            <div>
              <strong>Scénario de cession</strong>
              <span>Valorisation, plus-value et régime fiscal</span>
            </div>
            <button
              type="button"
              className="ts-disposal-info-button"
              aria-label="Comprendre le régime de cession"
              aria-controls="ts-disposal-regime-help"
              aria-expanded={showDisposalInfo}
              onClick={() => setShowDisposalInfo((value) => !value)}
            >
              i
            </button>
          </div>
          {showDisposalInfo ? (
            <div id="ts-disposal-regime-help" className="ts-disposal-info" role="note">
              <ul>
                <li>
                  <strong>Régime standard</strong> : plus-value imposable à l’IS sur la plus-value
                  nette.
                </li>
                <li>
                  <strong>Régime PVLT titres de participation</strong> : plus-value long terme
                  exonérée à 0 %, avec réintégration d’une quote-part taxable de 12 % du montant
                  brut des plus-values éligibles.
                </li>
                <li>
                  Cette quote-part n’est due que si l’exercice constate une plus-value nette long
                  terme sur titres de participation.
                </li>
                <li>
                  La quote-part est ensuite imposée à l’IS, éventuellement au taux réduit PME si la
                  société y est éligible.
                </li>
              </ul>
            </div>
          ) : null}
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell
              label="Année de cession"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={disposal.year ?? ''}
                onChange={(event) =>
                  patchDisposal({
                    year: parseNumberInput(event.target.value) || undefined,
                  })
                }
              />
            </SimFieldShell>

            <SimFieldShell label="Valorisation" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(disposal.estimatedPrice)}
                onChange={(event) =>
                  patchDisposal({ estimatedPrice: parseEuroInput(event.target.value) })
                }
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell
              label="Valeur fiscale des titres"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(disposal.taxBasis)}
                onChange={(event) =>
                  patchDisposal({ taxBasis: parseEuroInput(event.target.value) })
                }
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell
              label="Frais de cession"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(disposal.fees)}
                onChange={(event) => patchDisposal({ fees: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell
              label="Année d’acquisition"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={disposal.acquisitionYear ?? ''}
                onChange={(event) =>
                  patchDisposal({
                    acquisitionYear: parseNumberInput(event.target.value) || undefined,
                  })
                }
              />
            </SimFieldShell>

            <SimFieldShell
              label="Régime de cession"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <SimSelect
                value={disposal.regime}
                onChange={(value) => patchDisposal({ regime: value as SubsidiaryDisposalRegime })}
                options={DISPOSAL_REGIME_OPTIONS}
                ariaLabel="Régime de cession"
              />
            </SimFieldShell>
          </div>
        </div>
      </div>
    </SimModalShell>
  );
}
