/**
 * snapshotSchema — Zod schemas for SER1 .ser1 snapshot files (P1-01)
 *
 * Defines the canonical structure of a snapshot file with strict
 * validation. Each schema version is immutable once released.
 *
 * Current version: 2
 * Migration path: v1 → v2 (see snapshotMigrations.ts)
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SNAPSHOT_APP = 'SER1' as const;
export const SNAPSHOT_KIND = 'snapshot' as const;
export const CURRENT_SNAPSHOT_VERSION = 2;

// ---------------------------------------------------------------------------
// Sim data schemas (payload.sims.*)
// Each sim's internal data is opaque (Record<string, unknown>) because
// the sim pages own their own state shape. We validate presence, not content.
// ---------------------------------------------------------------------------

const SimDataSchema = z.record(z.string(), z.unknown()).nullable();

// ---------------------------------------------------------------------------
// V2 Schema (current) — canonical structure
// ---------------------------------------------------------------------------

export const SnapshotMetaSchema = z.object({
  savedAt: z.string(),
  appVersion: z.string().optional(),
});

export const SnapshotSimsSchema = z.object({
  placement: SimDataSchema.optional().default(null),
  credit: SimDataSchema.optional().default(null),
  ir: SimDataSchema.optional().default(null),
  strategy: SimDataSchema.optional().default(null),
  audit: SimDataSchema.optional().default(null),
});

export const SnapshotPayloadSchema = z.object({
  sims: SnapshotSimsSchema,
});

export const SnapshotV2Schema = z.object({
  app: z.literal(SNAPSHOT_APP),
  kind: z.literal(SNAPSHOT_KIND),
  version: z.literal(CURRENT_SNAPSHOT_VERSION),
  meta: SnapshotMetaSchema,
  payload: SnapshotPayloadSchema,
});

// ---------------------------------------------------------------------------
// Loose schema for initial parsing (accepts any version)
// ---------------------------------------------------------------------------

export const SnapshotEnvelopeSchema = z.object({
  app: z.literal(SNAPSHOT_APP),
  kind: z.literal(SNAPSHOT_KIND),
  version: z.number().int().min(1),
  meta: z.record(z.string(), z.unknown()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type SnapshotV2 = z.infer<typeof SnapshotV2Schema>;
export type SnapshotEnvelope = z.infer<typeof SnapshotEnvelopeSchema>;
export type SnapshotMeta = z.infer<typeof SnapshotMetaSchema>;
export type SnapshotSims = z.infer<typeof SnapshotSimsSchema>;
