import { SimSegmentedControl, SimSelect } from '@/components/ui/sim';
import type { PrevoyanceContractDraft } from '@/domain/prevoyance/types';
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
  const updateInvaliditePalier = (palierIndex: number, amount: number) => {
    update({
      invalidite: {
        paliers: contract.invalidite.paliers.map((palier, currentIndex) =>
          currentIndex === palierIndex ? { ...palier, amount } : palier,
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
        <span>Arrêt de travail</span>
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
        <div className="prevoyance-form-grid prevoyance-form-grid--three">
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
        <span>Invalidité</span>
        {contract.invalidite.paliers.map((palier, palierIndex) => (
          <SimFieldShell key={palier.fromRate} label={`Dès ${palier.fromRate} %`}>
            <NumberInput
              value={palier.amount}
              onChange={(amount) => updateInvaliditePalier(palierIndex, amount)}
              suffix="€/an"
            />
          </SimFieldShell>
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
    </article>
  );
}
