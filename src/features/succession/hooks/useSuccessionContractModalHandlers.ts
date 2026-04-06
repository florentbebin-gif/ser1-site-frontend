import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  SuccessionAssuranceVieEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';

interface UseContractModalHandlersArgs<T extends { id: string }> {
  entries: T[];
  draft: T | null;
  setEntries: Dispatch<SetStateAction<T[]>>;
  setDraft: Dispatch<SetStateAction<T | null>>;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  numericFields: Array<keyof T>;
  positiveOptionalField?: keyof T;
}

function useContractModalHandlers<T extends { id: string }>({
  entries,
  draft,
  setEntries,
  setDraft,
  setShowModal,
  numericFields,
  positiveOptionalField,
}: UseContractModalHandlersArgs<T>) {
  const openModal = useCallback((id: string) => {
    const entry = entries.find((current) => current.id === id);
    if (!entry) return;
    setDraft({ ...entry });
    setShowModal(true);
  }, [entries, setDraft, setShowModal]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setDraft(null);
  }, [setDraft, setShowModal]);

  const validateModal = useCallback(() => {
    if (!draft) return;
    setEntries((prev) => prev.map((entry) => (entry.id === draft.id ? { ...draft } : entry)));
    setShowModal(false);
    setDraft(null);
  }, [draft, setDraft, setEntries, setShowModal]);

  const updateDraft = useCallback((field: keyof T, value: string | number | undefined) => {
    setDraft((prev) => {
      if (!prev) return null;
      if (numericFields.includes(field)) {
        return { ...prev, [field]: Math.max(0, Number(value) || 0) };
      }
      if (positiveOptionalField === field) {
        const numericValue = Number(value);
        return {
          ...prev,
          [field]: Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined,
        };
      }
      return { ...prev, [field]: value };
    });
  }, [numericFields, positiveOptionalField, setDraft]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, [setEntries]);

  return {
    openModal,
    closeModal,
    validateModal,
    updateDraft,
    removeEntry,
  };
}

interface UseSuccessionContractModalHandlersArgs {
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  assuranceVieDraft: SuccessionAssuranceVieEntry | null;
  setAssuranceVieEntries: Dispatch<SetStateAction<SuccessionAssuranceVieEntry[]>>;
  setAssuranceVieDraft: Dispatch<SetStateAction<SuccessionAssuranceVieEntry | null>>;
  setShowAssuranceVieModal: Dispatch<SetStateAction<boolean>>;
  perEntries: SuccessionPerEntry[];
  perDraft: SuccessionPerEntry | null;
  setPerEntries: Dispatch<SetStateAction<SuccessionPerEntry[]>>;
  setPerDraft: Dispatch<SetStateAction<SuccessionPerEntry | null>>;
  setShowPerModal: Dispatch<SetStateAction<boolean>>;
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  prevoyanceDraft: SuccessionPrevoyanceDecesEntry | null;
  setPrevoyanceDecesEntries: Dispatch<SetStateAction<SuccessionPrevoyanceDecesEntry[]>>;
  setPrevoyanceDraft: Dispatch<SetStateAction<SuccessionPrevoyanceDecesEntry | null>>;
  setShowPrevoyanceModal: Dispatch<SetStateAction<boolean>>;
}

export function useSuccessionContractModalHandlers({
  assuranceVieEntries,
  assuranceVieDraft,
  setAssuranceVieEntries,
  setAssuranceVieDraft,
  setShowAssuranceVieModal,
  perEntries,
  perDraft,
  setPerEntries,
  setPerDraft,
  setShowPerModal,
  prevoyanceDecesEntries,
  prevoyanceDraft,
  setPrevoyanceDecesEntries,
  setPrevoyanceDraft,
  setShowPrevoyanceModal,
}: UseSuccessionContractModalHandlersArgs) {
  const assuranceVieHandlers = useContractModalHandlers({
    entries: assuranceVieEntries,
    draft: assuranceVieDraft,
    setEntries: setAssuranceVieEntries,
    setDraft: setAssuranceVieDraft,
    setShowModal: setShowAssuranceVieModal,
    numericFields: ['capitauxDeces', 'versementsApres70'],
    positiveOptionalField: 'ageUsufruitier',
  });

  const perHandlers = useContractModalHandlers({
    entries: perEntries,
    draft: perDraft,
    setEntries: setPerEntries,
    setDraft: setPerDraft,
    setShowModal: setShowPerModal,
    numericFields: ['capitauxDeces'],
    positiveOptionalField: 'ageUsufruitier',
  });

  const prevoyanceHandlers = useContractModalHandlers({
    entries: prevoyanceDecesEntries,
    draft: prevoyanceDraft,
    setEntries: setPrevoyanceDecesEntries,
    setDraft: setPrevoyanceDraft,
    setShowModal: setShowPrevoyanceModal,
    numericFields: ['capitalDeces', 'dernierePrime'],
  });

  return {
    openAssuranceVieModal: assuranceVieHandlers.openModal,
    closeAssuranceVieModal: assuranceVieHandlers.closeModal,
    validateAssuranceVieModal: assuranceVieHandlers.validateModal,
    updateAssuranceVieDraft: assuranceVieHandlers.updateDraft,
    removeAssuranceVieEntry: assuranceVieHandlers.removeEntry,
    openPerModal: perHandlers.openModal,
    closePerModal: perHandlers.closeModal,
    validatePerModal: perHandlers.validateModal,
    updatePerDraft: perHandlers.updateDraft,
    removePerEntry: perHandlers.removeEntry,
    openPrevoyanceModal: prevoyanceHandlers.openModal,
    closePrevoyanceModal: prevoyanceHandlers.closeModal,
    validatePrevoyanceModal: prevoyanceHandlers.validateModal,
    updatePrevoyanceDraft: prevoyanceHandlers.updateDraft,
    removePrevoyanceDecesEntry: prevoyanceHandlers.removeEntry,
  };
}
