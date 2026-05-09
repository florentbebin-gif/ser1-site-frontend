import { useState, type KeyboardEvent } from 'react';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  AssociateInput,
  AssociateKind,
  AssociateProfileInput,
  AssociateRemunerationInput,
  CcaScheduleInput,
  OwnershipRight,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
import { TresoAssociateRemunerationPanel } from './TresoAssociateRemunerationPanel';
import {
  fmtEuroInput,
  fmtRateInput,
  parseEuroInput,
  parseNumberInput,
  parsePctInput,
  parseRateInput,
} from '../../utils/tresorerieFormatters';

interface TresoAssociateModalProps {
  associate: AssociateInput;
  subsidiaries: SubsidiaryInput[];
  fallbackProfile: AssociateProfileInput;
  onChange: (patch: Partial<AssociateInput>) => void;
  onClose: () => void;
}

type AssociateModalSection = 'identite' | 'profil' | 'remuneration' | 'cca';

const ASSOCIATE_KIND_OPTIONS: Array<{ value: AssociateKind; label: string }> = [
  { value: 'pp', label: 'Associé PP' },
  { value: 'pm', label: 'Associé PM' },
];

const OWNERSHIP_OPTIONS: Array<{ value: OwnershipRight; label: string }> = [
  { value: 'pleine_propriete', label: 'Pleine propriété' },
  { value: 'usufruit', label: 'Usufruit' },
  { value: 'nue_propriete', label: 'Nue-propriété' },
];

const ASSOCIATE_MODAL_SECTIONS: Array<{ key: AssociateModalSection; label: string }> = [
  { key: 'identite', label: 'Identité' },
  { key: 'profil', label: 'Profil' },
  { key: 'remuneration', label: 'Rémunération' },
  { key: 'cca', label: 'CCA' },
];

function getCca(associate: AssociateInput, fallbackYear: number): CcaScheduleInput {
  return associate.cca ?? {
    currentBalance: 0,
    exceptionalContributions: [],
    annualContribution: {
      amount: 0,
      startYear: fallbackYear,
      endYear: fallbackYear,
    },
    remunerationRate: 0,
  };
}

function getRemuneration(associate: AssociateInput): AssociateRemunerationInput {
  return associate.remuneration ?? {
    source: 'holding',
    loadedAnnualCost: 0,
    socialChargeRate: 0,
    annualNeedAfterStop: 0,
  };
}

