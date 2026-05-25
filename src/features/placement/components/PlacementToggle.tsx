interface PlacementToggleProps {
  checked: boolean;
  onChange: (_checked: boolean) => void;
  label?: string;
  ariaLabel?: string;
}

export function PlacementToggle({ checked, onChange, label, ariaLabel }: PlacementToggleProps) {
  return (
    <div className="pl-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || "Activer l'option"}
        className={`pl-toggle__switch${checked ? ' is-active' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="pl-toggle__knob" />
      </button>
      {label ? <span className="pl-toggle__label">{label}</span> : null}
    </div>
  );
}
