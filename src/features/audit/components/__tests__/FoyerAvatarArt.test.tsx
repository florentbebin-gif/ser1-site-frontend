// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FoyerAvatarArt, FoyerAvatarClipDef } from '../FoyerAvatarArt';
import { resolveFamilyAvatarVariant } from '../familyAvatarAssets';

describe('FoyerAvatarArt', () => {
  it('résout les variantes image sans changer les enfants', () => {
    expect(resolveFamilyAvatarVariant('homme', { skinTone: 'fonce', age: 'senior' })).toBe(
      'grandfather',
    );
    expect(resolveFamilyAvatarVariant('femme', { skinTone: 'clair', age: 'senior' })).toBe(
      'grandmother',
    );
    expect(resolveFamilyAvatarVariant('garcon', { skinTone: 'clair', age: 'senior' })).toBe('boy');
  });

  it('rend un fragment SVG tokenisé basé sur le PNG transparent', () => {
    const { container } = render(
      <svg viewBox="-120 -120 240 240">
        <defs>
          <FoyerAvatarClipDef clipId="avatar-test" />
        </defs>
        <FoyerAvatarArt
          kind="homme"
          clipId="avatar-test"
          appearance={{ skinTone: 'fonce', age: 'senior' }}
        />
      </svg>,
    );

    const image = container.querySelector('image');
    expect(container.querySelector('[data-avatar-variant="grandfather"]')).not.toBeNull();
    expect(image?.getAttribute('href')).toMatch(/avatar-grandfather-outline\.png/);
    expect(container.innerHTML).toContain('fill="var(--surface-active)"');
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}|rgb\(|hsl\(/i);
  });
});
