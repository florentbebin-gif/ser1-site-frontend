interface IconProps {
  className?: string;
}

export function IconLayers({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 4 8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
