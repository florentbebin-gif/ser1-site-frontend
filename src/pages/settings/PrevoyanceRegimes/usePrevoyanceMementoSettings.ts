import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import {
  useOptionalMementoSaveRegistry,
  type MementoSaveResult,
} from '@/hooks/settings/mementoSaveRegistry';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import {
  createPrevoyanceDraft,
  isPrevoyanceDraft,
  loadPrevoyanceDraft,
  savePrevoyanceDraft,
  type PrevoyanceDraft,
} from './prevoyanceSaveAdapter';

export const PREVOYANCE_MEMENTO_SAVE_TARGET_ID = 'prevoyance-regimes';
const PREVOYANCE_MEMENTO_SAVE_LABEL = 'Prévoyance et régimes';

export type PrevoyanceEditorTarget =
  | { type: 'regime'; value: PrevoyanceRegimeSettings; originalCode?: string }
  | { type: 'maintien'; value: PrevoyanceMaintienEmployeurSettings; originalCode?: string };

function addUniqueCode(codes: readonly string[], code: string): string[] {
  return Array.from(new Set([...codes, code]));
}

function replaceByCode<T extends { code: string }>(
  rows: T[],
  originalCode: string,
  nextRow: T,
): T[] {
  let replaced = false;
  const nextRows = rows.map((row) => {
    if (row.code !== originalCode) return row;
    replaced = true;
    return nextRow;
  });

  if (replaced) return nextRows;
  return nextRows.some((row) => row.code === nextRow.code)
    ? nextRows.map((row) => (row.code === nextRow.code ? nextRow : row))
    : [...nextRows, nextRow];
}

export function usePrevoyanceMementoSettings() {
  const { isAdmin } = useUserRole();
  const saveRegistry = useOptionalMementoSaveRegistry();
  const registerSaveTarget = saveRegistry?.registerTarget;
  const markSaveTargetDirty = saveRegistry?.markDirty;
  const registryTarget = saveRegistry?.targets[PREVOYANCE_MEMENTO_SAVE_TARGET_ID];
  const initialRegistryDraftRef = useRef(registryTarget?.draft);
  const [loading, setLoading] = useState(true);
  const [regimes, setRegimes] = useState<PrevoyanceRegimeSettings[]>(
    isPrevoyanceDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.regimes
      : [],
  );
  const [maintien, setMaintien] = useState<PrevoyanceMaintienEmployeurSettings[]>(
    isPrevoyanceDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.maintien
      : [],
  );
  const [dirtyRegimeCodes, setDirtyRegimeCodes] = useState<string[]>(
    isPrevoyanceDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.dirtyRegimeCodes
      : [],
  );
  const [dirtyMaintienCodes, setDirtyMaintienCodes] = useState<string[]>(
    isPrevoyanceDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.dirtyMaintienCodes
      : [],
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (isPrevoyanceDraft(initialRegistryDraftRef.current)) {
        if (mounted) setLoading(false);
        return;
      }

      const draft = await loadPrevoyanceDraft();
      if (!mounted) return;
      setRegimes(draft.regimes);
      setMaintien(draft.maintien);
      setDirtyRegimeCodes(draft.dirtyRegimeCodes);
      setDirtyMaintienCodes(draft.dirtyMaintienCodes);
      setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (registryTarget?.isDirty === false) {
      setDirtyRegimeCodes([]);
      setDirtyMaintienCodes([]);
    }
  }, [registryTarget?.isDirty]);

  const markPrevoyanceDirty = useCallback((): void => {
    markSaveTargetDirty?.(PREVOYANCE_MEMENTO_SAVE_TARGET_ID);
  }, [markSaveTargetDirty]);

  const applyEditorTarget = useCallback(
    (target: PrevoyanceEditorTarget): void => {
      const originalCode = target.originalCode ?? target.value.code;

      if (target.type === 'regime') {
        setRegimes((current) => replaceByCode(current, originalCode, target.value));
        setDirtyRegimeCodes((current) => addUniqueCode(current, target.value.code));
      } else {
        setMaintien((current) => replaceByCode(current, originalCode, target.value));
        setDirtyMaintienCodes((current) => addUniqueCode(current, target.value.code));
      }
      markPrevoyanceDirty();
    },
    [markPrevoyanceDirty],
  );

  const draft = useMemo(
    () => createPrevoyanceDraft(regimes, maintien, dirtyRegimeCodes, dirtyMaintienCodes),
    [dirtyMaintienCodes, dirtyRegimeCodes, maintien, regimes],
  );

  useEffect(() => {
    if (!registerSaveTarget || loading) return;
    registerSaveTarget({
      id: PREVOYANCE_MEMENTO_SAVE_TARGET_ID,
      label: PREVOYANCE_MEMENTO_SAVE_LABEL,
      draft,
      blockingError: null,
      save: (candidateDraft): Promise<MementoSaveResult> =>
        savePrevoyanceDraft(
          isPrevoyanceDraft(candidateDraft) ? candidateDraft : (draft as PrevoyanceDraft),
          isAdmin,
        ),
    });
  }, [draft, isAdmin, loading, registerSaveTarget]);

  return {
    isAdmin,
    loading,
    regimes,
    maintien,
    applyEditorTarget,
  };
}
