import {
  DEFAULT_SUCCESSION_ASSURANCE_VIE,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PER,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
} from './successionDraft.defaults';
import {
  asAmount,
  asBoolean,
  asChildrenCount,
  asPercent,
  isAssetCategory,
  isAssetOwner,
  isAssuranceVieContractType,
  isChoixLegalConjointSansDDV,
  isDispositionTestamentaire,
  isDonationEntryType,
  isDonationEntreEpouxOption,
  isEnfantRattachement,
  isFamilyBranch,
  isFamilyMemberType,
  isLienParente,
  isObject,
  isPacsConvention,
  isPrimarySide,
  isRegimeMatrimonial,
  isSituation,
  isSuccessionBeneficiaryRef,
  normalizeOptionalDate,
  normalizeOptionalString,
  normalizePrenom,
} from './successionDraft.guards';
import {
  collectLegacyParticularLegacies,
  deriveLegacyAssetEntries,
  deriveLegacyDonations,
  deriveLegacyEnfants,
  getLegacyTestamentConfig,
  isSupportedSuccessionDraftVersion,
} from './successionDraft.legacy';
import { normalizeResidencePrincipaleAssetEntries } from './successionAssetValuation';
import type {
  FamilyMember,
  ParsedSuccessionDraftPayload,
  PersistedHeritierRow,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionPerEntry,
  SuccessionParticularLegacyEntry,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from './successionDraft.types';

const DECES_DANS_X_ANS_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const;

function parseTestamentConfig(raw: unknown): SuccessionTestamentConfig {
  if (!isObject(raw)) {
    return {
      ...DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
      particularLegacies: [],
    };
  }

  const particularLegaciesRaw = Array.isArray(raw.particularLegacies) ? raw.particularLegacies : [];
  const particularLegacies: SuccessionParticularLegacyEntry[] = particularLegaciesRaw
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => ({
      id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `leg-${idx + 1}`,
      beneficiaryRef: isSuccessionBeneficiaryRef(item.beneficiaryRef) ? item.beneficiaryRef : null,
      amount: asAmount(item.amount, 0),
      label: normalizeOptionalString(item.label),
    }));

  return {
    active: asBoolean(raw.active, DEFAULT_SUCCESSION_TESTAMENT_CONFIG.active),
    dispositionType: isDispositionTestamentaire(raw.dispositionType)
      ? raw.dispositionType
      : DEFAULT_SUCCESSION_TESTAMENT_CONFIG.dispositionType,
    beneficiaryRef: isSuccessionBeneficiaryRef(raw.beneficiaryRef)
      ? raw.beneficiaryRef
      : DEFAULT_SUCCESSION_TESTAMENT_CONFIG.beneficiaryRef,
    quotePartPct: asPercent(raw.quotePartPct, DEFAULT_SUCCESSION_TESTAMENT_CONFIG.quotePartPct),
    particularLegacies,
  };
}

function parsePersistedHeirs(rawHeritiers: unknown): PersistedHeritierRow[] {
  const heritiersRaw = Array.isArray(rawHeritiers) ? rawHeritiers : [];

  const heritiers = heritiersRaw
    .filter((heritier): heritier is Record<string, unknown> => isObject(heritier))
    .map((heritier) => ({
      lien: isLienParente(heritier.lien) ? heritier.lien : 'enfant',
      partSuccession: Number.isFinite(Number(heritier.partSuccession))
        ? Math.max(0, Number(heritier.partSuccession))
        : 0,
    }));

  return heritiers.length > 0 ? heritiers : [{ lien: 'enfant', partSuccession: 0 }];
}

function parseFamilyMembers(rawFamilyMembers: unknown): FamilyMember[] {
  return (Array.isArray(rawFamilyMembers) ? rawFamilyMembers : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .filter((item) => isFamilyMemberType(item.type))
    .map((item, idx) => ({
      id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `mbr-${idx}`,
      type: item.type as FamilyMember['type'],
      branch: isFamilyBranch(item.branch) ? item.branch : undefined,
      parentEnfantId: typeof item.parentEnfantId === 'string' ? item.parentEnfantId : undefined,
    }));
}

function parseDonations(rawDonations: unknown): SuccessionDonationEntry[] {
  return (Array.isArray(rawDonations) ? rawDonations : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      if (!isDonationEntryType(item.type)) return null;

      const donation: SuccessionDonationEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `don-${idx + 1}`,
        type: item.type,
        montant: asAmount(item.montant, 0),
      };

      const date = normalizeOptionalString(item.date);
      const donateur = normalizeOptionalString(item.donateur);
      const donataire = normalizeOptionalString(item.donataire);
      if (date) donation.date = date;
      if (donateur) donation.donateur = donateur;
      if (donataire) donation.donataire = donataire;

      const valeurDonation = asAmount(item.valeurDonation, -1);
      const valeurActuelle = asAmount(item.valeurActuelle, -1);
      if (valeurDonation >= 0) donation.valeurDonation = valeurDonation;
      if (valeurActuelle >= 0) donation.valeurActuelle = valeurActuelle;
      if (asBoolean(item.donSommeArgentExonere, false)) donation.donSommeArgentExonere = true;
      if (asBoolean(item.avecReserveUsufruit, false)) donation.avecReserveUsufruit = true;

      return donation;
    })
    .filter((item): item is SuccessionDonationEntry => item !== null);
}

