interface IconProps {
  className?: string;
}

export function IconShield({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 19 6v5c0 5-3.4 8-7 10-3.6-2-7-5-7-10V6zM12 8v7M9.5 10.5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
