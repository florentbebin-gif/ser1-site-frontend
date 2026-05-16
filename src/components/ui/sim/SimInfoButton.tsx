interface SimInfoButtonProps {
  ariaLabel: string;
  onClick: () => void;
}

export function SimInfoButton({ ariaLabel, onClick }: SimInfoButtonProps) {
  return (
    <button
      type="button"
      className="sim-info-btn"
      aria-label={ariaLabel}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      i
    </button>
  );
}
