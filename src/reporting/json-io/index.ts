/**
 * json-io — Public API for .ser1 snapshot file handling (P1-01)
 *
 * Re-exports everything consumers need. Import from '@/reporting/json-io'.
 */

// Schema & types
export {
  SNAPSHOT_APP,
  SNAPSHOT_KIND,
  CURRENT_SNAPSHOT_VERSION,
  SnapshotV4Schema,
  SnapshotV2Schema,
  SnapshotEnvelopeSchema,
  FiscalIdentitySchema,
} from './snapshotSchema';
export type { SnapshotV4, SnapshotV2, SnapshotEnvelope, SnapshotMeta, SnapshotSims, FiscalIdentity } from './snapshotSchema';

// Migrations
export { migrateSnapshot } from './snapshotMigrations';
export type { MigrationResult } from './snapshotMigrations';

// IO (save / load)
export {
  saveGlobalState,
  loadGlobalState,
  loadGlobalStateWithDialog,
  openFileDialog,
  SNAPSHOT_LOADED_EVENT,
  SNAPSHOT_LAST_LOADED_KEY,
} from './snapshotIO';
export type { SaveResult, LoadResult } from './snapshotIO';
