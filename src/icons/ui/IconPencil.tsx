interface IconProps {
  className?: string;
}

export function IconPencil({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 20h4.2L19 9.2 14.8 5 4 15.8V20zM13.5 6.3l4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
