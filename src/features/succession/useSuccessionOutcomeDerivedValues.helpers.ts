import type { RegimeMatrimonial } from '../../engine/civil';
import { DONATION_ENTRE_EPOUX_OPTIONS } from './successionSimulator.constants';
import { getUsufruitValuationFromBirthDate } from './successionUsufruit';

export interface InsuranceBeneficiaryLine {
  id: string;
  label: string;
  capitalTransmis: number;
  totalDroits: number;
  netTransmis: number;
}

type FiscalLine = {
  id: string;
  label: string;
  capitauxAvant70: number;
  capitauxApres70: number;
  droits990I: number;
  droits757B: number;
  capitalTransmis?: number;
};

function aggregateByBeneficiary(lines: Array<{ id: string; label: string; capitalTransmis: number; totalDroits: number }>): InsuranceBeneficiaryLine[] {
  const map = new Map<string, InsuranceBeneficiaryLine>();
  for (const line of lines) {
    const current = map.get(line.id) ?? { id: line.id, label: line.label, capitalTransmis: 0, totalDroits: 0, netTransmis: 0 };
    current.capitalTransmis += line.capitalTransmis;
    current.totalDroits += line.totalDroits;
    current.netTransmis = Math.max(0, current.capitalTransmis - current.totalDroits);
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
  const allLines: FiscalLine[] = [...avLines, ...perLines, ...prevoyanceLines];

  const input990I = allLines.map((line) => ({
    id: line.id,
    label: line.label,
    capitalTransmis: line.capitalTransmis ?? line.capitauxAvant70,
    totalDroits: line.droits990I,
  }));

  const input757B = allLines.map((line) => ({
    id: line.id,
    label: line.label,
    capitalTransmis: line.capitauxApres70,
    totalDroits: line.droits757B,
  }));

  return {
    lines990I: aggregateByBeneficiary(input990I),
    lines757B: aggregateByBeneficiary(input757B),
  };
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
