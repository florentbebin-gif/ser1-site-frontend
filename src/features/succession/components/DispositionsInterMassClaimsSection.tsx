import type { SuccessionAssetPocket } from '../successionDraft';
import type { DispositionsDraftState } from '../successionSimulator.helpers';
import {
  getSuccessionInterMassClaimKindLabel,
  getSuccessionPocketLabel,
} from '../successionInterMassClaims';
import { OUI_NON_OPTIONS } from '../successionSimulator.constants';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect, type ScSelectOption } from './ScSelect';

const INTER_MASS_CLAIM_KIND_OPTIONS: ScSelectOption[] = [
  { value: 'recompense', label: 'Récompense' },
  { value: 'creance', label: 'Créance entre masses' },
];

interface DispositionsInterMassClaimsSectionProps {
  dispositionsDraft: DispositionsDraftState;
  interMassClaimPocketOptions: { value: SuccessionAssetPocket; label: string }[];
  onAddInterMassClaim: () => void;
  onUpdateInterMassClaim: (
    claimId: string,
    field: 'kind' | 'fromPocket' | 'toPocket' | 'amount' | 'enabled' | 'label',
    value: string | number | boolean,
  ) => void;
  onRemoveInterMassClaim: (claimId: string) => void;
}

export function DispositionsInterMassClaimsSection({
  dispositionsDraft,
  interMassClaimPocketOptions,
  onAddInterMassClaim,
  onUpdateInterMassClaim,
  onRemoveInterMassClaim,
}: DispositionsInterMassClaimsSectionProps) {
  return (
    <>
      <div className="sc-field">
        <label>Récompenses / créances entre masses</label>
        <p className="sc-hint sc-hint--compact">
          Ces écritures déplacent une valeur simplifiée d&apos;une masse débitrice vers une masse créancière avant liquidation.
          Les passifs détaillés rattachés à une masse restent traités à part comme passifs affectés.
        </p>
      </div>

      {dispositionsDraft.interMassClaims.length > 0 && (
        <div className="sc-preciput-list">
          {dispositionsDraft.interMassClaims.map((claim) => (
            <div key={claim.id} className="sc-preciput-item">
              <div className="sc-preciput-item__header">
                <div>
                  <div className="sc-preciput-item__title">
                    {claim.label ?? getSuccessionInterMassClaimKindLabel(claim.kind)}
                  </div>
                  <p className="sc-hint sc-hint--compact">
                    {getSuccessionPocketLabel(claim.fromPocket)} vers {getSuccessionPocketLabel(claim.toPocket)}
                  </p>
                </div>
                <button
                  type="button"
                  className="sc-remove-btn sc-remove-btn--quiet"
                  onClick={() => onRemoveInterMassClaim(claim.id)}
                  aria-label="Supprimer l'écriture entre masses"
                >
                  Supprimer
                </button>
              </div>

              <div className="sc-preciput-item__grid">
                <div className="sc-field">
                  <label>Active</label>
                  <ScSelect
                    value={claim.enabled ? 'oui' : 'non'}
                    onChange={(value) => onUpdateInterMassClaim(claim.id, 'enabled', value === 'oui')}
                    options={OUI_NON_OPTIONS}
                  />
                </div>
                <div className="sc-field">
                  <label>Nature</label>
                  <ScSelect
                    value={claim.kind}
                    onChange={(value) => onUpdateInterMassClaim(claim.id, 'kind', value)}
                    options={INTER_MASS_CLAIM_KIND_OPTIONS}
                  />
                </div>
                <div className="sc-field">
                  <label>Masse débitrice</label>
                  <ScSelect
                    value={claim.fromPocket}
                    onChange={(value) => onUpdateInterMassClaim(claim.id, 'fromPocket', value)}
                    options={interMassClaimPocketOptions}
                  />
                </div>
                <div className="sc-field">
                  <label>Masse créancière</label>
                  <ScSelect
                    value={claim.toPocket}
                    onChange={(value) => onUpdateInterMassClaim(claim.id, 'toPocket', value)}
                    options={interMassClaimPocketOptions}
                  />
                </div>
                <div className="sc-field">
                  <label>Montant (EUR)</label>
                  <ScNumericInput
                    value={claim.amount}
                    min={0}
                    onChange={(value) => onUpdateInterMassClaim(claim.id, 'amount', value)}
                  />
                </div>
                <div className="sc-field">
                  <label>Libellé</label>
                  <input
                    type="text"
                    className="sc-input--left"
                    value={claim.label ?? ''}
                    onChange={(e) => onUpdateInterMassClaim(claim.id, 'label', e.target.value)}
                    placeholder="Ex : récompense communauté / époux 1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="sc-child-add-btn"
        onClick={onAddInterMassClaim}
      >
        + Ajouter une écriture entre masses
      </button>
    </>
  );
}
