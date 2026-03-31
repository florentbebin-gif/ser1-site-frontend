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

const pocketOptions = [
  { value: 'epoux1', label: 'Epoux 1' },
  { value: 'epoux2', label: 'Epoux 2' },
  { value: 'communaute', label: 'Communaute' },
] as const;

function buildBaseProps() {
  return {
    isExpert: true,
    isMarried: true,
    isPacsed: false,
    isConcubinage: false,
    isCommunauteUniverselleRegime: false,
    isCommunauteMeublesAcquetsRegime: false,
    assetEntriesByCategory: [] as Array<{
      value: 'immobilier' | 'financier' | 'divers';
      label: string;
      entries: SuccessionAssetDetailEntry[];
    }>,
    assetOwnerOptions: [...ownerOptions],
    assetPocketOptions: [...pocketOptions],
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
    onOpenAssuranceVieModal: (_id: string) => {},
    onRemoveAssuranceVieEntry: () => {},
    onOpenPerModal: (_id: string) => {},
    onRemovePerEntry: () => {},
    onSetSimplifiedBalanceField: () => {},
    forfaitMobilierMode: 'off' as const,
    forfaitMobilierPct: 5,
    forfaitMobilierMontant: 0,
    abattementResidencePrincipale: false,
    stipulationContraireCU: false,
    onUpdatePatrimonialField: () => {},
    groupementFoncierEntries: [] as SuccessionGroupementFoncierEntry[],
    onUpdateGroupementFoncierEntry: () => {},
    onRemoveGroupementFoncierEntry: () => {},
    prevoyanceDecesEntries: [] as SuccessionPrevoyanceDecesEntry[],
    onOpenPrevoyanceModal: (_id: string) => {},
    onRemovePrevoyanceDecesEntry: () => {},
  };
}

describe('ScAssetsPassifsCard', () => {
  it('removes the main residence option from other immobilier rows once one exists', () => {
    const currentResidence: SuccessionAssetDetailEntry = {
      id: 'asset-rp',
      pocket: 'epoux1',
      category: 'immobilier',
      subCategory: RESIDENCE_PRINCIPALE_SUBCATEGORY,
      amount: 250000,
      label: 'Maison',
    };
    const secondaryResidence: SuccessionAssetDetailEntry = {
      id: 'asset-rs',
      pocket: 'communaute',
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
            pocket: 'epoux1',
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

  it('uses Masse de rattachement instead of Porteur for detailed patrimonial rows', () => {
    const props = buildBaseProps();
    props.assetEntriesByCategory = [
      {
        value: 'immobilier',
        label: 'Biens immobiliers',
        entries: [
          {
            id: 'asset-1',
            pocket: 'epoux1',
            category: 'immobilier',
            subCategory: 'Residence secondaire',
            amount: 250000,
          },
        ],
      },
    ];

    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...props} />);

    expect(markup).toContain('Masse de rattachement');
    expect(markup).not.toContain('Porteur');
  });

  it('renders legal qualification pencil button for detailed assets', () => {
    const props = buildBaseProps();
    props.assetEntriesByCategory = [
      {
        value: 'financier',
        label: 'Biens financiers et autres biens',
        entries: [
          {
            id: 'asset-1',
            pocket: 'epoux1',
            category: 'financier',
            subCategory: 'Titres',
            amount: 125000,
          },
        ],
      },
    ];

    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...props} />);

    expect(markup).toContain('Modifier la qualification juridique');
  });

  it('renders only the add icon for the financier section (no dedicated AV/PER buttons)', () => {
    const props = buildBaseProps();
    props.assetEntriesByCategory = [
      {
        value: 'financier',
        label: 'Biens financiers et autres biens',
        entries: [],
      },
    ];

    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...props} />);

    expect(markup).not.toContain('+ Assurance vie');
    expect(markup).not.toContain('+ PER assurance');
    expect(markup).toContain('title="Ajouter une ligne"');
  });

  it('keeps the forfait mobilier hidden until it is explicitly added', () => {
    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...buildBaseProps()} />);

    expect(markup).toContain('Configurer le forfait mobilier');
    expect(markup).not.toContain('Pourcentage (%)');
  });

  it('renders prevoyance rows with Modifier button and capital display', () => {
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

    expect(markup).toContain('Prévoyance décès');
    expect(markup).toContain('Modifier');
    expect(markup).toContain('250');
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
      pocket: 'epoux1',
      type: 'GFA',
      valeurTotale: 1_000_000,
    }];

    const markup = renderToStaticMarkup(<ScAssetsPassifsCard {...props} />);

    expect(markup).toContain('base taxable définitive est recalculée par bénéficiaire');
    expect(markup).toContain('masse civile nette');
  });
});
