import { useId, type ReactElement } from 'react';

import type { AuditAvatarAppearance, AuditAvatarKind } from '@/domain/audit/types';

import { FoyerAvatarArt, FoyerAvatarClipDef } from './FoyerAvatarArt';

export function FoyerAvatarBadge({
  label,
  kind,
  appearance,
}: {
  label: string;
  kind: AuditAvatarKind;
  appearance?: AuditAvatarAppearance;
}): ReactElement {
  const clipId = useId();

  return (
    <span className="audit-avatar-badge" aria-hidden="true" title={label}>
      <svg viewBox="-120 -120 240 240">
        <defs>
          <FoyerAvatarClipDef clipId={clipId} />
        </defs>
        <FoyerAvatarArt kind={kind} clipId={clipId} appearance={appearance} />
      </svg>
    </span>
  );
}
