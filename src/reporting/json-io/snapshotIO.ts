/**
 * snapshotIO — Save / Load logic for .ser1 snapshot files (P1-01)
 *
 * Replaces the logic previously in utils/globalStorage.js.
 * - Save: builds payload → stamps version → serializes → File System Access / fallback
 * - Load: parse → envelope validation → migrate → Zod strict validation → restore
 *
 * All error messages are in French (user-facing).
 */

import {
  SNAPSHOT_APP,
  SNAPSHOT_KIND,
  CURRENT_SNAPSHOT_VERSION,
  SnapshotEnvelopeSchema,
  SnapshotV2Schema,
} from './snapshotSchema';
import type { SnapshotV2, SnapshotSims } from './snapshotSchema';
import { migrateSnapshot } from './snapshotMigrations';
import { createTrackedObjectURL } from '../../utils/createTrackedObjectURL';

// ---------------------------------------------------------------------------
// Events & keys (backward-compatible with globalStorage.js)
// ---------------------------------------------------------------------------

export const SNAPSHOT_LOADED_EVENT = 'ser1:snapshot:loaded';
export const SNAPSHOT_LAST_LOADED_KEY = 'ser1:snapshot:lastLoadedName';

// ---------------------------------------------------------------------------
// Sim storage map — sessionStorage keys per simulator
// ---------------------------------------------------------------------------

const SIM_STORAGE_MAP: Record<string, string> = {
  placement: 'ser1:sim:placement',
  credit: 'ser1:sim:credit',
  ir: 'ser1:sim:ir',
  strategy: 'ser1:sim:strategy',
  audit: 'ser1_audit_draft',
  per: 'ser1:sim:per',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function collectSimulatorStates(): SnapshotSims {
  const sims: Record<string, Record<string, unknown> | null> = {};
  for (const [simId, storageKey] of Object.entries(SIM_STORAGE_MAP)) {
    try {
      const raw = sessionStorage.getItem(storageKey);
      sims[simId] = raw ? JSON.parse(raw) : null;
    } catch {
      sims[simId] = null;
    }
  }
  return sims as SnapshotSims;
}

function buildSnapshot(): SnapshotV2 {
  return {
    app: SNAPSHOT_APP,
    kind: SNAPSHOT_KIND,
    version: CURRENT_SNAPSHOT_VERSION,
    meta: {
      savedAt: new Date().toISOString(),
      appVersion: CURRENT_SNAPSHOT_VERSION.toString(),
    },
    payload: {
      sims: collectSimulatorStates(),
    },
  };
}

function generateFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  return `SER1_Snapshot_${date}_${time}.ser1`;
}

// File System Access API types (not yet in lib.dom.d.ts)
type FSWindow = Window & {
  showSaveFilePicker?: (..._args: unknown[]) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (..._args: unknown[]) => Promise<FileSystemFileHandle[]>;
};

function hasFileSystemAccess(): boolean {
  const w = window as FSWindow;
  return (
    typeof window !== 'undefined' &&
    typeof w.showSaveFilePicker === 'function' &&
    typeof w.showOpenFilePicker === 'function'
  );
}

function restoreData(snapshot: SnapshotV2): number {
  const sims = snapshot.payload?.sims ?? {};
  let restoredCount = 0;

  for (const [simId, storageKey] of Object.entries(SIM_STORAGE_MAP)) {
    const value = (sims as Record<string, unknown>)[simId] ?? null;
    try {
      if (value !== null && value !== undefined) {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
      } else {
        sessionStorage.removeItem(storageKey);
      }
      restoredCount++;
    } catch {
      // sessionStorage full or unavailable — skip silently
    }
  }

  return restoredCount;
}

/**
 * Format Zod errors into user-friendly French messages.
 */
function formatZodErrors(error: unknown): string {
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as { issues: Array<{ message: string; path: (string | number)[] }> }).issues;
    if (issues.length > 0) {
      return issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
    }
  }
  return String(error);
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface SaveResult {
  success: boolean;
  message: string;
  filename?: string;
  cancelled?: boolean;
}

export interface LoadResult {
  success: boolean;
  message: string;
  filename?: string;
  cancelled?: boolean;
  requiresReload?: boolean;
  migrated?: boolean;
  migratedFrom?: number;
}

// ---------------------------------------------------------------------------
// SAVE
// ---------------------------------------------------------------------------

