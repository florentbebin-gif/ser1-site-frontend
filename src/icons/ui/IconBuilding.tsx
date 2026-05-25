interface IconProps {
  className?: string;
}

export function IconBuilding({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 21V5l9-3 5 2v17M9 9h1M9 13h1M9 17h1M14 10h1M14 14h1M4 21h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
