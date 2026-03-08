import {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  type FamilyMember,
  type SuccessionCivilContext,
  type SuccessionDevolutionContext,
  type SuccessionEnfant,
  type SuccessionPatrimonialContext,
} from './successionDraft';
import {
  buildSuccessionDescendantRecipients,
  countEffectiveDescendantBranches,
} from './successionEnfants';
import { getUsufruitValuationFromBirthDate } from './successionUsufruit';

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

function getSurvivingSpouseBirthDate(
  civil: SuccessionCivilContext,
  simulatedDeceased: 'epoux1' | 'epoux2',
): string | undefined {
  return simulatedDeceased === 'epoux1'
    ? civil.dateNaissanceEpoux2
    : civil.dateNaissanceEpoux1;
}

function getDonationEntreEpouxValuation(
  civil: SuccessionCivilContext,
  nbEnfants: number,
  masseReference: number,
  patrimonial: Pick<SuccessionPatrimonialContext, 'donationEntreEpouxActive' | 'donationEntreEpouxOption'> | undefined,
  simulatedDeceased: 'epoux1' | 'epoux2',
  referenceDate: Date,
): {
  conjointAmount: number;
  descendantsAmount: number;
  conjointRights: string;
  descendantsRights: string;
  warnings: string[];
} | null {
  if (!patrimonial?.donationEntreEpouxActive) return null;

  const warnings: string[] = [];
  const birthDate = getSurvivingSpouseBirthDate(civil, simulatedDeceased);
  const usufruitValuation = getUsufruitValuationFromBirthDate(birthDate, masseReference, referenceDate);

  if (patrimonial.donationEntreEpouxOption === 'usufruit_total') {
    if (!usufruitValuation) {
      warnings.push('Donation entre époux en usufruit total: date de naissance du conjoint survivant manquante, repli moteur sur 1/4 en pleine propriété.');
      return {
        conjointAmount: masseReference * 0.25,
        descendantsAmount: masseReference * 0.75,
        conjointRights: 'Totalité en usufruit (repli de calcul 1/4 PP faute de date de naissance)',
        descendantsRights: '75% en pleine propriété (repli moteur faute de valorisation art. 669 CGI)',
        warnings,
      };
    }

    warnings.push(`Donation entre époux: valorisation art. 669 CGI sur la base d’un usufruitier âgé de ${usufruitValuation.age} ans.`);
    return {
      conjointAmount: usufruitValuation.valeurUsufruit,
      descendantsAmount: usufruitValuation.valeurNuePropriete,
      conjointRights: `Totalité en usufruit (${Math.round(usufruitValuation.tauxUsufruit * 100)}% art. 669 CGI)`,
      descendantsRights: `Nue-propriété de la totalité (${Math.round(usufruitValuation.tauxNuePropriete * 100)}% art. 669 CGI)`,
      warnings,
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'mixte') {
    if (!usufruitValuation) {
      warnings.push('Donation entre époux mixte: date de naissance du conjoint survivant manquante, repli moteur sur 1/4 en pleine propriété.');
      return {
        conjointAmount: masseReference * 0.25,
        descendantsAmount: masseReference * 0.75,
        conjointRights: '1/4 en pleine propriété et 3/4 en usufruit (repli de calcul 1/4 PP faute de date de naissance)',
        descendantsRights: '75% en pleine propriété (repli moteur faute de valorisation art. 669 CGI)',
        warnings,
      };
    }

    const demembreBase = masseReference * 0.75;
    const demembreValuation = getUsufruitValuationFromBirthDate(birthDate, demembreBase, referenceDate);
    if (!demembreValuation) return null;
    warnings.push(`Donation entre époux mixte: valorisation art. 669 CGI sur 3/4 démembrés, usufruitier âgé de ${demembreValuation.age} ans.`);
    return {
      conjointAmount: (masseReference * 0.25) + demembreValuation.valeurUsufruit,
      descendantsAmount: demembreValuation.valeurNuePropriete,
      conjointRights: `1/4 en pleine propriété + usufruit des 3/4 (${Math.round(demembreValuation.tauxUsufruit * 100)}% sur la part démembrée)`,
      descendantsRights: `Nue-propriété des 3/4 (${Math.round(demembreValuation.tauxNuePropriete * 100)}% sur la part démembrée)`,
      warnings,
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_quotite') {
    const quotite = getQuotiteDisponibleRatio(nbEnfants);
    return {
      conjointAmount: masseReference * quotite,
      descendantsAmount: masseReference * (1 - quotite),
      conjointRights: 'Quotité disponible en pleine propriété',
      descendantsRights: 'Réserve héréditaire en pleine propriété',
      warnings,
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_totale') {
    warnings.push('Donation entre époux en pleine propriété totale: hypothèse très protectrice, à confronter à la réserve héréditaire.');
    return {
      conjointAmount: masseReference,
      descendantsAmount: 0,
      conjointRights: 'Totalité en pleine propriété',
      descendantsRights: 'Droits des descendants potentiellement réduits à due concurrence',
      warnings,
    };
  }

  return null;
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
): void {
  const nbParents = familyMembers.filter((m) => m.type === 'parent').length;
  const nbFreresSoeurs = familyMembers.filter((m) => m.type === 'frere_soeur').length;

  if (nbParents === 0 && nbFreresSoeurs === 0) {
    lines.push({
      heritier: 'Héritiers légaux',
      droits: 'Ordres 3 et 4 : ascendants ordinaires, collatéraux ordinaires (non modélisés)',
      montantEstime: null,
    });
    warnings.push('Ordres successoraux 3 et 4 non modélisés : ajoutez les membres de la famille pour affiner.');
  } else if (nbParents >= 2 && nbFreresSoeurs === 0) {
    lines.push({ heritier: 'Père et mère', droits: '1/2 chacun (art. 736 CC)', montantEstime: masseReference });
  } else if (nbParents === 1 && nbFreresSoeurs === 0) {
    lines.push({ heritier: 'Ascendant survivant', droits: 'Totalité (art. 736 CC)', montantEstime: masseReference });
  } else if (nbParents === 0) {
    const label = `${nbFreresSoeurs} ${nbFreresSoeurs > 1 ? 'collatéraux privilégiés' : 'collatéral privilégié'}`;
    lines.push({
      heritier: 'Frères et sœurs',
      droits: `Totalité à parts égales — ${label} (art. 737 CC)`,
      montantEstime: masseReference,
    });
  } else if (nbParents >= 2) {
    const label = `${nbFreresSoeurs} ${nbFreresSoeurs > 1 ? 'collatéraux privilégiés' : 'collatéral privilégié'}`;
    lines.push({ heritier: 'Père et mère', droits: '1/4 chacun (art. 738 CC)', montantEstime: masseReference * 0.5 });
    lines.push({
      heritier: 'Frères et sœurs',
      droits: `1/2 à parts égales — ${label} (art. 738 CC)`,
      montantEstime: masseReference * 0.5,
    });
  } else {
    // nbParents === 1, nbFreresSoeurs > 0
    const label = `${nbFreresSoeurs} ${nbFreresSoeurs > 1 ? 'collatéraux privilégiés' : 'collatéral privilégié'}`;
    lines.push({ heritier: 'Ascendant survivant', droits: '1/4 (art. 738-1 CC)', montantEstime: masseReference * 0.25 });
    lines.push({
      heritier: 'Frères et sœurs',
      droits: `3/4 à parts égales — ${label} (art. 738-1 CC)`,
      montantEstime: masseReference * 0.75,
    });
  }
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
  options: SuccessionDevolutionBuildOptions = {},
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
      const donationValuation = getDonationEntreEpouxValuation(
        civil,
        nbEnfantsTotal,
        masseReference,
        options.patrimonial,
        options.simulatedDeceased ?? 'epoux1',
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
      // Art. 757-1 / 757-2 CC : marié sans descendants
      const nbParents = familyMembers.filter((m) => m.type === 'parent').length;
      const effectiveParents = nbParents > 0 ? nbParents : (context.ascendantsSurvivants ? 1 : 0);
      if (effectiveParents >= 2) {
        lines.push({ heritier: 'Conjoint survivant', droits: '1/2 en pleine propriété (art. 757-1 CC)', montantEstime: masseReference * 0.5 });
        lines.push({ heritier: 'Ascendants (père et mère)', droits: '1/4 chacun en pleine propriété (art. 757-1 CC)', montantEstime: masseReference * 0.5 });
      } else if (effectiveParents === 1) {
        lines.push({ heritier: 'Conjoint survivant', droits: '3/4 en pleine propriété (art. 757-1 CC)', montantEstime: masseReference * 0.75 });
        lines.push({ heritier: 'Ascendant survivant', droits: '1/4 en pleine propriété (art. 757-1 CC)', montantEstime: masseReference * 0.25 });
      } else {
        // Art. 757-2 CC : pas d'ascendants → conjoint hérite de tout (frères/sœurs exclus)
        lines.push({ heritier: 'Conjoint survivant', droits: 'Totalité de la succession (art. 757-2 CC)', montantEstime: masseReference });
      }
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
    } else if (!context.testamentActif) {
      // Sans testament : héritiers légaux (parents / frères et sœurs)
      addAscendantsCollaterauxLines(lines, warnings, familyMembers, masseReference);
    }
    // Avec testament et sans descendants : le partenaire peut recueillir tout (pas de réserve héréditaire)
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
    } else if (!context.testamentActif) {
      // Sans testament : héritiers légaux (parents / frères et sœurs)
      addAscendantsCollaterauxLines(lines, warnings, familyMembers, masseReference);
    }
    // Avec testament et sans descendants : le concubin peut recueillir tout (pas de réserve héréditaire)
  } else {
    if (nbEnfantsTotal > 0) {
      lines.push({
        heritier: 'Descendants',
        droits: getDescendantsLine(nbEnfantsTotal, 100, representedBranchLabels),
        montantEstime: masseReference,
      });
    } else {
      // Art. 736-738-1 CC : sans descendants ni conjoint
      addAscendantsCollaterauxLines(lines, warnings, familyMembers, masseReference);
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
