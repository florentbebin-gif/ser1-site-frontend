// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CompanyLogo, {
  getCompanyLogoToneClass,
  slugifyCompanyForLogo,
} from '../components/CompanyLogo';

describe('CompanyLogo', () => {
  it('normalise le nom de compagnie vers le slug logo attendu', () => {
    expect(slugifyCompanyForLogo('AG2R_LA_MONDIALE')).toBe('ag2r-la-mondiale');
    expect(slugifyCompanyForLogo('Crédit Agricole')).toBe('credit-agricole');
    expect(slugifyCompanyForLogo('La Banque Postale')).toBe('la-banque-postale');
    expect(slugifyCompanyForLogo('LPA_PREVOYANCE')).toBe('lpa-prevoyance');
    expect(slugifyCompanyForLogo('SMA_BTP')).toBe('sma-btp');
  });

  it('rend le logo public avec un texte alternatif explicite et son extension', () => {
    const { rerender } = render(<CompanyLogo company="ABEILLE" />);

    expect(screen.getByRole('img', { name: 'Logo ABEILLE' })).toHaveAttribute(
      'src',
      '/logos/compagnies/abeille.svg',
    );

    rerender(<CompanyLogo company="MALAKOFF_HUMANIS" />);

    expect(screen.getByRole('img', { name: 'Logo MALAKOFF_HUMANIS' })).toHaveAttribute(
      'src',
      '/logos/compagnies/malakoff-humanis.png',
    );

    rerender(<CompanyLogo company="MEDICIS" />);

    expect(screen.getByRole('img', { name: 'Logo MEDICIS' })).toHaveAttribute(
      'src',
      '/logos/compagnies/medicis.webp',
    );

    rerender(<CompanyLogo company="UFF" />);

    expect(screen.getByRole('img', { name: 'Logo UFF' })).toHaveAttribute(
      'src',
      '/logos/compagnies/uff.svg',
    );
  });

  it('applique un calibrage compact au logo AXA', () => {
    render(<CompanyLogo company="AXA" />);

    expect(screen.getByTestId('company-logo-axa')).toHaveStyle({
      '--company-logo-image-scale': '62%',
    });
  });

  it('applique les fonds configurés par le manifeste', () => {
    render(<CompanyLogo company="LPA_PREVOYANCE" />);

    expect(screen.getByTestId('company-logo-lpa-prevoyance')).toHaveClass('company-logo--bg-c1');
  });

  it('bascule vers une pastille stable si le logo ne charge pas', () => {
    render(<CompanyLogo company="AG2R_LA_MONDIALE" />);

    fireEvent.error(screen.getByRole('img', { name: 'Logo AG2R_LA_MONDIALE' }));

    const fallback = screen.getByLabelText('Logo AG2R_LA_MONDIALE');
    expect(fallback).toHaveTextContent('A');
    expect(fallback).toHaveClass(getCompanyLogoToneClass('AG2R_LA_MONDIALE'));
    expect(getCompanyLogoToneClass('AG2R_LA_MONDIALE')).toBe(
      getCompanyLogoToneClass('AG2R_LA_MONDIALE'),
    );
  });
});
