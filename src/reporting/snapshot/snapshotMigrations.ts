/**
 * snapshotMigrations — Migration registry for .ser1 snapshot files (P1-01)
 *
 * Each migration transforms a snapshot from version N to version N+1.
 * Migrations are applied in chain: v1 → v2 → ... → vCurrent.
 *
 * Rules:
 * - Migrations are pure functions (no side effects)
 * - Once released, a migration is IMMUTABLE
 * - Each migration receives the raw object and returns the upgraded object
 * - Forward-only (no rollback needed — old app just refuses newer versions)
 */

import { CURRENT_SNAPSHOT_VERSION, SNAPSHOT_APP, SNAPSHOT_KIND } from './snapshotSchema';

// ---------------------------------------------------------------------------
// Migration type
// ---------------------------------------------------------------------------

type MigrationFn = (_input: Record<string, unknown>) => Record<string, unknown>;

// ---------------------------------------------------------------------------
// Registry: version N → function that upgrades to N+1
// ---------------------------------------------------------------------------

const migrations: Record<number, MigrationFn> = {
  /**
   * v1 → v2
   * - Ensure meta.appVersion exists (set to 'pre-v2' for legacy files)
   * - Normalize sims keys (add missing keys as null)
   * - Bump version to 2
   */
  1: (input) => {
    const meta = (input.meta ?? {}) as Record<string, unknown>;
    const payload = (input.payload ?? {}) as Record<string, unknown>;
    const sims = (payload.sims ?? {}) as Record<string, unknown>;

    return {
      app: SNAPSHOT_APP,
      kind: SNAPSHOT_KIND,
      version: 2,
      meta: {
        ...meta,
        savedAt: meta.savedAt ?? new Date().toISOString(),
        appVersion: meta.appVersion ?? 'pre-v2',
      },
      payload: {
        ...payload,
        sims: {
          placement: sims.placement ?? null,
          credit: sims.credit ?? null,
          ir: sims.ir ?? null,
          strategy: sims.strategy ?? null,
          audit: sims.audit ?? null,
        },
      },
    };
  },

  /**
   * v2 → v3
   * - Add per sim key (null by default)
   * - Bump version to 3
   */
  2: (input) => {
    const payload = (input.payload ?? {}) as Record<string, unknown>;
    const sims = (payload.sims ?? {}) as Record<string, unknown>;

    return {
      ...input,
      version: 3,
      payload: {
        ...payload,
        sims: {
          ...sims,
          per: sims.per ?? null,
        },
      },
    };
  },

  /**
   * v3 → v4
   * - Initialize meta.fiscal to null (no identity recorded in old files)
   * - Bump version to 4
   */
  3: (input) => {
    const meta = (input.meta ?? {}) as Record<string, unknown>;

    return {
      ...input,
      version: 4,
      meta: {
        ...meta,
        fiscal: meta.fiscal ?? null,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MigrationResult {
  data: Record<string, unknown>;
  migratedFrom: number;
  migratedTo: number;
  steps: number;
}

/**
 * Apply all necessary migrations to bring a snapshot to the current version.
 *
 * @param raw - Parsed JSON object with at least a `version` field
 * @returns MigrationResult with the upgraded data
 * @throws Error if a required migration is missing
 */
export function migrateSnapshot(raw: Record<string, unknown>): MigrationResult {
  const startVersion = Number(raw.version ?? 0);

  if (startVersion < 1) {
    throw new Error('Version du snapshot invalide ou manquante.');
  }

  if (startVersion > CURRENT_SNAPSHOT_VERSION) {
    throw new Error(
      `Ce fichier a été créé avec une version plus récente de SER1 (v${startVersion}). ` +
      `Mettez à jour l'application (version actuelle : v${CURRENT_SNAPSHOT_VERSION}).`
    );
  }

  if (startVersion === CURRENT_SNAPSHOT_VERSION) {
    return { data: raw, migratedFrom: startVersion, migratedTo: startVersion, steps: 0 };
  }

  let current = { ...raw };
  let version = startVersion;

  while (version < CURRENT_SNAPSHOT_VERSION) {
    const migrateFn = migrations[version];
    if (!migrateFn) {
      throw new Error(
        `Migration manquante : v${version} → v${version + 1}. ` +
        'Contactez le support technique.'
      );
    }
    current = migrateFn(current);
    version++;
  }

  return {
    data: current,
    migratedFrom: startVersion,
    migratedTo: CURRENT_SNAPSHOT_VERSION,
    steps: CURRENT_SNAPSHOT_VERSION - startVersion,
  };
}
