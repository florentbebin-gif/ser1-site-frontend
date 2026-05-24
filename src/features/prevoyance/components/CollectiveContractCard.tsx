import { SimSelect } from '@/components/ui/sim';
import {
  computeCollectiveAssietteBase,
  computeTranchesFromPass,
} from '@/domain/prevoyance/helpers';
import type { PrevoyanceAssiette, PrevoyanceContractDraft } from '@/domain/prevoyance/types';
import { ACTE_OPTIONS, ASSIETTE_OPTIONS } from '../constants';
import { euro } from '../formatters';
import { NumberInput, SimFieldShell } from './FormPrimitives';

type ContractEditorSection = 'arret' | 'frais' | 'invalidite' | 'deces';

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
    <article className="prevoyance-contract prevoyance-contract-editor">
      <div className="prevoyance-contract-editor__top">
        <input
          value={contract.name}
          onChange={(event) => update({ name: event.target.value })}
          aria-label={`Nom du contrat ${index + 1}`}
          className="prevoyance-contract__title-input"
        />
        <div className="prevoyance-contract-editor__base-grid prevoyance-contract-editor__base-grid--collective">
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
          <SimFieldShell label="Cotisation">
            <NumberInput
              value={contract.cotisation.tauxPctSalaire}
              onChange={(tauxPctSalaire) =>
                update({ cotisation: { ...contract.cotisation, tauxPctSalaire } })
              }
              suffix="%"
            />
          </SimFieldShell>
          <div className="prevoyance-assiette-chip">Base retenue {euro(assietteBase)}</div>
        </div>
      </div>

      {activeSection === 'arret' ? (
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
      ) : null}

      {activeSection === 'frais' ? (
        <div className="prevoyance-mini-section">
          <span>Frais professionnels</span>
          <p className="prevoyance-side-note">
            Les frais professionnels ne sont pas une garantie modélisée pour un contrat collectif
            dans ce simulateur.
          </p>
        </div>
      ) : null}

      {activeSection === 'invalidite' ? (
        <div className="prevoyance-mini-section">
          <span>Invalidité</span>
          {contract.invalidite.paliers.map((palier, palierIndex) => (
            <div key={palierIndex} className="prevoyance-invalidite-row">
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
    </article>
  );
}
