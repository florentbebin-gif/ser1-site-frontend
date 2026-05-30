// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignSystemInputPreview } from '../InputPreview';

describe('DesignSystemInputPreview', () => {
  it('rend les champs canoniques, les états et l’extrait inputs', () => {
    render(<DesignSystemInputPreview />);

    expect(screen.getByLabelText('Montant euro')).toBeInTheDocument();
    expect(screen.getByLabelText('Taux décimal')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre libre')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Profil investisseur' })).toBeInTheDocument();
    expect(screen.getByText('États inputs')).toBeInTheDocument();
    expect(screen.getByLabelText('Montant état repos')).toBeInTheDocument();
    expect(screen.getByLabelText('Montant état désactivé')).toBeDisabled();
    expect(screen.getByText('Extrait inputs')).toBeInTheDocument();
  });
});
