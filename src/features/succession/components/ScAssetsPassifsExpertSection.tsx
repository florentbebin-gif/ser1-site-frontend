import { useCallback, useMemo, useState } from 'react';
import { SimActionButton, SimAmountInputEuro, SimAmountInputPercent } from '@/components/ui/sim';
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
import { RESIDENCE_PRINCIPALE_SUBCATEGORY } from '../successionSimulator.constants';
import {
  computeGroupementFoncierExoneration,
  GF_UI_OPTIONS,
  normalizeGfTypeForUi,
} from '../successionGroupementFoncier';
import { fmt } from '../successionSimulator.helpers';
import AssetLegalQualificationModal from './AssetLegalQualificationModal';
import { ScAssetsSummary, ScForfaitMobilierSection } from './ScAssetsPassifsExtras';
import { ScSelect } from './ScSelect';
import { buildSubCategoryOptions } from './ScAssetsPassifs.shared';
import { EditRowButton, getPartyLabel } from './ScAssetsPassifsExpertRows';

interface ScAssetsPassifsExpertSectionProps {
  assetEntriesByCategory: {
    value: SuccessionAssetCategory;
    label: string;
    entries: SuccessionAssetDetailEntry[];
  }[];
  assetOwnerOptions: { value: SuccessionLegacyAssetOwner; label: string }[];
  assetPocketOptions: { value: SuccessionAssetPocket; label: string }[];
  assetNetTotals: Record<SuccessionLegacyAssetOwner, number>;
  residencePrincipaleEntryId: string | null;
  abattementResidencePrincipale: boolean;
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  assuranceViePartyOptions: { value: SuccessionPersonParty; label: string }[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  showForfaitMobilier: boolean;
  forfaitMobilierMode: 'off' | 'auto' | 'pct' | 'montant';
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  onAddAssetEntry: (category: SuccessionAssetCategory) => void;
  onUpdateAssetEntry: (
    id: string,
    field: keyof SuccessionAssetDetailEntry,
    value: string | number,
  ) => void;
  onRemoveAssetEntry: (id: string) => void;
  onOpenAssuranceVieModal: (id: string) => void;
  onRemoveAssuranceVieEntry: (id: string) => void;
  onOpenPerModal: (id: string) => void;
  onRemovePerEntry: (id: string) => void;
  onUpdateGroupementFoncierEntry: (id: string, field: string, value: string | number) => void;
  onRemoveGroupementFoncierEntry: (id: string) => void;
  onOpenPrevoyanceModal: (id: string) => void;
  onRemovePrevoyanceDecesEntry: (id: string) => void;
  onUpdatePatrimonialField: <K extends string>(field: K, value: unknown) => void;
  getActifNetLabel: (owner: SuccessionLegacyAssetOwner) => string;
}

export function ScAssetsPassifsExpertSection({
  assetEntriesByCategory,
  assetOwnerOptions,
  assetPocketOptions,
  assetNetTotals,
  residencePrincipaleEntryId,
  abattementResidencePrincipale,
  assuranceVieEntries,
  perEntries,
  assuranceViePartyOptions,
  groupementFoncierEntries,
  prevoyanceDecesEntries,
  showForfaitMobilier,
  forfaitMobilierMode,
  forfaitMobilierPct,
  forfaitMobilierMontant,
  onAddAssetEntry,
  onUpdateAssetEntry,
  onRemoveAssetEntry,
  onOpenAssuranceVieModal,
  onRemoveAssuranceVieEntry,
  onOpenPerModal,
  onRemovePerEntry,
  onUpdateGroupementFoncierEntry,
  onRemoveGroupementFoncierEntry,
  onOpenPrevoyanceModal,
  onRemovePrevoyanceDecesEntry,
  onUpdatePatrimonialField,
  getActifNetLabel,
}: ScAssetsPassifsExpertSectionProps) {
  const [legalModalEntryId, setLegalModalEntryId] = useState<string | null>(null);
  const allAssetEntries = useMemo(
    () => assetEntriesByCategory.flatMap((category) => category.entries),
    [assetEntriesByCategory],
  );
  const legalModalEntry = legalModalEntryId
    ? (allAssetEntries.find((entry) => entry.id === legalModalEntryId) ?? null)
    : null;

  const handleLegalSave = useCallback(
    (
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
    },
    [onUpdateAssetEntry],
  );

  return (
    <>
      <div className="sc-assets-sections">
        {assetEntriesByCategory.map((category) => {
          const showFinancierContracts = category.value === 'financier';
          const showImmobilierContracts = category.value === 'immobilier';
          const showDiversContracts = category.value === 'divers';
          const hasExtraRows =
            (showFinancierContracts && (assuranceVieEntries.length > 0 || perEntries.length > 0)) ||
            (showImmobilierContracts && groupementFoncierEntries.length > 0) ||
            (showDiversContracts && prevoyanceDecesEntries.length > 0);

          return (
            <section key={category.value} className="sc-asset-section">
              <div className="sc-asset-section__header">
                <h3 className="sc-asset-section__title">{category.label}</h3>
                <div className="sc-asset-section__actions">
                  <SimActionButton
                    variant="add"
                    mode="icon"
                    label="Ajouter"
                    className="sc-member-add-icon-btn"
                    onClick={() => onAddAssetEntry(category.value)}
                    ariaLabel="Ajouter une ligne"
                    title="Ajouter une ligne"
                  />
                </div>
              </div>

              <div className="sc-assets-list">
                {category.entries.map((entry) => {
                  const showResidenceCheckbox =
                    category.value === 'immobilier' &&
                    entry.subCategory === RESIDENCE_PRINCIPALE_SUBCATEGORY;

                  return (
                    <div key={entry.id} className="sc-asset-row-stack">
                      <div className="sc-asset-row">
                        <div className="sc-field">
                          <label htmlFor={`sc-asset-pocket-${entry.id}`}>
                            Masse de rattachement
                          </label>
                          <ScSelect
                            id={`sc-asset-pocket-${entry.id}`}
                            className="sc-asset-select"
                            value={entry.pocket ?? assetPocketOptions[0]?.value ?? 'epoux1'}
                            onChange={(value) => onUpdateAssetEntry(entry.id, 'pocket', value)}
                            options={assetPocketOptions}
                          />
                        </div>
                        <div className="sc-field">
                          <label htmlFor={`sc-asset-subcategory-${entry.id}`}>Sous-catégorie</label>
                          <ScSelect
                            id={`sc-asset-subcategory-${entry.id}`}
                            className="sc-asset-select"
                            value={entry.subCategory}
                            onChange={(value) => onUpdateAssetEntry(entry.id, 'subCategory', value)}
                            options={buildSubCategoryOptions(entry, residencePrincipaleEntryId)}
                          />
                        </div>
                        <div className="sc-field">
                          <label htmlFor={`sc-asset-amount-${entry.id}`}>Montant</label>
                          <SimAmountInputEuro
                            id={`sc-asset-amount-${entry.id}`}
                            value={entry.amount || 0}
                            min={0}
                            onChange={(value) => onUpdateAssetEntry(entry.id, 'amount', value)}
                          />
                        </div>
                        <div className="sc-row-actions">
                          {entry.category !== 'passif' && (
                            <EditRowButton
                              label="Modifier la qualification juridique"
                              onClick={() => setLegalModalEntryId(entry.id)}
                            />
                          )}
                          <SimActionButton
                            variant="delete"
                            mode="icon"
                            label="Supprimer"
                            className="sc-remove-btn"
                            onClick={() => onRemoveAssetEntry(entry.id)}
                            title="Supprimer cette ligne"
                            ariaLabel="Supprimer cette ligne"
                          />
                        </div>
                      </div>
                      {entry.pocket === 'indivision_separatiste' && (
                        <div className="sc-field sc-field--full sc-asset-row__suboption">
                          <label htmlFor={`sc-asset-quote-epoux1-${entry.id}`}>
                            Quote-part Époux 1 (%)
                          </label>
                          <SimAmountInputPercent
                            id={`sc-asset-quote-epoux1-${entry.id}`}
                            value={entry.quotePartEpoux1Pct ?? 50}
                            min={0}
                            max={100}
                            onChange={(value) =>
                              onUpdateAssetEntry(entry.id, 'quotePartEpoux1Pct', value)
                            }
                          />
                          <p className="sc-hint sc-hint--compact">
                            100 = entièrement Époux 1, 0 = entièrement Époux 2. La quote-part du
                            défunt est déduite selon l&apos;ordre de décès simulé.
                          </p>
                        </div>
                      )}
                      {showResidenceCheckbox && (
                        <div className="sc-field sc-field--full sc-asset-row__suboption">
                          <label className="sc-checkbox-label">
                            <input
                              type="checkbox"
                              checked={abattementResidencePrincipale}
                              onChange={(event) =>
                                onUpdatePatrimonialField(
                                  'abattementResidencePrincipale',
                                  event.target.checked,
                                )
                              }
                            />
                            Appliquer l&apos;abattement 20 % (occupation éligible au jour du décès)
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}

                {showImmobilierContracts &&
                  groupementFoncierEntries.map((entry) => {
                    const uiType = normalizeGfTypeForUi(entry.type);
                    const exoneration = computeGroupementFoncierExoneration(
                      entry.type,
                      entry.valeurTotale,
                    );

                    return (
                      <div key={entry.id} className="sc-asset-row-stack">
                        <div className="sc-asset-row">
                          <div className="sc-field">
                            <label htmlFor={`sc-gf-pocket-${entry.id}`}>
                              Masse de rattachement
                            </label>
                            <ScSelect
                              id={`sc-gf-pocket-${entry.id}`}
                              className="sc-asset-select"
                              value={entry.pocket ?? assetPocketOptions[0]?.value ?? 'epoux1'}
                              onChange={(value) =>
                                onUpdateGroupementFoncierEntry(entry.id, 'pocket', value)
                              }
                              options={assetPocketOptions}
                            />
                          </div>
                          <div className="sc-field">
                            <label htmlFor={`sc-gf-type-${entry.id}`}>Type GF</label>
                            <ScSelect
                              id={`sc-gf-type-${entry.id}`}
                              className="sc-asset-select"
                              value={uiType}
                              onChange={(value) =>
                                onUpdateGroupementFoncierEntry(entry.id, 'type', value)
                              }
                              options={GF_UI_OPTIONS}
                            />
                          </div>
                          <div className="sc-field">
                            <label htmlFor={`sc-gf-valeur-totale-${entry.id}`}>Valeur totale</label>
                            <SimAmountInputEuro
                              id={`sc-gf-valeur-totale-${entry.id}`}
                              value={entry.valeurTotale || 0}
                              min={0}
                              onChange={(value) =>
                                onUpdateGroupementFoncierEntry(entry.id, 'valeurTotale', value)
                              }
                            />
                          </div>
                          <SimActionButton
                            variant="delete"
                            mode="icon"
                            label="Supprimer"
                            className="sc-remove-btn"
                            onClick={() => onRemoveGroupementFoncierEntry(entry.id)}
                            title="Supprimer cette ligne"
                            ariaLabel="Supprimer cette ligne"
                          />
                        </div>
                        {entry.pocket === 'indivision_separatiste' && (
                          <div className="sc-field sc-field--full sc-asset-row__suboption">
                            <label htmlFor={`sc-gf-quote-epoux1-${entry.id}`}>
                              Quote-part Époux 1 (%)
                            </label>
                            <SimAmountInputPercent
                              id={`sc-gf-quote-epoux1-${entry.id}`}
                              value={entry.quotePartEpoux1Pct ?? 50}
                              min={0}
                              max={100}
                              onChange={(value) =>
                                onUpdateGroupementFoncierEntry(
                                  entry.id,
                                  'quotePartEpoux1Pct',
                                  value,
                                )
                              }
                            />
                            <p className="sc-hint sc-hint--compact">
                              100 = entièrement Époux 1, 0 = entièrement Époux 2. La quote-part du
                              défunt est déduite selon l&apos;ordre de décès simulé.
                            </p>
                          </div>
                        )}
                        {entry.valeurTotale > 0 && (
                          <div className="sc-field sc-field--full sc-asset-row__suboption sc-asset-row__suboption--info">
                            Exonéré : {fmt(exoneration.exonere)} | Taxable :{' '}
                            {fmt(exoneration.taxable)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {showDiversContracts &&
                  prevoyanceDecesEntries.map((entry) => (
                    <div key={entry.id} className="sc-asset-row">
                      <div className="sc-field">
                        <div className="sc-field-label">Souscripteur</div>
                        <span className="sc-asset-row__value">
                          {getPartyLabel(assuranceViePartyOptions, entry.souscripteur)}
                        </span>
                      </div>
                      <div className="sc-field">
                        <div className="sc-field-label">Sous-catégorie</div>
                        <span className="sc-asset-row__value">Prévoyance décès</span>
                      </div>
                      <div className="sc-field">
                        <div className="sc-field-label">Capital décès (€)</div>
                        <span className="sc-asset-row__value">{fmt(entry.capitalDeces)}</span>
                      </div>
                      <div className="sc-row-actions">
                        <EditRowButton
                          label="Modifier ce contrat"
                          onClick={() => onOpenPrevoyanceModal(entry.id)}
                        />
                        <SimActionButton
                          variant="delete"
                          mode="icon"
                          label="Supprimer"
                          className="sc-remove-btn"
                          onClick={() => onRemovePrevoyanceDecesEntry(entry.id)}
                          title="Supprimer cette ligne"
                          ariaLabel="Supprimer cette ligne"
                        />
                      </div>
                    </div>
                  ))}

                {showFinancierContracts &&
                  assuranceVieEntries.map((entry) => (
                    <div key={entry.id} className="sc-asset-row">
                      <div className="sc-field">
                        <div className="sc-field-label">Personne assurée</div>
                        <span className="sc-asset-row__value">
                          {getPartyLabel(assuranceViePartyOptions, entry.assure)}
                        </span>
                      </div>
                      <div className="sc-field">
                        <div className="sc-field-label">Sous-catégorie</div>
                        <span className="sc-asset-row__value">Assurance-vie</span>
                      </div>
                      <div className="sc-field">
                        <div className="sc-field-label">Capitaux décès (€)</div>
                        <span className="sc-asset-row__value">{fmt(entry.capitauxDeces)}</span>
                      </div>
                      <div className="sc-row-actions">
                        <EditRowButton
                          label="Modifier ce contrat"
                          onClick={() => onOpenAssuranceVieModal(entry.id)}
                        />
                        <SimActionButton
                          variant="delete"
                          mode="icon"
                          label="Supprimer"
                          className="sc-remove-btn"
                          onClick={() => onRemoveAssuranceVieEntry(entry.id)}
                          title="Supprimer cette ligne"
                          ariaLabel="Supprimer cette ligne"
                        />
                      </div>
                    </div>
                  ))}

                {showFinancierContracts &&
                  perEntries.map((entry) => (
                    <div key={entry.id} className="sc-asset-row">
                      <div className="sc-field">
                        <div className="sc-field-label">Personne assurée</div>
                        <span className="sc-asset-row__value">
                          {getPartyLabel(assuranceViePartyOptions, entry.assure)}
                        </span>
                      </div>
                      <div className="sc-field">
                        <div className="sc-field-label">Sous-catégorie</div>
                        <span className="sc-asset-row__value">PER assurance</span>
                      </div>
                      <div className="sc-field">
                        <div className="sc-field-label">Capitaux décès (€)</div>
                        <span className="sc-asset-row__value">{fmt(entry.capitauxDeces)}</span>
                      </div>
                      <div className="sc-row-actions">
                        <EditRowButton
                          label="Modifier ce contrat"
                          onClick={() => onOpenPerModal(entry.id)}
                        />
                        <SimActionButton
                          variant="delete"
                          mode="icon"
                          label="Supprimer"
                          className="sc-remove-btn"
                          onClick={() => onRemovePerEntry(entry.id)}
                          title="Supprimer cette ligne"
                          ariaLabel="Supprimer cette ligne"
                        />
                      </div>
                    </div>
                  ))}

                {category.entries.length === 0 && !hasExtraRows && (
                  <p className="sc-hint sc-hint--compact">
                    Aucune ligne détaillée dans cette catégorie.
                  </p>
                )}
              </div>
            </section>
          );
        })}

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
          getActifNetLabel={getActifNetLabel}
        />
      </div>

      {legalModalEntry && (
        <AssetLegalQualificationModal
          entry={legalModalEntry}
          onClose={() => setLegalModalEntryId(null)}
          onSave={handleLegalSave}
        />
      )}
    </>
  );
}
