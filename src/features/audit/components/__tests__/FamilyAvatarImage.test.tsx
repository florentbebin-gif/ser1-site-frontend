// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FamilyAvatarImage } from '../FamilyAvatarImage';

describe('FamilyAvatarImage', () => {
  it('affiche un PNG décoratif sur un fond circulaire tokenisé', () => {
    const { container } = render(
      <FamilyAvatarImage variant="woman" size={40} className="avatar-test" decorative />,
    );

    const root = container.querySelector('.family-avatar-image');
    const image = container.querySelector('img');

    expect(root).toHaveClass('avatar-test');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveStyle({ '--family-avatar-size': '40px' });
    expect(image).toHaveAttribute('alt', '');
    expect(image?.getAttribute('src')).toMatch(/avatar-woman-outline\.png/);
  });
});
