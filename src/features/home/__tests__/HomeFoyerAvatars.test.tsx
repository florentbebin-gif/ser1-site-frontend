// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AuditLandingMember } from '@/features/audit/shared';

import { HomeFoyerAvatars } from '../HomeFoyerAvatars';

const senior: AuditLandingMember = {
  id: 'principal',
  fullName: 'Jean Dupont',
  prenom: 'Jean',
  nom: 'Dupont',
  age: 72,
  profession: null,
  statutSocial: null,
  role: 'principal',
  estCommun: true,
  avatarKind: 'homme',
  avatarAppearance: { skinTone: 'fonce', age: 'senior' },
};

describe('HomeFoyerAvatars', () => {
  it('transmet avatarAppearance pour rendre une variante senior', () => {
    const { container } = render(<HomeFoyerAvatars principal={senior} conjoint={null} />);

    expect(container.querySelector('[data-avatar-variant="grandfather"]')).not.toBeNull();
  });
});
