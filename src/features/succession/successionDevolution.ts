import {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  type FamilyMember,
  type SuccessionCivilContext,
  type SuccessionDevolutionContext,
  type SuccessionDevolutionContextInput,
  type SuccessionEnfant,
  type SuccessionPatrimonialContext,
} from './successionDraft';
import {
  buildSuccessionDescendantRecipients,
  countEffectiveDescendantBranches,
} from './successionEnfants';
import {
  computeTestamentDistribution,
  getAscendantsSurvivantsForSide,
  getTestamentConfigForSide,
  hasActiveTestamentForSide,
  type SuccessionTestamentDistributionResult,
} from './successionTestament';
import {
  getDonationEntreEpouxValuation,
  getLegalSpouseValuationWithoutDonation,
} from './successionDevolutionSpouseValuation';

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
  testamentDistribution: SuccessionTestamentDistributionResult | null;
  warnings: string[];
}

interface SuccessionDevolutionBuildOptions {
  patrimonial?: Pick<SuccessionPatrimonialContext, 'donationEntreEpouxActive' | 'donationEntreEpouxOption'>;
  simulatedDeceased?: 'epoux1' | 'epoux2';
  referenceDate?: Date;
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

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function findLineAmount(
  lines: SuccessionDevolutionLine[],
  ...labels: string[]
): number {
  const normalizedLabels = labels.map(normalizeLabel);
  const line = lines.find((candidate) => normalizedLabels.includes(normalizeLabel(candidate.heritier)));
  return asAmount(line?.montantEstime, 0);
}

function getReserveInfo(nbEnfants: number): SuccessionReserveInfo | null {
  if (nbEnfants <= 0) return null;
  if (nbEnfants === 1) return { reserve: '1/2', quotiteDisponible: '1/2' };
  if (nbEnfants === 2) return { reserve: '2/3', quotiteDisponible: '1/3' };
  return { reserve: '3/4', quotiteDisponible: '1/4' };
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

function addAscendantsCollaterauxLines(
  lines: SuccessionDevolutionLine[],
  warnings: string[],
  familyMembers: FamilyMember[],
  masseReference: number,
  simulatedDeceased: 'epoux1' | 'epoux2',
): void {
  const sideMembers = familyMembers.filter((member) => !member.branch || member.branch === simulatedDeceased);
  const nbParents = sideMembers.filter((member) => member.type === 'parent').length;
  const nbFreresSoeurs = sideMembers.filter((member) => member.type === 'frere_soeur').length;

  if (nbParents === 0 && nbFreresSoeurs === 0) {
    lines.push({
      heritier: 'Héritiers légaux',
      droits: 'Ordres 3 et 4 : ascendants ordinaires, collatéraux ordinaires (non modélisés)',
      montantEstime: null,
    });
    warnings.push('Ordres successoraux 3 et 4 non modélisés : ajoutez les membres de la famille pour affiner.');
    return;
  }

  if (nbParents >= 2 && nbFreresSoeurs === 0) {
    lines.push({ heritier: 'Père et mère', droits: '1/2 chacun (art. 736 CC)', montantEstime: masseReference });
    return;
  }

  if (nbParents === 1 && nbFreresSoeurs === 0) {
    lines.push({ heritier: 'Ascendant survivant', droits: 'Totalité (art. 736 CC)', montantEstime: masseReference });
    return;
  }

  if (nbParents === 0) {
    const label = `${nbFreresSoeurs} ${nbFreresSoeurs > 1 ? 'collatéraux privilégiés' : 'collatéral privilégié'}`;
    lines.push({
      heritier: 'Frères et sœurs',
      droits: `Totalité à parts égales — ${label} (art. 737 CC)`,
      montantEstime: masseReference,
    });
    return;
  }

  if (nbParents >= 2) {
    const label = `${nbFreresSoeurs} ${nbFreresSoeurs > 1 ? 'collatéraux privilégiés' : 'collatéral privilégié'}`;
    lines.push({ heritier: 'Père et mère', droits: '1/4 chacun (art. 738 CC)', montantEstime: masseReference * 0.5 });
    lines.push({
      heritier: 'Frères et sœurs',
      droits: `1/2 à parts égales — ${label} (art. 738 CC)`,
      montantEstime: masseReference * 0.5,
    });
    return;
  }

  const label = `${nbFreresSoeurs} ${nbFreresSoeurs > 1 ? 'collatéraux privilégiés' : 'collatéral privilégié'}`;
  lines.push({ heritier: 'Ascendant survivant', droits: '1/4 (art. 738-1 CC)', montantEstime: masseReference * 0.25 });
  lines.push({
    heritier: 'Frères et sœurs',
    droits: `3/4 à parts égales — ${label} (art. 738-1 CC)`,
    montantEstime: masseReference * 0.75,
  });
}

function addTestamentLines(
  lines: SuccessionDevolutionLine[],
  warnings: string[],
  civil: SuccessionCivilContext,
  context: SuccessionDevolutionContext,
  simulatedDeceased: 'epoux1' | 'epoux2',
  masseReference: number,
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  maxAvailableAmount: number,
): SuccessionTestamentDistributionResult | null {
  const testament = getTestamentConfigForSide(context, simulatedDeceased);
  if (!testament.active) return null;

  const distribution = computeTestamentDistribution({
    situation: civil.situationMatrimoniale,
    side: simulatedDeceased,
    testament,
    masseReference,
    enfants: enfantsContext,
    familyMembers,
    maxAvailableAmount,
  });
  if (!distribution) return null;

  warnings.push(...distribution.warnings);
  distribution.beneficiaries.forEach((beneficiary) => {
    let droits = 'Transmission testamentaire';
    if (distribution.dispositionType === 'legs_universel') {
      droits = 'Legs universel';
    } else if (distribution.dispositionType === 'legs_titre_universel') {
      droits = `${Math.round(Math.min(100, Math.max(0, testament.quotePartPct)))}% de la succession visée par testament`;
    } else if (distribution.dispositionType === 'legs_particulier') {
      droits = 'Legs particulier de biens ou de montants déterminés';
    }

    if (distribution.distributedAmount < distribution.requestedAmount) {
      droits += ' (plafonné par la part redistribuable retenue)';
    }

    lines.push({
      heritier: `${beneficiary.label} (testament)`,
      droits,
      montantEstime: beneficiary.partSuccession,
    });
  });

  return distribution;
}

export function buildSuccessionDevolutionAnalysis(
  civil: SuccessionCivilContext,
  nbEnfantsTotalInput: number,
  contextInput: SuccessionDevolutionContextInput | undefined,
  masseReferenceInput: number,
  _legsParticuliersInput = 0,
  enfantsContext: SuccessionEnfant[] = [],
  familyMembers: FamilyMember[] = [],
  options: SuccessionDevolutionBuildOptions = {},
): SuccessionDevolutionAnalysis {
  const masseReference = asAmount(masseReferenceInput, 0);
  const warnings: string[] = [];
  const simulatedDeceased = options.simulatedDeceased ?? 'epoux1';
  const context: SuccessionDevolutionContext = {
    ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
    ...contextInput,
    testamentsBySide: {
      epoux1: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux1,
        ...contextInput?.testamentsBySide?.epoux1,
        particularLegacies: contextInput?.testamentsBySide?.epoux1?.particularLegacies
          ? [...contextInput.testamentsBySide.epoux1.particularLegacies]
          : [...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux1.particularLegacies],
      },
      epoux2: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux2,
        ...contextInput?.testamentsBySide?.epoux2,
        particularLegacies: contextInput?.testamentsBySide?.epoux2?.particularLegacies
          ? [...contextInput.testamentsBySide.epoux2.particularLegacies]
          : [...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux2.particularLegacies],
      },
    },
    ascendantsSurvivantsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide,
      ...contextInput?.ascendantsSurvivantsBySide,
    },
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
      const donationValuation = getDonationEntreEpouxValuation(
        civil,
        nbEnfantsTotal,
        masseReference,
        options.patrimonial,
        simulatedDeceased,
        options.referenceDate ?? new Date(),
      );
      if (donationValuation) {
        lines.push({
          heritier: 'Conjoint survivant',
          droits: donationValuation.conjointRights,
          montantEstime: donationValuation.conjointAmount,
        });
        lines.push({
          heritier: 'Descendants',
          droits: donationValuation.descendantsRights,
          montantEstime: donationValuation.descendantsAmount,
        });
        warnings.push(...donationValuation.warnings);
      } else if (nbEnfantsNonCommuns > 0) {
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
        const legalSpouseValuation = getLegalSpouseValuationWithoutDonation(
          civil,
          context.choixLegalConjointSansDDV,
          masseReference,
          simulatedDeceased,
          options.referenceDate ?? new Date(),
        );
        if (legalSpouseValuation) {
          lines.push({
            heritier: 'Conjoint survivant',
            droits: legalSpouseValuation.conjointRights,
            montantEstime: legalSpouseValuation.conjointAmount,
          });
          lines.push({
            heritier: 'Descendants',
            droits: legalSpouseValuation.descendantsRights,
            montantEstime: legalSpouseValuation.descendantsAmount,
          });
          warnings.push(...legalSpouseValuation.warnings);
        } else {
          const conjointRights = context.choixLegalConjointSansDDV === 'quart_pp'
            ? '1/4 en pleine propriété (art. 757 CC, choix légal du conjoint)'
            : '1/4 en pleine propriété (hypothèse moteur)';
          lines.push({
            heritier: 'Conjoint survivant',
            droits: conjointRights,
            montantEstime: masseReference * 0.25,
          });
          lines.push({
            heritier: 'Descendants',
            droits: getDescendantsLine(nbEnfantsTotal, 75, representedBranchLabels),
            montantEstime: masseReference * 0.75,
          });
        }
      }
    } else {
      const nbParents = familyMembers.filter(
        (member) => member.type === 'parent' && (!member.branch || member.branch === simulatedDeceased),
      ).length;
      const effectiveParents = nbParents > 0
        ? nbParents
        : (getAscendantsSurvivantsForSide(context, simulatedDeceased) ? 1 : 0);
      if (effectiveParents >= 2) {
        lines.push({
          heritier: 'Conjoint survivant',
          droits: '1/2 en pleine propriété (art. 757-1 CC)',
          montantEstime: masseReference * 0.5,
        });
        lines.push({
          heritier: 'Ascendants (père et mère)',
          droits: '1/4 chacun en pleine propriété (art. 757-1 CC)',
          montantEstime: masseReference * 0.5,
        });
      } else if (effectiveParents === 1) {
        lines.push({
          heritier: 'Conjoint survivant',
          droits: '3/4 en pleine propriété (art. 757-1 CC)',
          montantEstime: masseReference * 0.75,
        });
        lines.push({
          heritier: 'Ascendant survivant',
          droits: '1/4 en pleine propriété (art. 757-1 CC)',
          montantEstime: masseReference * 0.25,
        });
      } else {
        lines.push({
          heritier: 'Conjoint survivant',
          droits: 'Totalité de la succession (art. 757-2 CC)',
          montantEstime: masseReference,
        });
      }
    }
  } else if (civil.situationMatrimoniale === 'pacse') {
    warnings.push('PACS: pas de vocation successorale légale automatique sans testament.');
    if (!hasActiveTestamentForSide(context, simulatedDeceased)) {
      lines.push({ heritier: 'Partenaire pacsé', droits: 'Aucun droit successoral légal', montantEstime: 0 });
    }
    if (nbEnfantsTotal > 0) {
      lines.push({
        heritier: 'Descendants',
        droits: getDescendantsLine(nbEnfantsTotal, 100, representedBranchLabels),
        montantEstime: masseReference,
      });
    } else {
      addAscendantsCollaterauxLines(lines, warnings, familyMembers, masseReference, simulatedDeceased);
    }
  } else if (civil.situationMatrimoniale === 'concubinage') {
    warnings.push('Concubinage: pas de vocation successorale légale du concubin.');
    if (!hasActiveTestamentForSide(context, simulatedDeceased)) {
      lines.push({ heritier: 'Concubin', droits: 'Aucun droit successoral légal', montantEstime: 0 });
    }
    if (nbEnfantsTotal > 0) {
      lines.push({
        heritier: 'Descendants',
        droits: getDescendantsLine(nbEnfantsTotal, 100, representedBranchLabels),
        montantEstime: masseReference,
      });
    } else {
      addAscendantsCollaterauxLines(lines, warnings, familyMembers, masseReference, simulatedDeceased);
    }
  } else {
    if (nbEnfantsTotal > 0) {
      lines.push({
        heritier: 'Descendants',
        droits: getDescendantsLine(nbEnfantsTotal, 100, representedBranchLabels),
        montantEstime: masseReference,
      });
    } else {
      addAscendantsCollaterauxLines(lines, warnings, familyMembers, masseReference, simulatedDeceased);
    }
  }

  const protectedAmount = civil.situationMatrimoniale === 'marie'
    ? findLineAmount(lines, 'Conjoint survivant')
    : 0;
  const testamentDistribution = addTestamentLines(
    lines,
    warnings,
    civil,
    context,
    simulatedDeceased,
    masseReference,
    enfantsContext,
    familyMembers,
    Math.max(0, masseReference - protectedAmount),
  );

  return {
    masseReference,
    nbEnfantsTotal,
    nbEnfantsNonCommuns,
    reserve,
    lines,
    testamentDistribution,
    warnings,
  };
}
