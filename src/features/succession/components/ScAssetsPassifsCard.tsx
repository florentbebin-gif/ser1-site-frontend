import type {
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
  SuccessionAssetOwner,
  SuccessionAssuranceVieEntry,
  SuccessionGroupementFoncierEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';
import {
  ASSET_SUBCATEGORY_OPTIONS,
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
} from '../successionSimulator.constants';
import { computeGroupementFoncierExoneration, GF_TYPE_OPTIONS } from '../successionGroupementFoncier';
import { fmt, isSupportedStructuredClause } from '../successionSimulator.helpers';
import { ScNumericInput } from './ScNumericInput';
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
  forfaitMobilierComputed: number;
  residencePrincipaleEntryId: string | null;
  hasBeneficiaryLevelGfAdjustment: boolean;
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  assuranceViePartyOptions: { value: 'epoux1' | 'epoux2'; label: string }[];
  onAddAssetEntry: (_category: SuccessionAssetCategory) => void;
  onUpdateAssetEntry: (
    _id: string,
    _field: keyof SuccessionAssetDetailEntry,
    _value: string | number,
  ) => void;
  onRemoveAssetEntry: (_id: string) => void;
  onOpenAssuranceVieModal: () => void;
  onOpenPerModal: () => void;
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  onAddGroupementFoncierEntry: () => void;
  onUpdateGroupementFoncierEntry: (_id: string, _field: string, _value: string | number) => void;
  onRemoveGroupementFoncierEntry: (_id: string) => void;
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  prevoyanceClauseOptions: { value: string; label: string }[];
  prevoyanceRegimeByEntry: Record<string, { regimeLabel: string; warning?: string }>;
  onAddPrevoyanceDecesEntry: () => void;
  onUpdatePrevoyanceDecesEntry: (_id: string, _field: string, _value: string | number) => void;
  onRemovePrevoyanceDecesEntry: (_id: string) => void;
  onSetSimplifiedBalanceField: (
    _type: 'actifs' | 'passifs',
    _owner: SuccessionAssetOwner,
    _value: number,
  ) => void;
  forfaitMobilierMode: 'off' | 'auto' | 'pct' | 'montant';
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  abattementResidencePrincipale: boolean;
  onUpdatePatrimonialField: <K extends string>(_field: K, _value: unknown) => void;
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

export function buildSubCategoryOptions(
  entry: SuccessionAssetDetailEntry,
  residencePrincipaleEntryId: string | null,
) {
  const hasResidencePrincipale = residencePrincipaleEntryId !== null;
  const isCurrentResidencePrincipale = entry.id === residencePrincipaleEntryId;

  return ASSET_SUBCATEGORY_OPTIONS[entry.category]
    .filter((option) => (
      entry.category !== 'immobilier'
      || option !== RESIDENCE_PRINCIPALE_SUBCATEGORY
      || !hasResidencePrincipale
      || isCurrentResidencePrincipale
    ))
    .map((option) => ({
      value: option,
      label: option,
    }));
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
  residencePrincipaleEntryId,
  hasBeneficiaryLevelGfAdjustment,
  assuranceVieEntries,
  perEntries,
  assuranceViePartyOptions,
  onAddAssetEntry,
  onUpdateAssetEntry,
  onRemoveAssetEntry,
  onOpenAssuranceVieModal,
  onOpenPerModal,
  groupementFoncierEntries,
  onAddGroupementFoncierEntry,
  onUpdateGroupementFoncierEntry,
  onRemoveGroupementFoncierEntry,
  prevoyanceDecesEntries,
  prevoyanceClauseOptions,
  prevoyanceRegimeByEntry,
  onAddPrevoyanceDecesEntry,
  onUpdatePrevoyanceDecesEntry,
  onRemovePrevoyanceDecesEntry,
  onSetSimplifiedBalanceField,
  forfaitMobilierMode,
  forfaitMobilierPct,
  forfaitMobilierMontant,
  abattementResidencePrincipale,
  onUpdatePatrimonialField,
}: ScAssetsPassifsCardProps) {
  const flags = { isMarried, isPacsed, isConcubinage };
  const showCivilVsFiscalHint = abattementResidencePrincipale
    || hasBeneficiaryLevelGfAdjustment
    || forfaitMobilierMode !== 'off';
  const showForfaitMobilier = forfaitMobilierMode !== 'off';

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
                  {category.value === 'financier' && (
                    <>
                      <button
                        type="button"
                        className="sc-child-add-btn"
                        onClick={onOpenAssuranceVieModal}
                      >
                        + Assurance vie
                      </button>
                      <button
                        type="button"
                        className="sc-child-add-btn"
                        onClick={onOpenPerModal}
                      >
                        + PER assurance
                      </button>
                    </>
                  )}
                  {category.value === 'immobilier' && (
                    <button type="button" className="sc-child-add-btn" onClick={onAddGroupementFoncierEntry}>
                      + GFA/GFV
                    </button>
                  )}
                  {category.value === 'divers' && (
                    <button type="button" className="sc-child-add-btn" onClick={onAddPrevoyanceDecesEntry}>
                      + Prévoyance décès
                    </button>
                  )}
                  <button
                    type="button"
                    className="sc-member-add-icon-btn"
                    onClick={() => onAddAssetEntry(category.value)}
                    title="Ajouter une ligne"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="sc-assets-list">
                {category.entries.map((entry) => {
                  const showResidenceCheckbox = (
                    category.value === 'immobilier'
                    && entry.subCategory === RESIDENCE_PRINCIPALE_SUBCATEGORY
                  );

                  return (
                    <div key={entry.id} className="sc-asset-row-stack">
                      <div className="sc-asset-row">
                        <div className="sc-field">
                          <label>Porteur</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={entry.owner}
                            onChange={(value) => onUpdateAssetEntry(entry.id, 'owner', value)}
                            options={assetOwnerOptions}
                          />
                        </div>
                        <div className="sc-field">
                          <label>Sous-catégorie</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={entry.subCategory}
                            onChange={(value) => onUpdateAssetEntry(entry.id, 'subCategory', value)}
                            options={buildSubCategoryOptions(entry, residencePrincipaleEntryId)}
                          />
                        </div>
                        <div className="sc-field">
                          <label>Montant (€)</label>
                          <ScNumericInput
                            value={entry.amount || 0}
                            min={0}
                            onChange={(val) => onUpdateAssetEntry(entry.id, 'amount', val)}
                          />
                        </div>
                        <button
                          type="button"
                          className="sc-remove-btn"
                          onClick={() => onRemoveAssetEntry(entry.id)}
                          title="Supprimer cette ligne"
                        >
                          &#10005;
                        </button>
                      </div>
                      {showResidenceCheckbox && (
                        <div className="sc-field sc-field--full sc-asset-row__suboption">
                          <label className="sc-checkbox-label">
                            <input
                              type="checkbox"
                              checked={abattementResidencePrincipale}
                              onChange={(e) => onUpdatePatrimonialField('abattementResidencePrincipale', e.target.checked)}
                            />
                            Appliquer l&apos;abattement 20 % (occupation éligible au jour du décès)
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}

                {category.value === 'immobilier' && groupementFoncierEntries.map((gfEntry) => {
                  const exoneration = computeGroupementFoncierExoneration(gfEntry.type, gfEntry.valeurTotale);

                  return (
                    <div key={gfEntry.id} className="sc-asset-row-stack">
                      <div className="sc-asset-row">
                        <div className="sc-field">
                          <label>Porteur</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={gfEntry.owner}
                            onChange={(value) => onUpdateGroupementFoncierEntry(gfEntry.id, 'owner', value)}
                            options={assetOwnerOptions}
                          />
                        </div>
                        <div className="sc-field">
                          <label>Type GF</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={gfEntry.type}
                            onChange={(value) => onUpdateGroupementFoncierEntry(gfEntry.id, 'type', value)}
                            options={GF_TYPE_OPTIONS}
                          />
                        </div>
                        <div className="sc-field">
                          <label>Valeur totale (€)</label>
                          <ScNumericInput
                            value={gfEntry.valeurTotale || 0}
                            min={0}
                            onChange={(val) => onUpdateGroupementFoncierEntry(gfEntry.id, 'valeurTotale', val)}
                          />
                        </div>
                        <button
                          type="button"
                          className="sc-remove-btn"
                          onClick={() => onRemoveGroupementFoncierEntry(gfEntry.id)}
                          title="Supprimer cette ligne"
                        >
                          &#10005;
                        </button>
                      </div>
                      {gfEntry.valeurTotale > 0 && (
                        <div className="sc-field sc-field--full sc-asset-row__suboption sc-asset-row__suboption--info">
                          Exonéré : {fmt(exoneration.exonere)} | Taxable : {fmt(exoneration.taxable)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {category.value === 'divers' && prevoyanceDecesEntries.map((pvEntry) => {
                  const selectedClause = pvEntry.clauseBeneficiaire || prevoyanceClauseOptions[0]?.value || '';
                  const clauseOptions = isSupportedStructuredClause(selectedClause)
                    ? prevoyanceClauseOptions
                    : [
                      ...prevoyanceClauseOptions,
                      { value: selectedClause, label: 'Clause libre existante' },
                    ];
                  const regimeInfo = prevoyanceRegimeByEntry[pvEntry.id];

                  return (
                    <div key={pvEntry.id} className="sc-asset-row-stack">
                      <div className="sc-asset-row">
                        <div className="sc-field">
                          <label>Souscripteur</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={pvEntry.souscripteur}
                            onChange={(value) => onUpdatePrevoyanceDecesEntry(pvEntry.id, 'souscripteur', value)}
                            options={assuranceViePartyOptions}
                          />
                        </div>
                        <div className="sc-field">
                          <label>Assuré</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={pvEntry.assure}
                            onChange={(value) => onUpdatePrevoyanceDecesEntry(pvEntry.id, 'assure', value)}
                            options={assuranceViePartyOptions}
                          />
                        </div>
                        <div className="sc-field">
                          <label>Capital décès (€)</label>
                          <ScNumericInput
                            value={pvEntry.capitalDeces || 0}
                            min={0}
                            onChange={(val) => onUpdatePrevoyanceDecesEntry(pvEntry.id, 'capitalDeces', val)}
                          />
                        </div>
                        <button
                          type="button"
                          className="sc-remove-btn"
                          onClick={() => onRemovePrevoyanceDecesEntry(pvEntry.id)}
                          title="Supprimer cette ligne"
                        >
                          &#10005;
                        </button>
                      </div>
                      <div className="sc-asset-row__suboption sc-asset-row__suboption--prevoyance">
                        <div className="sc-field sc-field--wide">
                          <label>Dernière prime versée (€)</label>
                          <ScNumericInput
                            value={pvEntry.dernierePrime || 0}
                            min={0}
                            onChange={(val) => onUpdatePrevoyanceDecesEntry(pvEntry.id, 'dernierePrime', val)}
                          />
                        </div>
                        <div className="sc-field sc-field--wide">
                          <label>Régime applicable</label>
                          <span className="sc-asset-row__value">
                            {`Régime applicable : ${regimeInfo?.regimeLabel ?? '990 I'}`}
                          </span>
                        </div>
                        {regimeInfo?.warning && (
                          <div className="sc-field sc-field--wide">
                            <span className="sc-hint sc-hint--compact">{regimeInfo.warning}</span>
                          </div>
                        )}
                        <div className="sc-field sc-field--wide">
                          <label>Clause bénéficiaire</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={selectedClause}
                            onChange={(value) => onUpdatePrevoyanceDecesEntry(pvEntry.id, 'clauseBeneficiaire', value)}
                            options={clauseOptions}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

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

                {category.value === 'financier' && perEntries.map((entry) => (
                  <div key={entry.id} className="sc-asset-row sc-asset-row--av">
                    <div className="sc-field">
                      <label>Porteur</label>
                      <span className="sc-asset-row__value">
                        {assuranceViePartyOptions.find((option) => option.value === entry.assure)?.label ?? entry.assure}
                      </span>
                    </div>
                    <div className="sc-field">
                      <label>Sous-catégorie</label>
                      <span className="sc-asset-row__value">PER assurance</span>
                    </div>
                    <div className="sc-field">
                      <label>Capitaux décès (€)</label>
                      <span className="sc-asset-row__value">{fmt(entry.capitauxDeces)}</span>
                    </div>
                    <div />
                  </div>
                ))}

                {category.entries.length === 0
                  && !(category.value === 'financier' && (assuranceVieEntries.length > 0 || perEntries.length > 0))
                  && !(category.value === 'immobilier' && groupementFoncierEntries.length > 0)
                  && !(category.value === 'divers' && prevoyanceDecesEntries.length > 0)
                  && (
                    <p className="sc-hint sc-hint--compact">Aucune ligne détaillée dans cette catégorie.</p>
                  )}
              </div>
            </section>
          ))}

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
                <ScNumericInput
                  value={assetBreakdown.actifs[option.value] || 0}
                  min={0}
                  onChange={(val) => onSetSimplifiedBalanceField('actifs', option.value, val)}
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
                <ScNumericInput
                  value={assetBreakdown.passifs[option.value] || 0}
                  min={0}
                  onChange={(val) => onSetSimplifiedBalanceField('passifs', option.value, val)}
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

      {hasBeneficiaryLevelGfAdjustment && (
        <p className="sc-hint sc-hint--compact">
          Les totaux GFA/GFV affichés dans cette carte restent provisoires. La base taxable définitive est recalculée par bénéficiaire dans la synthèse et l&apos;export.
        </p>
      )}
      {showCivilVsFiscalHint && (
        <p className="sc-hint sc-hint--compact">
          Les totaux affichés dans cette carte correspondent à la masse civile nette. L&apos;assiette fiscale est recalculée séparément pour les droits.
        </p>
      )}
    </div>
  );
}
