import type {
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionGroupementFoncierEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft.types';
import type {
  SuccessionAssetPocket,
  SuccessionLegacyAssetOwner,
  SuccessionPersonParty,
} from '../successionDraft';
import { ScAssetsSummary } from './ScAssetsPassifsExtras';
import { ScNumericInput } from './ScNumericInput';
import { ScAssetsPassifsExpertSection } from './ScAssetsPassifsExpertSection';
import { getActifNetLabel, type ScAssetsOwnerFlags } from './ScAssetsPassifs.shared';

export { buildSubCategoryOptions } from './ScAssetsPassifs.shared';

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
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  onUpdateGroupementFoncierEntry: (id: string, field: string, value: string | number) => void;
  onRemoveGroupementFoncierEntry: (id: string) => void;
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  onOpenPrevoyanceModal: (id: string) => void;
  onRemovePrevoyanceDecesEntry: (id: string) => void;
  onSetSimplifiedBalanceField: (
    type: 'actifs' | 'passifs',
    owner: SuccessionLegacyAssetOwner,
    value: number,
  ) => void;
  forfaitMobilierMode: 'off' | 'auto' | 'pct' | 'montant';
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  abattementResidencePrincipale: boolean;
  stipulationContraireCU: boolean;
  onUpdatePatrimonialField: <K extends string>(field: K, value: unknown) => void;
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
  const flags: ScAssetsOwnerFlags = { isMarried, isPacsed, isConcubinage };
  const showCivilVsFiscalHint = (
    abattementResidencePrincipale
    || hasBeneficiaryLevelGfAdjustment
    || forfaitMobilierMode !== 'off'
  );
  const showForfaitMobilier = forfaitMobilierMode !== 'off';
  const getNetLabel = (owner: SuccessionLegacyAssetOwner) => getActifNetLabel(owner, flags);

  return (
    <div className="premium-card sc-card sc-card--guide">
      <header className="sc-card__header">
        <div className="sc-card__title-row">
          <div className="sc-section-icon-wrapper">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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
              ? "Les biens qualifiés 'propre par nature' et rattachés à un époux restent hors de la masse commune simplifiée."
              : 'Sans stipulation contraire active, la communauté universelle intègre tous les biens détaillés dans la masse commune simplifiée.'}
          </p>
        )}
        {isExpert && isCommunauteMeublesAcquetsRegime && (
          <p className="sc-hint sc-hint--compact">
            En communauté de meubles et acquêts, les biens qualifiés meubles rejoignent la communauté simplifiée ; les
            immeubles restent sur leur masse déclarée.
          </p>
        )}
      </header>
      <div className="sc-card__divider" />

      {isExpert ? (
        <ScAssetsPassifsExpertSection
          assetEntriesByCategory={assetEntriesByCategory}
          assetOwnerOptions={assetOwnerOptions}
          assetPocketOptions={assetPocketOptions}
          assetNetTotals={assetNetTotals}
          residencePrincipaleEntryId={residencePrincipaleEntryId}
          abattementResidencePrincipale={abattementResidencePrincipale}
          assuranceVieEntries={assuranceVieEntries}
          perEntries={perEntries}
          assuranceViePartyOptions={assuranceViePartyOptions}
          groupementFoncierEntries={groupementFoncierEntries}
          prevoyanceDecesEntries={prevoyanceDecesEntries}
          showForfaitMobilier={showForfaitMobilier}
          forfaitMobilierMode={forfaitMobilierMode}
          forfaitMobilierPct={forfaitMobilierPct}
          forfaitMobilierMontant={forfaitMobilierMontant}
          onAddAssetEntry={onAddAssetEntry}
          onUpdateAssetEntry={onUpdateAssetEntry}
          onRemoveAssetEntry={onRemoveAssetEntry}
          onOpenAssuranceVieModal={onOpenAssuranceVieModal}
          onRemoveAssuranceVieEntry={onRemoveAssuranceVieEntry}
          onOpenPerModal={onOpenPerModal}
          onRemovePerEntry={onRemovePerEntry}
          onUpdateGroupementFoncierEntry={onUpdateGroupementFoncierEntry}
          onRemoveGroupementFoncierEntry={onRemoveGroupementFoncierEntry}
          onOpenPrevoyanceModal={onOpenPrevoyanceModal}
          onRemovePrevoyanceDecesEntry={onRemovePrevoyanceDecesEntry}
          onUpdatePatrimonialField={onUpdatePatrimonialField}
          getActifNetLabel={getNetLabel}
        />
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
                  onChange={(value) => onSetSimplifiedBalanceField('actifs', option.value, value)}
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
                  onChange={(value) => onSetSimplifiedBalanceField('passifs', option.value, value)}
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
          Les totaux GFA/GFV affichés dans cette carte restent provisoires. La base taxable définitive est recalculée
          par bénéficiaire dans la synthèse et l&apos;export.
        </p>
      )}
      {showCivilVsFiscalHint && (
        <p className="sc-hint sc-hint--compact">
          Les totaux affichés dans cette carte correspondent à la masse civile nette. L&apos;assiette fiscale est
          recalculée séparément pour les droits.
        </p>
      )}
    </div>
  );
}
