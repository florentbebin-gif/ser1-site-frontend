import { useState } from 'react';
import { SimActionButton, SimSegmentedControl, SimSelect } from '@/components/ui/sim';
import { computeInvaliditePalierAmount } from '@/domain/prevoyance/helpers';
import type { PrevoyanceContractDraft } from '@/domain/prevoyance/types';
import { ArretPeriodsModal } from './ArretPeriodsModal';
import { NumberInput, SimFieldShell } from './FormPrimitives';

type ContractEditorSection =
  | 'arret'
  | 'frais'
  | 'invalidite'
  | 'deces'
  | 'cotisation'
  | 'juridique';

interface IndividualContractCardProps {
  contract: Extract<PrevoyanceContractDraft, { kind: 'individuel' }>;
  index: number;
  activeSection: ContractEditorSection;
  onChange: (next: PrevoyanceContractDraft) => void;
  onOpenFrais: () => void;
  hasConjoint: boolean;
  hasChildren: boolean;
}

export function IndividualContractCard({
  contract,
  index,
  activeSection,
  onChange,
  onOpenFrais,
  hasConjoint,
  hasChildren,
}: IndividualContractCardProps) {
  const [showArretPeriodsModal, setShowArretPeriodsModal] = useState(false);
  const [madelinClamped, setMadelinClamped] = useState(false);
  const update = (patch: Partial<typeof contract>) => onChange({ ...contract, ...patch });
  const updateArretPalier = (palierIndex: number, amount: number) => {
    update({
      arret: {
        ...contract.arret,
        paliers: contract.arret.paliers.map((palier, currentIndex) =>
          currentIndex === palierIndex ? { ...palier, amount } : palier,
        ),
      },
    });
  };
  const updateInvaliditePalier = (
    palierIndex: number,
    patch: Partial<(typeof contract.invalidite.paliers)[number]>,
  ) => {
    update({
      invalidite: {
        ...contract.invalidite,
        paliers: contract.invalidite.paliers.map((palier, currentIndex) =>
          currentIndex === palierIndex ? { ...palier, ...patch } : palier,
        ),
      },
    });
  };
  const addInvaliditePalier = () => {
    if (contract.invalidite.paliers.length >= 3) return;
    update({
      invalidite: {
        ...contract.invalidite,
        paliers: [
          ...contract.invalidite.paliers,
          {
            fromRate: 0,
            toRate: null,
            mode: 'fixed',
            referenceAmount:
              contract.invalidite.paliers[contract.invalidite.paliers.length - 1]
                ?.referenceAmount ?? 0,
            amount:
              contract.invalidite.paliers[contract.invalidite.paliers.length - 1]?.amount ?? 0,
          },
        ],
      },
    });
  };
  const removeInvaliditePalier = (palierIndex: number) => {
    if (contract.invalidite.paliers.length <= 1) return;
    update({
      invalidite: {
        ...contract.invalidite,
        paliers: contract.invalidite.paliers.filter(
          (_, currentIndex) => currentIndex !== palierIndex,
        ),
      },
    });
  };

  return (
    <article className="prevoyance-contract prevoyance-contract-editor">
      <div className="prevoyance-contract-editor__top">
        <input
          value={contract.name}
          onChange={(event) => update({ name: event.target.value })}
          aria-label={`Nom du contrat ${index + 1}`}
          className="prevoyance-contract__title-input"
        />
      </div>

      {activeSection === 'arret' ? (
        <div className="prevoyance-mini-section">
          <div className="prevoyance-mini-section__header">
            <span>Arrêt de travail</span>
            <SimActionButton
              variant="add"
              mode="icon"
              label="Découper"
              className="prevoyance-icon-button prevoyance-icon-button--compact"
              onClick={() => setShowArretPeriodsModal(true)}
              ariaLabel={`Découper les périodes d’arrêt du contrat ${index + 1}`}
            />
          </div>
          <SimSegmentedControl
            value={contract.indemnisation}
            onChange={(indemnisation) => update({ indemnisation })}
            ariaLabel={`Mode indemnisation arrêt du contrat ${index + 1}`}
            size="sm"
            options={[
              { value: 'indemnitaire', label: 'Indemnitaire' },
              { value: 'forfaitaire', label: 'Forfaitaire' },
            ]}
          />
          <div className="prevoyance-form-grid prevoyance-form-grid--three">
            <SimFieldShell label="Acc.">
              <NumberInput
                value={contract.arret.franchises.accident}
                onChange={(accident) =>
                  update({
                    arret: {
                      ...contract.arret,
                      franchises: { ...contract.arret.franchises, accident },
                    },
                  })
                }
                suffix="j"
                showZero
                ariaLabel="Franchise accident"
              />
            </SimFieldShell>
            <SimFieldShell label="Hospi.">
              <NumberInput
                value={contract.arret.franchises.hospitalisation}
                onChange={(hospitalisation) =>
                  update({
                    arret: {
                      ...contract.arret,
                      franchises: { ...contract.arret.franchises, hospitalisation },
                    },
                  })
                }
                suffix="j"
                showZero
                ariaLabel="Franchise hospitalisation"
              />
            </SimFieldShell>
            <SimFieldShell label="Maladie">
              <NumberInput
                value={contract.arret.franchises.maladie}
                onChange={(maladie) =>
                  update({
                    arret: {
                      ...contract.arret,
                      franchises: { ...contract.arret.franchises, maladie },
                    },
                  })
                }
                suffix="j"
                showZero
                ariaLabel="Franchise maladie"
              />
            </SimFieldShell>
          </div>
          {contract.arret.paliers.map((palier, palierIndex) => (
            <SimFieldShell
              key={`${palier.fromDay}-${palier.toDay}`}
              label={`De ${palier.fromDay} à ${palier.toDay} j`}
            >
              <NumberInput
                value={palier.amount}
                onChange={(amount) => updateArretPalier(palierIndex, amount)}
                suffix="€/j"
              />
            </SimFieldShell>
          ))}
        </div>
      ) : null}

      {activeSection === 'frais' ? (
        <div className="prevoyance-mini-section">
          <span>Frais généraux</span>
          <div className="prevoyance-form-grid prevoyance-frais-inline-grid">
            <SimFieldShell label="Franchise">
              <NumberInput
                value={contract.fraisPro.franchiseDays}
                onChange={(franchiseDays) =>
                  update({ fraisPro: { ...contract.fraisPro, franchiseDays } })
                }
                suffix="j"
              />
            </SimFieldShell>
            <SimFieldShell label="Montant mensuel">
              <NumberInput
                value={contract.fraisPro.amount}
                onChange={(amount) => update({ fraisPro: { ...contract.fraisPro, amount } })}
                suffix="€/mois"
                ariaLabel="Montant mensuel frais généraux"
              />
            </SimFieldShell>
            <SimFieldShell label="Durée max">
              <SimSelect
                value={String(contract.fraisPro.maxDurationYears)}
                onChange={(value) =>
                  update({
                    fraisPro: {
                      ...contract.fraisPro,
                      maxDurationYears: Number(value) as 1 | 2 | 3,
                    },
                  })
                }
                options={[
                  { value: '1', label: '1 an' },
                  { value: '2', label: '2 ans' },
                  { value: '3', label: '3 ans' },
                ]}
              />
            </SimFieldShell>
          </div>
          <SimActionButton
            variant="edit"
            mode="text"
            label="Estimer l’assiette depuis un compte de résultat"
            className="prevoyance-link-button"
            onClick={onOpenFrais}
          />
        </div>
      ) : null}

      {activeSection === 'invalidite' ? (
        <div className="prevoyance-mini-section">
          <div className="prevoyance-mini-section__header">
            <span>Invalidité</span>
            <SimActionButton
              variant="add"
              mode="icon"
              label="Ajouter"
              className="prevoyance-icon-button prevoyance-icon-button--compact"
              onClick={addInvaliditePalier}
              ariaLabel={`Ajouter un palier invalidité au contrat ${index + 1}`}
              disabled={contract.invalidite.paliers.length >= 3}
            />
          </div>
          <SimSegmentedControl
            value={contract.invalidite.indemnisation}
            onChange={(indemnisation) =>
              update({
                invalidite: {
                  ...contract.invalidite,
                  indemnisation,
                },
              })
            }
            ariaLabel={`Mode indemnisation invalidité du contrat ${index + 1}`}
            size="sm"
            options={[
              { value: 'indemnitaire', label: 'Indemnitaire' },
              { value: 'forfaitaire', label: 'Forfaitaire' },
            ]}
          />
          {contract.invalidite.paliers.map((palier, palierIndex) => (
            <div key={palierIndex} className="prevoyance-invalidite-row">
              {contract.invalidite.paliers.length > 1 ? (
                <div className="prevoyance-invalidite-row__actions">
                  <SimActionButton
                    variant="delete"
                    mode="icon"
                    label="Supprimer"
                    className="prevoyance-icon-button prevoyance-icon-button--compact"
                    onClick={() => removeInvaliditePalier(palierIndex)}
                    ariaLabel={`Supprimer le palier invalidité ${palierIndex + 1}`}
                  />
                </div>
              ) : null}
              <div className="prevoyance-invalidite-row__grid">
                <SimFieldShell label="Déclenchement">
                  <NumberInput
                    value={palier.fromRate}
                    onChange={(fromRate) => updateInvaliditePalier(palierIndex, { fromRate })}
                    suffix="%"
                  />
                </SimFieldShell>
                <SimFieldShell label="Jusqu’à">
                  <NumberInput
                    value={palier.toRate ?? 0}
                    onChange={(toRate) =>
                      updateInvaliditePalier(palierIndex, {
                        toRate: toRate <= 0 || toRate >= 100 ? null : toRate,
                      })
                    }
                    suffix="%"
                  />
                </SimFieldShell>
                <SimFieldShell label="Formule">
                  <SimSelect
                    value={palier.mode}
                    onChange={(mode) =>
                      updateInvaliditePalier(palierIndex, {
                        mode: mode as (typeof palier)['mode'],
                      })
                    }
                    options={[
                      { value: 'fixed', label: 'Montant fixe' },
                      { value: 'proportional_66', label: 'Taux / 66 × rente' },
                    ]}
                  />
                </SimFieldShell>
                {palier.mode === 'proportional_66' ? (
                  <SimFieldShell label="Rente référence">
                    <NumberInput
                      value={palier.referenceAmount}
                      onChange={(referenceAmount) =>
                        updateInvaliditePalier(palierIndex, { referenceAmount })
                      }
                      suffix="€/an"
                    />
                  </SimFieldShell>
                ) : (
                  <SimFieldShell label="Montant versé">
                    <NumberInput
                      value={palier.amount}
                      onChange={(amount) => updateInvaliditePalier(palierIndex, { amount })}
                      suffix="€/an"
                    />
                  </SimFieldShell>
                )}
                <div className="prevoyance-side-note prevoyance-invalidite-row__note">
                  Affiché à {palier.fromRate} % :{' '}
                  {computeInvaliditePalierAmount(palier, palier.fromRate).toLocaleString('fr-FR')}{' '}
                  €/an
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeSection === 'deces' ? (
        <div className="prevoyance-mini-section">
          <span>Décès</span>
          <SimFieldShell label="Capital">
            <NumberInput
              value={contract.deces.capital}
              onChange={(capital) => update({ deces: { ...contract.deces, capital } })}
              suffix="€"
            />
          </SimFieldShell>
          <label className="prevoyance-check">
            <input
              type="checkbox"
              checked={contract.deces.doublementAccident}
              onChange={(event) =>
                update({
                  deces: { ...contract.deces, doublementAccident: event.target.checked },
                })
              }
            />
            Doublement accident
          </label>
          {hasChildren ? (
            <label className="prevoyance-check">
              <input
                type="checkbox"
                checked={contract.deces.doubleEffet}
                onChange={(event) =>
                  update({
                    deces: { ...contract.deces, doubleEffet: event.target.checked },
                  })
                }
              />
              Double effet
            </label>
          ) : null}
          <div className="prevoyance-form-grid prevoyance-form-grid--two">
            {hasConjoint ? (
              <SimFieldShell label="Rente conjoint">
                <NumberInput
                  value={contract.deces.renteConjoint}
                  onChange={(renteConjoint) =>
                    update({ deces: { ...contract.deces, renteConjoint } })
                  }
                  suffix="€/an"
                />
              </SimFieldShell>
            ) : null}
            {hasChildren ? (
              <SimFieldShell label="Rente éducation">
                <NumberInput
                  value={contract.deces.renteEducation}
                  onChange={(renteEducation) =>
                    update({ deces: { ...contract.deces, renteEducation } })
                  }
                  suffix="€/an"
                />
              </SimFieldShell>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeSection === 'cotisation' ? (
        <div className="prevoyance-mini-section">
          <span>Cotisation</span>
          <div className="prevoyance-form-grid prevoyance-form-grid--two">
            <SimFieldShell label="Cotisation annuelle">
              <NumberInput
                value={contract.cotisation.montantAnnuel}
                onChange={(montantAnnuel) => {
                  setMadelinClamped(contract.cotisation.dontMadelin > montantAnnuel);
                  update({
                    cotisation: {
                      montantAnnuel,
                      dontMadelin: Math.min(contract.cotisation.dontMadelin, montantAnnuel),
                    },
                  });
                }}
                suffix="€"
              />
            </SimFieldShell>
            <SimFieldShell label="dont Madelin">
              <NumberInput
                value={contract.cotisation.dontMadelin}
                onChange={(dontMadelin) => {
                  setMadelinClamped(dontMadelin > contract.cotisation.montantAnnuel);
                  update({
                    cotisation: {
                      ...contract.cotisation,
                      dontMadelin: Math.min(dontMadelin, contract.cotisation.montantAnnuel),
                    },
                  });
                }}
                suffix="€"
              />
            </SimFieldShell>
          </div>
          {madelinClamped ? (
            <span className="prevoyance-side-note">
              Le montant Madelin est plafonné à la cotisation annuelle.
            </span>
          ) : null}
        </div>
      ) : null}

      {showArretPeriodsModal ? (
        <ArretPeriodsModal
          paliers={contract.arret.paliers}
          onClose={() => setShowArretPeriodsModal(false)}
          onApply={(paliers) => update({ arret: { ...contract.arret, paliers } })}
        />
      ) : null}
    </article>
  );
}
