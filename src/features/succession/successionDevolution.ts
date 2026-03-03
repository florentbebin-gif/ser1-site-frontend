import {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  type SuccessionCivilContext,
} from './successionDraft';

export interface SuccessionDevolutionContext {
  nbEnfantsNonCommuns: number;
  testamentActif: boolean;
}

export interface SuccessionDevolutionLine {
  heritier: string;
  droits: string;
}

export interface SuccessionReserveInfo {
  reserve: string;
  quotiteDisponible: string;
}

export interface SuccessionDevolutionAnalysis {
  nbEnfantsTotal: number;
  nbEnfantsNonCommuns: number;
  reserve: SuccessionReserveInfo | null;
  lines: SuccessionDevolutionLine[];
  warnings: string[];
}

function asChildrenCount(input: unknown, fallback = 0): number {
  const num = Number(input);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

function getReserveInfo(nbEnfants: number): SuccessionReserveInfo | null {
  if (nbEnfants <= 0) return null;
  if (nbEnfants === 1) return { reserve: '1/2', quotiteDisponible: '1/2' };
  if (nbEnfants === 2) return { reserve: '2/3', quotiteDisponible: '1/3' };
  return { reserve: '3/4', quotiteDisponible: '1/4' };
}

function getDescendantsLine(nbEnfantsTotal: number, availablePct: number): string {
  if (nbEnfantsTotal <= 0) return `${availablePct.toFixed(0)}% en pleine propriété`;
  const perChild = availablePct / nbEnfantsTotal;
  return `${availablePct.toFixed(0)}% en pleine propriété (${perChild.toFixed(2)}% par enfant)`;
}

export function buildSuccessionDevolutionAnalysis(
  civil: SuccessionCivilContext,
  nbEnfantsTotalInput: number,
  contextInput: Partial<SuccessionDevolutionContext> | undefined,
): SuccessionDevolutionAnalysis {
  const nbEnfantsTotal = asChildrenCount(nbEnfantsTotalInput, 0);
  const warnings: string[] = [];

  const nbEnfantsNonCommunsRaw = asChildrenCount(
    contextInput?.nbEnfantsNonCommuns,
    DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.nbEnfantsNonCommuns,
  );
  const nbEnfantsNonCommuns = Math.min(nbEnfantsNonCommunsRaw, nbEnfantsTotal);

  if (nbEnfantsNonCommunsRaw > nbEnfantsTotal) {
    warnings.push('Enfants non communs plafonnés au nombre total d’enfants.');
  }

  const testamentActif = contextInput?.testamentActif === true;
  const lines: SuccessionDevolutionLine[] = [];
  const reserve = getReserveInfo(nbEnfantsTotal);

  if (civil.situationMatrimoniale === 'marie') {
    if (nbEnfantsTotal > 0) {
      if (nbEnfantsNonCommuns > 0) {
        lines.push({ heritier: 'Conjoint survivant', droits: '1/4 en pleine propriété' });
        lines.push({
          heritier: 'Descendants',
          droits: getDescendantsLine(nbEnfantsTotal, 75),
        });
      } else {
        lines.push({
          heritier: 'Option A - Conjoint survivant',
          droits: '1/4 en pleine propriété',
        });
        lines.push({
          heritier: 'Option A - Descendants',
          droits: getDescendantsLine(nbEnfantsTotal, 75),
        });
        lines.push({
          heritier: 'Option B - Conjoint survivant',
          droits: 'Usufruit de la totalité',
        });
        lines.push({
          heritier: 'Option B - Descendants',
          droits: 'Nue-propriété de la totalité',
        });
      }
    } else {
      lines.push({
        heritier: 'Conjoint survivant',
        droits: 'Droits variables selon ascendants/collatéraux (non détaillés ici)',
      });
      warnings.push('Dévolution sans descendants non modélisée finement (ascendants/collatéraux exclus).');
    }
  } else if (civil.situationMatrimoniale === 'pacse') {
    warnings.push('PACS: pas de vocation successorale légale automatique sans testament.');
    if (testamentActif) {
      lines.push({
        heritier: 'Partenaire pacsé',
        droits: 'Possible selon testament, dans la limite de la quotité disponible',
      });
    } else {
      lines.push({ heritier: 'Partenaire pacsé', droits: 'Aucun droit successoral légal' });
    }
    if (nbEnfantsTotal > 0) {
      lines.push({ heritier: 'Descendants', droits: getDescendantsLine(nbEnfantsTotal, 100) });
    } else {
      warnings.push('Dévolution sans descendants non modélisée finement (ascendants/collatéraux exclus).');
    }
  } else if (civil.situationMatrimoniale === 'concubinage') {
    warnings.push('Concubinage: pas de vocation successorale légale du concubin.');
    if (testamentActif) {
      lines.push({
        heritier: 'Concubin',
        droits: 'Possible selon testament, dans la limite de la quotité disponible',
      });
    } else {
      lines.push({ heritier: 'Concubin', droits: 'Aucun droit successoral légal' });
    }
    if (nbEnfantsTotal > 0) {
      lines.push({ heritier: 'Descendants', droits: getDescendantsLine(nbEnfantsTotal, 100) });
    } else {
      warnings.push('Dévolution sans descendants non modélisée finement (ascendants/collatéraux exclus).');
    }
  } else {
    if (nbEnfantsTotal > 0) {
      lines.push({ heritier: 'Descendants', droits: getDescendantsLine(nbEnfantsTotal, 100) });
    } else {
      lines.push({
        heritier: 'Ordres successoraux',
        droits: 'Ascendants/collatéraux non détaillés dans ce module simplifié',
      });
      warnings.push('Dévolution sans descendants non modélisée finement (ascendants/collatéraux exclus).');
    }
  }

  if (testamentActif && nbEnfantsTotal > 0) {
    warnings.push('Testament actif: contrôle réserve héréditaire et quotité disponible requis.');
  }

  warnings.push('Module simplifié: représentation, renonciation et cantonnement non modélisés.');

  return {
    nbEnfantsTotal,
    nbEnfantsNonCommuns,
    reserve,
    lines,
    warnings,
  };
}
