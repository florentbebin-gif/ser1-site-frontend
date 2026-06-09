interface IconProps {
  className?: string;
}

export function IconHardDrive({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5.5 6.5h13l2 6.2v4.8a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-4.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.8 12.7h20.4M15.5 16h.1M18 16h.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
