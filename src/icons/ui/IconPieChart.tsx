interface IconProps {
  className?: string;
}

export function IconPieChart({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 12a9 9 0 1 1-9-9M21 12A9 9 0 0 0 12 3v9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
