import {
  buildArretCoverageBars,
  buildInvaliditeCoverageBars,
  computeDecesCapitalFromContract,
  computeRegimeDecesCapital,
  selectMaintienEmployeurPalier,
  type PrevoyanceCoverageBar,
} from '@/domain/prevoyance/helpers';
import type {
  PrevoyanceContractAggregationMode,
  PrevoyanceContractDraft,
  PrevoyanceContractKind,
  PrevoyanceDeathTargetDraft,
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
  PrevoyanceSituationDraft,
} from '@/domain/prevoyance/types';
import { TARGET_DECES_MULTIPLE } from '../constants';

export interface PrevoyanceExportSituation {
  kind: PrevoyanceContractKind;
  kindLabel: string;
  regimeLabel: string;
  familyStatus: PrevoyanceSituationDraft['familyStatus'];
  childrenCount: number;
  revenuImposable: number;
  salaireBrutAnnuel: number;
  salaireNetImposable: number;
  ancienneteYears: number;
  annualBase: number;
  referenceAnnual: number;
}

export interface PrevoyanceExportRegime {
  code: string;
  label: string;
  caisse: string;
}

export interface PrevoyanceExportContract {
  id: string;
  name: string;
  kind: PrevoyanceContractKind;
  indemnisationLabel: string;
  arretSummary: string;
  invaliditeSummary: string;
  decesCapital: number;
  decesSummary: string;
  fraisProAmount: number;
  fraisProSummary: string;
  cotisationAnnual: number;
  cotisationDontMadelin: number;
  cotisationSummary: string;
}

export interface PrevoyanceExportCoverage {
  arret: PrevoyanceCoverageBar[];
  invalidite: PrevoyanceCoverageBar[];
  decesTarget: number;
  decesRegimeCapital: number;
  decesPrivateCapital: number;
  decesCapital: number;
  fraisProEstimated: number;
  fraisProCovered: number;
}

export interface PrevoyanceExportData {
  situation: PrevoyanceExportSituation;
  regimeStack: PrevoyanceExportRegime[];
  contracts: PrevoyanceExportContract[];
  contractAggregationMode: PrevoyanceContractAggregationMode;
  coverage: PrevoyanceExportCoverage;
  assumptions: string[];
}

interface BuildPrevoyanceExportDataInput {
  situation: PrevoyanceSituationDraft;
  kind: PrevoyanceContractKind;
  regimeStack: PrevoyanceRegimeSettings[];
  maintien: PrevoyanceMaintienEmployeurSettings | null;
  contracts: PrevoyanceContractDraft[];
  contractAggregationMode: PrevoyanceContractAggregationMode;
  deathTarget: PrevoyanceDeathTargetDraft;
  annualBase: number;
  referenceAnnual: number;
  fraisGenerauxAssiette: number;
}

function formatArret(contract: PrevoyanceContractDraft): string {
  if (contract.kind === 'collectif') {
    const paliers = contract.arret.paliers?.length
      ? contract.arret.paliers
      : [{ fromDay: 0, toDay: null, salairePct: contract.arret.salairePct }];
    return paliers
      .map((palier) => `${palier.fromDay}-${palier.toDay ?? '+'} j : ${palier.salairePct}%`)
      .join(' ; ');
  }
  return contract.arret.paliers
    .map((palier) => `${palier.fromDay}-${palier.toDay} j : ${palier.amount} €/j`)
    .join(' ; ');
}

function formatInvalidite(contract: PrevoyanceContractDraft): string {
  return contract.invalidite.paliers
    .map((palier) => {
      const toRate = palier.toRate == null ? '+' : palier.toRate;
      if ('amount' in palier) {
        const amount =
          palier.mode === 'proportional_66'
            ? `taux/66 x ${palier.referenceAmount} €`
            : `${palier.amount} €`;
        return `${palier.fromRate}-${toRate}% : ${amount}`;
      }
      const amount =
        palier.mode === 'proportional_66'
          ? `taux/66 x ${palier.referencePct ?? palier.salairePct}%`
          : `${palier.salairePct}%`;
      return `${palier.fromRate}-${toRate}% : ${amount}`;
    })
    .join(' ; ');
}

function formatDeces(contract: PrevoyanceContractDraft, annualBase: number): string {
  const capital = computeDecesCapitalFromContract(contract, annualBase);
  if (contract.kind === 'collectif') {
    return `${contract.deces.salairePct}% du salaire brut, soit ${capital} €`;
  }
  return `Capital ${capital} €`;
}

function formatCotisation(contract: PrevoyanceContractDraft): string {
  if (contract.kind === 'collectif') {
    return `${contract.cotisation.tauxPctSalaire}% du salaire, employeur ${contract.cotisation.repartition.employeur}% / salarié ${contract.cotisation.repartition.salarie}%`;
  }
  return `${contract.cotisation.montantAnnuel} € / an, dont ${contract.cotisation.dontMadelin} € Madelin`;
}

