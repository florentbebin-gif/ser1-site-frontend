import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TresoInputsV6 } from '@/engine/tresorerie/types';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import { TresoKPISidebar } from '../components/TresoKPISidebar';

const KPIS: TresoKPIs = {
  ccaTotalConstitue: 100000,
  isTotalDecaisse: 1000,
  isLatentCapi: 5000,
  revenusNetsRetraite: 24000,
  dureeRemboursementCCA: 6,
  valeurNetteSocieteRetraite: 150000,
  reservesRetraite: 40000,
  capaciteDistribuableAn1: 12000,
  alerteDividendesAn1: false,
  deficitBancaireMax: 0,
  compteBancaireFinHorizon: 85000,
  ccaRestantFinHorizon: 30000,
  ccaRembourseTotal: 70000,
  alerteTresorerieBancaire: false,
  premiereAnneeDeficitBancaire: null,
  tresorerieTientHorizon: true,
  revenuCibleTientHorizon: true,
  premiereAnneeRevenuCibleNonTenu: null,
  performanceMoyenneTresorerie: 0.042,
  hasRows: true,
  anneeRetraiteIndex: 2,
};

const INPUTS: TresoInputsV6 = {
  version: 6,
  selectedAssociateId: 'associe-1',
  foyer: {
    selectedAssociateId: 'associe-1',
  },
  company: {
    creationType: 'existante',
    legalForm: 'sas',
    shareCapital: 10000,
    sharePremium: 0,
    reservesInitial: 0,
    treasuryInitial: 150000,
    annualStructureCosts: 3000,
    reducedCorporateTaxEligible: true,
    associates: [
      {
        id: 'associe-1',
        label: 'Associé 1',
        kind: 'pp',
        profile: {
          currentAge: 50,
          retirementAge: 62,
          annualIncomeNeed: 24000,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        cca: {
          currentBalance: 0,
          remunerationRate: 0,
        },
        revenuePhases: [],
      },
    ],
    loans: [],
    subsidiaries: [
      {
        id: 'filiale-1',
        label: 'Filiale',
        holdingOwnershipPct: 80,
        motherDaughterEligible: true,
        fiscalIntegrationEstimateEnabled: false,
        servicesSchedule: [],
        dividendsSchedule: [{ amount: 18000, startYear: 2026 }],
      },
    ],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    pockets: [
      {
        id: 'capitalisation-1',
        kind: 'capitalisation',
        durationYears: 8,
        annualReturnRate: 0.035,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 100,
        annualAllocationPct: 100,
        repeatAtTerm: false,
      },
    ],
  },
};

describe('TresoKPISidebar', () => {
  it('affiche quatre repères lisibles de la projection', () => {
    const html = renderToStaticMarkup(<TresoKPISidebar kpis={KPIS} inputs={INPUTS} />);

    expect(html).toContain('IS total décaissé');
    expect(html).toContain('Trésorerie sur horizon');
    expect(html).toContain('Revenu cible');
    expect(html).toContain('Performance moyenne');
    expect(html).toContain('Compte bancaire fin horizon');
    expect(html).toContain('Déficit bancaire maximal');
    expect(html).toContain('CCA restant dû');
    expect(html).toContain('premium-card sim-summary-card ts-kpi-sidebar');
    expect(html).toContain('ts-kpi-sidebar__header sim-card__header sim-card__header--bleed');
    expect(html).toContain('ts-kpi-sidebar__title-row sim-card__title-row');
    expect(html).toContain('sim-card__icon');
    expect(html).toContain('sim-metric sim-metric--secondary');
    expect(html).not.toContain('class="ts-kpi-card');
    expect(html).not.toContain('IS latent capitalisation');
  });

  it('indique si la trésorerie et la cible de revenu tiennent jusqu’à la fin', () => {
    const html = renderToStaticMarkup(<TresoKPISidebar kpis={KPIS} inputs={INPUTS} />);

    expect(html).toContain('Trésorerie sur horizon');
    expect(html).toContain('Revenu cible');
    expect(html).toContain('OK');
    expect(html).toContain('Trésorerie suffisante sur tout l’horizon');
    expect(html).toContain('Cible de revenu tenue sur tout l’horizon');
    expect(html).toContain('4,2 %');
  });

  it('signale la première rupture de trésorerie ou de revenu cible', () => {
    const html = renderToStaticMarkup(
      <TresoKPISidebar
        kpis={{
          ...KPIS,
          tresorerieTientHorizon: false,
          revenuCibleTientHorizon: false,
          premiereAnneeDeficitBancaire: 2029,
          premiereAnneeRevenuCibleNonTenu: 2032,
        }}
        inputs={INPUTS}
      />,
    );

    expect(html).toContain('Déficit en 2029');
    expect(html).toContain('Manqué dès 2032');
    expect(html).toContain('Trésorerie bancaire passe en négatif cette année-là');
    expect(html).toContain('Revenu cible non atteint');
  });

  it('affiche le CCA remboursé quand aucun CCA ne reste dû', () => {
    const html = renderToStaticMarkup(
      <TresoKPISidebar kpis={{ ...KPIS, ccaRestantFinHorizon: 0 }} inputs={INPUTS} />,
    );

    expect(html).toContain('CCA remboursé');
    expect(html).toContain('70');
  });

  it('affiche une alerte bancaire exploitable quand le solde minimum n’est pas respecté', () => {
    const html = renderToStaticMarkup(
      <TresoKPISidebar
        kpis={{
          ...KPIS,
          deficitBancaireMax: 15000,
          alerteTresorerieBancaire: true,
          premiereAnneeDeficitBancaire: 2028,
        }}
        inputs={INPUTS}
      />,
    );

    expect(html).toContain('Déficit bancaire maximal');
    expect(html).toContain('15');
    expect(html).toContain('2028');
  });
});
