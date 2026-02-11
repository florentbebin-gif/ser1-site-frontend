/**
 * Tests for snapshot migrations + Zod validation (P1-01)
 *
 * Covers:
 * - v1 snapshot → migrated to v2 → valid
 * - v2 snapshot → no migration needed → valid
 * - Invalid snapshot → clear error
 * - Future version → clear error
 * - Missing fields → clear error
 */

import { describe, it, expect } from 'vitest';
import { migrateSnapshot } from '../snapshotMigrations';
import {
  SnapshotV2Schema,
  SnapshotEnvelopeSchema,
  CURRENT_SNAPSHOT_VERSION,
} from '../snapshotSchema';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const V1_SNAPSHOT = {
  app: 'SER1',
  kind: 'snapshot',
  version: 1,
  meta: {
    savedAt: '2026-01-15T10:00:00.000Z',
  },
  payload: {
    sims: {
      placement: { capital: 100000, duree: 8 },
      credit: null,
      ir: { revenu: 50000, parts: 1 },
    },
  },
};

const V2_SNAPSHOT = {
  app: 'SER1',
  kind: 'snapshot',
  version: 2,
  meta: {
    savedAt: '2026-02-11T10:00:00.000Z',
    appVersion: '2',
  },
  payload: {
    sims: {
      placement: { capital: 200000 },
      credit: null,
      ir: null,
      strategy: null,
      audit: null,
    },
  },
};

// ---------------------------------------------------------------------------
// Migration tests
// ---------------------------------------------------------------------------

describe('snapshotMigrations', () => {
  it('migrates v1 → v2 successfully', () => {
    const result = migrateSnapshot(V1_SNAPSHOT as Record<string, unknown>);

    expect(result.migratedFrom).toBe(1);
    expect(result.migratedTo).toBe(CURRENT_SNAPSHOT_VERSION);
    expect(result.steps).toBe(1);
    expect(result.data.version).toBe(2);

    // Should have appVersion added
    const meta = result.data.meta as Record<string, unknown>;
    expect(meta.appVersion).toBe('pre-v2');

    // Should preserve existing sim data
    const payload = result.data.payload as Record<string, unknown>;
    const sims = payload.sims as Record<string, unknown>;
    expect(sims.placement).toEqual({ capital: 100000, duree: 8 });
    expect(sims.ir).toEqual({ revenu: 50000, parts: 1 });

    // Should normalize missing sims to null
    expect(sims.credit).toBeNull();
    expect(sims.strategy).toBeNull();
    expect(sims.audit).toBeNull();
  });

  it('v2 snapshot requires no migration', () => {
    const result = migrateSnapshot(V2_SNAPSHOT as Record<string, unknown>);

    expect(result.migratedFrom).toBe(2);
    expect(result.migratedTo).toBe(2);
    expect(result.steps).toBe(0);
    expect(result.data).toEqual(V2_SNAPSHOT);
  });

  it('rejects future version with clear message', () => {
    const futureSnapshot = { ...V2_SNAPSHOT, version: 99 };
    expect(() => migrateSnapshot(futureSnapshot as Record<string, unknown>)).toThrow(
      /version plus récente/
    );
  });

  it('rejects missing version', () => {
    const noVersion = { app: 'SER1', kind: 'snapshot', payload: {} };
    expect(() => migrateSnapshot(noVersion as Record<string, unknown>)).toThrow(
      /invalide ou manquante/
    );
  });

  it('rejects version 0', () => {
    const v0 = { ...V1_SNAPSHOT, version: 0 };
    expect(() => migrateSnapshot(v0 as Record<string, unknown>)).toThrow(
      /invalide ou manquante/
    );
  });
});

// ---------------------------------------------------------------------------
// Zod schema validation tests
// ---------------------------------------------------------------------------

describe('SnapshotV2Schema (Zod)', () => {
  it('validates a correct v2 snapshot', () => {
    const result = SnapshotV2Schema.safeParse(V2_SNAPSHOT);
    expect(result.success).toBe(true);
  });

  it('validates a migrated v1 snapshot', () => {
    const migrated = migrateSnapshot(V1_SNAPSHOT as Record<string, unknown>);
    const result = SnapshotV2Schema.safeParse(migrated.data);
    expect(result.success).toBe(true);
  });

  it('rejects wrong app', () => {
    const bad = { ...V2_SNAPSHOT, app: 'OTHER' };
    const result = SnapshotV2Schema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects wrong kind', () => {
    const bad = { ...V2_SNAPSHOT, kind: 'placement' };
    const result = SnapshotV2Schema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects missing payload', () => {
    const bad = { app: 'SER1', kind: 'snapshot', version: 2, meta: { savedAt: '2026-01-01' } };
    const result = SnapshotV2Schema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Envelope schema tests
// ---------------------------------------------------------------------------

describe('SnapshotEnvelopeSchema (Zod)', () => {
  it('accepts v1 snapshot envelope', () => {
    const result = SnapshotEnvelopeSchema.safeParse(V1_SNAPSHOT);
    expect(result.success).toBe(true);
  });

  it('accepts v2 snapshot envelope', () => {
    const result = SnapshotEnvelopeSchema.safeParse(V2_SNAPSHOT);
    expect(result.success).toBe(true);
  });

  it('rejects non-SER1 file', () => {
    const bad = { app: 'EXCEL', kind: 'spreadsheet', version: 1 };
    const result = SnapshotEnvelopeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects completely invalid data', () => {
    const result = SnapshotEnvelopeSchema.safeParse('not an object');
    expect(result.success).toBe(false);
  });

  it('rejects null', () => {
    const result = SnapshotEnvelopeSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Integration: full pipeline v1 → migrate → validate → ready
// ---------------------------------------------------------------------------

describe('Full pipeline: v1 load → migrate → validate', () => {
  it('v1 file with partial data loads correctly', () => {
    const v1Minimal = {
      app: 'SER1',
      kind: 'snapshot',
      version: 1,
      meta: { savedAt: '2025-06-01T00:00:00Z' },
      payload: { sims: {} },
    };

    // 1. Envelope check
    const envelope = SnapshotEnvelopeSchema.safeParse(v1Minimal);
    expect(envelope.success).toBe(true);

    // 2. Migrate
    const migrated = migrateSnapshot(v1Minimal as Record<string, unknown>);
    expect(migrated.steps).toBe(1);

    // 3. Strict validate
    const strict = SnapshotV2Schema.safeParse(migrated.data);
    expect(strict.success).toBe(true);

    if (strict.success) {
      // 4. All sims should be null (empty file)
      expect(strict.data.payload.sims.placement).toBeNull();
      expect(strict.data.payload.sims.credit).toBeNull();
      expect(strict.data.payload.sims.ir).toBeNull();
      expect(strict.data.payload.sims.strategy).toBeNull();
      expect(strict.data.payload.sims.audit).toBeNull();
    }
  });
});
