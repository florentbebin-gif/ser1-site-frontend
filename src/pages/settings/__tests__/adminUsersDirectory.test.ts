import { describe, expect, it } from 'vitest';
import {
  ALL_CABINETS_FILTER,
  NO_CABINET_FILTER,
  buildCabinetFilterItems,
  filterAdminUsersByDirectory,
} from '../utils/adminUsersDirectory';

const CABINETS = [
  { id: 'cabinet-alpha', name: 'Alpha' },
  { id: 'cabinet-mako', name: 'MAKO' },
];

const USERS = [
  { id: 'user-1', email: 'client@example.com', cabinet_id: 'cabinet-alpha' },
  { id: 'user-2', email: 'florent.bebin@orange.fr', cabinet_id: 'cabinet-mako' },
  { id: 'user-3', email: 'sans-cabinet@example.com', cabinet_id: null },
  { id: 'user-4', email: 'autre-client@example.com', cabinet_id: 'cabinet-alpha' },
];

describe('adminUsersDirectory', () => {
  it('calcule les compteurs globaux par cabinet', () => {
    expect(buildCabinetFilterItems({ users: USERS, cabinets: CABINETS })).toEqual([
      { id: ALL_CABINETS_FILTER, label: 'Tous', count: 4 },
      { id: NO_CABINET_FILTER, label: 'Sans cabinet', count: 1 },
      { id: 'cabinet-alpha', label: 'Alpha', count: 2 },
      { id: 'cabinet-mako', label: 'MAKO', count: 1 },
    ]);
  });

  it('combine recherche email et filtre cabinet sans modifier les compteurs', () => {
    const filtered = filterAdminUsersByDirectory(USERS, {
      searchEmail: 'client',
      cabinetFilter: 'cabinet-alpha',
    });

    expect(filtered.map((user) => user.id)).toEqual(['user-1', 'user-4']);
  });

  it('filtre les utilisateurs sans cabinet', () => {
    const filtered = filterAdminUsersByDirectory(USERS, {
      searchEmail: '',
      cabinetFilter: NO_CABINET_FILTER,
    });

    expect(filtered.map((user) => user.id)).toEqual(['user-3']);
  });
});
