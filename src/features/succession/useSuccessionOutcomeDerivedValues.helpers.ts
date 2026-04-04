import type { RegimeMatrimonial } from '../../engine/civil';
import { DONATION_ENTRE_EPOUX_OPTIONS } from './successionSimulator.constants';
import { getUsufruitValuationFromBirthDate } from './successionUsufruit';

export type InsuranceSourceKind = 'av' | 'per' | 'prevoyance';

export interface InsuranceBeneficiaryLine {
  id: string;
  label: string;
  capitalTransmis: number;
  baseFiscale: number;
  sourceKind: InsuranceSourceKind;
  totalDroits: number;
  netTransmis: number;
}

type FiscalLine = {
  id: string;
  label: string;
  capitauxAvant70: number;
  capitauxApres70: number;
  baseFiscale990I?: number;
  baseFiscale757B?: number;
  droits990I: number;
  droits757B: number;
  capitalTransmis?: number;
  sourceKind?: InsuranceSourceKind;
};

function aggregateByBeneficiary(lines: Array<{ id: string; label: string; capitalTransmis: number; baseFiscale: number; sourceKind: InsuranceSourceKind; totalDroits: number }>): InsuranceBeneficiaryLine[] {
  const map = new Map<string, InsuranceBeneficiaryLine>();
  for (const line of lines) {
    const current = map.get(line.id) ?? { id: line.id, label: line.label, capitalTransmis: 0, baseFiscale: 0, sourceKind: line.sourceKind, totalDroits: 0, netTransmis: 0 };
    current.capitalTransmis += line.capitalTransmis;
    current.baseFiscale += line.baseFiscale;
    current.totalDroits += line.totalDroits;
    current.netTransmis = Math.max(0, current.capitalTransmis - current.totalDroits);
    if (line.sourceKind === 'prevoyance') current.sourceKind = 'prevoyance';
    map.set(line.id, current);
  }
  return Array.from(map.values())
    .filter((l) => l.capitalTransmis > 0 || l.totalDroits > 0)
    .sort((a, b) => b.capitalTransmis - a.capitalTransmis || b.netTransmis - a.netTransmis);
}

export function mergeInsuranceBeneficiaryLines(
  avLines: FiscalLine[],
  perLines: FiscalLine[],
  prevoyanceLines: FiscalLine[],
): { lines990I: InsuranceBeneficiaryLine[]; lines757B: InsuranceBeneficiaryLine[] } {
  const taggedAv = avLines.map((l) => ({ ...l, sourceKind: 'av' as const }));
  const taggedPer = perLines.map((l) => ({ ...l, sourceKind: 'per' as const }));
  const taggedPrev = prevoyanceLines.map((l) => ({ ...l, sourceKind: 'prevoyance' as const }));
  const allLines = [...taggedAv, ...taggedPer, ...taggedPrev];

  const input990I = allLines.map((line) => ({
    id: line.id,
    label: line.label,
    // Prévoyance (capitalTransmis défini) : capital nominal si régime 990I (capitauxAvant70 > 0), sinon 0
    // AV/PER (capitalTransmis non défini) : juste la tranche avant 70
    capitalTransmis: line.capitalTransmis != null
      ? (line.capitauxAvant70 > 0 ? line.capitalTransmis : 0)
      : line.capitauxAvant70,
    baseFiscale: line.baseFiscale990I ?? line.capitauxAvant70,
    sourceKind: line.sourceKind,
    totalDroits: line.droits990I,
  }));

  const input757B = allLines.map((line) => ({
    id: line.id,
    label: line.label,
    // Prévoyance (capitalTransmis défini) : capital nominal si régime 757B (capitauxApres70 > 0), sinon 0
    // AV/PER (capitalTransmis non défini) : juste la tranche après 70 (0 pour un contrat purement avant 70)
    capitalTransmis: line.capitalTransmis != null
      ? (line.capitauxApres70 > 0 ? line.capitalTransmis : 0)
      : line.capitauxApres70,
    baseFiscale: line.baseFiscale757B ?? line.capitauxApres70,
    sourceKind: line.sourceKind,
    totalDroits: line.droits757B,
  }));

  return {
    lines990I: aggregateByBeneficiary(input990I),
    lines757B: aggregateByBeneficiary(input757B),
  };
}