function parseAssetEntries(rawAssetEntries: unknown): SuccessionAssetDetailEntry[] {
  const parsedEntries = (Array.isArray(rawAssetEntries) ? rawAssetEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      if (!isAssetOwner(item.owner) || !isAssetCategory(item.category)) return null;

      const asset: SuccessionAssetDetailEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `asset-${idx + 1}`,
        owner: item.owner,
        category: item.category,
        subCategory: normalizeOptionalString(item.subCategory) ?? 'Saisie libre',
        amount: asAmount(item.amount, 0),
      };

      const label = normalizeOptionalString(item.label);
      if (label) asset.label = label;

      return asset;
    })
    .filter((item): item is SuccessionAssetDetailEntry => item !== null);

  return normalizeResidencePrincipaleAssetEntries(parsedEntries);
}

function parseAssuranceVieEntries(rawAssuranceVieEntries: unknown): SuccessionAssuranceVieEntry[] {
  return (Array.isArray(rawAssuranceVieEntries) ? rawAssuranceVieEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const souscripteur = item.souscripteur;
      const assure = item.assure;

      if (
        !isAssuranceVieContractType(item.typeContrat)
        || (souscripteur !== 'epoux1' && souscripteur !== 'epoux2')
        || (assure !== 'epoux1' && assure !== 'epoux2')
      ) {
        return null;
      }

      const entry: SuccessionAssuranceVieEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `av-${idx + 1}`,
        typeContrat: item.typeContrat,
        souscripteur,
        assure,
        capitauxDeces: asAmount(item.capitauxDeces, 0),
        versementsApres70: asAmount(item.versementsApres70, 0),
      };

      const clauseBeneficiaire = normalizeOptionalString(item.clauseBeneficiaire);
      if (clauseBeneficiaire) entry.clauseBeneficiaire = clauseBeneficiaire;

      const ageUsufruitier = Number(item.ageUsufruitier);
      if (Number.isFinite(ageUsufruitier) && ageUsufruitier > 0) {
        entry.ageUsufruitier = ageUsufruitier;
      }

      return entry;
    })
    .filter((item): item is SuccessionAssuranceVieEntry => item !== null);
}

function parsePerEntries(rawPerEntries: unknown): SuccessionPerEntry[] {
  return (Array.isArray(rawPerEntries) ? rawPerEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const assure = item.assure;
      if (
        !isAssuranceVieContractType(item.typeContrat)
        || (assure !== 'epoux1' && assure !== 'epoux2')
      ) {
        return null;
      }

      const entry: SuccessionPerEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `per-${idx + 1}`,
        typeContrat: item.typeContrat,
        assure,
        capitauxDeces: asAmount(item.capitauxDeces, 0),
      };

      const clauseBeneficiaire = normalizeOptionalString(item.clauseBeneficiaire);
      if (clauseBeneficiaire) entry.clauseBeneficiaire = clauseBeneficiaire;

      const ageUsufruitier = Number(item.ageUsufruitier);
      if (Number.isFinite(ageUsufruitier) && ageUsufruitier > 0) {
        entry.ageUsufruitier = ageUsufruitier;
      }

      return entry;
    })
    .filter((item): item is SuccessionPerEntry => item !== null);
}

function parseDecesDansXAns(raw: unknown): typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.decesDansXAns {
  return DECES_DANS_X_ANS_VALUES.includes(raw as (typeof DECES_DANS_X_ANS_VALUES)[number])
    ? raw as typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.decesDansXAns
    : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.decesDansXAns;
}

