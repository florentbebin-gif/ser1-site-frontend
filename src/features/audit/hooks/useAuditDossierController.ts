import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from 'react';

import type { DossierAudit } from '@/domain/audit/types';
import { createEmptyDossier, ensureDossierAuditUuid } from '@/domain/audit/types';
import {
  buildDossierPatrimonialFromAudit,
  mergeDossierPatrimonialIntoAuditDraft,
} from '@/domain/dossier';
import { useDossierPatrimonialPersistence } from '@/hooks/useDossierPatrimonialPersistence';
import { onResetEvent } from '@/utils/reset';

import { buildAuditLandingViewModel, type AuditLandingViewModel } from '../auditLandingViewModel';
import {
  clearDraftFromSession,
  exportDossierToFile,
  importDossierFromFile,
  loadDraftFromSession,
  saveDraftToSession,
  setupBeforeUnloadWarning,
} from '../utils/storage';

const SAVE_EVENT = 'ser1:save';
const LOAD_EVENT = 'ser1:load';

export interface AuditDossierController {
  dossier: DossierAudit;
  viewModel: AuditLandingViewModel;
  fileInputRef: RefObject<HTMLInputElement | null>;
  updateDossier: (updater: (previous: DossierAudit) => DossierAudit) => void;
  handleImport: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
}

function readSessionDraft(): DossierAudit {
  const stored = loadDraftFromSession();
  return stored ? ensureDossierAuditUuid(stored) : createEmptyDossier();
}

export function useAuditDossierController(): AuditDossierController {
  const [dossier, setDossier] = useState<DossierAudit>(readSessionDraft);
  const [hasInitialSessionDraft] = useState(() => Boolean(loadDraftFromSession()));
  const [hasChanges, setHasChanges] = useState(false);
  const hasLoadedCentralDossierRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ownerUserId, saveDossier, loadLatestDossier } = useDossierPatrimonialPersistence();

  const dossierPatrimonial = useMemo(
    () => buildDossierPatrimonialFromAudit(dossier, { ownerUserId }),
    [dossier, ownerUserId],
  );

  const viewModel = useMemo(
    () => buildAuditLandingViewModel(dossierPatrimonial),
    [dossierPatrimonial],
  );

  useEffect(() => {
    if (
      !ownerUserId ||
      hasChanges ||
      hasInitialSessionDraft ||
      hasLoadedCentralDossierRef.current
    ) {
      return undefined;
    }

    let cancelled = false;
    hasLoadedCentralDossierRef.current = true;

    async function hydrateFromCentralDossier(): Promise<void> {
      const result = await loadLatestDossier();
      if (cancelled || !result.ok) return;
      setDossier((previous) => mergeDossierPatrimonialIntoAuditDraft(result.dossier, previous));
    }

    void hydrateFromCentralDossier();

    return () => {
      cancelled = true;
    };
  }, [hasChanges, hasInitialSessionDraft, loadLatestDossier, ownerUserId]);

  useEffect(() => {
    if (hasChanges) saveDraftToSession(dossier);
  }, [dossier, hasChanges]);

  useEffect(() => setupBeforeUnloadWarning(() => hasChanges), [hasChanges]);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId: string }) => {
      if (simId !== 'audit') return;
      clearDraftFromSession();
      setDossier(createEmptyDossier());
      setHasChanges(false);
    });
    return off || (() => {});
  }, []);

  const saveCurrentDossier = useCallback(async () => {
    exportDossierToFile(dossier);
    await saveDossier(dossierPatrimonial);
    setHasChanges(false);
  }, [dossier, dossierPatrimonial, saveDossier]);

  useEffect(() => {
    const handler = () => {
      if (window.location.pathname === '/audit') void saveCurrentDossier();
    };
    window.addEventListener(SAVE_EVENT, handler);
    return () => window.removeEventListener(SAVE_EVENT, handler);
  }, [saveCurrentDossier]);

  useEffect(() => {
    const handler = () => {
      if (window.location.pathname === '/audit') fileInputRef.current?.click();
    };
    window.addEventListener(LOAD_EVENT, handler);
    return () => window.removeEventListener(LOAD_EVENT, handler);
  }, []);

  const updateDossier = useCallback((updater: (previous: DossierAudit) => DossierAudit) => {
    setDossier((previous) => ({
      ...updater(previous),
      dateModification: new Date().toISOString(),
    }));
    setHasChanges(true);
  }, []);

  const handleImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importDossierFromFile(file);
      setDossier(ensureDossierAuditUuid(imported));
      setHasChanges(false);
    } catch (error) {
      window.alert((error as Error).message);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return {
    dossier,
    viewModel,
    fileInputRef,
    updateDossier,
    handleImport,
  };
}
