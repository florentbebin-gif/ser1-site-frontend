import { buildSuccessionAvFiscalAnalysis } from './successionAvFiscal';
import type {
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionEnfant,
  SuccessionPerEntry,
} from './successionDraft.types';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';

export interface SuccessionPerFiscalAnalysis extends ReturnType<typeof buildSuccessionAvFiscalAnalysis> {}

function getAgeAtDate(birthDate: string | undefined, referenceDate: Date): number | null {
  if (!birthDate) return null;
  const parsedBirthDate = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(parsedBirthDate.getTime())) return null;

  const years = referenceDate.getUTCFullYear() - parsedBirthDate.getUTCFullYear();
  const birthMonth = parsedBirthDate.getUTCMonth();
  const birthDay = parsedBirthDate.getUTCDate();
  const refMonth = referenceDate.getUTCMonth();
  const refDay = referenceDate.getUTCDate();

  const age = years - (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay) ? 1 : 0);
  return age >= 0 ? age : null;
}

function toSyntheticAssuranceVieEntries(
  perEntries: SuccessionPerEntry[],
  civil: SuccessionCivilContext,
  referenceDate: Date,
): { assuranceVieEntries: SuccessionAssuranceVieEntry[]; warnings: string[] } {
  const warnings: string[] = [];

  const assuranceVieEntries = perEntries.map((entry) => {
    const birthDate = entry.assure === 'epoux1'
      ? civil.dateNaissanceEpoux1
      : civil.dateNaissanceEpoux2;
    const ageAtDeath = getAgeAtDate(birthDate, referenceDate);
    const assumeBefore70 = ageAtDeath == null;

    if (ageAtDeath == null) {
      warnings.push(
        `PER assurance: date de naissance manquante pour ${entry.assure}, hypothese par defaut d'un deces avant 70 ans.`,
      );
    }

    return {
      id: `per-${entry.id}`,
      typeContrat: entry.typeContrat,
      souscripteur: entry.assure,
      assure: entry.assure,
      clauseBeneficiaire: entry.clauseBeneficiaire,
      capitauxDeces: entry.capitauxDeces,
      versementsApres70: assumeBefore70 || ageAtDeath < 70 ? 0 : entry.capitauxDeces,
      ageUsufruitier: entry.ageUsufruitier,
    } satisfies SuccessionAssuranceVieEntry;
  });

  return {
    assuranceVieEntries,
    warnings,
  };
}

export function buildSuccessionPerFiscalAnalysis(
  perEntries: SuccessionPerEntry[],
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  snapshot: SuccessionFiscalSnapshot,
  referenceDate: Date,
): SuccessionPerFiscalAnalysis {
  const { assuranceVieEntries, warnings: syntheticWarnings } = toSyntheticAssuranceVieEntries(
    perEntries,
    civil,
    referenceDate,
  );

  const analysis = buildSuccessionAvFiscalAnalysis(
    assuranceVieEntries,
    civil,
    enfants,
    familyMembers,
    snapshot,
  );

  return {
    ...analysis,
    warnings: Array.from(new Set([
      ...syntheticWarnings,
      ...analysis.warnings.map((warning) => warning.replace(/Assurance-vie/g, 'PER assurance')),
      ...(perEntries.length > 0
        ? ['PER assurance deces: ventilation fiscale simplifiee sur la base de l\'age de l\'assure au deces simule.']
        : []),
    ])),
  };
}
