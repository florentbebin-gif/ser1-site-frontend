// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignSystemMobilePreview } from '../MobilePreview';

describe('DesignSystemMobilePreview', () => {
  it('rend la démonstration mobile 390 et ses actions sticky', () => {
    render(<DesignSystemMobilePreview />);

    expect(screen.getByLabelText('Mobile 390')).toBeInTheDocument();
    expect(screen.getByLabelText('Versement mobile')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Période mobile' })).toBeInTheDocument();
    expect(screen.getByText('Aucun scénario')).toBeInTheDocument();
    expect(screen.getByLabelText('Actions mobiles 390')).toBeInTheDocument();
    expect(screen.getByText('Extrait mobile')).toBeInTheDocument();
  });
});