export interface UnifiedBeneficiaryBlock {
  id: string;
  label: string;
  exonerated?: boolean;
  isConjoint: boolean;
  brut: number;
  step1Brut?: number;
  step2Brut?: number;
  capitauxDecesNets: number;
  step1CapitauxDecesNets?: number;
  step2CapitauxDecesNets?: number;
  droits: number;
  step1Droits?: number;
  step2Droits?: number;
  transmissionNette: number;
  step1TransmissionNette?: number;
  step2TransmissionNette?: number;
}

interface BuildUnifiedBeneficiaryBlocksInput {
  transmissionRows: Array<{
    id: string;
    label: string;
    brut: number;
    droits: number;
    exonerated?: boolean;
    step1Brut?: number;
    step1Droits?: number;
    step2Brut?: number;
    step2Droits?: number;
  }>;
  insurance990IStep1: InsuranceBeneficiaryLine[];
  insurance757BStep1: InsuranceBeneficiaryLine[];
  insurance990IStep2: InsuranceBeneficiaryLine[];
  insurance757BStep2: InsuranceBeneficiaryLine[];
  displayUsesChainage: boolean;
}

export function buildUnifiedBeneficiaryBlocks({
  transmissionRows,
  insurance990IStep1,
  insurance757BStep1,
  insurance990IStep2,
  insurance757BStep2,
  displayUsesChainage,
}: BuildUnifiedBeneficiaryBlocksInput): UnifiedBeneficiaryBlock[] {
  const ids = new Map<string, { label: string; exonerated?: boolean }>();
  for (const row of transmissionRows) {
    ids.set(row.id, { label: row.label, exonerated: row.exonerated });
  }
  for (const line of [...insurance990IStep1, ...insurance757BStep1, ...insurance990IStep2, ...insurance757BStep2]) {
    if (!ids.has(line.id)) ids.set(line.id, { label: line.label });
  }

  const blocks: UnifiedBeneficiaryBlock[] = [];

  for (const [id, { label, exonerated }] of ids.entries()) {
    const row = transmissionRows.find((r) => r.id === id);
    const ins990I1 = insurance990IStep1.find((l) => l.id === id);
    const ins990I2 = insurance990IStep2.find((l) => l.id === id);
    const ins757B1 = insurance757BStep1.find((l) => l.id === id);
    const ins757B2 = insurance757BStep2.find((l) => l.id === id);

    const brut = row?.brut ?? 0;
    const dmtgDroits = row?.droits ?? 0;

    const s1CapNets = (ins990I1?.netTransmis ?? 0) + (ins757B1?.capitalTransmis ?? 0);
    const s2CapNets = (ins990I2?.netTransmis ?? 0) + (ins757B2?.capitalTransmis ?? 0);
    const capitauxDecesNets = s1CapNets + s2CapNets;

    const s1DroitsTotal = (row?.step1Droits ?? 0) + (ins757B1?.totalDroits ?? 0);
    const s2DroitsTotal = (row?.step2Droits ?? 0) + (ins757B2?.totalDroits ?? 0);
    const droits = dmtgDroits + (ins757B1?.totalDroits ?? 0) + (ins757B2?.totalDroits ?? 0);

    const transmissionNette = brut + capitauxDecesNets - droits;

    if (brut === 0 && capitauxDecesNets === 0 && droits === 0) continue;

    const block: UnifiedBeneficiaryBlock = {
      id,
      label,
      exonerated,
      isConjoint: id === 'conjoint',
      brut,
      capitauxDecesNets,
      droits,
      transmissionNette,
    };

    if (displayUsesChainage) {
      block.step1Brut = row?.step1Brut ?? 0;
      block.step2Brut = row?.step2Brut ?? 0;
      block.step1CapitauxDecesNets = s1CapNets;
      block.step2CapitauxDecesNets = s2CapNets;
      block.step1Droits = s1DroitsTotal;
      block.step2Droits = s2DroitsTotal;
      block.step1TransmissionNette = (row?.step1Brut ?? 0) + s1CapNets - s1DroitsTotal;
      block.step2TransmissionNette = (row?.step2Brut ?? 0) + s2CapNets - s2DroitsTotal;
    }

    blocks.push(block);
  }

  blocks.sort((a, b) => (a.isConjoint ? -1 : b.isConjoint ? 1 : 0));

  return blocks;
}

