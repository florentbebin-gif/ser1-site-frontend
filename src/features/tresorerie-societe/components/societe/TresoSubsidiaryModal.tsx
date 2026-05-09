import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  AmountScheduleInput,
  CompanyInput,
  SubsidiaryDisposalInput,
  SubsidiaryDisposalRegime,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
import {
  fmtEuroInput,
  parseEuroInput,
  parseNumberInput,
  parsePctInput,
} from '../../utils/tresorerieFormatters';

interface TresoSubsidiaryModalProps {
  company: CompanyInput;
  subsidiary: SubsidiaryInput;
  onChange: (patch: Partial<SubsidiaryInput>) => void;
  onClose: () => void;
}

const DISPOSAL_REGIME_OPTIONS: Array<{ value: SubsidiaryDisposalRegime; label: string }> = [
  { value: 'auto', label: 'Auto selon détention et durée' },
  { value: 'pvlt', label: 'Régime PVLT titres de participation' },
  { value: 'standard', label: 'Régime standard' },
];

function parentLabel(company: CompanyInput, parentId: string | undefined): string {
  if (!parentId || parentId === 'societe') return company.label || 'Société mère';
  return company.subsidiaries.find(subsidiary => subsidiary.id === parentId)?.label ?? 'Filiale parente';
}

function normalizeSchedules(
  schedules: AmountScheduleInput[] | undefined,
  fallbackYear = new Date().getFullYear(),
): AmountScheduleInput[] {
  if (schedules && schedules.length > 0) return schedules;
  return [{
    amount: 0,
    startYear: fallbackYear,
    endYear: fallbackYear,
  }];
}

function buildNextSchedule(schedules: AmountScheduleInput[], fallbackYear: number): AmountScheduleInput {
  const previous = schedules[schedules.length - 1];
  const startYear = previous?.endYear != null
    ? previous.endYear + 1
    : (previous?.startYear ?? fallbackYear) + 1;
  return {
    amount: Math.max(0, previous?.amount ?? 0),
    startYear,
    endYear: startYear,
  };
}

function defaultDisposal(subsidiary: SubsidiaryInput): SubsidiaryDisposalInput {
  return subsidiary.disposal ?? {
    year: undefined,
    estimatedPrice: 0,
    taxBasis: 0,
    fees: 0,
    regime: 'auto',
  };
}

