import { useEffect, useId, useRef, useState, type ReactElement } from 'react';

import type { AuditAvatarAppearance, AuditAvatarKind } from '@/domain/audit/types';
import { IconPencil } from '@/icons/ui';

import {
  appearanceForAvatarChoice,
  normalizeAvatarAppearance,
  normalizeAvatarKind,
  optionsForAvatarSubject,
  type AuditAvatarChoice,
  type AuditAvatarSubject,
} from '../avatarAppearance';
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
  const rootRef = useRef<HTMLDivElement>(null);
  const clipId = useId();
  const [open, setOpen] = useState(false);
  const currentKind = normalizeAvatarKind(kind, subject);
  const currentAppearance = normalizeAvatarAppearance(appearance, subject);
  const groups = avatarGroupsForSubject(subject);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="audit-avatar-picker" role="group" aria-label={label}>
      <button
        type="button"
        className="audit-avatar-picker__trigger"
        aria-label={`Modifier ${label.toLowerCase()}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        <AvatarPreview
          className="audit-avatar-picker__preview"
          clipId={clipId}
          kind={currentKind}
          appearance={currentAppearance}
        />
        <span className="audit-avatar-picker__overlay" aria-hidden="true">
          <IconPencil />
        </span>
      </button>
      {open ? (
        <div className="audit-avatar-picker__popover" role="dialog" aria-label={label}>
          <p className="audit-avatar-picker__title">Bibliothèque de profils</p>
          {groups.map((group) => (
            <div className="audit-avatar-picker__group" key={group.title}>
              <p>{group.title}</p>
              <div className="audit-avatar-picker__choices">
                {group.choices.map((choice) => {
                  const selected = isSelectedAvatar(choice, currentKind, currentAppearance);
                  const choiceAppearance = appearanceForAvatarChoice(choice, currentAppearance);
                  const variantClipId = `${clipId}-${choice.id}`;
                  return (
                    <button
                      type="button"
                      key={choice.id}
                      className="audit-avatar-picker__choice"
                      data-selected={selected ? 'true' : undefined}
                      aria-pressed={selected}
                      aria-label={avatarProfileLabel(choice)}
                      onClick={() => {
                        onChange({ kind: choice.kind, appearance: choiceAppearance });
                        setOpen(false);
                      }}
                    >
                      <AvatarPreview
                        className="audit-avatar-picker__choice-art"
                        clipId={variantClipId}
                        kind={choice.kind}
                        appearance={choiceAppearance}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AvatarPreview({
  className,
  clipId,
  kind,
  appearance,
}: {
  className: string;
  clipId: string;
  kind: AuditAvatarKind;
  appearance: AuditAvatarAppearance | undefined;
}): ReactElement {
  return (
    <svg className={className} viewBox="-120 -120 240 240" aria-hidden="true">
      <defs>
        <FoyerAvatarClipDef clipId={clipId} />
      </defs>
      <FoyerAvatarArt kind={kind} clipId={clipId} appearance={appearance} />
    </svg>
  );
}

function avatarGroupsForSubject(subject: AuditAvatarSubject): Array<{
  title: string;
  choices: AuditAvatarChoice[];
}> {
  const choices = optionsForAvatarSubject(subject);
  if (subject === 'enfant') {
    return [
      {
        title: 'Enfants',
        choices,
      },
    ];
  }

  return [
    {
      title: 'Adultes',
      choices: choices.filter((choice) => choice.age === 'adulte'),
    },
    {
      title: 'Seniors',
      choices: choices.filter((choice) => choice.age === 'senior'),
    },
  ];
}

function isSelectedAvatar(
  choice: AuditAvatarChoice,
  kind: AuditAvatarKind,
  appearance: AuditAvatarAppearance,
): boolean {
  return choice.kind === kind && choice.age === appearance.age;
}

function avatarProfileLabel(choice: AuditAvatarChoice): string {
  return `Profil ${choice.label}`;
}
