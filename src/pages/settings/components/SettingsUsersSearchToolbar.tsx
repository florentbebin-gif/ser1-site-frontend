interface SettingsUsersSearchToolbarProps {
  searchEmail: string;
  visibleCount: number;
  totalCount: number;
  onSearchEmailChange: (value: string) => void;
}

export function SettingsUsersSearchToolbar({
  searchEmail,
  visibleCount,
  totalCount,
  onSearchEmailChange,
}: SettingsUsersSearchToolbarProps) {
  return (
    <div className="users-directory-toolbar">
      <label className="users-directory-search" htmlFor="settings-users-email-search">
        <span>Rechercher par email</span>
        <input
          id="settings-users-email-search"
          type="search"
          value={searchEmail}
          onChange={(event) => onSearchEmailChange(event.target.value)}
          placeholder="email@exemple.fr"
          autoComplete="off"
        />
      </label>
      <div className="users-directory-toolbar__meta">
        <span>
          {visibleCount} / {totalCount} utilisateurs
        </span>
        {searchEmail && (
          <button
            className="users-directory-clear"
            type="button"
            aria-label="Effacer la recherche email"
            onClick={() => onSearchEmailChange('')}
          >
            Effacer
          </button>
        )}
      </div>
    </div>
  );
}