export function TresoAssociateModal({
  associate,
  subsidiaries,
  fallbackProfile,
  onChange,
  onClose,
}: TresoAssociateModalProps) {
  const [activeSection, setActiveSection] = useState<AssociateModalSection>('identite');
  const kind = associate.kind ?? 'pp';
  const profile = associate.profile ?? fallbackProfile;
  const lot = associate.ownershipLots[0] ?? {
    right: 'pleine_propriete' as const,
    capitalPct: 0,
    economicRightsPct: 0,
  };
  const cca = getCca(associate, profile.projectionStartYear);
  const remuneration = getRemuneration(associate);
  const firstExceptionalContribution = cca.exceptionalContributions[0] ?? {
    year: profile.projectionStartYear,
    amount: 0,
  };

  const patchProfile = (patch: Partial<AssociateProfileInput>) => {
    onChange({ profile: { ...profile, ...patch } });
  };

  const patchCca = (patch: Partial<CcaScheduleInput>) => {
    const nextCca = { ...cca, ...patch };
    onChange({ cca: nextCca });
  };

  const selectSection = (section: AssociateModalSection) => {
    setActiveSection(section);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = ASSOCIATE_MODAL_SECTIONS.length - 1;
    const nextIndex = event.key === 'ArrowDown' || event.key === 'ArrowRight'
      ? Math.min(index + 1, lastIndex)
      : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
        ? Math.max(index - 1, 0)
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? lastIndex
            : index;
    if (nextIndex === index) return;
    event.preventDefault();
    setActiveSection(ASSOCIATE_MODAL_SECTIONS[nextIndex].key);
  };

  return (
    <SimModalShell
      title="Paramétrer l’associé"
      subtitle={associate.label}
      onClose={onClose}
      modalClassName="ts-company-modal"
      bodyClassName="ts-company-modal__body"
    >
      <div className="ts-associate-modal-layout">
        <nav
          className="ts-associate-modal-nav"
          role="tablist"
          aria-label="Rubriques de l’associé"
          aria-orientation="vertical"
        >
          {ASSOCIATE_MODAL_SECTIONS.map((section, index) => (
            <button
              key={section.key}
              id={`ts-associate-tab-${section.key}`}
              type="button"
              role="tab"
              className={activeSection === section.key ? 'is-active' : ''}
              aria-controls={`ts-associate-panel-${section.key}`}
              aria-selected={activeSection === section.key}
              tabIndex={activeSection === section.key ? 0 : -1}
              onClick={() => selectSection(section.key)}
              onKeyDown={event => handleTabKeyDown(event, index)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div
          className="ts-associate-modal-panel"
          id={`ts-associate-panel-${activeSection}`}
          role="tabpanel"
          aria-labelledby={`ts-associate-tab-${activeSection}`}
          tabIndex={0}
        >
        {activeSection === 'identite' && (
        <div className="ts-modal-grid ts-modal-grid--three">
          <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
            <input
              type="text"
              className="sim-field__control ts-input-left"
              value={associate.label}
              onChange={event => onChange({ label: event.target.value })}
            />
          </SimFieldShell>

          <SimFieldShell label="Type d’associé" className="ts-field" rowClassName="ts-field__row">
            <SimSelect
              value={kind}
              onChange={value => onChange({ kind: value as AssociateKind })}
              options={ASSOCIATE_KIND_OPTIONS}
              ariaLabel="Type d’associé"
            />
          </SimFieldShell>

          <SimFieldShell label="Droit" className="ts-field" rowClassName="ts-field__row">
            <SimSelect
              value={lot.right}
              onChange={value => onChange({
                ownershipLots: [{
                  ...lot,
                  right: value as OwnershipRight,
                  economicRightsPct: value === 'pleine_propriete'
                    ? lot.capitalPct
                    : lot.economicRightsPct,
                }],
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
              onChange={event => onChange({
                ownershipLots: [{
                  ...lot,
                  capitalPct: parsePctInput(event.target.value),
                  economicRightsPct: lot.right === 'pleine_propriete'
                    ? parsePctInput(event.target.value)
                    : lot.economicRightsPct,
                }],
              })}
            />
            <span className="sim-field__unit ts-unit">%</span>
          </SimFieldShell>

          {lot.right === 'pleine_propriete' ? (
            <p className="ts-field-note">
              En pleine propriété, les droits économiques suivent automatiquement le capital.
            </p>
          ) : (
            <SimFieldShell label="% économique" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={String(lot.economicRightsPct)}
                onChange={event => onChange({
                  ownershipLots: [{ ...lot, economicRightsPct: parsePctInput(event.target.value) }],
                })}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>
          )}
        </div>
        )}

        {activeSection === 'profil' && kind === 'pp' && (
          <div className="ts-associate-card">
            <div className="ts-associate-card__header">
              <strong>Profil foyer</strong>
              <span>Paramètre personnel de projection</span>
            </div>
            <p className="ts-note--info">
              La projection démarre en {profile.projectionStartYear}. L’année est pilotée depuis la société.
            </p>
            <div className="ts-modal-grid ts-modal-grid--three">
              <SimFieldShell label="Âge actuel" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={profile.currentAge}
                  onChange={event => patchProfile({ currentAge: parseNumberInput(event.target.value) })}
                />
              </SimFieldShell>
            </div>
          </div>
        )}

        {activeSection === 'profil' && kind === 'pm' && (
          <div className="ts-associate-card">
            <div className="ts-associate-card__header">
              <strong>Profil</strong>
              <span>Associé personne morale</span>
            </div>
            <p className="ts-note--info">
              Une personne morale ne porte pas de besoin retraite personnel dans cette version.
            </p>
          </div>
        )}

        {activeSection === 'remuneration' && (
          <TresoAssociateRemunerationPanel
            associate={associate}
            profile={profile}
            remuneration={remuneration}
            subsidiaries={subsidiaries}
            onChange={onChange}
          />
        )}

        {activeSection === 'cca' && (
        <div className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Compte courant d’associé</strong>
            <span>Taux maximum déductible</span>
          </div>
          <p className="ts-note--info">
            Les intérêts CCA sont saisis au taux convenu ; la déductibilité est plafonnée par le taux maximum déductible issu des paramètres fiscaux.
          </p>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell label="CCA actuel" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(cca.currentBalance)}
                onChange={event => patchCca({ currentBalance: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>
            <SimFieldShell label="Apport exceptionnel" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(firstExceptionalContribution.amount)}
                onChange={event => patchCca({
                  exceptionalContributions: [{
                    ...firstExceptionalContribution,
                    amount: parseEuroInput(event.target.value),
                  }],
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>
            <SimFieldShell label="Année exceptionnelle" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={firstExceptionalContribution.year}
                onChange={event => patchCca({
                  exceptionalContributions: [{
                    ...firstExceptionalContribution,
                    year: parseNumberInput(event.target.value),
                  }],
                })}
              />
            </SimFieldShell>
            <SimFieldShell label="Apport annuel" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(cca.annualContribution.amount)}
                onChange={event => patchCca({
                  annualContribution: {
                    ...cca.annualContribution,
                    amount: parseEuroInput(event.target.value),
                  },
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>
            <SimFieldShell label="Apport annuel de" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={cca.annualContribution.startYear}
                onChange={event => patchCca({
                  annualContribution: {
                    ...cca.annualContribution,
                    startYear: parseNumberInput(event.target.value),
                  },
                })}
              />
            </SimFieldShell>
            <SimFieldShell label="Apport annuel à" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={cca.annualContribution.endYear ?? ''}
                onChange={event => {
                  const endYear = parseNumberInput(event.target.value);
                  patchCca({
                    annualContribution: {
                      ...cca.annualContribution,
                      endYear: endYear || undefined,
                    },
                  });
                }}
              />
            </SimFieldShell>
            <SimFieldShell label="Taux de rémunération CCA" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={fmtRateInput(cca.remunerationRate)}
                onChange={event => patchCca({ remunerationRate: parseRateInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>
          </div>
        </div>
        )}
        </div>
      </div>
    </SimModalShell>
  );
}
