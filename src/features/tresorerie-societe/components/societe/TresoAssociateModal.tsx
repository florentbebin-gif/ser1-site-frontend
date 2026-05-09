import { useRef, useState } from 'react';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  AssociateInput,
  AssociateKind,
  AssociateProfileInput,
  AssociateRemunerationInput,
  AssociateRemunerationSource,
  CcaScheduleInput,
  OwnershipRight,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
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

const REMUNERATION_SOURCE_OPTIONS: Array<{ value: AssociateRemunerationSource; label: string }> = [
  { value: 'holding', label: 'Holding' },
  { value: 'subsidiary', label: 'Filiale' },
];

const ASSOCIATE_MODAL_SECTIONS: Array<{ key: AssociateModalSection; label: string }> = [
  { key: 'identite', label: 'Identité' },
  { key: 'profil', label: 'Profil' },
  { key: 'remuneration', label: 'Rémunération' },
  { key: 'cca', label: 'CCA' },
];

function getCca(associate: AssociateInput, fallbackYear: number): CcaScheduleInput {
  return associate.cca ?? {
    currentBalance: associate.ccaInitial,
    exceptionalContributions: [],
    annualContribution: {
      amount: associate.ccaAnnualContribution,
      startYear: fallbackYear,
      endYear: associate.ccaContributionEndYear,
    },
    remunerationRate: 0,
  };
}

