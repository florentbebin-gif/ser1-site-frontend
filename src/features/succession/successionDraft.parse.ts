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
  isChoixLegalConjointSansDDV,
  isDonationEntreEpouxOption,
  isEnfantRattachement,
  isObject,
  isPacsConvention,
  isPrimarySide,
  isRegimeMatrimonial,
  isSituation,
  isSuccessionPreciputMode,
  normalizeOptionalDate,
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
import {
  parseAssetEntries,
  parseAssuranceVieEntries,
  parseDecesDansXAns,
  parseDonations,
  parseFamilyMembers,
  parseGroupementFoncierEntries,
  parseInterMassClaims,
  parseParticipationAcquetsConfig,
  parsePerEntries,
  parsePersistedHeirs,
  parsePreciputSelections,
  parsePrevoyanceDecesEntries,
  parseSocieteAcquetsConfig,
  parseTestamentConfig,
} from './successionDraft.parse.helpers';
import type {
  ParsedSuccessionDraftPayload,
  SuccessionDevolutionContext,
} from './successionDraft.types';

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
      stipulationContraireCU: version >= 25
        ? asBoolean(
          patrimonialRaw.stipulationContraireCU,
          DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.stipulationContraireCU,
        )
        : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.stipulationContraireCU,
      societeAcquets: parseSocieteAcquetsConfig(
        patrimonialRaw.societeAcquets,
        version,
        civil.regimeMatrimonial,
      ),
      participationAcquets: version >= 24
        ? parseParticipationAcquetsConfig(patrimonialRaw.participationAcquets)
        : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.participationAcquets,
      preciputMode: isSuccessionPreciputMode(patrimonialRaw.preciputMode)
        ? patrimonialRaw.preciputMode
        : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.preciputMode,
      preciputSelections: version >= 23
        ? parsePreciputSelections(patrimonialRaw.preciputSelections)
        : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.preciputSelections,
      interMassClaims: version >= 26
        ? parseInterMassClaims(patrimonialRaw.interMassClaims)
        : DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.interMassClaims,
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
      decesDansXAns: parseDecesDansXAns(version >= 17 ? patrimonialRaw.decesDansXAns : 0),
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

    const familyMembers = version >= 7 ? parseFamilyMembers(payload.familyMembers) : [];
    const parsedDonations = version >= 9 && Array.isArray(payload.donations)
      ? parseDonations(payload.donations)
      : deriveLegacyDonations(patrimonial);
    const { donations, particularLegaciesBySide } = collectLegacyParticularLegacies(
      parsedDonations,
      civil,
      enfants,
      familyMembers,
    );

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
      ? parseAssetEntries(payload.assetEntries, civil)
      : deriveLegacyAssetEntries(liquidation, civil.situationMatrimoniale);

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
      groupementFoncierEntries: parseGroupementFoncierEntries(
        payload.groupementFoncierEntries,
        civil,
      ),
      prevoyanceDecesEntries: version >= 18 && Array.isArray(payload.prevoyanceDecesEntries)
        ? parsePrevoyanceDecesEntries(payload.prevoyanceDecesEntries)
        : [],
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
