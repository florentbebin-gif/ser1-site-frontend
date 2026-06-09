interface IconProps {
  className?: string;
}

export function IconCloud({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.5 18.5h9.2a4.2 4.2 0 0 0 .4-8.4A6.1 6.1 0 0 0 5.7 8.3a4.4 4.4 0 0 0 1.8 10.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
