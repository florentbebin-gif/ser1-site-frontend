import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { RegimeMatrimonial } from '../../engine/civil';
import type {
  PacsConvention,
  SituationMatrimoniale,
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
  SuccessionAssetPocket,
  SuccessionPersonParty,
  SuccessionAssuranceVieEntry,
  SuccessionGroupementFoncierEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from './successionDraft';
import {
  ASSET_SUBCATEGORY_OPTIONS,
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
  RESIDENCE_SECONDAIRE_SUBCATEGORY,
} from './successionSimulator.constants';
import {
  buildAggregateAssetEntries,
  buildAssuranceVieFromAsset,
  buildGroupementFoncierFromAsset,
  buildPerFromAsset,
  buildPrevoyanceFromAsset,
  createAssetId,
} from './successionSimulator.helpers';
import {
  getSuccessionLegacyOwnerFromPocket,
  resolveSuccessionAssetLocation,
  type SuccessionLegacyAssetOwner,
} from './successionPatrimonialModel';

interface UseSuccessionAssetHandlersArgs {
  civilSituation: SituationMatrimoniale;
  regimeMatrimonial: RegimeMatrimonial | null;
  pacsConvention: PacsConvention;
  assetBreakdown: {
    actifs: Record<'epoux1' | 'epoux2' | 'commun', number>;
    passifs: Record<'epoux1' | 'epoux2' | 'commun', number>;
  };
  assetPocketOptions: { value: SuccessionAssetPocket; label: string }[];
  assuranceViePartyOptions: { value: SuccessionPersonParty; label: string }[];
  assetEntries: SuccessionAssetDetailEntry[];
  setAssetEntries: Dispatch<SetStateAction<SuccessionAssetDetailEntry[]>>;
  setGroupementFoncierEntries: Dispatch<SetStateAction<SuccessionGroupementFoncierEntry[]>>;
  setAssuranceVieEntries: Dispatch<SetStateAction<SuccessionAssuranceVieEntry[]>>;
  setAssuranceVieDraft: Dispatch<SetStateAction<SuccessionAssuranceVieEntry | null>>;
  setShowAssuranceVieModal: Dispatch<SetStateAction<boolean>>;
  setPerEntries: Dispatch<SetStateAction<SuccessionPerEntry[]>>;
  setPerDraft: Dispatch<SetStateAction<SuccessionPerEntry | null>>;
  setShowPerModal: Dispatch<SetStateAction<boolean>>;
  setPrevoyanceDecesEntries: Dispatch<SetStateAction<SuccessionPrevoyanceDecesEntry[]>>;
  setPrevoyanceDraft: Dispatch<SetStateAction<SuccessionPrevoyanceDecesEntry | null>>;
  setShowPrevoyanceModal: Dispatch<SetStateAction<boolean>>;
}

export function useSuccessionAssetHandlers({
  civilSituation,
  regimeMatrimonial,
  pacsConvention,
  assetBreakdown,
  assetPocketOptions,
  assuranceViePartyOptions,
  assetEntries,
  setAssetEntries,
  setGroupementFoncierEntries,
  setAssuranceVieEntries,
  setAssuranceVieDraft,
  setShowAssuranceVieModal,
  setPerEntries,
  setPerDraft,
  setShowPerModal,
  setPrevoyanceDecesEntries,
  setPrevoyanceDraft,
  setShowPrevoyanceModal,
}: UseSuccessionAssetHandlersArgs) {
  const resolvePersonParty = useCallback((pocket: SuccessionAssetPocket): SuccessionPersonParty => {
    const owner = getSuccessionLegacyOwnerFromPocket(pocket);
    if (owner !== 'commun') return owner;
    return assuranceViePartyOptions[0]?.value ?? 'epoux1';
  }, [assuranceViePartyOptions]);

  const hasResidencePrincipale = useCallback((
    entries: SuccessionAssetDetailEntry[],
    exceptId?: string,
  ) => entries.some((entry) => (
    entry.id !== exceptId
    && entry.category === 'immobilier'
    && entry.subCategory === RESIDENCE_PRINCIPALE_SUBCATEGORY
  )), []);

  const setSimplifiedBalanceField = useCallback((
    type: 'actifs' | 'passifs',
    owner: SuccessionLegacyAssetOwner,
    value: number,
  ) => {
    setAssetEntries(buildAggregateAssetEntries({
      actifs: {
        epoux1: owner === 'epoux1' && type === 'actifs' ? Math.max(0, value) : assetBreakdown.actifs.epoux1,
        epoux2: owner === 'epoux2' && type === 'actifs' ? Math.max(0, value) : assetBreakdown.actifs.epoux2,
        commun: owner === 'commun' && type === 'actifs' ? Math.max(0, value) : assetBreakdown.actifs.commun,
      },
      passifs: {
        epoux1: owner === 'epoux1' && type === 'passifs' ? Math.max(0, value) : assetBreakdown.passifs.epoux1,
        epoux2: owner === 'epoux2' && type === 'passifs' ? Math.max(0, value) : assetBreakdown.passifs.epoux2,
        commun: owner === 'commun' && type === 'passifs' ? Math.max(0, value) : assetBreakdown.passifs.commun,
      },
    }, {
      situationMatrimoniale: civilSituation,
      regimeMatrimonial,
      pacsConvention,
    }));
  }, [assetBreakdown, civilSituation, pacsConvention, regimeMatrimonial, setAssetEntries]);

  const addAssetEntry = useCallback((category: SuccessionAssetCategory) => {
    setAssetEntries((prev) => {
      const nextSubCategory = category === 'immobilier' && hasResidencePrincipale(prev)
        ? RESIDENCE_SECONDAIRE_SUBCATEGORY
        : ASSET_SUBCATEGORY_OPTIONS[category][0] ?? 'Saisie libre';
      return [
        ...prev,
        {
          id: createAssetId(),
          pocket: (resolveSuccessionAssetLocation({
            pocket: assetPocketOptions[0]?.value ?? 'epoux1',
            situationMatrimoniale: civilSituation,
            regimeMatrimonial,
            pacsConvention,
          }) ?? {
            pocket: 'epoux1' as const,
          }).pocket,
          category,
          subCategory: nextSubCategory,
          amount: 0,
        },
      ];
    });
  }, [assetPocketOptions, civilSituation, hasResidencePrincipale, pacsConvention, regimeMatrimonial, setAssetEntries]);

  const updateAssetEntry = useCallback((
    id: string,
    field: keyof SuccessionAssetDetailEntry,
    value: string | number,
  ) => {
    if (field === 'subCategory') {
      const sourceEntry = assetEntries.find((entry) => entry.id === id);
      if (value === 'GFA/GFV' || value === 'GFF/GF') {
        setAssetEntries((prev) => prev.filter((entry) => entry.id !== id));
        setGroupementFoncierEntries((prev) => [...prev, buildGroupementFoncierFromAsset(sourceEntry, value)]);
        return;
      }
      if (value === 'Assurance vie') {
        const draft = buildAssuranceVieFromAsset(
          sourceEntry,
          resolvePersonParty(sourceEntry?.pocket ?? 'epoux1'),
        );
        setAssetEntries((prev) => prev.filter((entry) => entry.id !== id));
        setAssuranceVieEntries((prev) => [...prev, draft]);
        setAssuranceVieDraft({ ...draft });
        setShowAssuranceVieModal(true);
        return;
      }
      if (value === 'PER assurance') {
        const draft = buildPerFromAsset(
          sourceEntry,
          resolvePersonParty(sourceEntry?.pocket ?? 'epoux1'),
        );
        setAssetEntries((prev) => prev.filter((entry) => entry.id !== id));
        setPerEntries((prev) => [...prev, draft]);
        setPerDraft({ ...draft });
        setShowPerModal(true);
        return;
      }
      if (value === 'Prévoyance décès') {
        const draft = buildPrevoyanceFromAsset(
          sourceEntry,
          resolvePersonParty(sourceEntry?.pocket ?? 'epoux1'),
        );
        setAssetEntries((prev) => prev.filter((entry) => entry.id !== id));
        setPrevoyanceDecesEntries((prev) => [...prev, draft]);
        setPrevoyanceDraft({ ...draft });
        setShowPrevoyanceModal(true);
        return;
      }
    }

    setAssetEntries((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      if (field === 'amount') {
        return {
          ...entry,
          amount: Math.max(0, Number(value) || 0),
        };
      }
      if (field === 'category') {
        const category = value as SuccessionAssetCategory;
        const nextSubCategory = category === 'immobilier' && hasResidencePrincipale(prev, id)
          ? RESIDENCE_SECONDAIRE_SUBCATEGORY
          : ASSET_SUBCATEGORY_OPTIONS[category][0] ?? 'Saisie libre';
        return {
          ...entry,
          category,
          subCategory: nextSubCategory,
        };
      }
      if (field === 'subCategory') {
        const nextSubCategory = value === RESIDENCE_PRINCIPALE_SUBCATEGORY && hasResidencePrincipale(prev, id)
          ? RESIDENCE_SECONDAIRE_SUBCATEGORY
          : value;
        return {
          ...entry,
          subCategory: String(nextSubCategory),
        };
      }
      if (field === 'pocket') {
        const location = resolveSuccessionAssetLocation({
          pocket: value,
          situationMatrimoniale: civilSituation,
          regimeMatrimonial,
          pacsConvention,
        });
        return location ? { ...entry, pocket: location.pocket } : entry;
      }
      return {
        ...entry,
        [field]: value,
      };
    }));
  }, [
    assetEntries,
    civilSituation,
    hasResidencePrincipale,
    pacsConvention,
    regimeMatrimonial,
    resolvePersonParty,
    setAssetEntries,
    setAssuranceVieDraft,
    setAssuranceVieEntries,
    setGroupementFoncierEntries,
    setPerDraft,
    setPerEntries,
    setPrevoyanceDraft,
    setPrevoyanceDecesEntries,
    setShowAssuranceVieModal,
    setShowPerModal,
    setShowPrevoyanceModal,
  ]);

  const removeAssetEntry = useCallback((id: string) => {
    setAssetEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, [setAssetEntries]);

  return {
    setSimplifiedBalanceField,
    addAssetEntry,
    updateAssetEntry,
    removeAssetEntry,
  };
}
