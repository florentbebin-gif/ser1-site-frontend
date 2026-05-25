interface IconProps {
  className?: string;
}

export function IconEmptyDocs({ className }: IconProps) {
  return (
    <svg className={className} width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <path
        d="M20 10h15l9 9v31H20zM35 10v10h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 16h-2v30h6M27 30h10M27 38h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