function getRemuneration(associate: AssociateInput): AssociateRemunerationInput {
  return associate.remuneration ?? {
    source: 'holding',
    loadedAnnualCost: Math.max(0, associate.remunerationAnnualCost ?? 0),
    socialChargeRate: Math.max(0, associate.socialChargesManualRate ?? 0),
    endYear: associate.remunerationEndYear,
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
  const sectionRefs = {
    identite: useRef<HTMLDivElement>(null),
    profil: useRef<HTMLDivElement>(null),
    remuneration: useRef<HTMLDivElement>(null),
    cca: useRef<HTMLDivElement>(null),
  };
  const kind = associate.kind ?? 'pp';
  const profile = associate.profile ?? fallbackProfile;
  const lot = associate.ownershipLots[0] ?? {
    right: 'pleine_propriete' as const,
    capitalPct: 0,
    economicRightsPct: 0,
  };
  const cca = getCca(associate, profile.projectionStartYear);
  const remuneration = getRemuneration(associate);
  const netRemuneration = Math.max(0, remuneration.loadedAnnualCost * (1 - remuneration.socialChargeRate));
  const firstExceptionalContribution = cca.exceptionalContributions[0] ?? {
    year: profile.projectionStartYear,
    amount: 0,
  };

  const patchProfile = (patch: Partial<AssociateProfileInput>) => {
    onChange({ profile: { ...profile, ...patch } });
  };

  const patchRemuneration = (patch: Partial<AssociateRemunerationInput>) => {
    const nextRemuneration = { ...remuneration, ...patch };
    onChange({
      remuneration: nextRemuneration,
      remunerationAnnualCost: nextRemuneration.loadedAnnualCost,
      remunerationEndYear: nextRemuneration.endYear,
    });
  };

  const patchCca = (patch: Partial<CcaScheduleInput>) => {
    const nextCca = { ...cca, ...patch };
    onChange({
      cca: nextCca,
      ccaInitial: nextCca.currentBalance,
      ccaAnnualContribution: nextCca.annualContribution.amount,
      ccaContributionEndYear: nextCca.annualContribution.endYear,
    });
  };

  const goToSection = (section: AssociateModalSection) => {
    setActiveSection(section);
    sectionRefs[section].current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
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
        <nav className="ts-associate-modal-nav" aria-label="Rubriques de l’associé">
          {ASSOCIATE_MODAL_SECTIONS.map(section => (
            <button
              key={section.key}
              type="button"
              className={activeSection === section.key ? 'is-active' : ''}
              aria-current={activeSection === section.key ? 'page' : undefined}
              onClick={() => goToSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="ts-modal-stack">
        <div ref={sectionRefs.identite} className="ts-modal-grid ts-modal-grid--three" id="ts-associate-identite">
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
              onChange={event => onChange({
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
              onChange={event => onChange({
                ownershipLots: [{ ...lot, economicRightsPct: parsePctInput(event.target.value) }],
              })}
            />
            <span className="sim-field__unit ts-unit">%</span>
          </SimFieldShell>
        </div>

        {kind === 'pp' && (
          <div ref={sectionRefs.profil} className="ts-associate-card" id="ts-associate-profil">
            <div className="ts-associate-card__header">
              <strong>Profil foyer</strong>
              <span>Paramètres personnels de projection</span>
            </div>
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
              <SimFieldShell label="Âge de retraite" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={profile.retirementAge}
                  onChange={event => patchProfile({ retirementAge: parseNumberInput(event.target.value) })}
                />
              </SimFieldShell>
              <SimFieldShell label="Besoin annuel net" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={fmtEuroInput(profile.annualIncomeNeed)}
                  onChange={event => patchProfile({ annualIncomeNeed: parseEuroInput(event.target.value) })}
                />
                <span className="sim-field__unit ts-unit">€</span>
              </SimFieldShell>
              <SimFieldShell label="Début projection" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={profile.projectionStartYear}
                  onChange={event => patchProfile({ projectionStartYear: parseNumberInput(event.target.value) })}
                />
              </SimFieldShell>
            </div>
          </div>
        )}

        {kind === 'pm' && (
          <div ref={sectionRefs.profil} className="ts-associate-card" id="ts-associate-profil">
            <div className="ts-associate-card__header">
              <strong>Profil</strong>
              <span>Associé personne morale</span>
            </div>
            <p className="ts-note--info">
              Une personne morale ne porte pas de besoin retraite personnel dans cette version.
            </p>
          </div>
        )}

        <div ref={sectionRefs.remuneration} className="ts-associate-card" id="ts-associate-remuneration">
          <div className="ts-associate-card__header">
            <strong>Rémunération</strong>
            <span>Coût société et revenu net estimé</span>
          </div>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell label="Source de rémunération" className="ts-field" rowClassName="ts-field__row">
              <SimSelect
                value={remuneration.source}
                onChange={value => patchRemuneration({
                  source: value as AssociateRemunerationSource,
                  subsidiaryId: value === 'subsidiary'
                    ? remuneration.subsidiaryId ?? subsidiaries[0]?.id
                    : undefined,
                })}
                options={REMUNERATION_SOURCE_OPTIONS}
                ariaLabel="Source du revenu"
              />
            </SimFieldShell>

            {remuneration.source === 'subsidiary' && (
              <SimFieldShell label="Filiale source" className="ts-field" rowClassName="ts-field__row">
                <SimSelect
                  value={remuneration.subsidiaryId ?? subsidiaries[0]?.id ?? ''}
                  onChange={value => patchRemuneration({ subsidiaryId: value || undefined })}
                  options={subsidiaries.map(subsidiary => ({
                    value: subsidiary.id,
                    label: subsidiary.label,
                  }))}
                  ariaLabel="Filiale source de rémunération"
                />
              </SimFieldShell>
            )}

            <SimFieldShell label="Rémunération chargée pour la société" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(remuneration.loadedAnnualCost)}
                onChange={event => patchRemuneration({
                  loadedAnnualCost: parseEuroInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Taux de charges" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={fmtRateInput(remuneration.socialChargeRate)}
                onChange={event => patchRemuneration({
                  socialChargeRate: parseRateInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>

            <SimFieldShell label="Rémunération nette estimée" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control"
                value={fmtEuroInput(netRemuneration)}
                readOnly
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>

            <SimFieldShell label="Début de rémunération" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={remuneration.startYear ?? ''}
                onChange={event => patchRemuneration({
                  startYear: parseNumberInput(event.target.value) || undefined,
                })}
              />
            </SimFieldShell>

            <SimFieldShell label="Fin de rémunération" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={remuneration.endYear ?? ''}
                onChange={event => patchRemuneration({
                  endYear: parseNumberInput(event.target.value) || undefined,
                })}
              />
            </SimFieldShell>

            <SimFieldShell label="Besoin annuel après arrêt" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(remuneration.annualNeedAfterStop)}
                onChange={event => patchRemuneration({
                  annualNeedAfterStop: parseEuroInput(event.target.value),
                })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>
          </div>
          {subsidiaries.length > 0 && (
            <p className="ts-note--info">
              Filiales disponibles : {subsidiaries.map(subsidiary => subsidiary.label).join(', ')}
            </p>
          )}
        </div>

        <div ref={sectionRefs.cca} className="ts-associate-card" id="ts-associate-cca">
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
        </div>
      </div>
    </SimModalShell>
  );
}
