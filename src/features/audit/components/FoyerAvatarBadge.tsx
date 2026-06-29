import type { ReactElement } from 'react';

import type { AuditAvatarAppearance, AuditAvatarKind } from '@/domain/audit/types';

import { FamilyAvatarImage } from './FamilyAvatarImage';
import { resolveFamilyAvatarVariant } from './familyAvatarAssets';

export function FoyerAvatarBadge({
  label,
  kind,
  appearance,
}: {
  label: string;
  kind: AuditAvatarKind;
  appearance?: AuditAvatarAppearance;
}): ReactElement {
  return (
    <span className="audit-avatar-badge" aria-hidden="true" title={label}>
      <FamilyAvatarImage
        className="audit-avatar-badge__image"
        variant={resolveFamilyAvatarVariant(kind, appearance)}
        size={32}
        decorative
      />
    </span>
  );
}