function formatFraisPro(contract: PrevoyanceContractDraft): { amount: number; summary: string } {
  if (contract.kind === 'collectif') return { amount: 0, summary: 'Non applicable salarié' };
  const amount = Math.max(0, contract.fraisPro.amount);
  if (amount === 0) return { amount: 0, summary: 'Non couvert' };
  return {
    amount,
    summary: `${amount} €, franchise ${contract.fraisPro.franchiseDays} j, durée ${contract.fraisPro.maxDurationYears} an(s)`,
  };
}

export function buildPrevoyanceExportData({
  situation,
  kind,
  regimeStack,
  maintien,
  contracts,
  contractAggregationMode,
  deathTarget,
  annualBase,
  referenceAnnual,
  fraisGenerauxAssiette,
}: BuildPrevoyanceExportDataInput): PrevoyanceExportData {
  const maintienPalier =
    kind === 'collectif'
      ? selectMaintienEmployeurPalier(situation.ancienneteYears, maintien)
      : null;
  const coverageContracts =
    contractAggregationMode === 'compare' ? contracts.slice(0, 1) : contracts;
  const regimeDecesCapital = computeRegimeDecesCapital(
    regimeStack,
    referenceAnnual,
    situation.salaireBrutAnnuel,
  );
  const privateDecesCapital = coverageContracts.reduce(
    (sum, contract) => sum + computeDecesCapitalFromContract(contract, annualBase),
    0,
  );
  const decesTarget =
    deathTarget.mode === 'manual' && deathTarget.manualAmount > 0
      ? deathTarget.manualAmount
      : referenceAnnual * TARGET_DECES_MULTIPLE;
  const fraisProCovered = contracts.reduce((sum, contract) => {
    const frais = formatFraisPro(contract);
    return sum + frais.amount;
  }, 0);

  return {
    situation: {
      kind,
      kindLabel: kind === 'collectif' ? 'Salarié collectif' : 'TNS / libéral',
      regimeLabel:
        regimeStack.map((regime) => regime.label).join(' + ') || 'Régime non sélectionné',
      familyStatus: situation.familyStatus,
      childrenCount: situation.childrenCount,
      revenuImposable: situation.revenuImposable,
      salaireBrutAnnuel: situation.salaireBrutAnnuel,
      salaireNetImposable: situation.salaireNetImposable,
      ancienneteYears: situation.ancienneteYears,
      annualBase,
      referenceAnnual,
    },
    regimeStack: regimeStack.map((regime) => ({
      code: regime.code,
      label: regime.label,
      caisse: regime.caisse,
    })),
    contractAggregationMode,
    contracts: contracts.map((contract) => {
      const frais = formatFraisPro(contract);
      return {
        id: contract.id,
        name: contract.name,
        kind: contract.kind,
        indemnisationLabel:
          contract.kind === 'individuel'
            ? `Arrêt ${contract.indemnisation} · Invalidité ${contract.invalidite.indemnisation}`
            : 'contrat collectif',
        arretSummary: formatArret(contract),
        invaliditeSummary: formatInvalidite(contract),
        decesCapital: computeDecesCapitalFromContract(contract, annualBase),
        decesSummary: formatDeces(contract, annualBase),
        fraisProAmount: frais.amount,
        fraisProSummary: frais.summary,
        cotisationAnnual:
          contract.kind === 'individuel'
            ? contract.cotisation.montantAnnuel
            : Math.round(annualBase * (contract.cotisation.tauxPctSalaire / 100)),
        cotisationDontMadelin: contract.kind === 'individuel' ? contract.cotisation.dontMadelin : 0,
        cotisationSummary: formatCotisation(contract),
      };
    }),
    coverage: {
      arret: buildArretCoverageBars({
        regimeStack,
        contracts: coverageContracts,
        kind,
        contractAggregationMode,
        maintienPalier,
        referenceAnnual,
        salaireBrutAnnuel: situation.salaireBrutAnnuel,
      }),
      invalidite: buildInvaliditeCoverageBars({
        regimeStack,
        contracts: coverageContracts,
        kind,
        contractAggregationMode,
        referenceAnnual,
        salaireBrutAnnuel: situation.salaireBrutAnnuel,
      }),
      decesTarget,
      decesRegimeCapital: regimeDecesCapital,
      decesPrivateCapital: privateDecesCapital,
      decesCapital: regimeDecesCapital + privateDecesCapital,
      fraisProEstimated: kind === 'individuel' ? fraisGenerauxAssiette : 0,
      fraisProCovered,
    },
    assumptions: [
      'Simulation indicative sans moteur actuariel ni tarification assureur.',
      'Les régimes obligatoires proviennent des paramètres Prévoyance et doivent être relus avec leurs sources métier.',
      'Les couvertures arrêt et invalidité sont exprimées en pourcentage du revenu cible affiché dans le simulateur.',
    ],
  };
}
