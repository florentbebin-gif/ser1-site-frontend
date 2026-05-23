import { SimSelect } from '@/components/ui/sim';
import {
  computeCollectiveAssietteBase,
  computeTranchesFromPass,
} from '@/domain/prevoyance/helpers';
import type { PrevoyanceAssiette, PrevoyanceContractDraft } from '@/domain/prevoyance/types';
import { ACTE_OPTIONS, ASSIETTE_OPTIONS } from '../constants';
import { euro } from '../formatters';
import { NumberInput, SimFieldShell } from './FormPrimitives';

interface CollectiveContractCardProps {
  contract: Extract<PrevoyanceContractDraft, { kind: 'collectif' }>;
  index: number;
  pass: number;
  salaireBrutAnnuel: number;
  onChange: (next: PrevoyanceContractDraft) => void;
  onRemove: () => void;
  removable: boolean;
}

export function CollectiveContractCard({
  contract,
  index,
  pass,
  salaireBrutAnnuel,
  onChange,
  onRemove,
  removable,
}: CollectiveContractCardProps) {
  const tranches = computeTranchesFromPass(salaireBrutAnnuel, pass);
  const assietteBase = computeCollectiveAssietteBase(contract.assiette, tranches);
  const update = (patch: Partial<typeof contract>) => onChange({ ...contract, ...patch });
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
        <span>Contrat entreprise</span>
        <SimFieldShell label="Acte juridique">
          <SimSelect
            value={contract.acteJuridique}
            onChange={(acteJuridique) =>
              update({ acteJuridique: acteJuridique as typeof contract.acteJuridique })
            }
            options={ACTE_OPTIONS}
          />
        </SimFieldShell>
        <SimFieldShell label="Assiette couverte">
          <SimSelect
            value={contract.assiette}
            onChange={(assiette) => update({ assiette: assiette as PrevoyanceAssiette })}
            options={ASSIETTE_OPTIONS}
          />
        </SimFieldShell>
        <div className="prevoyance-assiette-chip">Base retenue {euro(assietteBase)}</div>
      </div>

      <div className="prevoyance-mini-section">
        <span>Arrêt de travail</span>
        <SimFieldShell label="% salaire brut">
          <NumberInput
            value={contract.arret.salairePct}
            onChange={(salairePct) => update({ arret: { salairePct } })}
            suffix="%"
          />
        </SimFieldShell>
      </div>

      <div className="prevoyance-mini-section">
        <span>Invalidité</span>
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
            <SimFieldShell label="% salaire brut">
              <NumberInput
                value={palier.salairePct}
                onChange={(salairePct) => updateInvaliditePalier(palierIndex, { salairePct })}
                suffix="%"
              />
            </SimFieldShell>
          </div>
        ))}
      </div>

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
        <div className="prevoyance-form-grid prevoyance-form-grid--two">
          <SimFieldShell label="Rente conjoint">
            <NumberInput
              value={contract.deces.renteConjointPct}
              onChange={(renteConjointPct) =>
                update({ deces: { ...contract.deces, renteConjointPct } })
              }
              suffix="%"
            />
          </SimFieldShell>
          <SimFieldShell label="Rente éducation">
            <NumberInput
              value={contract.deces.renteEducationPct}
              onChange={(renteEducationPct) =>
                update({ deces: { ...contract.deces, renteEducationPct } })
              }
              suffix="%"
            />
          </SimFieldShell>
        </div>
      </div>

      <div className="prevoyance-mini-section">
        <span>Cotisation</span>
        <SimFieldShell label="% salaire">
          <NumberInput
            value={contract.cotisation.tauxPctSalaire}
            onChange={(tauxPctSalaire) =>
              update({ cotisation: { ...contract.cotisation, tauxPctSalaire } })
            }
            suffix="%"
          />
        </SimFieldShell>
        <div className="prevoyance-form-grid prevoyance-form-grid--two">
          <SimFieldShell label="Employeur">
            <NumberInput
              value={contract.cotisation.repartition.employeur}
              onChange={(employeur) =>
                update({
                  cotisation: {
                    ...contract.cotisation,
                    repartition: {
                      employeur,
                      salarie: Math.max(0, 100 - employeur),
                    },
                  },
                })
              }
              suffix="%"
            />
          </SimFieldShell>
          <SimFieldShell label="Salarié">
            <NumberInput
              value={contract.cotisation.repartition.salarie}
              onChange={(salarie) =>
                update({
                  cotisation: {
                    ...contract.cotisation,
                    repartition: {
                      salarie,
                      employeur: Math.max(0, 100 - salarie),
                    },
                  },
                })
              }
              suffix="%"
            />
          </SimFieldShell>
        </div>
      </div>
    </article>
  );
}
