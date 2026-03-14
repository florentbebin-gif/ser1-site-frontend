/**
 * Tests for snapshot migrations + Zod validation (P1-01, updated P1-06-08)
 *
 * Covers:
 * - v1 snapshot → migrated to v4 → valid
 * - v2 snapshot → migrated to v4 → valid
 * - v3 snapshot → migrated to v4 → valid
 * - v4 snapshot → no migration needed → valid
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

const V3_SNAPSHOT = {
  app: 'SER1',
  kind: 'snapshot',
  version: 3,
  meta: {
    savedAt: '2026-02-11T12:00:00.000Z',
    appVersion: '3',
  },
  payload: {
    sims: {
      placement: { capital: 300000 },
      credit: null,
      ir: null,
      strategy: null,
      audit: null,
      per: { versementAnnuel: 5000 },
    },
  },
};

const V4_SNAPSHOT = {
  app: 'SER1',
  kind: 'snapshot',
  version: 4,
  meta: {
    savedAt: '2026-02-28T10:00:00.000Z',
    appVersion: '4',
    fiscal: {
      tax: { updatedAt: '2026-02-01T00:00:00.000Z', hash: 'abc123' },
      ps: { updatedAt: '2026-02-01T00:00:00.000Z', hash: 'def456' },
      fiscality: { updatedAt: '2026-02-01T00:00:00.000Z', hash: 'ghi789' },
    },
  },
  payload: {
    sims: {
      placement: { capital: 400000 },
      credit: null,
      ir: null,
      strategy: null,
      audit: null,
      per: { versementAnnuel: 6000 },
    },
  },
};

// ---------------------------------------------------------------------------
// Migration tests
// ---------------------------------------------------------------------------

describe('snapshotMigrations', () => {
  it('migrates v1 → v4 successfully (3 steps)', () => {
    const result = migrateSnapshot(V1_SNAPSHOT as Record<string, unknown>);

    expect(result.migratedFrom).toBe(1);
    expect(result.migratedTo).toBe(CURRENT_SNAPSHOT_VERSION);
    expect(result.steps).toBe(3);
    expect(result.data.version).toBe(4);

    // Should have appVersion added
    const meta = result.data.meta as Record<string, unknown>;
    expect(meta.appVersion).toBe('pre-v2');
    // v3→v4: fiscal should be null for old files
    expect(meta.fiscal).toBeNull();

    // Should preserve existing sim data
    const payload = result.data.payload as Record<string, unknown>;
    const sims = payload.sims as Record<string, unknown>;
    expect(sims.placement).toEqual({ capital: 100000, duree: 8 });
    expect(sims.ir).toEqual({ revenu: 50000, parts: 1 });

    // Should normalize missing sims to null
    expect(sims.credit).toBeNull();
    expect(sims.strategy).toBeNull();
    expect(sims.audit).toBeNull();
    expect(sims.per).toBeNull();
  });

  it('migrates v2 → v4 successfully (2 steps, adds per + fiscal null)', () => {
    const result = migrateSnapshot(V2_SNAPSHOT as Record<string, unknown>);

    expect(result.migratedFrom).toBe(2);
    expect(result.migratedTo).toBe(CURRENT_SNAPSHOT_VERSION);
    expect(result.steps).toBe(2);
    expect(result.data.version).toBe(4);

    const meta = result.data.meta as Record<string, unknown>;
    expect(meta.fiscal).toBeNull();

    const payload = result.data.payload as Record<string, unknown>;
    const sims = payload.sims as Record<string, unknown>;
    expect(sims.per).toBeNull();
    expect(sims.placement).toEqual({ capital: 200000 });
  });

  it('migrates v3 → v4 successfully (1 step, adds fiscal null)', () => {
    const result = migrateSnapshot(V3_SNAPSHOT as Record<string, unknown>);

    expect(result.migratedFrom).toBe(3);
    expect(result.migratedTo).toBe(CURRENT_SNAPSHOT_VERSION);
    expect(result.steps).toBe(1);
    expect(result.data.version).toBe(4);

    const meta = result.data.meta as Record<string, unknown>;
    expect(meta.fiscal).toBeNull();

    const payload = result.data.payload as Record<string, unknown>;
    const sims = payload.sims as Record<string, unknown>;
    expect(sims.per).toEqual({ versementAnnuel: 5000 });
  });

  it('v4 snapshot requires no migration', () => {
    const result = migrateSnapshot(V4_SNAPSHOT as Record<string, unknown>);

    expect(result.migratedFrom).toBe(4);
    expect(result.migratedTo).toBe(4);
    expect(result.steps).toBe(0);
    expect(result.data).toEqual(V4_SNAPSHOT);
  });

  it('rejects future version with clear message', () => {
    const futureSnapshot = { ...V4_SNAPSHOT, version: 99 };
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
  it('validates a correct v4 snapshot with fiscal identity', () => {
    const result = SnapshotV2Schema.safeParse(V4_SNAPSHOT);
    expect(result.success).toBe(true);
  });

  it('validates a v4 snapshot with fiscal: null', () => {
    const withNullFiscal = {
      ...V4_SNAPSHOT,
      meta: { ...V4_SNAPSHOT.meta, fiscal: null },
    };
    const result = SnapshotV2Schema.safeParse(withNullFiscal);
    expect(result.success).toBe(true);
  });

  it('validates a migrated v1 snapshot', () => {
    const migrated = migrateSnapshot(V1_SNAPSHOT as Record<string, unknown>);
    const result = SnapshotV2Schema.safeParse(migrated.data);
    expect(result.success).toBe(true);
  });

  it('validates a migrated v3 snapshot', () => {
    const migrated = migrateSnapshot(V3_SNAPSHOT as Record<string, unknown>);
    const result = SnapshotV2Schema.safeParse(migrated.data);
    expect(result.success).toBe(true);
  });

  it('rejects wrong app', () => {
    const bad = { ...V4_SNAPSHOT, app: 'OTHER' };
    const result = SnapshotV2Schema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects wrong kind', () => {
    const bad = { ...V4_SNAPSHOT, kind: 'placement' };
    const result = SnapshotV2Schema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects missing payload', () => {
    const bad = { app: 'SER1', kind: 'snapshot', version: 4, meta: { savedAt: '2026-01-01' } };
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

  it('accepts v4 snapshot envelope', () => {
    const result = SnapshotEnvelopeSchema.safeParse(V4_SNAPSHOT);
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
    expect(migrated.steps).toBe(3);

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
      expect(strict.data.payload.sims.per).toBeNull();
      // 5. fiscal should be null (no identity in old file)
      expect(strict.data.meta.fiscal).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// Fiscal identity tests (v4)
// ---------------------------------------------------------------------------

describe('Fiscal identity in v4 snapshots', () => {
  it('preserves fiscal identity through migration-free path', () => {
    const result = migrateSnapshot(V4_SNAPSHOT as Record<string, unknown>);
    expect(result.steps).toBe(0);
    const meta = result.data.meta as Record<string, unknown>;
    const fiscal = meta.fiscal as Record<string, unknown>;
    expect(fiscal).toBeTruthy();
    const tax = fiscal.tax as Record<string, unknown>;
    expect(tax.hash).toBe('abc123');
  });

  it('v3 migration sets fiscal to null', () => {
    const result = migrateSnapshot(V3_SNAPSHOT as Record<string, unknown>);
    const meta = result.data.meta as Record<string, unknown>;
    expect(meta.fiscal).toBeNull();
  });

  it('existing meta.fiscal is preserved during v3→v4 if already present', () => {
    const v3WithFiscal = {
      ...V3_SNAPSHOT,
      meta: { ...V3_SNAPSHOT.meta, fiscal: { tax: { hash: 'existing' } } },
    };
    const result = migrateSnapshot(v3WithFiscal as Record<string, unknown>);
    const meta = result.data.meta as Record<string, unknown>;
    // Migration should preserve existing fiscal if already present
    expect((meta.fiscal as Record<string, unknown>)?.tax).toEqual({ hash: 'existing' });
  });
});
