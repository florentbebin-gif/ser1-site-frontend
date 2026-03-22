import type { SuccessionAssetOwner } from '../successionDraft.types';
import { fmt } from '../successionSimulator.helpers';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';

export function ScAssetsSummary({
  assetOwnerOptions,
  assetNetTotals,
  getActifNetLabel,
}: {
  assetOwnerOptions: { value: SuccessionAssetOwner; label: string }[];
  assetNetTotals: Record<SuccessionAssetOwner, number>;
  getActifNetLabel: (_owner: SuccessionAssetOwner) => string;
}) {
  return (
    <div className="sc-assets-summary">
      {assetOwnerOptions.map((option) => (
        <div key={`summary-${option.value}`} className="sc-summary-row">
          <span>{getActifNetLabel(option.value)}</span>
          <strong>{fmt(assetNetTotals[option.value])}</strong>
        </div>
      ))}
    </div>
  );
}

interface ScForfaitMobilierSectionProps {
  showForfaitMobilier: boolean;
  forfaitMobilierMode: 'off' | 'auto' | 'pct' | 'montant';
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  onUpdatePatrimonialField: <K extends string>(_field: K, _value: unknown) => void;
}

export function ScForfaitMobilierSection({
  showForfaitMobilier,
  forfaitMobilierMode,
  forfaitMobilierPct,
  forfaitMobilierMontant,
  onUpdatePatrimonialField,
}: ScForfaitMobilierSectionProps) {
  return (
    <section className="sc-asset-section">
      <div className="sc-asset-section__header">
        <h3 className="sc-asset-section__title">Forfait mobilier</h3>
        <div className="sc-asset-section__actions">
          {!showForfaitMobilier ? (
            <button type="button" className="sc-member-add-icon-btn" onClick={() => onUpdatePatrimonialField('forfaitMobilierMode', 'auto')} aria-label="Configurer le forfait mobilier">+</button>
          ) : (
            <button type="button" className="sc-child-remove-btn" onClick={() => onUpdatePatrimonialField('forfaitMobilierMode', 'off')} aria-label="Désactiver le forfait mobilier">&#10005;</button>
          )}
        </div>
      </div>
      {showForfaitMobilier && (
        <div className="sc-assets-list">
          <div className="sc-asset-row sc-asset-row--three-cols">
            <div className="sc-field">
              <label>Mode</label>
              <ScSelect
                value={forfaitMobilierMode}
                onChange={(value) => onUpdatePatrimonialField('forfaitMobilierMode', value)}
                options={[
                  { value: 'auto', label: 'Automatique (5 % légal)' },
                  { value: 'pct', label: 'Pourcentage personnalisé' },
                  { value: 'montant', label: 'Montant fixe' },
                ]}
              />
            </div>
            {forfaitMobilierMode === 'pct' ? (
              <div className="sc-field">
                <label>Pourcentage (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={forfaitMobilierPct}
                  onChange={(e) => onUpdatePatrimonialField('forfaitMobilierPct', Number(e.target.value) || 0)}
                />
              </div>
            ) : (
              <div className="sc-field">
                <label>Pourcentage (%)</label>
                <input type="number" value={5} disabled />
              </div>
            )}
            <div className="sc-field">
              <label>Montant fixe (€)</label>
              <ScNumericInput
                value={forfaitMobilierMode === 'montant' ? forfaitMobilierMontant : 0}
                min={0}
                onChange={(val) => onUpdatePatrimonialField('forfaitMobilierMontant', val)}
                disabled={forfaitMobilierMode !== 'montant'}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
