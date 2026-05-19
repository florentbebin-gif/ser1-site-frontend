export const ALL_CABINETS_FILTER = 'all';
export const NO_CABINET_FILTER = 'none';

export type CabinetFilterId = typeof ALL_CABINETS_FILTER | typeof NO_CABINET_FILTER | string;

export interface AdminDirectoryUser {
  id: string;
  email: string;
  cabinet_id?: string | null;
}

export interface AdminDirectoryCabinet {
  id: string;
  name: string;
}

export interface CabinetFilterItem {
  id: CabinetFilterId;
  label: string;
  count: number;
}

export function filterAdminUsersByDirectory<TUser extends AdminDirectoryUser>(
  users: TUser[],
  options: { searchEmail: string; cabinetFilter: CabinetFilterId },
): TUser[] {
  const normalizedSearch = options.searchEmail.trim().toLowerCase();

  return users.filter((user) => {
    const matchesEmail = !normalizedSearch || user.email.toLowerCase().includes(normalizedSearch);
    if (!matchesEmail) return false;

    if (options.cabinetFilter === ALL_CABINETS_FILTER) return true;
    if (options.cabinetFilter === NO_CABINET_FILTER) return !user.cabinet_id;
    return user.cabinet_id === options.cabinetFilter;
  });
}

export function buildCabinetFilterItems({
  users,
  cabinets,
}: {
  users: AdminDirectoryUser[];
  cabinets: AdminDirectoryCabinet[];
}): CabinetFilterItem[] {
  const counts = users.reduce<Record<string, number>>((acc, user) => {
    const key = user.cabinet_id || NO_CABINET_FILTER;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return [
    { id: ALL_CABINETS_FILTER, label: 'Tous', count: users.length },
    { id: NO_CABINET_FILTER, label: 'Sans cabinet', count: counts[NO_CABINET_FILTER] ?? 0 },
    ...cabinets.map((cabinet) => ({
      id: cabinet.id,
      label: cabinet.name,
      count: counts[cabinet.id] ?? 0,
    })),
  ];
}
