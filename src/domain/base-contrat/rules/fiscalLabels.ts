import {
  DEFAULT_BASE_CONTRAT_RULE_LABEL_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '../../../constants/settingsDefaults';
import type { BaseContratFiscalLabels } from './types';

interface BaseContratFiscalLabelSettings {
  pfuRateIR?: number;
  psRateGeneral?: number;
  psRateException?: number;
  dmtgAbattementEnfant?: number;
  _raw_tax?: typeof DEFAULT_TAX_SETTINGS;
  _raw_ps?: typeof DEFAULT_PS_SETTINGS;
  _raw_fiscality?: typeof DEFAULT_FISCALITY_SETTINGS;
}

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

function formatPercent(value: number): string {
  return `${numberFormatter.format(value)} %`;
}

function formatEuro(value: number): string {
  return `${euroFormatter.format(value)} €`;
}

function formatTaxableFractionsByAge(
  brackets: readonly { label: string; fraction: number }[],
): string {
  return brackets
    .map(({ label, fraction }) => `${label} : ${formatPercent(fraction * 100)} imposable`)
    .join('. ');
}

export function buildBaseContratFiscalLabels(
  settings: BaseContratFiscalLabelSettings = {},
): BaseContratFiscalLabels {
  const tax = settings._raw_tax ?? DEFAULT_TAX_SETTINGS;
  const ps = settings._raw_ps ?? DEFAULT_PS_SETTINGS;
  const fiscality = settings._raw_fiscality ?? DEFAULT_FISCALITY_SETTINGS;

  const pfuRateIR = settings.pfuRateIR ?? tax.pfu.current.rateIR;
  const psRateGeneral = settings.psRateGeneral ?? ps.patrimony.current.generalRate;
  const psRateException = settings.psRateException ?? ps.patrimony.current.exceptionRate;
  const pfuRateTotal = pfuRateIR + psRateGeneral;

  const avRetraitsDepuis2017 = fiscality.assuranceVie.retraitsCapital.depuis2017;
  const avPlus8Ans = avRetraitsDepuis2017.plus8Ans;
  const avPsRate = fiscality.assuranceVie.retraitsCapital.psRatePercent ?? psRateException;
  const avDeces = fiscality.assuranceVie.deces;
  const av990IBrackets = avDeces.primesApres1998.brackets.length >= 2
    ? avDeces.primesApres1998.brackets
    : DEFAULT_FISCALITY_SETTINGS.assuranceVie.deces.primesApres1998.brackets;
  const av990ITranche1 = av990IBrackets[0];
  const av990ITranche2 = av990IBrackets[1];
  const av990IAllowance = avDeces.primesApres1998.allowancePerBeneficiary;
  const av990ITranche1DisplayThreshold =
    av990ITranche1?.upTo == null ? null : av990IAllowance + av990ITranche1.upTo;
  const ruleLabels = DEFAULT_BASE_CONTRAT_RULE_LABEL_SETTINGS;
  const av990IRates = av990ITranche1 && av990ITranche2
    ? `${formatPercent(av990ITranche1.ratePercent)} jusqu'à ${
      av990ITranche1DisplayThreshold ? formatEuro(av990ITranche1DisplayThreshold) : 'la première tranche'
    }, puis ${formatPercent(av990ITranche2.ratePercent)} au-delà`
    : 'barème 990 I à confirmer depuis les paramètres fiscaux';

  return {
    pfu: `PFU ${formatPercent(pfuRateTotal)} (${formatPercent(pfuRateIR)} IR + ${formatPercent(psRateGeneral)} prélèvements sociaux)`,
    pfuIr: `${formatPercent(pfuRateIR)} IR`,
    psGeneral: `${formatPercent(psRateGeneral)} prélèvements sociaux`,
    psException: `${formatPercent(psRateException)} prélèvements sociaux`,
    dmtgLigneDirecteAbattement: `${formatEuro(
      settings.dmtgAbattementEnfant ?? tax.dmtg.ligneDirecte.abattement,
    )} par enfant`,
    assuranceVie990IAllowance: `${formatEuro(av990IAllowance)} par bénéficiaire`,
    assuranceVie757BAllowance: `${formatEuro(avDeces.apres70ans.globalAllowance)} partagé entre tous les bénéficiaires`,
    assuranceVie990IRates: av990IRates,
    assuranceVieRachatMoins8Ans: `Avant 8 ans : PFU ${formatPercent(pfuRateTotal)} (${formatPercent(
      pfuRateIR,
    )} IR + ${formatPercent(avPsRate)} prélèvements sociaux), ou option barème IR.`,
    assuranceVieRachatPlus8Ans: `Après 8 ans : abattement annuel ${formatEuro(
      avPlus8Ans.abattementAnnuel.single,
    )} (personne seule) / ${formatEuro(
      avPlus8Ans.abattementAnnuel.couple,
    )} (couple). Taux IR ${formatPercent(
      avPlus8Ans.irRateUnderThresholdPercent,
    )} si total primes < ${formatEuro(avPlus8Ans.primesNettesSeuil)}, sinon ${formatPercent(pfuRateIR)}.`,
    assuranceVieRetraitsPs: `Prélèvements sociaux : ${formatPercent(avPsRate)} dans tous les cas (après abattement).`,
    capitalGainIr: `IR ${formatPercent(ruleLabels.capitalGains.irRatePercent)}`,
    malrauxReductionRates: `${formatPercent(
      ruleLabels.malraux.psmvRatePercent,
    )} (SPR avec PSMV) ou ${formatPercent(ruleLabels.malraux.pvapRatePercent)} (SPR avec PVAP)`,
    microFoncierAbattement: `Micro-foncier (si loyers bruts ≤ ${formatEuro(
      ruleLabels.microFoncier.grossRentCeiling,
    )} / an) : abattement forfaitaire de ${formatPercent(ruleLabels.microFoncier.abatementRatePercent)}.`,
    rvtoTaxableFractions: `${formatTaxableFractionsByAge(ruleLabels.rvtoTaxableFractionByAgeAtFirstPayment)}.`,
    peaVersementCeilings: `Plafond de versements : ${formatEuro(
      ruleLabels.pea.ceiling,
    )} (cumulable avec le PEA-PME dans la limite de ${formatEuro(ruleLabels.pea.globalCeiling)} au total, art. L221-30 CMF)`,
    peaPmeVersementCeilings: `Plafond de versements : ${formatEuro(
      ruleLabels.pea.peaPmeCeiling,
    )} (cumulable avec le PEA ${formatEuro(ruleLabels.pea.ceiling)} — plafond global ${formatEuro(
      ruleLabels.pea.globalCeiling,
    )}, art. L221-32-1 CMF)`,
    preciousMetalsFlatTax: `taxe de ${formatPercent(
      ruleLabels.preciousMetals.flatTaxRatePercent,
    )} sur le prix de cession (+ ${formatPercent(ruleLabels.preciousMetals.crdsRatePercent)} CRDS)`,
    soficaReductionRates: `${formatPercent(
      ruleLabels.sofica.minReductionRatePercent,
    )} à ${formatPercent(ruleLabels.sofica.maxReductionRatePercent)} selon les investissements réalisés`,
    ifiResidencePrincipaleAbattement: `${formatPercent(
      tax.ifi.current.residencePrincipaleAbattementRate,
    )} sur la valeur de la résidence principale`,
  };
}

export const DEFAULT_RULE_RENDER_CONTEXT = {
  fiscalLabels: buildBaseContratFiscalLabels(),
};
