import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  SuccessionFamilyOverview,
  SuccessionPageContent,
  SuccessionPageSidebar,
} from '../components/SuccessionPageSections';

function buildProps(
  shouldRenderSuccessionComputationSections: boolean,
): ComponentProps<typeof SuccessionPageContent> {
  return {
    derived: {
      shouldRenderSuccessionComputationSections,
      birthDateLabels: { primary: 'Date Naiss. Defunt(e)' },
      showSecondBirthDate: false,
      canOpenDispositionsModal: false,
      enfantRattachementOptions: [{ value: 'epoux1', label: 'Defunt(e)' }],
      isMarried: false,
      isPacsed: false,
      isConcubinage: false,
      assetEntriesByCategory: [],
      assetOwnerOptions: [{ value: 'epoux1', label: 'Defunt(e)' }],
      assetPocketOptions: [{ value: 'epoux1', label: 'Defunt(e)' }],
      assetBreakdown: {
        actifs: { epoux1: 0, epoux2: 0, commun: 0 },
        passifs: { epoux1: 0, epoux2: 0, commun: 0 },
      },
      assetNetTotals: { epoux1: 0, epoux2: 0, commun: 0 },
      forfaitMobilierComputed: 0,
      residencePrincipaleEntryId: null,
      hasBeneficiaryLevelGfAdjustment: false,
      assuranceViePartyOptions: [],
      prevoyanceClauseOptions: [],
      donationTotals: { rapportable: 0, horsPart: 0, legsParticuliers: 0 },
      donateurOptions: [],
      donatairesOptions: [],
      displayUsesChainage: false,
      derivedTotalDroits: 0,
      synthDonutTransmis: 0,
      derivedMasseTransmise: 0,
      unifiedBlocks: [],
      synthHypothese: null,
      chainageAnalysis: {
        order: 'epoux1',
        firstDecedeLabel: 'Epoux 1',
        secondDecedeLabel: 'Epoux 2',
        societeAcquets: null,
        step1: null,
        step2: null,
      },
      avFiscalAnalysis: {
        byAssure: { epoux1: { totalDroits: 0, lines: [] }, epoux2: { totalDroits: 0, lines: [] } },
      },
      perFiscalAnalysis: {
        byAssure: { epoux1: { totalDroits: 0, lines: [] }, epoux2: { totalDroits: 0, lines: [] } },
      },
      prevoyanceFiscalAnalysis: {
        byAssure: { epoux1: { totalDroits: 0, lines: [] }, epoux2: { totalDroits: 0, lines: [] } },
      },
      directDisplayAnalysis: {
        simulatedDeceased: 'epoux1',
        result: null,
      },
      assuranceVieByAssure: { epoux1: 0, epoux2: 0 },
      perByAssure: { epoux1: 0, epoux2: 0 },
      prevoyanceByAssure: { epoux1: 0, epoux2: 0 },
    } as unknown as ComponentProps<typeof SuccessionPageContent>['derived'],
    isExpert: true,
    civilContext: {
      situationMatrimoniale: 'celibataire',
      regimeMatrimonial: null,
      pacsConvention: 'separation',
      dateNaissanceEpoux1: '1970-01-01',
    },
    enfantsContext: [],
    familyMembers: [],
    assuranceVieEntries: [],
    perEntries: [],
    donationsContext: [],
    chainOrder: 'epoux1',
    onToggleChainOrder: () => {},
    onSituationChange: () => {},
    setCivilContext: (() => undefined) as never,
    onOpenDispositions: () => {},
    onAddEnfant: () => {},
    onToggleAddMemberPanel: () => {},
    onUpdateEnfantRattachement: () => {},
    onToggleEnfantDeceased: () => {},
    onRemoveEnfant: () => {},
    onRemoveFamilyMember: () => {},
    onAddAssetEntry: () => {},
    onUpdateAssetEntry: () => {},
    onRemoveAssetEntry: () => {},
    onOpenAssuranceVieModal: (_id: string) => {},
    onRemoveAssuranceVieEntry: () => {},
    onOpenPerModal: (_id: string) => {},
    onRemovePerEntry: () => {},
    onOpenPrevoyanceModal: (_id: string) => {},
    onRemovePrevoyanceDecesEntry: () => {},
    groupementFoncierEntries: [],
    onUpdateGroupementFoncierEntry: () => {},
    onRemoveGroupementFoncierEntry: () => {},
    prevoyanceDecesEntries: [],
    onSetSimplifiedBalanceField: () => {},
    onAddDonationEntry: () => {},
    onUpdateDonationEntry: () => {},
    onRemoveDonationEntry: () => {},
    forfaitMobilierMode: 'off',
    forfaitMobilierPct: 5,
    forfaitMobilierMontant: 0,
    abattementResidencePrincipale: false,
    decesDansXAns: 0,
    onUpdatePatrimonialField: () => {},
  };
}

describe('SuccessionPageSections', () => {
  it('masks computation sections when the scenario is not calculable', () => {
    const props = buildProps(false);
    const markup = renderToStaticMarkup(
      <>
        <SuccessionFamilyOverview {...props} />
        <SuccessionPageContent {...props} />
        <SuccessionPageSidebar {...props} />
      </>,
    );

    expect(markup).toContain('Contexte familial');
    expect(markup).not.toContain('Actifs / Passifs');
    expect(markup).not.toContain('Donations');
    expect(markup).not.toContain('Synthèse successorale');
    expect(markup).not.toContain('Chronologie des deces');
    expect(markup).not.toContain('sim-grid__col');
  });

  it('renders computation sections when the scenario is calculable', () => {
    const props = buildProps(true);
    const markup = renderToStaticMarkup(
      <>
        <SuccessionFamilyOverview {...props} />
        <SuccessionPageContent {...props} />
        <SuccessionPageSidebar {...props} />
      </>,
    );

    expect(markup).toContain('Contexte familial');
    expect(markup).toContain('Actifs / Passifs');
    expect(markup).toContain('Donations');
    expect(markup).toContain('Synthèse successorale');
    expect(markup).toContain('Chronologie des deces');
    expect(markup).not.toContain('sim-grid__col');
  });
});
