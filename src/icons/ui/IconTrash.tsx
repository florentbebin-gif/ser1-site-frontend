import React from 'react';

interface IconProps {
  className?: string;
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
