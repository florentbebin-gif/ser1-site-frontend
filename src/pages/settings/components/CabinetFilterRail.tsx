import type { CabinetFilterId, CabinetFilterItem } from '../utils/adminUsersDirectory';

interface CabinetFilterRailProps {
  items: CabinetFilterItem[];
  selectedFilter: CabinetFilterId;
  onSelectFilter: (filter: CabinetFilterId) => void;
}

export function CabinetFilterRail({
  items,
  selectedFilter,
  onSelectFilter,
}: CabinetFilterRailProps) {
  return (
    <aside className="cabinet-filter-rail" aria-label="Filtrer les utilisateurs par cabinet">
      <div className="cabinet-filter-rail__title">Cabinets</div>
      <div className="cabinet-filter-rail__list">
        {items.map((item) => {
          const isSelected = item.id === selectedFilter;

          return (
            <button
              key={item.id}
              type="button"
              className={`cabinet-filter-rail__item${isSelected ? ' is-selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onSelectFilter(item.id)}
            >
              <span className="cabinet-filter-rail__label">{item.label}</span>
              <span className="cabinet-filter-rail__count">{item.count}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
