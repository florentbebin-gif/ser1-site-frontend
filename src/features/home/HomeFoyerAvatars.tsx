import { useId, type ReactElement } from 'react';

import { FoyerAvatarArt, FoyerAvatarClipDef } from '@/features/audit';
import type { AuditLandingMember } from '@/features/audit';

import './HomeFoyerAvatars.css';

interface HomeFoyerAvatarsProps {
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
}

/**
 * Pastilles Mr/Mme rappelant que le dossier du foyer est chargé. Réutilise les
 * avatars de la page /audit : Monsieur seul si une personne, Monsieur et Madame
 * si un conjoint est présent.
 */
export function HomeFoyerAvatars({
  principal,
  conjoint,
}: HomeFoyerAvatarsProps): ReactElement | null {
  const clipBase = useId();
  const members = [principal, conjoint].filter((member): member is AuditLandingMember =>
    Boolean(member),
  );
  if (members.length === 0) {
    return null;
  }

  const hasMadame = members.some((member) => member.avatarKind === 'femme');
  const hasMonsieur = members.some((member) => member.avatarKind !== 'femme');
  const label =
    hasMonsieur && hasMadame
      ? 'Dossier chargé : Monsieur et Madame'
      : hasMadame
        ? 'Dossier chargé : Madame'
        : 'Dossier chargé : Monsieur';

  return (
    <span className="home-foyer-avatars" role="img" aria-label={label} title={label}>
      {members.map((member) => {
        const clipId = `${clipBase}-${member.id}`;
        return (
          <svg
            key={member.id}
            className="home-foyer-avatars__img"
            viewBox="-120 -120 240 240"
            aria-hidden="true"
          >
            <defs>
              <FoyerAvatarClipDef clipId={clipId} />
            </defs>
            <FoyerAvatarArt kind={member.avatarKind} clipId={clipId} />
          </svg>
        );
      })}
    </span>
  );
}

export default HomeFoyerAvatars;
