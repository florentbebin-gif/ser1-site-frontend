import {
  DEFAULT_ASSURANCE_VIE_RULES,
  DEFAULT_BASE_CONTRAT_RULE_LABEL_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '../../../constants/settingsDefaults';
import type { FiscalitySettingsV2 } from '../../../utils/cache/fiscalitySettings';
import type { BaseContratFiscalLabels } from './types';

interface BaseContratFiscalLabelSettings {
  pfuRateIR?: number;
  psRateGeneral?: number;
  psRateException?: number;
  dmtgAbattementEnfant?: number;
  _raw_tax?: typeof DEFAULT_TAX_SETTINGS;
  _raw_ps?: typeof DEFAULT_PS_SETTINGS;
  _raw_fiscality?: FiscalitySettingsV2;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getAssuranceVieRules(fiscality: FiscalitySettingsV2): typeof DEFAULT_ASSURANCE_VIE_RULES {
  const rules = fiscality.rulesetsByKey.assuranceVie?.rules;
  return isRecord(rules)
    ? (rules as typeof DEFAULT_ASSURANCE_VIE_RULES)
    : DEFAULT_ASSURANCE_VIE_RULES;
}

function resolveFiscalRefs(
  obj: unknown,
  taxSettings: Record<string, unknown> | null,
  psSettings: Record<string, unknown> | null,
): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' && obj.startsWith('$ref:')) {
    const withoutPrefix = obj.slice(5);
    const dotIndex = withoutPrefix.indexOf('.');
    if (dotIndex === -1) return undefined;
    const table = withoutPrefix.slice(0, dotIndex);
    const source =
      table === 'tax_settings' ? taxSettings : table === 'ps_settings' ? psSettings : null;
    return source ? getByPath(source, withoutPrefix.slice(dotIndex + 1)) : undefined;
  }
  if (Array.isArray(obj))
    return obj.map((item) => resolveFiscalRefs(item, taxSettings, psSettings));
  if (!isRecord(obj)) return obj;

  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    resolved[key] = resolveFiscalRefs(value, taxSettings, psSettings);
  }
  return resolved;
}

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (!isRecord(current)) return undefined;
    current = current[part];
  }
  return current;
}

