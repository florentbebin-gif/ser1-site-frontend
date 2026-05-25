interface IconProps {
  className?: string;
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19a5.5 5.5 0 0 1 11 0M17 10a2.5 2.5 0 1 0 0-5M15.5 14.5A4.5 4.5 0 0 1 20.5 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
