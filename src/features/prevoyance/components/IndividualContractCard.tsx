import { useState } from 'react';
import { SimSegmentedControl, SimSelect } from '@/components/ui/sim';
import type { PrevoyanceContractDraft } from '@/domain/prevoyance/types';
import { computeInvaliditePalierAmount } from '@/domain/prevoyance/helpers';
import { ArretPeriodsModal } from './ArretPeriodsModal';
import { NumberInput, SimFieldShell } from './FormPrimitives';

interface IndividualContractCardProps {
  contract: Extract<PrevoyanceContractDraft, { kind: 'individuel' }>;
  index: number;
  onChange: (next: PrevoyanceContractDraft) => void;
  onRemove: () => void;
  onOpenFrais: () => void;
  removable: boolean;
}

export function IndividualContractCard({
  contract,
  index,
  onChange,
  onRemove,
  onOpenFrais,
  removable,
}: IndividualContractCardProps) {
  const [showArretPeriodsModal, setShowArretPeriodsModal] = useState(false);
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
        paliers: [
          ...contract.invalidite.paliers,
          {
            fromRate: 66,
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

  return (
    <article className="prevoyance-contract">
      <div className="prevoyance-contract__header">
        <input
          value={contract.name}
          onChange={(event) => update({ name: event.target.value })}
          aria-label={`Nom du contrat ${index + 1}`}
          className="prevoyance-contract__title-input"
        />
        {removable ? (
          <button type="button" className="prevoyance-icon-button" onClick={onRemove}>
            ×
          </button>
        ) : null}
      </div>

      <div className="prevoyance-mini-section">
        <span>Base</span>
        <SimSegmentedControl
          value={contract.indemnisation}
          onChange={(indemnisation) => update({ indemnisation })}
          ariaLabel={`Mode indemnisation contrat ${index + 1}`}
          size="sm"
          options={[
            { value: 'indemnitaire', label: 'Indemnitaire' },
            { value: 'forfaitaire', label: 'Forfaitaire' },
          ]}
        />
      </div>

      <div className="prevoyance-mini-section">
        <div className="prevoyance-mini-section__header">
          <span>Arrêt de travail</span>
          <button
            type="button"
            className="prevoyance-icon-button prevoyance-icon-button--compact"
            onClick={() => setShowArretPeriodsModal(true)}
            aria-label={`Découper les périodes d’arrêt du contrat ${index + 1}`}
          >
            +
          </button>
        </div>
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

      <div className="prevoyance-mini-section">
        <span>Frais professionnels</span>
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
          <SimFieldShell label="Montant">
            <NumberInput
              value={contract.fraisPro.amount}
              onChange={(amount) => update({ fraisPro: { ...contract.fraisPro, amount } })}
              suffix="€"
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
        <button type="button" className="prevoyance-link-button" onClick={onOpenFrais}>
          Estimer depuis un compte de résultat
        </button>
      </div>

      <div className="prevoyance-mini-section">
        <div className="prevoyance-mini-section__header">
          <span>Invalidité</span>
          <button
            type="button"
            className="prevoyance-icon-button prevoyance-icon-button--compact"
            onClick={addInvaliditePalier}
            aria-label={`Ajouter un palier invalidité au contrat ${index + 1}`}
            disabled={contract.invalidite.paliers.length >= 3}
          >
            +
          </button>
        </div>
        {contract.invalidite.paliers.map((palier, palierIndex) => (
          <div
            key={`${palierIndex}-${palier.fromRate}-${palier.toRate ?? 'plus'}`}
            className="prevoyance-invalidite-row"
          >
            <div className="prevoyance-form-grid prevoyance-form-grid--two">
              <SimFieldShell label="Déclenchement">
                <NumberInput
                  value={palier.fromRate}
                  onChange={(fromRate) => updateInvaliditePalier(palierIndex, { fromRate })}
                  suffix="%"
                />
              </SimFieldShell>
              <SimFieldShell label="Jusqu’à">
                <NumberInput
                  value={palier.toRate ?? 100}
                  onChange={(toRate) =>
                    updateInvaliditePalier(palierIndex, {
                      toRate: toRate >= 100 ? null : toRate,
                    })
                  }
                  suffix="%"
                />
              </SimFieldShell>
            </div>
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
            <div className="prevoyance-side-note">
              Affiché à {palier.fromRate} % :{' '}
              {computeInvaliditePalierAmount(palier, palier.fromRate).toLocaleString('fr-FR')} €/an
            </div>
          </div>
        ))}
      </div>

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
        <div className="prevoyance-form-grid prevoyance-form-grid--two">
          <SimFieldShell label="Rente conjoint">
            <NumberInput
              value={contract.deces.renteConjoint}
              onChange={(renteConjoint) => update({ deces: { ...contract.deces, renteConjoint } })}
              suffix="€/an"
            />
          </SimFieldShell>
          <SimFieldShell label="Rente éducation">
            <NumberInput
              value={contract.deces.renteEducation}
              onChange={(renteEducation) =>
                update({ deces: { ...contract.deces, renteEducation } })
              }
              suffix="€/an"
            />
          </SimFieldShell>
        </div>
      </div>

      <div className="prevoyance-mini-section">
        <span>Cotisation</span>
        <SimFieldShell label="Annuel">
          <NumberInput
            value={contract.cotisation.montantAnnuel}
            onChange={(montantAnnuel) =>
              update({ cotisation: { ...contract.cotisation, montantAnnuel } })
            }
            suffix="€"
          />
        </SimFieldShell>
        <label className="prevoyance-check">
          <input
            type="checkbox"
            checked={contract.cotisation.madelin}
            onChange={(event) =>
              update({ cotisation: { ...contract.cotisation, madelin: event.target.checked } })
            }
          />
          Madelin
        </label>
      </div>

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
