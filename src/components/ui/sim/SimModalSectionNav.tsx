export interface SimModalSectionNavItem {
  id: string;
  label: string;
  controls?: string;
  disabled?: boolean;
}

export interface SimModalSectionNavProps {
  sections: readonly SimModalSectionNavItem[];
  activeId: string;
  ariaLabel: string;
  onChange: (_id: string) => void;
  className?: string;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimModalSectionNav({
  sections,
  activeId,
  ariaLabel,
  onChange,
  className,
}: SimModalSectionNavProps) {
  return (
    <nav className={cx('sim-modal-section-nav', className)} aria-label={ariaLabel}>
      {sections.map((section) => {
        const active = section.id === activeId;

        return (
          <button
            key={section.id}
            type="button"
            className={cx('sim-modal-section-nav__item', active && 'is-active')}
            aria-current={active ? 'step' : undefined}
            aria-controls={section.controls}
            disabled={section.disabled}
            onClick={() => {
              if (active || section.disabled) return;
              onChange(section.id);
            }}
          >
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}
