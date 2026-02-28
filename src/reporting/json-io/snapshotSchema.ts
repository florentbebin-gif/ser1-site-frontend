/**
 * snapshotSchema — Zod schemas for SER1 .ser1 snapshot files (P1-01)
 *
 * Defines the canonical structure of a snapshot file with strict
 * validation. Each schema version is immutable once released.
 *
 * Current version: 4
 * Migration path: v1 → v2 → v3 → v4 (see snapshotMigrations.ts)
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SNAPSHOT_APP = 'SER1' as const;
export const SNAPSHOT_KIND = 'snapshot' as const;
export const CURRENT_SNAPSHOT_VERSION = 4;

// ---------------------------------------------------------------------------
// Sim data schemas (payload.sims.*)
// Each sim's internal data is opaque (Record<string, unknown>) because
// the sim pages own their own state shape. We validate presence, not content.
// ---------------------------------------------------------------------------

const SimDataSchema = z.record(z.string(), z.unknown()).nullable();

// ---------------------------------------------------------------------------
// Fiscal identity sub-schema (v4+)
// Stores the identity (updated_at + hash) of each settings table at save time.
// Allows detecting when parameters changed between save and reload.
// ---------------------------------------------------------------------------

const FiscalSettingEntrySchema = z.object({
  updatedAt: z.string().nullable().optional(),
  hash: z.string().nullable().optional(),
});

export const FiscalIdentitySchema = z.object({
  tax: FiscalSettingEntrySchema.optional(),
  ps: FiscalSettingEntrySchema.optional(),
  fiscality: FiscalSettingEntrySchema.optional(),
}).nullable().optional();

// ---------------------------------------------------------------------------
// V4 Schema (current) — canonical structure
// ---------------------------------------------------------------------------

export const SnapshotMetaSchema = z.object({
  savedAt: z.string(),
  appVersion: z.string().optional(),
  fiscal: FiscalIdentitySchema,
});

export const SnapshotSimsSchema = z.object({
  placement: SimDataSchema.optional().default(null),
  credit: SimDataSchema.optional().default(null),
  ir: SimDataSchema.optional().default(null),
  strategy: SimDataSchema.optional().default(null),
  audit: SimDataSchema.optional().default(null),
  per: SimDataSchema.optional().default(null),
});

export const SnapshotPayloadSchema = z.object({
  sims: SnapshotSimsSchema,
});

export const SnapshotV4Schema = z.object({
  app: z.literal(SNAPSHOT_APP),
  kind: z.literal(SNAPSHOT_KIND),
  version: z.literal(CURRENT_SNAPSHOT_VERSION),
  meta: SnapshotMetaSchema,
  payload: SnapshotPayloadSchema,
});

// Backward-compatible aliases
export const SnapshotV3Schema = SnapshotV4Schema;
export const SnapshotV2Schema = SnapshotV4Schema;

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

export type SnapshotV4 = z.infer<typeof SnapshotV4Schema>;
export type SnapshotV3 = SnapshotV4;
export type SnapshotV2 = SnapshotV4;
export type SnapshotEnvelope = z.infer<typeof SnapshotEnvelopeSchema>;
export type SnapshotMeta = z.infer<typeof SnapshotMetaSchema>;
export type SnapshotSims = z.infer<typeof SnapshotSimsSchema>;
export type FiscalIdentity = z.infer<typeof FiscalIdentitySchema>;
