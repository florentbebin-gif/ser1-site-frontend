import {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  type FamilyMember,
  type SuccessionCivilContext,
  type SuccessionDevolutionContext,
  type SuccessionEnfant,
} from './successionDraft';
import {
  buildSuccessionDescendantRecipients,
  countEffectiveDescendantBranches,
} from './successionEnfants';

export interface SuccessionDevolutionLine {
  heritier: string;
  droits: string;
  montantEstime: number | null;
}

export interface SuccessionReserveInfo {
  reserve: string;
  quotiteDisponible: string;
}

export interface SuccessionDevolutionAnalysis {
  masseReference: number;
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

function asAmount(input: unknown, fallback = 0): number {
  const num = Number(input);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, num);
}

function getReserveInfo(nbEnfants: number): SuccessionReserveInfo | null {
  if (nbEnfants <= 0) return null;
  if (nbEnfants === 1) return { reserve: '1/2', quotiteDisponible: '1/2' };
  if (nbEnfants === 2) return { reserve: '2/3', quotiteDisponible: '1/3' };
  return { reserve: '3/4', quotiteDisponible: '1/4' };
}

function getQuotiteDisponibleRatio(nbEnfants: number): number {
  if (nbEnfants <= 0) return 1;
  if (nbEnfants === 1) return 0.5;
  if (nbEnfants === 2) return 1 / 3;
  return 0.25;
}

function getDescendantsLine(
  nbBranches: number,
  availablePct: number,
  representedBranchLabels: string[],
): string {
  if (nbBranches <= 0) return `${availablePct.toFixed(0)}% en pleine propriété`;
  const perBranch = availablePct / nbBranches;
  const representationHint = representedBranchLabels.length > 0
    ? `, représentation de ${representedBranchLabels.join(', ')}`
    : '';
  return `${availablePct.toFixed(0)}% en pleine propriété (${perBranch.toFixed(2)}% par branche${representationHint})`;
}

function addTestamentLines(
  lines: SuccessionDevolutionLine[],
  warnings: string[],
  context: SuccessionDevolutionContext,
  nbEnfantsTotal: number,
  masseReference: number,
  legsParticuliersMontant: number,
): void {
  if (!context.testamentActif) return;

  warnings.push('Testament actif: valider les clauses exactes et leur articulation avec la réserve héréditaire.');

  if (!context.typeDispositionTestamentaire) {
    warnings.push('Testament actif sans type de disposition: précisez le mécanisme testamentaire.');
    return;
  }

  const quotiteDisponible = masseReference * getQuotiteDisponibleRatio(nbEnfantsTotal);
  const plafondTestament = nbEnfantsTotal > 0 ? quotiteDisponible : masseReference;

  if (context.typeDispositionTestamentaire === 'legs_universel') {
    lines.push({
      heritier: 'Légataire universel (testament)',
      droits: nbEnfantsTotal > 0
        ? 'Vocation limitée à la quotité disponible'
        : 'Vocation potentiellement intégrale (hors droits spéciaux)',
      montantEstime: plafondTestament,
    });
    return;
  }

  if (context.typeDispositionTestamentaire === 'legs_titre_universel') {
    const ratio = Math.min(100, Math.max(0, context.quotePartLegsTitreUniverselPct)) / 100;
    if (ratio <= 0) {
      warnings.push('Quote-part de legs à titre universel nulle: renseignez un pourcentage pertinent.');
    }
    lines.push({
      heritier: 'Légataire à titre universel',
      droits: `${Math.round(ratio * 100)}% de la quotité disponible`,
      montantEstime: plafondTestament * ratio,
    });
    return;
  }

  const montantLegsParticuliers = Math.max(0, legsParticuliersMontant);
  if (montantLegsParticuliers <= 0) {
    warnings.push('Legs particuliers sélectionnés sans montant: renseignez la valeur des biens légués.');
  }
  lines.push({
    heritier: 'Bénéficiaire de legs particuliers',
    droits: 'Transmission de biens ou de montants déterminés',
    montantEstime: montantLegsParticuliers,
  });

  if (nbEnfantsTotal > 0 && montantLegsParticuliers > plafondTestament) {
    warnings.push('Legs particuliers supérieurs à la quotité disponible: risque de réduction civile.');
  }
}

