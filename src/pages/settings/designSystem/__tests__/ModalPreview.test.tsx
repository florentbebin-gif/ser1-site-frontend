// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DesignSystemModalPreview } from '../ModalPreview';

describe('DesignSystemModalPreview', () => {
  it('rend la référence canonique des modales (largeurs, nav, footer danger)', () => {
    render(<DesignSystemModalPreview />);

    expect(screen.getByText('Largeurs canoniques')).toBeInTheDocument();
    expect(screen.getByText('sim-modal--lg')).toBeInTheDocument();
    expect(screen.getByText('Famille normale')).toBeInTheDocument();
    expect(screen.getByText('Famille avec menu gauche')).toBeInTheDocument();
    expect(screen.getByLabelText('Rubriques de modale')).toBeInTheDocument();
    expect(screen.getByText('Footer canonique')).toBeInTheDocument();
  });

  it('expose le drawer XL canonique /audit (variante de l’anatomie modale)', () => {
    render(<DesignSystemModalPreview />);

    expect(screen.getByText('Drawer XL (/audit)')).toBeInTheDocument();
    expect(screen.getByLabelText('Anatomie du drawer XL')).toBeInTheDocument();
    expect(screen.getByLabelText('Rubriques du drawer')).toBeInTheDocument();
    expect(screen.getByLabelText('Panneau sources')).toBeInTheDocument();
  });

  it('ouvre la modale canonique complète à la demande', async () => {
    const user = userEvent.setup();
    render(<DesignSystemModalPreview />);

    await user.click(screen.getByRole('button', { name: 'Ouvrir l’exemple canonique' }));

    expect(screen.getByLabelText('Rubriques de la modale ouverte')).toBeInTheDocument();
  });
});
