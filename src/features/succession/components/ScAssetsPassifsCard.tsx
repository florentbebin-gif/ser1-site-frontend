import type {
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
  SuccessionAssetOwner,
  SuccessionAssuranceVieEntry,
} from '../successionDraft';
import { ASSET_SUBCATEGORY_OPTIONS } from '../successionSimulator.constants';
import { fmt } from '../successionSimulator.helpers';
import { ScSelect } from './ScSelect';

interface ScAssetsPassifsCardProps {
  isExpert: boolean;
  isMarried: boolean;
  isPacsed: boolean;
  isConcubinage: boolean;
  assetEntriesByCategory: {
    value: SuccessionAssetCategory;
    label: string;
    entries: SuccessionAssetDetailEntry[];
  }[];
  assetOwnerOptions: { value: SuccessionAssetOwner; label: string }[];
  assetBreakdown: {
    actifs: Record<SuccessionAssetOwner, number>;
    passifs: Record<SuccessionAssetOwner, number>;
  };
  assetNetTotals: Record<SuccessionAssetOwner, number>;
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  assuranceViePartyOptions: { value: 'epoux1' | 'epoux2'; label: string }[];
  onAddAssetEntry: (_category: SuccessionAssetCategory) => void;
  onUpdateAssetEntry: (
    _id: string,
    _field: keyof SuccessionAssetDetailEntry,
    _value: string | number,
  ) => void;
  onRemoveAssetEntry: (_id: string) => void;
  onOpenAssuranceVieModal: () => void;
  onSetSimplifiedBalanceField: (
    _type: 'actifs' | 'passifs',
    _owner: SuccessionAssetOwner,
    _value: number,
  ) => void;
}

function getActifNetLabel(
  owner: SuccessionAssetOwner,
  flags: { isMarried: boolean; isPacsed: boolean; isConcubinage: boolean },
): string {
  if (owner === 'epoux1') {
    if (flags.isPacsed) return 'Actif net partenaire 1';
    if (flags.isMarried) return 'Actif net époux 1';
    if (flags.isConcubinage) return 'Actif net personne 1';
    return 'Actif net du/de la défunt(e)';
  }
  if (owner === 'epoux2') {
    if (flags.isPacsed) return 'Actif net partenaire 2';
    if (flags.isMarried) return 'Actif net époux 2';
    return 'Actif net personne 2';
  }
  return flags.isPacsed || flags.isConcubinage ? 'Masse indivise nette' : 'Masse commune nette';
}