interface BuildSuccessionSynthHypotheseInput {
  isMarried: boolean;
  nbDescendantBranches: number;
  nbEnfantsNonCommuns: number;
  regimeMatrimonial: RegimeMatrimonial | null;
  attributionIntegrale: boolean;
  donationEntreEpouxActive: boolean;
  donationEntreEpouxOption: string | null;
  chainOrder: 'epoux1' | 'epoux2';
  dateNaissanceEpoux1?: string;
  dateNaissanceEpoux2?: string;
  derivedActifNetSuccession: number;
  simulatedDeathDate: Date;
  choixLegalConjointSansDDV: 'usufruit' | 'quart_pp' | null;
}

export function buildSuccessionSynthHypothese({
  isMarried,
  nbDescendantBranches,
  nbEnfantsNonCommuns,
  regimeMatrimonial,
  attributionIntegrale,
  donationEntreEpouxActive,
  donationEntreEpouxOption,
  chainOrder,
  dateNaissanceEpoux1,
  dateNaissanceEpoux2,
  derivedActifNetSuccession,
  simulatedDeathDate,
  choixLegalConjointSansDDV,
}: BuildSuccessionSynthHypotheseInput): string | null {
  if (!isMarried || nbDescendantBranches === 0) return null;

  if (regimeMatrimonial === 'communaute_universelle' && attributionIntegrale) {
    return 'Communaute universelle avec attribution integrale: le 1er deces transmet integralement au conjoint survivant et reporte la taxation des descendants au 2e deces.';
  }

  if (donationEntreEpouxActive) {
    const option = DONATION_ENTRE_EPOUX_OPTIONS.find((entry) => entry.value === donationEntreEpouxOption);
    const spouseBirthDate = chainOrder === 'epoux1' ? dateNaissanceEpoux2 : dateNaissanceEpoux1;
    const valuationBase = donationEntreEpouxOption === 'mixte'
      ? derivedActifNetSuccession * 0.75
      : derivedActifNetSuccession;
    const valuation = (
      donationEntreEpouxOption === 'usufruit_total'
      || donationEntreEpouxOption === 'mixte'
    )
      ? getUsufruitValuationFromBirthDate(spouseBirthDate, valuationBase, simulatedDeathDate)
      : null;
    const baseLabel = `Donation entre epoux : ${option?.label ?? donationEntreEpouxOption}`;

    if (valuation) {
      return `${baseLabel} - valorisation art. 669 CGI : usufruit ${Math.round(valuation.tauxUsufruit * 100)}%, nue-propriete ${Math.round(valuation.tauxNuePropriete * 100)}% (usufruitier ${valuation.age} ans)`;
    }
    if (donationEntreEpouxOption === 'usufruit_total' || donationEntreEpouxOption === 'mixte') {
      return `${baseLabel} - valorisation art. 669 CGI en attente de la date de naissance du conjoint survivant`;
    }
    return baseLabel;
  }

  if (nbEnfantsNonCommuns > 0) {
    return "Art. 757 CC : 1/4 en pleine propriete impose au conjoint survivant en presence d'enfant(s) non commun(s).";
  }

  if (choixLegalConjointSansDDV === 'usufruit') {
    const spouseBirthDate = chainOrder === 'epoux1' ? dateNaissanceEpoux2 : dateNaissanceEpoux1;
    const valuation = getUsufruitValuationFromBirthDate(
      spouseBirthDate,
      derivedActifNetSuccession,
      simulatedDeathDate,
    );
    if (valuation) {
      return `Art. 757 CC : usufruit de la totalite retenu - valorisation art. 669 CGI : usufruit ${Math.round(valuation.tauxUsufruit * 100)}%, nue-propriete ${Math.round(valuation.tauxNuePropriete * 100)}% (usufruitier ${valuation.age} ans)`;
    }
    return "Art. 757 CC : usufruit de la totalite demande - valorisation art. 669 CGI en attente de la date de naissance du conjoint survivant (repli moteur sur 1/4 en pleine propriete).";
  }

  if (choixLegalConjointSansDDV === 'quart_pp') {
    return 'Art. 757 CC : 1/4 en pleine propriete retenu au titre du choix legal du conjoint survivant.';
  }

  return 'Hypothese moteur : 1/4 en pleine propriete pour le conjoint survivant (choix legal non precise).';
}
