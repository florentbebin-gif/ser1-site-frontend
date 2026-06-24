import { useId, type ReactElement } from 'react';

import type { AuditAvatarAppearance, AuditAvatarKind } from '@/domain/audit/types';
import { IconChevronRight } from '@/icons/ui';

import { nextAvatarVariant, type AuditAvatarSubject } from '../avatarAppearance';
import { FoyerAvatarArt, FoyerAvatarClipDef } from './FoyerAvatarArt';

export function AuditAvatarAppearancePicker({
  label,
  kind,
  subject,
  appearance,
  onChange,
}: {
  label: string;
  kind: AuditAvatarKind | undefined;
  subject: AuditAvatarSubject;
  appearance: AuditAvatarAppearance | undefined;
  onChange: (selection: { kind: AuditAvatarKind; appearance: AuditAvatarAppearance }) => void;
}): ReactElement {
  const clipId = useId();
  const currentKind = kind ?? (subject === 'enfant' ? 'fille' : 'homme');

  return (
    <div className="audit-avatar-picker" role="group" aria-label={label}>
      <button
        type="button"
        className="audit-avatar-picker__arrow audit-avatar-picker__arrow--previous"
        aria-label={`${label} précédent`}
        onClick={() => onChange(nextAvatarVariant({ kind, appearance, subject, direction: -1 }))}
      >
        <IconChevronRight />
      </button>
      <svg className="audit-avatar-picker__preview" viewBox="-120 -120 240 240" aria-hidden="true">
        <defs>
          <FoyerAvatarClipDef clipId={clipId} />
        </defs>
        <FoyerAvatarArt kind={currentKind} clipId={clipId} appearance={appearance} />
      </svg>
      <button
        type="button"
        className="audit-avatar-picker__arrow"
        aria-label={`${label} suivant`}
        onClick={() => onChange(nextAvatarVariant({ kind, appearance, subject, direction: 1 }))}
      >
        <IconChevronRight />
      </button>
    </div>
  );
}
