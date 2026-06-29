import type { CSSProperties, ReactElement } from 'react';

import {
  FAMILY_AVATAR_ASSETS,
  FAMILY_AVATAR_LABELS,
  type FamilyAvatarVariant,
} from './familyAvatarAssets';

import './FamilyAvatarImage.css';

type FamilyAvatarStyle = CSSProperties & {
  '--family-avatar-size': string;
};

interface FamilyAvatarImageProps {
  variant: FamilyAvatarVariant;
  size?: number | string;
  className?: string;
  alt?: string;
  decorative?: boolean;
}

export function FamilyAvatarImage({
  variant,
  size = 40,
  className,
  alt,
  decorative = false,
}: FamilyAvatarImageProps): ReactElement {
  const label = alt ?? FAMILY_AVATAR_LABELS[variant];
  const rootClassName = className ? `family-avatar-image ${className}` : 'family-avatar-image';
  const style: FamilyAvatarStyle = {
    '--family-avatar-size': typeof size === 'number' ? `${size}px` : size,
  };

  return (
    <span
      className={rootClassName}
      style={style}
      data-avatar-variant={variant}
      aria-hidden={decorative ? true : undefined}
    >
      <img
        className="family-avatar-image__asset"
        src={FAMILY_AVATAR_ASSETS[variant]}
        alt={decorative ? '' : label}
        aria-hidden={decorative ? true : undefined}
        draggable={false}
      />
    </span>
  );
}
