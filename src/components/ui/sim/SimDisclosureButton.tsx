import type { ButtonHTMLAttributes } from 'react';
import { IconChevronDown } from '@/icons/ui';

export interface SimDisclosureButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onClick'
> {
  expanded: boolean;
  onToggle: () => void;
  labelOpen?: string;
  labelClosed?: string;
  controls?: string;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimDisclosureButton({
  expanded,
  onToggle,
  labelOpen = 'Masquer',
  labelClosed = 'Afficher',
  controls,
  className,
  type = 'button',
  ...buttonProps
}: SimDisclosureButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      aria-expanded={expanded}
      aria-controls={controls}
      className={cx('sim-disclosure-btn', expanded && 'is-open', className)}
      onClick={onToggle}
    >
      <span>{expanded ? labelOpen : labelClosed}</span>
      <IconChevronDown className="sim-disclosure-btn__chevron" />
    </button>
  );
}
