// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LegalRefLink, LegalRefList } from './LegalRefLink';

describe('LegalRefLink', () => {
  it('rend un lien officiel pour une référence connue', () => {
    render(<LegalRefLink id="cgi-200-a" />);

    const link = screen.getByRole('link', { name: /200 A/i });
    expect(link).toHaveAttribute(
      'href',
      'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042909847',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('rend un libellé non cliquable pour une référence inconnue', () => {
    render(<LegalRefLink id="ref-inconnue" />);

    expect(screen.getByText('Référence inconnue : ref-inconnue')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('LegalRefList', () => {
  it('rend une liste de références officielles', () => {
    render(<LegalRefList ids={['cgi-200-a', 'cgi-990-i']} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /200 A/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /990 I/i })).toBeInTheDocument();
  });
});