export default function ScAssetsPassifsCard({
  isExpert,
  isMarried,
  isPacsed,
  isConcubinage,
  assetEntriesByCategory,
  assetOwnerOptions,
  assetBreakdown,
  assetNetTotals,
  assuranceVieEntries,
  assuranceViePartyOptions,
  onAddAssetEntry,
  onUpdateAssetEntry,
  onRemoveAssetEntry,
  onOpenAssuranceVieModal,
  onSetSimplifiedBalanceField,
}: ScAssetsPassifsCardProps) {
  const flags = { isMarried, isPacsed, isConcubinage };

  return (
    <div className="premium-card sc-card sc-card--guide">
      <header className="sc-card__header">
        <div className="sc-card__title-row">
          <div className="sc-section-icon-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h2 className="sc-card__title">Actifs / Passifs</h2>
        </div>
        <p className="sc-card__subtitle">
          {isExpert
            ? 'Saisie détaillée des actifs et passifs, agrégée automatiquement pour les analyses civiles.'
            : 'Saisie simplifiée des actifs et passifs, agrégée automatiquement pour les analyses civiles et la chronologie.'}
        </p>
      </header>
      <div className="sc-card__divider" />

      {isExpert ? (
        <div className="sc-assets-sections">
          {assetEntriesByCategory.map((category) => (
            <section key={category.value} className="sc-asset-section">
              <div className="sc-asset-section__header">
                <h3 className="sc-asset-section__title">{category.label}</h3>
                <div className="sc-asset-section__actions">
                  <button
                    type="button"
                    className="sc-member-add-icon-btn"
                    onClick={() => onAddAssetEntry(category.value)}
                    title="Ajouter une ligne"
                  >
                    +
                  </button>
                  {category.value === 'financier' && (
                    <button
                      type="button"
                      className="sc-child-add-btn"
                      onClick={onOpenAssuranceVieModal}
                    >
                      + Assurance vie
                    </button>
                  )}
                </div>
              </div>
              <div className="sc-assets-list">
                {category.entries.map((entry) => (
                  <div key={entry.id} className="sc-asset-row">
                    <div className="sc-field">
                      <label>Porteur</label>
                      <ScSelect
                        value={entry.owner}
                        onChange={(value) => onUpdateAssetEntry(entry.id, 'owner', value)}
                        options={assetOwnerOptions}
                      />
                    </div>
                    <div className="sc-field">
                      <label>Sous-catégorie</label>
                      <ScSelect
                        value={entry.subCategory}
                        onChange={(value) => onUpdateAssetEntry(entry.id, 'subCategory', value)}
                        options={ASSET_SUBCATEGORY_OPTIONS[entry.category].map((option) => ({
                          value: option,
                          label: option,
                        }))}
                      />
                    </div>
                    <div className="sc-field">
                      <label>Montant (€)</label>
                      <input
                        type="number"
                        min={0}
                        value={entry.amount || ''}
                        onChange={(e) => onUpdateAssetEntry(entry.id, 'amount', Number(e.target.value) || 0)}
                        placeholder="Montant"
                      />
                    </div>
                    <button
                      type="button"
                      className="sc-remove-btn"
                      onClick={() => onRemoveAssetEntry(entry.id)}
                      title="Supprimer cette ligne"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {category.value === 'financier' && assuranceVieEntries.map((entry) => (
                  <div key={entry.id} className="sc-asset-row sc-asset-row--av">
                    <div className="sc-field">
                      <label>Porteur</label>
                      <span className="sc-asset-row__value">
                        {assuranceViePartyOptions.find((option) => option.value === entry.assure)?.label ?? entry.assure}
                      </span>
                    </div>
                    <div className="sc-field">
                      <label>Sous-catégorie</label>
                      <span className="sc-asset-row__value">Assurance-vie</span>
                    </div>
                    <div className="sc-field">
                      <label>Capitaux décès (€)</label>
                      <span className="sc-asset-row__value">{fmt(entry.capitauxDeces)}</span>
                    </div>
                    <div />
                  </div>
                ))}
                {category.entries.length === 0 && !(category.value === 'financier' && assuranceVieEntries.length > 0) && (
                  <p className="sc-hint sc-hint--compact">Aucune ligne détaillée dans cette catégorie.</p>
                )}
              </div>
            </section>
          ))}

          <div className="sc-assets-summary">
            {assetOwnerOptions.map((option) => (
              <div key={`summary-${option.value}`} className="sc-summary-row">
                <span>{getActifNetLabel(option.value, flags)}</span>
                <strong>{fmt(assetNetTotals[option.value])}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="sc-balance-grid">
          <div
            className="sc-balance-grid__row"
            style={{ gridTemplateColumns: `88px repeat(${assetOwnerOptions.length}, minmax(0, 1fr))` }}
          >
            <div className="sc-balance-grid__label">Actifs</div>
            {assetOwnerOptions.map((option) => (
              <div key={`actifs-${option.value}`} className="sc-field">
                <label>{option.label} (€)</label>
                <input
                  type="number"
                  min={0}
                  value={assetBreakdown.actifs[option.value] || ''}
                  onChange={(e) => onSetSimplifiedBalanceField('actifs', option.value, Number(e.target.value) || 0)}
                  placeholder="Montant"
                />
              </div>
            ))}
          </div>
          <div
            className="sc-balance-grid__row"
            style={{ gridTemplateColumns: `88px repeat(${assetOwnerOptions.length}, minmax(0, 1fr))` }}
          >
            <div className="sc-balance-grid__label">Passifs</div>
            {assetOwnerOptions.map((option) => (
              <div key={`passifs-${option.value}`} className="sc-field">
                <label>{option.label} (€)</label>
                <input
                  type="number"
                  min={0}
                  value={assetBreakdown.passifs[option.value] || ''}
                  onChange={(e) => onSetSimplifiedBalanceField('passifs', option.value, Number(e.target.value) || 0)}
                  placeholder="Montant"
                />
              </div>
            ))}
          </div>
          <div className="sc-assets-summary">
            {assetOwnerOptions.map((option) => (
              <div key={`net-${option.value}`} className="sc-summary-row">
                <span>{getActifNetLabel(option.value, flags)}</span>
                <strong>{fmt(assetNetTotals[option.value])}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