export function TresoSubsidiaryModal({
  company,
  subsidiary,
  onChange,
  onClose,
}: TresoSubsidiaryModalProps) {
  const parentOptions = [
    { value: 'societe', label: 'Sous la société mère' },
    ...company.subsidiaries
      .filter(candidate => candidate.id !== subsidiary.id)
      .map(candidate => ({ value: candidate.id, label: `Sous ${candidate.label}` })),
  ];
  const parentId = subsidiary.parentEntityId ?? 'societe';
  const projectionYear =
    company.associates[0]?.profile?.projectionStartYear ??
    new Date().getFullYear();
  const servicesSchedules = normalizeSchedules(
    subsidiary.servicesSchedule,
    projectionYear,
  );
  const dividendsSchedules = normalizeSchedules(
    subsidiary.dividendsSchedule,
    projectionYear,
  );
  const disposal = defaultDisposal(subsidiary);

  const patchServicesSchedule = (index: number, patch: Partial<AmountScheduleInput>) => {
    const nextSchedules = servicesSchedules.map((schedule, scheduleIndex) =>
      scheduleIndex === index ? { ...schedule, ...patch } : schedule,
    );
    onChange({ servicesSchedule: nextSchedules });
  };

  const patchDividendsSchedule = (index: number, patch: Partial<AmountScheduleInput>) => {
    const nextSchedules = dividendsSchedules.map((schedule, scheduleIndex) =>
      scheduleIndex === index ? { ...schedule, ...patch } : schedule,
    );
    onChange({ dividendsSchedule: nextSchedules });
  };

  const addServicesSchedule = () => {
    const nextSchedules = [...servicesSchedules, buildNextSchedule(servicesSchedules, projectionYear)];
    onChange({ servicesSchedule: nextSchedules });
  };

  const addDividendsSchedule = () => {
    const nextSchedules = [...dividendsSchedules, buildNextSchedule(dividendsSchedules, projectionYear)];
    onChange({ dividendsSchedule: nextSchedules });
  };

  const removeServicesSchedule = (index: number) => {
    const nextSchedules = servicesSchedules.filter((_, scheduleIndex) => scheduleIndex !== index);
    onChange({ servicesSchedule: nextSchedules });
  };

  const removeDividendsSchedule = (index: number) => {
    const nextSchedules = dividendsSchedules.filter((_, scheduleIndex) => scheduleIndex !== index);
    onChange({ dividendsSchedule: nextSchedules });
  };

  const patchDisposal = (patch: Partial<SubsidiaryDisposalInput>) => {
    const nextDisposal = { ...disposal, ...patch };
    onChange({ disposal: nextDisposal });
  };

  return (
    <SimModalShell
      title="Paramétrer la filiale"
      subtitle={`${parentLabel(company, parentId)} détient ${subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct} %`}
      onClose={onClose}
      modalClassName="ts-company-modal"
      bodyClassName="ts-company-modal__body"
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
                onChange={event => onChange({ label: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell label="Position dans le schéma" className="ts-field" rowClassName="ts-field__row">
              <SimSelect
                value={parentId}
                onChange={value => onChange({ parentEntityId: value })}
                options={parentOptions}
                ariaLabel="Position de la filiale"
              />
            </SimFieldShell>

            <SimFieldShell label="Détenteur affiché" className="ts-field" rowClassName="ts-field__row">
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
                onChange={event => {
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
            <SimFieldShell label="Trésorerie de la filiale" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.treasuryInitial)}
                onChange={event => onChange({ treasuryInitial: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="BFR filiale" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.workingCapitalRequirement)}
                onChange={event => onChange({ workingCapitalRequirement: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Réserves distribuables" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(subsidiary.distributableReserves)}
                onChange={event => onChange({ distributableReserves: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={subsidiary.motherDaughterEligible}
                onChange={event => onChange({ motherDaughterEligible: event.target.checked })}
              />
              Régime mère-fille éligible
            </label>

            <label className="ts-toggle-label ts-modal-toggle">
              <input
                type="checkbox"
                checked={subsidiary.fiscalIntegrationEstimateEnabled}
                onChange={event => onChange({ fiscalIntegrationEstimateEnabled: event.target.checked })}
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
          <div className="ts-schedule-editor">
            <div className="ts-schedule-editor__header">
              <strong>Prestations annuelles vers la mère</strong>
              <button type="button" className="ts-text-btn" onClick={addServicesSchedule}>
                Ajouter un palier de prestations
              </button>
            </div>
            {servicesSchedules.map((schedule, index) => (
              <div key={`services-${index}`} className="ts-schedule-row">
                <SimFieldShell label={`Montant palier ${index + 1}`} className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={fmtEuroInput(schedule.amount)}
                    onChange={event => patchServicesSchedule(index, { amount: parseEuroInput(event.target.value) })}
                  />
                  <span className="sim-field__unit ts-unit">€</span>
                </SimFieldShell>
                <SimFieldShell label="De" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={schedule.startYear}
                    onChange={event => patchServicesSchedule(index, { startYear: parseNumberInput(event.target.value) })}
                  />
                </SimFieldShell>
                <SimFieldShell label="À" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={schedule.endYear ?? ''}
                    onChange={event => patchServicesSchedule(index, {
                      endYear: parseNumberInput(event.target.value) || undefined,
                    })}
                  />
                </SimFieldShell>
                <button
                  type="button"
                  className="ts-text-btn"
                  disabled={servicesSchedules.length <= 1}
                  onClick={() => removeServicesSchedule(index)}
                >
                  Supprimer
                </button>
              </div>
            ))}

            <div className="ts-schedule-editor__header">
              <strong>Dividendes annuels vers la mère</strong>
              <button type="button" className="ts-text-btn" onClick={addDividendsSchedule}>
                Ajouter un palier de dividendes
              </button>
            </div>
            {dividendsSchedules.map((schedule, index) => (
              <div key={`dividends-${index}`} className="ts-schedule-row">
                <SimFieldShell label={`Montant palier ${index + 1}`} className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={fmtEuroInput(schedule.amount)}
                    onChange={event => patchDividendsSchedule(index, { amount: parseEuroInput(event.target.value) })}
                  />
                  <span className="sim-field__unit ts-unit">€</span>
                </SimFieldShell>
                <SimFieldShell label="De" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={schedule.startYear}
                    onChange={event => patchDividendsSchedule(index, { startYear: parseNumberInput(event.target.value) })}
                  />
                </SimFieldShell>
                <SimFieldShell label="À" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={schedule.endYear ?? ''}
                    onChange={event => patchDividendsSchedule(index, {
                      endYear: parseNumberInput(event.target.value) || undefined,
                    })}
                  />
                </SimFieldShell>
                <button
                  type="button"
                  className="ts-text-btn"
                  disabled={dividendsSchedules.length <= 1}
                  onClick={() => removeDividendsSchedule(index)}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Scénario de cession</strong>
            <span>Valorisation, plus-value et régime fiscal</span>
          </div>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell label="Année de cession" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={disposal.year ?? ''}
                onChange={event => patchDisposal({
                  year: parseNumberInput(event.target.value) || undefined,
                })}
              />
            </SimFieldShell>

            <SimFieldShell label="Valorisation" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(disposal.estimatedPrice)}
                onChange={event => patchDisposal({ estimatedPrice: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Base fiscale" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(disposal.taxBasis)}
                onChange={event => patchDisposal({ taxBasis: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Frais de cession" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(disposal.fees)}
                onChange={event => patchDisposal({ fees: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Année d’acquisition" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={disposal.acquisitionYear ?? ''}
                onChange={event => patchDisposal({
                  acquisitionYear: parseNumberInput(event.target.value) || undefined,
                })}
              />
            </SimFieldShell>

            <SimFieldShell label="Régime de cession" className="ts-field" rowClassName="ts-field__row">
              <SimSelect
                value={disposal.regime}
                onChange={value => patchDisposal({ regime: value as SubsidiaryDisposalRegime })}
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