export async function saveGlobalState(): Promise<SaveResult> {
  try {
    const snapshot = buildSnapshot();
    const jsonContent = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });

    if (hasFileSystemAccess()) {
      try {
        const handle = await (window as FSWindow).showSaveFilePicker!({
          suggestedName: generateFilename(),
          types: [
            {
              description: 'Dossier SER1',
              accept: { 'application/json': ['.ser1'] },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        const filename = handle.name;
        sessionStorage.setItem('ser1:lastSavedFilename', filename);
        sessionStorage.setItem('ser1:snapshot:lastSavedName', filename);

        return { success: true, message: 'Dossier sauvegardé avec succès.', filename };
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: false, message: '', cancelled: true };
        }
        throw err;
      }
    } else {
      // Fallback for Firefox, Safari
      const url = createTrackedObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFilename();

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sessionStorage.setItem('ser1:lastSavedFilename', link.download);
      sessionStorage.setItem('ser1:snapshot:lastSavedName', link.download);

      return { success: true, message: 'Dossier sauvegardé avec succès.', filename: link.download };
    }
  } catch (error) {
    console.error('[SER1] Erreur de sauvegarde:', error);
    return {
      success: false,
      message: 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.',
    };
  }
}

// ---------------------------------------------------------------------------
// LOAD (from File object)
// ---------------------------------------------------------------------------

export function loadGlobalState(file: File): Promise<LoadResult> {
  return new Promise((resolve) => {
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.ser1') && !filename.endsWith('.json')) {
      resolve({
        success: false,
        message: 'Format de fichier non reconnu. Veuillez sélectionner un fichier .ser1 ou .json.',
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          throw new Error('Contenu du fichier invalide');
        }

        // 1. Parse JSON
        let rawData: unknown;
        try {
          rawData = JSON.parse(content);
        } catch {
          resolve({
            success: false,
            message: 'Le fichier est corrompu ou ne contient pas de JSON valide.',
          });
          return;
        }

        // 2. Validate envelope (loose — accepts any version)
        const envelopeResult = SnapshotEnvelopeSchema.safeParse(rawData);
        if (!envelopeResult.success) {
          resolve({
            success: false,
            message: 'Ce fichier n\'est pas un snapshot SER1 valide. ' +
              formatZodErrors(envelopeResult.error),
          });
          return;
        }

        // 3. Migrate to current version
        let migrationResult;
        try {
          migrationResult = migrateSnapshot(envelopeResult.data as Record<string, unknown>);
        } catch (migErr) {
          resolve({
            success: false,
            message: migErr instanceof Error ? migErr.message : 'Erreur de migration du snapshot.',
          });
          return;
        }

        // 4. Strict validation with current schema
        const strictResult = SnapshotV2Schema.safeParse(migrationResult.data);
        if (!strictResult.success) {
          resolve({
            success: false,
            message: 'Le fichier est invalide après migration. ' +
              formatZodErrors(strictResult.error),
          });
          return;
        }

        // 5. Restore to sessionStorage
        const restoredCount = restoreData(strictResult.data);

        if (restoredCount === 0) {
          resolve({
            success: false,
            message: 'Aucune donnée n\'a pu être restaurée depuis ce fichier.',
          });
          return;
        }

        // 6. Track loaded file
        try {
          sessionStorage.setItem('ser1:loadedFilename', file.name);
          sessionStorage.setItem(SNAPSHOT_LAST_LOADED_KEY, file.name);
        } catch {
          // ignore
        }

        try {
          const evt = new CustomEvent(SNAPSHOT_LOADED_EVENT, { detail: { filename: file.name } });
          window.dispatchEvent(evt);
        } catch {
          // ignore
        }

        const wasMigrated = migrationResult.steps > 0;

        resolve({
          success: true,
          message: wasMigrated
            ? `Dossier "${file.name}" chargé et mis à jour (v${migrationResult.migratedFrom} → v${migrationResult.migratedTo}).`
            : `Dossier "${file.name}" chargé avec succès.`,
          requiresReload: false,
          filename: file.name,
          migrated: wasMigrated,
          migratedFrom: wasMigrated ? migrationResult.migratedFrom : undefined,
        });
      } catch (error) {
        console.error('[SER1] Erreur de chargement:', error);
        resolve({
          success: false,
          message: 'Une erreur inattendue est survenue lors du chargement du fichier.',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        message: 'Impossible de lire le fichier. Vérifiez qu\'il n\'est pas endommagé.',
      });
    };

    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// FILE DIALOG helpers
// ---------------------------------------------------------------------------

export function openFileDialog(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ser1,.json';

    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0];
      resolve(file || null);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

export async function loadGlobalStateWithDialog(): Promise<LoadResult> {
  const file = await openFileDialog();

  if (!file) {
    return { success: false, message: '', cancelled: true };
  }

  return loadGlobalState(file);
}