export function buildSuccessionDevolutionAnalysis(
  civil: SuccessionCivilContext,
  nbEnfantsTotalInput: number,
  contextInput: Partial<SuccessionDevolutionContext> | undefined,
  masseReferenceInput: number,
  legsParticuliersInput = 0,
  enfantsContext: SuccessionEnfant[] = [],
  familyMembers: FamilyMember[] = [],
): SuccessionDevolutionAnalysis {
  const masseReference = asAmount(masseReferenceInput, 0);
  const warnings: string[] = [];

  const context: SuccessionDevolutionContext = {
    ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
    ...contextInput,
  };

  const derivedBranches = countEffectiveDescendantBranches(enfantsContext, familyMembers);
  const nbEnfantsTotal = Math.max(asChildrenCount(nbEnfantsTotalInput, 0), derivedBranches);
  const nbEnfantsNonCommunsRaw = asChildrenCount(
    context.nbEnfantsNonCommuns,
    DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.nbEnfantsNonCommuns,
  );
  const nbEnfantsNonCommuns = Math.min(nbEnfantsNonCommunsRaw, nbEnfantsTotal);
  const reserve = getReserveInfo(nbEnfantsTotal);
  const lines: SuccessionDevolutionLine[] = [];

  const descendantRecipients = buildSuccessionDescendantRecipients(enfantsContext, familyMembers);
  const representedBranchLabels = Array.from(
    new Set(
      descendantRecipients
        .filter((recipient) => recipient.lien === 'petit_enfant')
        .map((recipient) => recipient.branchLabel),
    ),
  );
  const deceasedWithoutRepresentation = enfantsContext.filter(
    (enfant) => enfant.deceased && !descendantRecipients.some((recipient) => recipient.branchId === enfant.id),
  );

  if (nbEnfantsNonCommunsRaw > nbEnfantsTotal) {
    warnings.push('Enfants non communs plafonnés au nombre total de branches descendantes.');
  }
  if (representedBranchLabels.length > 0) {
    warnings.push(`Représentation successorale simplifiée prise en compte pour ${representedBranchLabels.join(', ')}.`);
  }
  if (deceasedWithoutRepresentation.length > 0) {
    warnings.push('Enfant décédé sans descendant représentant: non compté dans la dévolution simplifiée.');
  }

  if (civil.situationMatrimoniale === 'marie') {
    if (nbEnfantsTotal > 0) {
      if (nbEnfantsNonCommuns > 0) {
        lines.push({
          heritier: 'Conjoint survivant',
          droits: '1/4 en pleine propriété',
          montantEstime: masseReference * 0.25,
        });
        lines.push({
          heritier: 'Descendants',
          droits: getDescendantsLine(nbEnfantsTotal, 75, representedBranchLabels),
          montantEstime: masseReference * 0.75,
        });
      } else {
        lines.push({
          heritier: 'Conjoint survivant',
          droits: '1/4 en pleine propriété (hypothèse moteur)',
          montantEstime: masseReference * 0.25,
        });
        lines.push({
          heritier: 'Descendants',
          droits: getDescendantsLine(nbEnfantsTotal, 75, representedBranchLabels),
          montantEstime: masseReference * 0.75,
        });
      }
    } else {
      if (context.ascendantsSurvivants) {
        lines.push({
          heritier: 'Conjoint survivant',
          droits: 'Droits dépendants du nombre d’ascendants privilégiés (non modélisé finement)',
          montantEstime: null,
        });
        lines.push({
          heritier: 'Ascendants survivants',
          droits: 'Droits à préciser selon la configuration familiale',
          montantEstime: null,
        });
      } else {
        lines.push({
          heritier: 'Conjoint survivant',
          droits: 'Droits à préciser selon collatéraux privilégiés (non modélisé finement)',
          montantEstime: null,
        });
      }
      warnings.push('Dévolution sans descendants: modélisation simplifiée, analyse notariale requise.');
    }
  } else if (civil.situationMatrimoniale === 'pacse') {
    warnings.push('PACS: pas de vocation successorale légale automatique sans testament.');
    if (context.testamentActif) {
      lines.push({
        heritier: 'Partenaire pacsé',
        droits: 'Possible selon testament, dans la limite de la quotité disponible',
        montantEstime: nbEnfantsTotal > 0 ? masseReference * getQuotiteDisponibleRatio(nbEnfantsTotal) : masseReference,
      });
    } else {
      lines.push({ heritier: 'Partenaire pacsé', droits: 'Aucun droit successoral légal', montantEstime: 0 });
    }
    if (nbEnfantsTotal > 0) {
      lines.push({
        heritier: 'Descendants',
        droits: getDescendantsLine(nbEnfantsTotal, 100, representedBranchLabels),
        montantEstime: masseReference,
      });
    } else {
      warnings.push('Dévolution sans descendants non modélisée finement (ascendants/collatéraux exclus).');
    }
  } else if (civil.situationMatrimoniale === 'concubinage') {
    warnings.push('Concubinage: pas de vocation successorale légale du concubin.');
    if (context.testamentActif) {
      lines.push({
        heritier: 'Concubin',
        droits: 'Possible selon testament, fiscalité potentiellement majorée',
        montantEstime: nbEnfantsTotal > 0 ? masseReference * getQuotiteDisponibleRatio(nbEnfantsTotal) : masseReference,
      });
    } else {
      lines.push({ heritier: 'Concubin', droits: 'Aucun droit successoral légal', montantEstime: 0 });
    }
    if (nbEnfantsTotal > 0) {
      lines.push({
        heritier: 'Descendants',
        droits: getDescendantsLine(nbEnfantsTotal, 100, representedBranchLabels),
        montantEstime: masseReference,
      });
    } else {
      warnings.push('Dévolution sans descendants non modélisée finement (ascendants/collatéraux exclus).');
    }
  } else {
    if (nbEnfantsTotal > 0) {
      lines.push({
        heritier: 'Descendants',
        droits: getDescendantsLine(nbEnfantsTotal, 100, representedBranchLabels),
        montantEstime: masseReference,
      });
    } else {
      lines.push({
        heritier: 'Héritiers légaux',
        droits: 'Ordres successoraux non détaillés dans ce module',
        montantEstime: null,
      });
      warnings.push('Ordres successoraux hors descendants non modélisés finement.');
    }
  }

  addTestamentLines(lines, warnings, context, nbEnfantsTotal, masseReference, asAmount(legsParticuliersInput, 0));

  return {
    masseReference,
    nbEnfantsTotal,
    nbEnfantsNonCommuns,
    reserve,
    lines,
    warnings,
  };
}
