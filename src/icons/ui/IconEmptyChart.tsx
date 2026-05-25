interface IconProps {
  className?: string;
}

export function IconEmptyChart({ className }: IconProps) {
  return (
    <svg className={className} width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <path
        d="M12 46h36M18 39V28M30 39V20M42 39v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 16c4-4 10-5 15-2 5 2 8 7 8 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M39 16h5v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
