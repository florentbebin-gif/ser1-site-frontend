import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SuccessionAssetDetailEntry } from '../successionDraft';
import { RESIDENCE_PRINCIPALE_SUBCATEGORY } from '../successionSimulator.constants';
import ScAssetsPassifsCard, { buildSubCategoryOptions } from '../components/ScAssetsPassifsCard';

const ownerOptions = [
  { value: 'epoux1', label: 'Epoux 1' },
  { value: 'epoux2', label: 'Epoux 2' },
  { value: 'commun', label: 'Commun' },
] as const;

function buildBaseProps() {
  return {
    isExpert: true,
    isMarried: true,
    isPacsed: false,
    isConcubinage: false,
    assetEntriesByCategory: [] as Array<{
      value: 'immobilier' | 'financier';
      label: string;
      entries: SuccessionAssetDetailEntry[];
    }>,
    assetOwnerOptions: [...ownerOptions],
    assetBreakdown: {
      actifs: { epoux1: 0, epoux2: 0, commun: 0 },
      passifs: { epoux1: 0, epoux2: 0, commun: 0 },
    },
    assetNetTotals: { epoux1: 0, epoux2: 0, commun: 0 },
    forfaitMobilierComputed: 0,
    residencePrincipaleEntryId: null as string | null,
    assuranceVieEntries: [],
    perEntries: [],
    assuranceViePartyOptions: [
      { value: 'epoux1' as const, label: 'Epoux 1' },
      { value: 'epoux2' as const, label: 'Epoux 2' },
    ],
    onAddAssetEntry: () => {},
    onUpdateAssetEntry: () => {},
    onRemoveAssetEntry: () => {},
    onOpenAssuranceVieModal: () => {},
    onOpenPerModal: () => {},
    onSetSimplifiedBalanceField: () => {},
    forfaitMobilierMode: 'auto' as const,
    forfaitMobilierPct: 5,
    forfaitMobilierMontant: 0,
    abattementResidencePrincipale: false,
    onUpdatePatrimonialField: () => {},
    onOpenGroupementFoncierModal: () => {},
    onOpenPrevoyanceDecesModal: () => {},
    groupementFoncierCount: 0,
    prevoyanceDecesCount: 0,
  };
}

describe('ScAssetsPassifsCard', () => {
  it('removes the main residence option from other immobilier rows once one exists', () => {
    const currentResidence: SuccessionAssetDetailEntry = {
      id: 'asset-rp',
      owner: 'epoux1',
      category: 'immobilier',
      subCategory: RESIDENCE_PRINCIPALE_SUBCATEGORY,
      amount: 250000,
      label: 'Maison',
    };
    const secondaryResidence: SuccessionAssetDetailEntry = {
      id: 'asset-rs',
      owner: 'commun',
      category: 'immobilier',
      subCategory: 'Residence secondaire',
      amount: 180000,
      label: 'Appartement',
    };

    expect(buildSubCategoryOptions(currentResidence, 'asset-rp').map((option) => option.value)).toContain(
      RESIDENCE_PRINCIPALE_SUBCATEGORY,
    );
    expect(buildSubCategoryOptions(secondaryResidence, 'asset-rp').map((option) => option.value)).not.toContain(
      RESIDENCE_PRINCIPALE_SUBCATEGORY,
    );
  });

  it('shows the 20 percent abatement under the main residence row', () => {
    const props = buildBaseProps();
    props.assetEntriesByCategory = [
      {
        value: 'immobilier',
        label: 'Biens immobiliers',
        entries: [
          {
            id: 'asset-rp',
            owner: 'epoux1',
            category: 'immobilier',
            subCategory: RESIDENCE_PRINCIPALE_SUBCATEGORY,
            amount: 250000,
            label: 'Maison',
          },
        ],
      },
    ];
    props.residencePrincipaleEntryId = 'asset-rp';

    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...props} />);

    expect(markup).toContain('abattement 20 %');
  });

  it('renders finance actions in the order assurance vie, PER, add row', () => {
    const props = buildBaseProps();
    props.assetEntriesByCategory = [
      {
        value: 'financier',
        label: 'Biens financiers et autres biens',
        entries: [],
      },
    ];

    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...props} />);
    const avIndex = markup.indexOf('+ Assurance vie');
    const perIndex = markup.indexOf('+ PER assurance');
    const addIndex = markup.indexOf('title="Ajouter une ligne"');

    expect(avIndex).toBeGreaterThanOrEqual(0);
    expect(perIndex).toBeGreaterThan(avIndex);
    expect(addIndex).toBeGreaterThan(perIndex);
  });
});
