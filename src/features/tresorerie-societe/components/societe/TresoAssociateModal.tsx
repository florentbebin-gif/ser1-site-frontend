import { useState, type KeyboardEvent } from 'react';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  AssociateInputV6,
  AssociateKind,
  AssociateProfileInput,
  CcaScheduleInputV6,
  OwnershipLotInput,
  OwnershipRight,
} from '@/engine/tresorerie/types';
import { TresoAssociateCcaPanel } from './TresoAssociateCcaPanel';
import { ASSOCIATE_KIND_OPTIONS, OWNERSHIP_OPTIONS } from '../../utils/tresorerieSocieteOptions';
import { parseNumberInput, parsePctInput } from '../../utils/tresorerieFormatters';

interface TresoAssociateModalProps {
  associate: AssociateInputV6;
  fallbackProfile: AssociateProfileInput;
  onChange: (patch: Partial<AssociateInputV6>) => void;
  onClose: () => void;
}

type AssociateModalSection = 'identite' | 'profil' | 'cca';

const ASSOCIATE_MODAL_SECTIONS: Array<{ key: AssociateModalSection; label: string }> = [
  { key: 'profil', label: 'Profil' },
  { key: 'identite', label: 'Détention' },
  { key: 'cca', label: 'CCA' },
];

function getCca(associate: AssociateInputV6, _fallbackYear: number): CcaScheduleInputV6 {
  return (
    associate.cca ?? {
      currentBalance: 0,
      remunerationRate: 0,
    }
  );
}

