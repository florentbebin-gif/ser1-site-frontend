export interface SimSparklineProps {
  className?: string;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimSparkline({ className }: SimSparklineProps) {
  return (
    <svg
      width="60"
      height="16"
      viewBox="0 0 60 16"
      className={cx('sim-sparkline', className)}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 12 L12 8 L23 10 L35 4 L47 7 L58 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
