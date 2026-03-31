import { useState, useMemo, useCallback } from 'react';
import type {
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
  SuccessionAssetLegalNature,
  SuccessionAssetOrigin,
  SuccessionAssuranceVieEntry,
  SuccessionGroupementFoncierEntry,
  SuccessionMeubleImmeubleLegal,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft.types';
import type {
  SuccessionAssetPocket,
  SuccessionLegacyAssetOwner,
  SuccessionPersonParty,
} from '../successionDraft';
import {
  ASSET_SUBCATEGORY_OPTIONS,
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
} from '../successionSimulator.constants';
import { computeGroupementFoncierExoneration, GF_UI_OPTIONS, normalizeGfTypeForUi } from '../successionGroupementFoncier';
import { fmt } from '../successionSimulator.helpers';
import AssetLegalQualificationModal from './AssetLegalQualificationModal';
import { ScAssetsSummary, ScForfaitMobilierSection } from './ScAssetsPassifsExtras';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';

interface ScAssetsPassifsCardProps {
  isExpert: boolean;
  isMarried: boolean;
  isPacsed: boolean;
  isConcubinage: boolean;
  isCommunauteUniverselleRegime: boolean;
  isCommunauteMeublesAcquetsRegime: boolean;
  assetEntriesByCategory: {
    value: SuccessionAssetCategory;
    label: string;
    entries: SuccessionAssetDetailEntry[];
  }[];
  assetOwnerOptions: { value: SuccessionLegacyAssetOwner; label: string }[];
  assetPocketOptions: { value: SuccessionAssetPocket; label: string }[];
  assetBreakdown: {
    actifs: Record<SuccessionLegacyAssetOwner, number>;
    passifs: Record<SuccessionLegacyAssetOwner, number>;
  };
  assetNetTotals: Record<SuccessionLegacyAssetOwner, number>;
  forfaitMobilierComputed: number;
  residencePrincipaleEntryId: string | null;
  hasBeneficiaryLevelGfAdjustment: boolean;
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  assuranceViePartyOptions: { value: SuccessionPersonParty; label: string }[];
  onAddAssetEntry: (_category: SuccessionAssetCategory) => void;
  onUpdateAssetEntry: (
    _id: string,
    _field: keyof SuccessionAssetDetailEntry,
    _value: string | number,
  ) => void;
  onRemoveAssetEntry: (_id: string) => void;
  onOpenAssuranceVieModal: (_id: string) => void;
  onRemoveAssuranceVieEntry: (_id: string) => void;
  onOpenPerModal: (_id: string) => void;
  onRemovePerEntry: (_id: string) => void;
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  onUpdateGroupementFoncierEntry: (_id: string, _field: string, _value: string | number) => void;
  onRemoveGroupementFoncierEntry: (_id: string) => void;
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  onOpenPrevoyanceModal: (_id: string) => void;
  onRemovePrevoyanceDecesEntry: (_id: string) => void;
  onSetSimplifiedBalanceField: (
    _type: 'actifs' | 'passifs',
    _owner: SuccessionLegacyAssetOwner,
    _value: number,
  ) => void;
  forfaitMobilierMode: 'off' | 'auto' | 'pct' | 'montant';
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  abattementResidencePrincipale: boolean;
  stipulationContraireCU: boolean;
  onUpdatePatrimonialField: <K extends string>(_field: K, _value: unknown) => void;
}

function getActifNetLabel(
  owner: SuccessionLegacyAssetOwner,
  flags: { isMarried: boolean; isPacsed: boolean; isConcubinage: boolean },
): string {
  if (owner === 'epoux1') {
    if (flags.isPacsed) return 'Actif net partenaire 1';
    if (flags.isMarried) return 'Actif net epoux 1';
    if (flags.isConcubinage) return 'Actif net personne 1';
    return 'Actif net (vous)';
  }
  if (owner === 'epoux2') {
    if (flags.isPacsed) return 'Actif net partenaire 2';
    if (flags.isMarried) return 'Actif net epoux 2';
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
  isCommunauteUniverselleRegime,
  isCommunauteMeublesAcquetsRegime,
  assetEntriesByCategory,
  assetOwnerOptions,
  assetPocketOptions,
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
  onRemoveAssuranceVieEntry,
  onOpenPerModal,
  onRemovePerEntry,
  groupementFoncierEntries,
  onUpdateGroupementFoncierEntry,
  onRemoveGroupementFoncierEntry,
  prevoyanceDecesEntries,
  onOpenPrevoyanceModal,
  onRemovePrevoyanceDecesEntry,
  onSetSimplifiedBalanceField,
  forfaitMobilierMode,
  forfaitMobilierPct,
  forfaitMobilierMontant,
  abattementResidencePrincipale,
  stipulationContraireCU,
  onUpdatePatrimonialField,
}: ScAssetsPassifsCardProps) {
  const flags = { isMarried, isPacsed, isConcubinage };
  const showCivilVsFiscalHint = abattementResidencePrincipale
    || hasBeneficiaryLevelGfAdjustment
    || forfaitMobilierMode !== 'off';
  const showForfaitMobilier = forfaitMobilierMode !== 'off';
  const getNetLabel = (owner: SuccessionLegacyAssetOwner) => getActifNetLabel(owner, flags);

  const [legalModalEntryId, setLegalModalEntryId] = useState<string | null>(null);
  const allAssetEntries = useMemo(
    () => assetEntriesByCategory.flatMap((c) => c.entries),
    [assetEntriesByCategory],
  );
  const legalModalEntry = legalModalEntryId
    ? allAssetEntries.find((e) => e.id === legalModalEntryId) ?? null
    : null;

  const handleLegalSave = useCallback((
    id: string,
    fields: {
      legalNature: SuccessionAssetLegalNature;
      origin: SuccessionAssetOrigin;
      meubleImmeubleLegal: SuccessionMeubleImmeubleLegal;
    },
  ) => {
    onUpdateAssetEntry(id, 'legalNature', fields.legalNature);
    onUpdateAssetEntry(id, 'origin', fields.origin);
    onUpdateAssetEntry(id, 'meubleImmeubleLegal', fields.meubleImmeubleLegal);
    setLegalModalEntryId(null);
  }, [onUpdateAssetEntry]);

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
        {isExpert && isCommunauteUniverselleRegime && (
          <p className="sc-hint sc-hint--compact">
            {stipulationContraireCU
              ? "Les biens qualifies 'propre par nature' et rattaches a un epoux restent hors de la masse commune simplifiee."
              : 'Sans stipulation contraire active, la communaute universelle integre tous les biens detailles dans la masse commune simplifiee.'}
          </p>
        )}
        {isExpert && isCommunauteMeublesAcquetsRegime && (
          <p className="sc-hint sc-hint--compact">
            En communaute de meubles et acquets, les biens qualifies meubles rejoignent la communaute simplifiee ; les immeubles restent sur leur masse declaree.
          </p>
        )}
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
                          <label>Masse de rattachement</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={entry.pocket ?? assetPocketOptions[0]?.value ?? 'epoux1'}
                            onChange={(value) => onUpdateAssetEntry(entry.id, 'pocket', value)}
                            options={assetPocketOptions}
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
                        <div className="sc-row-actions">
                          {entry.category !== 'passif' && (
                            <button
                              type="button"
                              className="sc-open-btn"
                              onClick={() => setLegalModalEntryId(entry.id)}
                              title="Modifier la qualification juridique"
                              aria-label="Modifier la qualification juridique"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            className="sc-remove-btn"
                            onClick={() => onRemoveAssetEntry(entry.id)}
                            title="Supprimer cette ligne"
                          >
                            &#10005;
                          </button>
                        </div>
                      </div>
                      {entry.pocket === 'indivision_separatiste' && (
                        <div className="sc-field sc-field--full sc-asset-row__suboption">
                          <label>Quote-part Epoux 1 (%)</label>
                          <ScNumericInput
                            value={entry.quotePartEpoux1Pct ?? 50}
                            min={0}
                            max={100}
                            onChange={(val) => onUpdateAssetEntry(entry.id, 'quotePartEpoux1Pct', val)}
                          />
                          <p className="sc-hint sc-hint--compact">
                            100 = entierement Epoux 1, 0 = entierement Epoux 2. La quote-part du defunt est deduite selon l'ordre de deces simule.
                          </p>
                        </div>
                      )}
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
                  const uiType = normalizeGfTypeForUi(gfEntry.type);
                  const exoneration = computeGroupementFoncierExoneration(gfEntry.type, gfEntry.valeurTotale);

                  return (
                    <div key={gfEntry.id} className="sc-asset-row-stack">
                      <div className="sc-asset-row">
                        <div className="sc-field">
                          <label>Masse de rattachement</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={gfEntry.pocket ?? assetPocketOptions[0]?.value ?? 'epoux1'}
                            onChange={(value) => onUpdateGroupementFoncierEntry(gfEntry.id, 'pocket', value)}
                            options={assetPocketOptions}
                          />
                        </div>
                        <div className="sc-field">
                          <label>Type GF</label>
                          <ScSelect
                            className="sc-asset-select"
                            value={uiType}
                            onChange={(value) => onUpdateGroupementFoncierEntry(gfEntry.id, 'type', value)}
                            options={GF_UI_OPTIONS}
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
                      {gfEntry.pocket === 'indivision_separatiste' && (
                        <div className="sc-field sc-field--full sc-asset-row__suboption">
                          <label>Quote-part Epoux 1 (%)</label>
                          <ScNumericInput
                            value={gfEntry.quotePartEpoux1Pct ?? 50}
                            min={0}
                            max={100}
                            onChange={(val) => onUpdateGroupementFoncierEntry(gfEntry.id, 'quotePartEpoux1Pct', val)}
                          />
                          <p className="sc-hint sc-hint--compact">
                            100 = entierement Epoux 1, 0 = entierement Epoux 2. La quote-part du defunt est deduite selon l'ordre de deces simule.
                          </p>
                        </div>
                      )}
                      {gfEntry.valeurTotale > 0 && (
                        <div className="sc-field sc-field--full sc-asset-row__suboption sc-asset-row__suboption--info">
                          Exonéré : {fmt(exoneration.exonere)} | Taxable : {fmt(exoneration.taxable)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {category.value === 'divers' && prevoyanceDecesEntries.map((pvEntry) => (
                  <div key={pvEntry.id} className="sc-asset-row">
                    <div className="sc-field">
                      <label>Souscripteur</label>
                      <span className="sc-asset-row__value">
                        {assuranceViePartyOptions.find((o) => o.value === pvEntry.souscripteur)?.label ?? pvEntry.souscripteur}
                      </span>
                    </div>
                    <div className="sc-field">
                      <label>Sous-catégorie</label>
                      <span className="sc-asset-row__value">Prévoyance décès</span>
                    </div>
                    <div className="sc-field">
                      <label>Capital décès (€)</label>
                      <span className="sc-asset-row__value">{fmt(pvEntry.capitalDeces)}</span>
                    </div>
                    <div className="sc-row-actions">
                      <button
                        type="button"
                        className="sc-open-btn"
                        onClick={() => onOpenPrevoyanceModal(pvEntry.id)}
                        title="Modifier ce contrat"
                        aria-label="Modifier ce contrat"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="sc-remove-btn"
                        onClick={() => onRemovePrevoyanceDecesEntry(pvEntry.id)}
                        title="Supprimer cette ligne"
                      >
                        &#10005;
                      </button>
                    </div>
                  </div>
                ))}

                {category.value === 'financier' && assuranceVieEntries.map((entry) => (
                  <div key={entry.id} className="sc-asset-row">
                    <div className="sc-field">
                      <label>Personne assuree</label>
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
                    <div className="sc-row-actions">
                      <button
                        type="button"
                        className="sc-open-btn"
                        onClick={() => onOpenAssuranceVieModal(entry.id)}
                        title="Modifier ce contrat"
                        aria-label="Modifier ce contrat"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="sc-remove-btn"
                        onClick={() => onRemoveAssuranceVieEntry(entry.id)}
                        title="Supprimer cette ligne"
                      >
                        &#10005;
                      </button>
                    </div>
                  </div>
                ))}

                {category.value === 'financier' && perEntries.map((entry) => (
                  <div key={entry.id} className="sc-asset-row">
                    <div className="sc-field">
                      <label>Personne assuree</label>
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
                    <div className="sc-row-actions">
                      <button
                        type="button"
                        className="sc-open-btn"
                        onClick={() => onOpenPerModal(entry.id)}
                        title="Modifier ce contrat"
                        aria-label="Modifier ce contrat"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="sc-remove-btn"
                        onClick={() => onRemovePerEntry(entry.id)}
                        title="Supprimer cette ligne"
                      >
                        &#10005;
                      </button>
                    </div>
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

          <ScForfaitMobilierSection
            showForfaitMobilier={showForfaitMobilier}
            forfaitMobilierMode={forfaitMobilierMode}
            forfaitMobilierPct={forfaitMobilierPct}
            forfaitMobilierMontant={forfaitMobilierMontant}
            onUpdatePatrimonialField={onUpdatePatrimonialField}
          />

          <ScAssetsSummary
            assetOwnerOptions={assetOwnerOptions}
            assetNetTotals={assetNetTotals}
            getActifNetLabel={getNetLabel}
          />
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
          <ScAssetsSummary
            assetOwnerOptions={assetOwnerOptions}
            assetNetTotals={assetNetTotals}
            getActifNetLabel={getNetLabel}
          />
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

      {legalModalEntry && (
        <AssetLegalQualificationModal
          entry={legalModalEntry}
          onClose={() => setLegalModalEntryId(null)}
          onSave={handleLegalSave}
        />
      )}
    </div>
  );
}