export function TresoAssociateModal({
  associate,
  fallbackProfile,
  onChange,
  onClose,
}: TresoAssociateModalProps) {
  const [activeSection, setActiveSection] = useState<AssociateModalSection>('profil');
  const kind = associate.kind ?? 'pp';
  const profile = associate.profile ?? fallbackProfile;
  const lots: OwnershipLotInput[] =
    associate.ownershipLots.length > 0
      ? associate.ownershipLots
      : [{ right: 'pleine_propriete', capitalPct: 0, economicRightsPct: 0 }];
  const totalCapital = lots.reduce((sum, l) => sum + (l.capitalPct || 0), 0);
  const totalEconomic = lots.reduce((sum, l) => sum + (l.economicRightsPct || 0), 0);
  const usedRights = new Set<OwnershipRight>(lots.map((l) => l.right));
  const availableRights = OWNERSHIP_OPTIONS.filter((opt) => !usedRights.has(opt.value));
  const cca = getCca(associate, profile.projectionStartYear);

  const replaceLots = (nextLots: OwnershipLotInput[]) => {
    onChange({ ownershipLots: nextLots });
  };

  const patchLot = (index: number, patch: Partial<OwnershipLotInput>) => {
    const next = lots.map((lot, i) => {
      if (i !== index) return lot;
      const updated = { ...lot, ...patch };
      if (updated.right === 'pleine_propriete') {
        updated.economicRightsPct = updated.capitalPct;
      }
      return updated;
    });
    replaceLots(next);
  };

  const addLot = () => {
    if (availableRights.length === 0) return;
    const nextRight = availableRights[0].value;
    replaceLots([...lots, { right: nextRight, capitalPct: 0, economicRightsPct: 0 }]);
  };

  const removeLot = (index: number) => {
    if (lots.length <= 1) return;
    replaceLots(lots.filter((_, i) => i !== index));
  };

  const patchProfile = (patch: Partial<AssociateProfileInput>) => {
    onChange({ profile: { ...profile, ...patch } });
  };

  const patchCca = (patch: Partial<CcaScheduleInputV6>) => {
    const nextCca = { ...cca, ...patch };
    onChange({ cca: nextCca });
  };

  const selectSection = (section: AssociateModalSection) => {
    setActiveSection(section);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = ASSOCIATE_MODAL_SECTIONS.length - 1;
    const nextIndex =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
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
        <div
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
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div
          className="ts-associate-modal-panel"
          id={`ts-associate-panel-${activeSection}`}
          role="tabpanel"
          aria-labelledby={`ts-associate-tab-${activeSection}`}
          tabIndex={0}
        >
          {activeSection === 'identite' && (
            <div className="ts-associate-card">
              <div className="ts-associate-card__header">
                <strong>Détention</strong>
                <span>Pleine propriété, usufruit, nue-propriété — cumulables</span>
              </div>

              <div className="ts-modal-grid ts-modal-grid--three">
                <SimFieldShell
                  label="Type d’associé"
                  className="ts-field"
                  rowClassName="ts-field__row"
                >
                  <SimSelect
                    value={kind}
                    onChange={(value) => onChange({ kind: value as AssociateKind })}
                    options={ASSOCIATE_KIND_OPTIONS}
                    ariaLabel="Type d’associé"
                  />
                </SimFieldShell>
              </div>

              <div className="ts-ownership-lots">
                {lots.map((currentLot, index) => (
                  <div key={`${currentLot.right}-${index}`} className="ts-ownership-lot">
                    <SimFieldShell label="Droit" className="ts-field" rowClassName="ts-field__row">
                      <SimSelect
                        value={currentLot.right}
                        onChange={(value) => patchLot(index, { right: value as OwnershipRight })}
                        options={OWNERSHIP_OPTIONS.filter(
                          (opt) => opt.value === currentLot.right || !usedRights.has(opt.value),
                        )}
                        ariaLabel={`Droit détenu (lot ${index + 1})`}
                      />
                    </SimFieldShell>

                    <SimFieldShell
                      label="% capital"
                      className="ts-field"
                      rowClassName="ts-field__row"
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        className="sim-field__control"
                        value={String(currentLot.capitalPct)}
                        onChange={(event) =>
                          patchLot(index, { capitalPct: parsePctInput(event.target.value) })
                        }
                      />
                      <span className="sim-field__unit ts-unit">%</span>
                    </SimFieldShell>

                    {currentLot.right === 'pleine_propriete' ? (
                      <p className="ts-field-note">
                        En pleine propriété, les droits économiques suivent le capital.
                      </p>
                    ) : (
                      <SimFieldShell
                        label="% économique"
                        className="ts-field"
                        rowClassName="ts-field__row"
                      >
                        <input
                          type="text"
                          inputMode="decimal"
                          className="sim-field__control"
                          value={String(currentLot.economicRightsPct)}
                          onChange={(event) =>
                            patchLot(index, {
                              economicRightsPct: parsePctInput(event.target.value),
                            })
                          }
                        />
                        <span className="sim-field__unit ts-unit">%</span>
                      </SimFieldShell>
                    )}

                    {lots.length > 1 && (
                      <button
                        type="button"
                        className="ts-text-btn ts-ownership-lot__remove"
                        onClick={() => removeLot(index)}
                        aria-label={`Supprimer le lot ${index + 1}`}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                ))}

                {availableRights.length > 0 && (
                  <button
                    type="button"
                    className="ts-text-btn ts-ownership-lots__add"
                    onClick={addLot}
                  >
                    + Ajouter un lot de détention
                  </button>
                )}
              </div>

              <p className="ts-ownership-totals">
                Totaux associé : capital {Math.round(totalCapital * 100) / 100} %{' · '}
                économique {Math.round(totalEconomic * 100) / 100} %
              </p>
            </div>
          )}

          {activeSection === 'profil' && kind === 'pp' && (
            <div className="ts-associate-card">
              <div className="ts-associate-card__header">
                <strong>Profil</strong>
                <span>Paramètre personnel de projection</span>
              </div>
              <div className="ts-modal-grid ts-modal-grid--three">
                <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    className="sim-field__control ts-input-left"
                    value={associate.label}
                    onChange={(event) => onChange({ label: event.target.value })}
                  />
                </SimFieldShell>

                <SimFieldShell label="Âge actuel" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={profile.currentAge}
                    onChange={(event) =>
                      patchProfile({ currentAge: parseNumberInput(event.target.value) })
                    }
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
              <div className="ts-modal-grid ts-modal-grid--three">
                <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    className="sim-field__control ts-input-left"
                    value={associate.label}
                    onChange={(event) => onChange({ label: event.target.value })}
                  />
                </SimFieldShell>
              </div>
              <p className="ts-note--info">
                Une personne morale ne porte pas de besoin retraite personnel dans cette version.
              </p>
            </div>
          )}

          {activeSection === 'cca' && <TresoAssociateCcaPanel cca={cca} onChange={patchCca} />}
        </div>
      </div>
    </SimModalShell>
  );
}
