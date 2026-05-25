interface IconProps {
  className?: string;
}

export function IconEmptyTable({ className }: IconProps) {
  return (
    <svg className={className} width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <path
        d="M12 16h36v28H12zM12 25h36M12 34h36M24 16v28M36 16v28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 50h20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
