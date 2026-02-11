/**
 * globalStorage — Thin re-export wrapper for backward compatibility
 *
 * All logic has been moved to src/reporting/json-io/ (P1-01).
 * This file exists so that existing imports from '@/utils/globalStorage'
 * continue to work without changes.
 */

export {
  saveGlobalState,
  loadGlobalState,
  loadGlobalStateWithDialog,
  openFileDialog,
  SNAPSHOT_LOADED_EVENT,
  SNAPSHOT_LAST_LOADED_KEY,
} from '../reporting/json-io/index';
