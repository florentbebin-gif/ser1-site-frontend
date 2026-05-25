import { SimActionButton, SimSelect } from '@/components/ui/sim';
import {
  computeCollectiveAssietteBase,
  computeTranchesFromPass,
  PREVOYANCE_MAX_ARRET_DURATION_DAYS,
} from '@/domain/prevoyance/helpers';
import type { PrevoyanceAssiette, PrevoyanceContractDraft } from '@/domain/prevoyance/types';
import { ACTE_OPTIONS, ASSIETTE_OPTIONS } from '../constants';
import { euro } from '../formatters';
import { NumberInput, SimFieldShell } from './FormPrimitives';

type ContractEditorSection =
  | 'arret'
  | 'frais'
  | 'invalidite'
  | 'deces'
  | 'cotisation'
  | 'juridique';

interface CollectiveContractCardProps {
  contract: Extract<PrevoyanceContractDraft, { kind: 'collectif' }>;
  index: number;
  pass: number;
  salaireBrutAnnuel: number;
  activeSection: ContractEditorSection;
  onChange: (next: PrevoyanceContractDraft) => void;
  hasConjoint: boolean;
  hasChildren: boolean;
}

export function CollectiveContractCard({
  contract,
  index,
  pass,
  salaireBrutAnnuel,
  activeSection,
  onChange,
  hasConjoint,
  hasChildren,
}: CollectiveContractCardProps) {
  const tranches = computeTranchesFromPass(salaireBrutAnnuel, pass);
  const assietteBase = computeCollectiveAssietteBase(contract.assiette, tranches);
  const arretPaliers = contract.arret.paliers?.length
    ? contract.arret.paliers
    : [
        {
          fromDay: 0,
          toDay: PREVOYANCE_MAX_ARRET_DURATION_DAYS,
          salairePct: contract.arret.salairePct,
        },
      ];
  const update = (patch: Partial<typeof contract>) => onChange({ ...contract, ...patch });
  const updateArretPaliers = (paliers: typeof arretPaliers) => {
    update({
      arret: {
        ...contract.arret,
        salairePct: paliers[0]?.salairePct ?? contract.arret.salairePct,
        paliers,
      },
    });
  };
  const updateArretPalier = (
    palierIndex: number,
    patch: Partial<(typeof arretPaliers)[number]>,
  ) => {
    updateArretPaliers(
      arretPaliers.map((palier, currentIndex) =>
        currentIndex === palierIndex ? { ...palier, ...patch } : palier,
      ),
    );
  };
  const addArretPalier = () => {
    if (arretPaliers.length >= 3) return;
    const last = arretPaliers[arretPaliers.length - 1] ?? {
      fromDay: 0,
      toDay: PREVOYANCE_MAX_ARRET_DURATION_DAYS,
      salairePct: 0,
    };
    if (arretPaliers.length === 1 && (last.toDay ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS) >= 1095) {
      updateArretPaliers([
        { ...last, toDay: 365 },
        { fromDay: 366, toDay: PREVOYANCE_MAX_ARRET_DURATION_DAYS, salairePct: last.salairePct },
      ]);
      return;
    }
    const fromDay = Math.min(PREVOYANCE_MAX_ARRET_DURATION_DAYS, (last.toDay ?? last.fromDay) + 1);
    updateArretPaliers([
      ...arretPaliers,
      {
        fromDay,
        toDay: PREVOYANCE_MAX_ARRET_DURATION_DAYS,
        salairePct: last.salairePct,
      },
    ]);
  };
  const removeArretPalier = (palierIndex: number) => {
    if (arretPaliers.length <= 1) return;
    updateArretPaliers(arretPaliers.filter((_, currentIndex) => currentIndex !== palierIndex));
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
    const last = contract.invalidite.paliers[contract.invalidite.paliers.length - 1];
    update({
      invalidite: {
        paliers: [
          ...contract.invalidite.paliers,
          {
            fromRate: last?.toRate ? Math.min(100, last.toRate + 1) : 66,
            toRate: null,
            mode: last?.mode ?? 'fixed',
            referencePct: last?.referencePct,
            salairePct: last?.salairePct ?? 0,
          },
        ],
      },
    });
  };
  const removeInvaliditePalier = (palierIndex: number) => {
    if (contract.invalidite.paliers.length <= 1) return;
    update({
      invalidite: {
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
        <div className="prevoyance-contract-editor__base-grid prevoyance-contract-editor__base-grid--collective">
          <SimFieldShell label="Assiette couverte">
            <SimSelect
              value={contract.assiette}
              onChange={(assiette) => update({ assiette: assiette as PrevoyanceAssiette })}
              options={ASSIETTE_OPTIONS}
            />
          </SimFieldShell>
          <div className="prevoyance-assiette-chip">Base retenue {euro(assietteBase)}</div>
        </div>
      </div>

      {activeSection === 'arret' ? (
        <div className="prevoyance-mini-section">
          <div className="prevoyance-mini-section__header">
            <span>Arrêt de travail</span>
            <SimActionButton
              variant="add"
              mode="icon"
              label="Ajouter"
              className="prevoyance-icon-button prevoyance-icon-button--compact"
              onClick={addArretPalier}
              ariaLabel={`Ajouter une période arrêt de travail au contrat ${index + 1}`}
              disabled={arretPaliers.length >= 3}
            />
          </div>
          {arretPaliers.map((palier, palierIndex) => (
            <div key={palierIndex} className="prevoyance-invalidite-row">
              {arretPaliers.length > 1 ? (
                <div className="prevoyance-invalidite-row__actions">
                  <SimActionButton
                    variant="delete"
                    mode="icon"
                    label="Supprimer"
                    className="prevoyance-icon-button prevoyance-icon-button--compact"
                    onClick={() => removeArretPalier(palierIndex)}
                    ariaLabel={`Supprimer la période arrêt de travail ${palierIndex + 1}`}
                  />
                </div>
              ) : null}
              <div className="prevoyance-invalidite-row__grid">
                <SimFieldShell label="Début">
                  <NumberInput
                    value={palier.fromDay}
                    onChange={(fromDay) => updateArretPalier(palierIndex, { fromDay })}
                    suffix="j"
                    showZero
                  />
                </SimFieldShell>
                <SimFieldShell label="Fin">
                  <NumberInput
                    value={palier.toDay ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS}
                    onChange={(toDay) =>
                      updateArretPalier(palierIndex, {
                        toDay: toDay >= PREVOYANCE_MAX_ARRET_DURATION_DAYS ? null : toDay,
                      })
                    }
                    suffix="j"
                  />
                </SimFieldShell>
                <SimFieldShell label="% salaire brut">
                  <NumberInput
                    value={palier.salairePct}
                    onChange={(salairePct) => updateArretPalier(palierIndex, { salairePct })}
                    suffix="%"
                  />
                </SimFieldShell>
              </div>
            </div>
          ))}
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
              ariaLabel={`Ajouter un seuil invalidité au contrat ${index + 1}`}
              disabled={contract.invalidite.paliers.length >= 3}
            />
          </div>
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
                    ariaLabel={`Supprimer le seuil invalidité ${palierIndex + 1}`}
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
                <SimFieldShell label="% salaire brut">
                  <NumberInput
                    value={palier.salairePct}
                    onChange={(salairePct) => updateInvaliditePalier(palierIndex, { salairePct })}
                    suffix="%"
                  />
                </SimFieldShell>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeSection === 'deces' ? (
        <div className="prevoyance-mini-section">
          <span>Décès</span>
          <SimFieldShell label="% salaire brut">
            <NumberInput
              value={contract.deces.salairePct}
              onChange={(salairePct) => update({ deces: { ...contract.deces, salairePct } })}
              suffix="%"
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
                  update({ deces: { ...contract.deces, doubleEffet: event.target.checked } })
                }
              />
              Double effet
            </label>
          ) : null}
          <div className="prevoyance-form-grid prevoyance-form-grid--two">
            {hasConjoint ? (
              <SimFieldShell label="Rente conjoint">
                <NumberInput
                  value={contract.deces.renteConjointPct}
                  onChange={(renteConjointPct) =>
                    update({ deces: { ...contract.deces, renteConjointPct } })
                  }
                  suffix="%"
                />
              </SimFieldShell>
            ) : null}
            {hasChildren ? (
              <SimFieldShell label="Rente éducation">
                <NumberInput
                  value={contract.deces.renteEducationPct}
                  onChange={(renteEducationPct) =>
                    update({ deces: { ...contract.deces, renteEducationPct } })
                  }
                  suffix="%"
                />
              </SimFieldShell>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeSection === 'cotisation' ? (
        <div className="prevoyance-mini-section">
          <span>Cotisation</span>
          <div className="prevoyance-form-grid prevoyance-form-grid--three">
            <SimFieldShell label="Taux salaire">
              <NumberInput
                value={contract.cotisation.tauxPctSalaire}
                onChange={(tauxPctSalaire) =>
                  update({ cotisation: { ...contract.cotisation, tauxPctSalaire } })
                }
                suffix="%"
              />
            </SimFieldShell>
            <SimFieldShell label="Part employeur">
              <NumberInput
                value={contract.cotisation.repartition.employeur}
                onChange={(employeur) =>
                  update({
                    cotisation: {
                      ...contract.cotisation,
                      repartition: { ...contract.cotisation.repartition, employeur },
                    },
                  })
                }
                suffix="%"
              />
            </SimFieldShell>
            <SimFieldShell label="Part salarié">
              <NumberInput
                value={contract.cotisation.repartition.salarie}
                onChange={(salarie) =>
                  update({
                    cotisation: {
                      ...contract.cotisation,
                      repartition: { ...contract.cotisation.repartition, salarie },
                    },
                  })
                }
                suffix="%"
              />
            </SimFieldShell>
          </div>
          <span className="prevoyance-side-note">
            Base de calcul retenue : {euro(assietteBase)}
          </span>
        </div>
      ) : null}

      {activeSection === 'juridique' ? (
        <div className="prevoyance-mini-section">
          <span>Acte juridique</span>
          <SimFieldShell label="Acte juridique">
            <SimSelect
              value={contract.acteJuridique}
              onChange={(acteJuridique) =>
                update({ acteJuridique: acteJuridique as typeof contract.acteJuridique })
              }
              options={ACTE_OPTIONS}
            />
          </SimFieldShell>
        </div>
      ) : null}
    </article>
  );
}
