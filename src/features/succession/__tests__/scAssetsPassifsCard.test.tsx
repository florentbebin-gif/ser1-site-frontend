import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type {
  SuccessionAssetDetailEntry,
  SuccessionGroupementFoncierEntry,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';
import {
  CLAUSE_CONJOINT_LABEL,
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
} from '../successionSimulator.constants';
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
      value: 'immobilier' | 'financier' | 'divers';
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
    hasBeneficiaryLevelGfAdjustment: false,
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
    forfaitMobilierMode: 'off' as const,
    forfaitMobilierPct: 5,
    forfaitMobilierMontant: 0,
    abattementResidencePrincipale: false,
    onUpdatePatrimonialField: () => {},
    groupementFoncierEntries: [] as SuccessionGroupementFoncierEntry[],
    onAddGroupementFoncierEntry: () => {},
    onUpdateGroupementFoncierEntry: () => {},
    onRemoveGroupementFoncierEntry: () => {},
    prevoyanceDecesEntries: [] as SuccessionPrevoyanceDecesEntry[],
    prevoyanceClauseOptions: [{ value: CLAUSE_CONJOINT_LABEL, label: 'Clause standard' }],
    onAddPrevoyanceDecesEntry: () => {},
    onUpdatePrevoyanceDecesEntry: () => {},
    onRemovePrevoyanceDecesEntry: () => {},
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

  it('keeps the forfait mobilier hidden until it is explicitly added', () => {
    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...buildBaseProps()} />);

    expect(markup).toContain('Configurer le forfait mobilier');
    expect(markup).not.toContain('Pourcentage (%)');
  });

  it('renders a structured select for prevoyance clauses and the new fiscal note', () => {
    const props = buildBaseProps();
    props.assetEntriesByCategory = [
      {
        value: 'divers',
        label: 'Biens divers',
        entries: [],
      },
    ];
    props.prevoyanceDecesEntries = [{
      id: 'prev-1',
      souscripteur: 'epoux1',
      assure: 'epoux1',
      capitalDeces: 250000,
      dernierePrime: 15000,
      clauseBeneficiaire: CLAUSE_CONJOINT_LABEL,
    }];

    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...props} />);

    expect(markup).toContain('Clause standard');
    expect(markup).toContain('Fiscalite appliquee');
    expect(markup).toContain('Conversion AV synthetique');
  });

  it('marks GFA totals as provisional when beneficiary-level adjustment applies', () => {
    const props = buildBaseProps();
    props.assetEntriesByCategory = [
      {
        value: 'immobilier',
        label: 'Biens immobiliers',
        entries: [],
      },
    ];
    props.hasBeneficiaryLevelGfAdjustment = true;
    props.groupementFoncierEntries = [{
      id: 'gf-1',
      owner: 'epoux1',
      type: 'GFA',
      valeurTotale: 1_000_000,
    }];

    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...props} />);

    expect(markup).toContain('base taxable definitive est recalculee par beneficiaire');
  });
});
