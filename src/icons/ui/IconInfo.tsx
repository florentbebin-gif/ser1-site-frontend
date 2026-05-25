interface IconProps {
  className?: string;
}

export function IconInfo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 17v-6M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
