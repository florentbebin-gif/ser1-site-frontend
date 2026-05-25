import type { ButtonHTMLAttributes, ComponentType } from 'react';
import { IconClose, IconDuplicate, IconPencil, IconPlus, IconTrash } from '@/icons/ui';

type SimActionVariant = 'add' | 'edit' | 'delete' | 'duplicate' | 'close';

type BaseButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'>;

type IconModeProps = {
  mode: 'icon';
  ariaLabel: string;
};

type TextModeProps = {
  mode: 'text';
  ariaLabel?: string;
};

export type SimActionButtonProps = BaseButtonProps &
  (IconModeProps | TextModeProps) & {
    variant: SimActionVariant;
    label: string;
    danger?: boolean;
  };

const ICONS = {
  add: IconPlus,
  edit: IconPencil,
  delete: IconTrash,
  duplicate: IconDuplicate,
  close: IconClose,
} satisfies Record<SimActionVariant, ComponentType<{ className?: string }>>;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimActionButton({
  variant,
  mode,
  label,
  ariaLabel,
  danger = false,
  className,
  type = 'button',
  ...buttonProps
}: SimActionButtonProps) {
  const Icon = ICONS[variant];
  const resolvedAriaLabel = mode === 'icon' ? ariaLabel : (ariaLabel ?? undefined);

  return (
    <button
      {...buttonProps}
      type={type}
      aria-label={resolvedAriaLabel}
      className={cx(
        'sim-action-btn',
        `sim-action-btn--${variant}`,
        `sim-action-btn--${mode}`,
        danger && 'sim-action-btn--danger',
        className,
      )}
    >
      {mode === 'icon' ? <Icon className="sim-action-btn__icon" /> : label}
    </button>
  );
}