export function buildBaseContratFiscalLabels(
  settings: BaseContratFiscalLabelSettings = {},
): BaseContratFiscalLabels {
  const tax = settings._raw_tax ?? DEFAULT_TAX_SETTINGS;
  const ps = settings._raw_ps ?? DEFAULT_PS_SETTINGS;
  const fiscality = settings._raw_fiscality ?? DEFAULT_FISCALITY_SETTINGS;

  const pfuRateIR =
    settings.pfuRateIR ?? tax.pfu?.current?.rateIR ?? DEFAULT_TAX_SETTINGS.pfu.current.rateIR;
  const psRateGeneral =
    settings.psRateGeneral ??
    ps.patrimony?.current?.generalRate ??
    DEFAULT_PS_SETTINGS.patrimony.current.generalRate;
  const psRateException =
    settings.psRateException ??
    ps.patrimony?.current?.exceptionRate ??
    DEFAULT_PS_SETTINGS.patrimony.current.exceptionRate;
  const pfuRateTotal = pfuRateIR + psRateGeneral;

  const defaultAssuranceVie = DEFAULT_ASSURANCE_VIE_RULES;
  const assuranceVie = resolveFiscalRefs(
    getAssuranceVieRules(fiscality),
    tax,
    ps,
  ) as typeof DEFAULT_ASSURANCE_VIE_RULES;
  const avRetraitsCapital = assuranceVie.retraitsCapital ?? defaultAssuranceVie.retraitsCapital;
  const avRetraitsDepuis2017 =
    avRetraitsCapital.depuis2017 ?? defaultAssuranceVie.retraitsCapital.depuis2017;
  const avPlus8AnsDefaults = defaultAssuranceVie.retraitsCapital.depuis2017.plus8Ans;
  const avPlus8Ans = avRetraitsDepuis2017.plus8Ans ?? avPlus8AnsDefaults;
  const avPlus8AnsAbattementAnnuel =
    avPlus8Ans.abattementAnnuel ?? avPlus8AnsDefaults.abattementAnnuel;
  const avPsRate = avRetraitsCapital.psRatePercent ?? psRateException;
  const avDeces = assuranceVie.deces ?? defaultAssuranceVie.deces;
  const avPrimesApres1998 = avDeces.primesApres1998 ?? defaultAssuranceVie.deces.primesApres1998;
  const av990IBrackets =
    (avPrimesApres1998.brackets?.length ?? 0) >= 2
      ? avPrimesApres1998.brackets
      : DEFAULT_ASSURANCE_VIE_RULES.deces.primesApres1998.brackets;
  const av990ITranche1 = av990IBrackets[0];
  const av990ITranche2 = av990IBrackets[1];
  const av990IAllowance =
    avPrimesApres1998.allowancePerBeneficiary ??
    defaultAssuranceVie.deces.primesApres1998.allowancePerBeneficiary;
  const avApres70Ans = avDeces.apres70ans ?? defaultAssuranceVie.deces.apres70ans;
  const av990ITranche1DisplayThreshold =
    av990ITranche1?.upTo == null ? null : av990IAllowance + av990ITranche1.upTo;
  const ruleLabels = DEFAULT_BASE_CONTRAT_RULE_LABEL_SETTINGS;
  const av990IRates =
    av990ITranche1 && av990ITranche2
      ? `${formatPercent(av990ITranche1.ratePercent)} jusqu'à ${
          av990ITranche1DisplayThreshold
            ? formatEuro(av990ITranche1DisplayThreshold)
            : 'la première tranche'
        }, puis ${formatPercent(av990ITranche2.ratePercent)} au-delà`
      : 'barème 990 I à confirmer depuis les paramètres fiscaux';

  return {
    pfu: `PFU ${formatPercent(pfuRateTotal)} (${formatPercent(pfuRateIR)} IR + ${formatPercent(psRateGeneral)} prélèvements sociaux)`,
    pfuIr: `${formatPercent(pfuRateIR)} IR`,
    psGeneral: `${formatPercent(psRateGeneral)} prélèvements sociaux`,
    psException: `${formatPercent(psRateException)} prélèvements sociaux`,
    dmtgLigneDirecteAbattement: `${formatEuro(
      settings.dmtgAbattementEnfant ??
        tax.dmtg?.ligneDirecte?.abattement ??
        DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.abattement,
    )} par enfant`,
    assuranceVie990IAllowance: `${formatEuro(av990IAllowance)} par bénéficiaire`,
    assuranceVie757BAllowance: `${formatEuro(
      avApres70Ans.globalAllowance ?? defaultAssuranceVie.deces.apres70ans.globalAllowance,
    )} partagé entre tous les bénéficiaires`,
    assuranceVie990IRates: av990IRates,
    assuranceVieRachatMoins8Ans: `Avant 8 ans : PFU ${formatPercent(pfuRateTotal)} (${formatPercent(
      pfuRateIR,
    )} IR + ${formatPercent(avPsRate)} prélèvements sociaux), ou option barème IR.`,
    assuranceVieRachatPlus8Ans: `Après 8 ans : abattement annuel ${formatEuro(
      avPlus8AnsAbattementAnnuel.single,
    )} (personne seule) / ${formatEuro(
      avPlus8AnsAbattementAnnuel.couple,
    )} (couple). Taux IR ${formatPercent(
      avPlus8Ans.irRateUnderThresholdPercent ?? avPlus8AnsDefaults.irRateUnderThresholdPercent,
    )} si total primes < ${formatEuro(
      avPlus8Ans.primesNettesSeuil ?? avPlus8AnsDefaults.primesNettesSeuil,
    )}, sinon ${formatPercent(pfuRateIR)}.`,
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
      tax.ifi?.current?.residencePrincipaleAbattementRate ??
        DEFAULT_TAX_SETTINGS.ifi.current.residencePrincipaleAbattementRate,
    )} sur la valeur de la résidence principale`,
  };
}

export const DEFAULT_RULE_RENDER_CONTEXT = {
  fiscalLabels: buildBaseContratFiscalLabels(),
};