export function parseSuccessionDraftPayload(raw: string): ParsedSuccessionDraftPayload | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed) || !isSupportedSuccessionDraftVersion(parsed.version)) return null;

    const payload = parsed as Record<string, unknown>;
    const version = payload.version as number;

    const formRaw = payload.form;
    if (!isObject(formRaw)) return null;

    const actifNetSuccession = Number(formRaw.actifNetSuccession);
    if (!Number.isFinite(actifNetSuccession) || actifNetSuccession < 0) return null;

    const civilRaw = isObject(payload.civil) ? payload.civil : {};
    const civil = {
      situationMatrimoniale: isSituation(civilRaw.situationMatrimoniale)
        ? civilRaw.situationMatrimoniale
        : DEFAULT_SUCCESSION_CIVIL_CONTEXT.situationMatrimoniale,
      regimeMatrimonial: isRegimeMatrimonial(civilRaw.regimeMatrimonial)
        ? civilRaw.regimeMatrimonial
        : null,
      pacsConvention: isPacsConvention(civilRaw.pacsConvention)
        ? civilRaw.pacsConvention
        : DEFAULT_SUCCESSION_CIVIL_CONTEXT.pacsConvention,
      dateNaissanceEpoux1: normalizeOptionalDate(civilRaw.dateNaissanceEpoux1),
      dateNaissanceEpoux2: normalizeOptionalDate(civilRaw.dateNaissanceEpoux2),
    };

    const liquidationRaw = version !== 1 && isObject(payload.liquidation) ? payload.liquidation : {};
    const liquidation = {
      actifEpoux1: asAmount(liquidationRaw.actifEpoux1, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifEpoux1),
      actifEpoux2: asAmount(liquidationRaw.actifEpoux2, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifEpoux2),
      actifCommun: asAmount(liquidationRaw.actifCommun, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifCommun),
      nbEnfants: asChildrenCount(liquidationRaw.nbEnfants, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.nbEnfants),
    };

    const devolutionRaw = version >= 3 && isObject(payload.devolution) ? payload.devolution : {};
    const legacyEpoux1Testament = getLegacyTestamentConfig(devolutionRaw);
    const parsedTestamentsBySide = version >= 16 && isObject(devolutionRaw.testamentsBySide)
      ? {
        epoux1: parseTestamentConfig(devolutionRaw.testamentsBySide.epoux1),
        epoux2: parseTestamentConfig(devolutionRaw.testamentsBySide.epoux2),
      }
      : {
        epoux1: legacyEpoux1Testament,
        epoux2: {
          ...DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
          particularLegacies: [],
        },
      };
    const parsedAscendantsBySide = version >= 16 && isObject(devolutionRaw.ascendantsSurvivantsBySide)
      ? {
        epoux1: asBoolean(
          devolutionRaw.ascendantsSurvivantsBySide.epoux1,
          DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide.epoux1,
        ),
        epoux2: asBoolean(
          devolutionRaw.ascendantsSurvivantsBySide.epoux2,
          DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide.epoux2,
        ),
      }
      : {
        epoux1: asBoolean(
          devolutionRaw.ascendantsSurvivants,
          DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide.epoux1,
        ),
        epoux2: DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide.epoux2,
      };
    const devolutionBase: SuccessionDevolutionContext = {
      nbEnfantsNonCommuns: asChildrenCount(
        devolutionRaw.nbEnfantsNonCommuns,
        DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.nbEnfantsNonCommuns,
      ),
      choixLegalConjointSansDDV: isChoixLegalConjointSansDDV(devolutionRaw.choixLegalConjointSansDDV)
        ? devolutionRaw.choixLegalConjointSansDDV
        : DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.choixLegalConjointSansDDV,
      testamentsBySide: {
        epoux1: {
          ...parsedTestamentsBySide.epoux1,
          particularLegacies: [...parsedTestamentsBySide.epoux1.particularLegacies],
        },
        epoux2: {
          ...parsedTestamentsBySide.epoux2,
          particularLegacies: [...parsedTestamentsBySide.epoux2.particularLegacies],
        },
      },
      ascendantsSurvivantsBySide: parsedAscendantsBySide,
    };

    const patrimonialRaw = version >= 4 && isObject(payload.patrimonial) ? payload.patrimonial : {};
    const parsedForfaitMobilierMode = (['off', 'auto', 'pct', 'montant'] as const).includes(
      patrimonialRaw.forfaitMobilierMode as 'off' | 'auto' | 'pct' | 'montant',
    )
      ? (patrimonialRaw.forfaitMobilierMode as 'off' | 'auto' | 'pct' | 'montant')
      : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.forfaitMobilierMode;
    const patrimonial = {
      donationsRapportables: asAmount(
        patrimonialRaw.donationsRapportables,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationsRapportables,
      ),
      donationsHorsPart: asAmount(
        patrimonialRaw.donationsHorsPart,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationsHorsPart,
      ),
      legsParticuliers: asAmount(
        patrimonialRaw.legsParticuliers,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.legsParticuliers,
      ),
      donationEntreEpouxActive: asBoolean(
        patrimonialRaw.donationEntreEpouxActive,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationEntreEpouxActive,
      ),
      donationEntreEpouxOption: isDonationEntreEpouxOption(patrimonialRaw.donationEntreEpouxOption)
        ? patrimonialRaw.donationEntreEpouxOption
        : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationEntreEpouxOption,
      preciputMontant: asAmount(
        patrimonialRaw.preciputMontant,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.preciputMontant,
      ),
      attributionIntegrale: asBoolean(
        patrimonialRaw.attributionIntegrale,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.attributionIntegrale,
      ),
      attributionBiensCommunsPct: asPercent(
        patrimonialRaw.attributionBiensCommunsPct,
        asBoolean(patrimonialRaw.attributionIntegrale, false)
          ? 100
          : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.attributionBiensCommunsPct,
      ),
      forfaitMobilierMode: version >= 18
        ? parsedForfaitMobilierMode
        : (parsedForfaitMobilierMode === 'pct' || parsedForfaitMobilierMode === 'montant'
          ? parsedForfaitMobilierMode
          : 'off'),
      forfaitMobilierPct: asAmount(
        patrimonialRaw.forfaitMobilierPct,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.forfaitMobilierPct,
      ),
      forfaitMobilierMontant: asAmount(
        patrimonialRaw.forfaitMobilierMontant,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.forfaitMobilierMontant,
      ),
      abattementResidencePrincipale: asBoolean(
        patrimonialRaw.abattementResidencePrincipale,
        DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.abattementResidencePrincipale,
      ),
      decesDansXAns: parseDecesDansXAns(
        version >= 17 ? patrimonialRaw.decesDansXAns : 0,
      ),
    };

    const enfants = version >= 5 && Array.isArray(payload.enfants)
      ? payload.enfants
        .filter((item): item is Record<string, unknown> => isObject(item))
        .map((item, idx) => ({
          id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `E${idx + 1}`,
          prenom: normalizePrenom(item.prenom),
          rattachement: isEnfantRattachement(item.rattachement) ? item.rattachement : 'commun',
          deceased: asBoolean(item.deceased, false) || undefined,
        }))
      : deriveLegacyEnfants(liquidation, devolutionBase);

    const familyMembers = version >= 7
      ? parseFamilyMembers(payload.familyMembers)
      : [];

    const parsedDonations = version >= 9 && Array.isArray(payload.donations)
      ? parseDonations(payload.donations)
      : deriveLegacyDonations(patrimonial);
    const {
      donations,
      particularLegaciesBySide,
    }: {
      donations: SuccessionDonationEntry[];
      particularLegaciesBySide: Record<SuccessionPrimarySide, SuccessionParticularLegacyEntry[]>;
    } = collectLegacyParticularLegacies(parsedDonations, civil, enfants, familyMembers);

    const devolution: SuccessionDevolutionContext = {
      ...devolutionBase,
      testamentsBySide: {
        epoux1: {
          ...devolutionBase.testamentsBySide.epoux1,
          particularLegacies: [
            ...devolutionBase.testamentsBySide.epoux1.particularLegacies,
            ...particularLegaciesBySide.epoux1,
          ],
        },
        epoux2: {
          ...devolutionBase.testamentsBySide.epoux2,
          particularLegacies: [
            ...devolutionBase.testamentsBySide.epoux2.particularLegacies,
            ...particularLegaciesBySide.epoux2,
          ],
        },
      },
    };

    const assetEntries = version >= 10 && Array.isArray(payload.assetEntries)
      ? parseAssetEntries(payload.assetEntries)
      : deriveLegacyAssetEntries(liquidation);

    const assuranceVieEntries = version >= 10 && Array.isArray(payload.assuranceVieEntries)
      ? parseAssuranceVieEntries(payload.assuranceVieEntries)
      : DEFAULT_SUCCESSION_ASSURANCE_VIE;
    const perEntries = version >= 17 && Array.isArray(payload.perEntries)
      ? parsePerEntries(payload.perEntries)
      : DEFAULT_SUCCESSION_PER;

    return {
      form: {
        actifNetSuccession,
        heritiers: parsePersistedHeirs(formRaw.heritiers),
      },
      civil,
      liquidation,
      devolution,
      patrimonial,
      enfants,
      familyMembers,
      donations,
      assetEntries,
      assuranceVieEntries,
      perEntries,
      groupementFoncierEntries: Array.isArray(payload.groupementFoncierEntries) ? payload.groupementFoncierEntries : [],
      prevoyanceDecesEntries: Array.isArray(payload.prevoyanceDecesEntries) ? payload.prevoyanceDecesEntries : [],
      ui: isObject(payload.ui)
        ? {
          chainOrder: isPrimarySide(payload.ui.chainOrder) ? payload.ui.chainOrder : 'epoux1',
        }
        : {
          chainOrder: 'epoux1',
        },
    };
  } catch {
    return null;
  }
}
