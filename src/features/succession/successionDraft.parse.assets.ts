import { normalizeResidencePrincipaleAssetEntries } from './successionAssetValuation';
import { resolveSuccessionAssetLocation } from './successionPatrimonialModel';
import {
  asAmount,
  isAssetCategory,
  isAssuranceVieContractType,
  isGroupementFoncierType,
  isObject,
  isPersonParty,
  isSuccessionAssetLegalNature,
  isSuccessionAssetOrigin,
  isSuccessionMeubleImmeubleLegal,
  normalizeOptionalString,
} from './successionDraft.guards';
import type {
  GroupementFoncierType,
  ParsedSuccessionDraftPayload,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionGroupementFoncierEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from './successionDraft.types';

export function parseAssetEntries(
  rawAssetEntries: unknown,
  civil: ParsedSuccessionDraftPayload['civil'],
): SuccessionAssetDetailEntry[] {
  const parsedEntries = (Array.isArray(rawAssetEntries) ? rawAssetEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const location = resolveSuccessionAssetLocation({
        owner: item.owner,
        pocket: item.pocket,
        situationMatrimoniale: civil.situationMatrimoniale,
        regimeMatrimonial: civil.regimeMatrimonial,
        pacsConvention: civil.pacsConvention,
      });
      if (!location || !isAssetCategory(item.category)) return null;

      const asset: SuccessionAssetDetailEntry = {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id.trim()
            : `asset-${idx + 1}`,
        pocket: location.pocket,
        category: item.category,
        subCategory: normalizeOptionalString(item.subCategory) ?? 'Saisie libre',
        amount: asAmount(item.amount, 0),
      };

      const label = normalizeOptionalString(item.label);
      if (label) asset.label = label;
      asset.legalNature = isSuccessionAssetLegalNature(item.legalNature)
        ? item.legalNature
        : 'non_qualifie';
      asset.origin = isSuccessionAssetOrigin(item.origin) ? item.origin : 'non_precise';
      asset.meubleImmeubleLegal = isSuccessionMeubleImmeubleLegal(item.meubleImmeubleLegal)
        ? item.meubleImmeubleLegal
        : 'non_qualifie';
      const quotePartEpoux1Pct = asAmount(item.quotePartEpoux1Pct, -1);
      if (quotePartEpoux1Pct >= 0) asset.quotePartEpoux1Pct = quotePartEpoux1Pct;

      return asset;
    })
    .filter((item): item is SuccessionAssetDetailEntry => item !== null);

  return normalizeResidencePrincipaleAssetEntries(parsedEntries);
}

export function parseGroupementFoncierEntries(
  rawGroupementFoncierEntries: unknown,
  civil: ParsedSuccessionDraftPayload['civil'],
): SuccessionGroupementFoncierEntry[] {
  return (Array.isArray(rawGroupementFoncierEntries) ? rawGroupementFoncierEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const location = resolveSuccessionAssetLocation({
        owner: item.owner,
        pocket: item.pocket,
        situationMatrimoniale: civil.situationMatrimoniale,
        regimeMatrimonial: civil.regimeMatrimonial,
        pacsConvention: civil.pacsConvention,
      });
      if (!location || !isGroupementFoncierType(item.type)) return null;

      const entry: SuccessionGroupementFoncierEntry = {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id.trim()
            : `gf-${idx + 1}`,
        type: item.type as GroupementFoncierType,
        pocket: location.pocket,
        valeurTotale: asAmount(item.valeurTotale, 0),
      };

      const label = normalizeOptionalString(item.label);
      if (label) entry.label = label;
      const quotePartEpoux1Pct = asAmount(item.quotePartEpoux1Pct, -1);
      if (quotePartEpoux1Pct >= 0) entry.quotePartEpoux1Pct = quotePartEpoux1Pct;

      return entry;
    })
    .filter((item): item is SuccessionGroupementFoncierEntry => item !== null);
}

export function parseAssuranceVieEntries(
  rawAssuranceVieEntries: unknown,
): SuccessionAssuranceVieEntry[] {
  return (Array.isArray(rawAssuranceVieEntries) ? rawAssuranceVieEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const souscripteur = item.souscripteur;
      const assure = item.assure;

      if (
        !isAssuranceVieContractType(item.typeContrat) ||
        !isPersonParty(souscripteur) ||
        !isPersonParty(assure)
      ) {
        return null;
      }

      const entry: SuccessionAssuranceVieEntry = {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id.trim()
            : `av-${idx + 1}`,
        typeContrat: item.typeContrat,
        souscripteur,
        assure,
        capitauxDeces: asAmount(item.capitauxDeces, 0),
        versementsApres70: asAmount(item.versementsApres70, 0),
        versementsAvant13101998: asAmount(item.versementsAvant13101998, 0),
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

export function parsePerEntries(rawPerEntries: unknown): SuccessionPerEntry[] {
  return (Array.isArray(rawPerEntries) ? rawPerEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const assure = item.assure;
      if (!isAssuranceVieContractType(item.typeContrat) || !isPersonParty(assure)) {
        return null;
      }

      const entry: SuccessionPerEntry = {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id.trim()
            : `per-${idx + 1}`,
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

export function parsePrevoyanceDecesEntries(
  rawPrevoyanceDecesEntries: unknown,
): SuccessionPrevoyanceDecesEntry[] {
  return (Array.isArray(rawPrevoyanceDecesEntries) ? rawPrevoyanceDecesEntries : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const souscripteur = item.souscripteur;
      const assure = item.assure;
      if (!isPersonParty(souscripteur) || !isPersonParty(assure)) {
        return null;
      }

      const entry: SuccessionPrevoyanceDecesEntry = {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id.trim()
            : `pv-${idx + 1}`,
        souscripteur,
        assure,
        capitalDeces: asAmount(item.capitalDeces, 0),
        dernierePrime: asAmount(item.dernierePrime, 0),
      };

      const clauseBeneficiaire = normalizeOptionalString(item.clauseBeneficiaire);
      return clauseBeneficiaire ? { ...entry, clauseBeneficiaire } : entry;
    })
    .filter((item): item is SuccessionPrevoyanceDecesEntry => item !== null);
}
