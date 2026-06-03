// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignSystemUiPreview } from '../UiPreview';

describe('DesignSystemUiPreview', () => {
  it('rend les actions, navigations et snippets UI sans monter tout le showroom', () => {
    render(<DesignSystemUiPreview />);

    expect(screen.getByRole('button', { name: 'Ajouter une ligne' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
    expect(screen.getByText('Navigation simulateur optionnelle')).toBeInTheDocument();
    expect(screen.getByText('Onglets soulignés')).toBeInTheDocument();
    expect(screen.getByLabelText('Étapes soulignées')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voir la synthèse/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Rubriques de modale')).toBeInTheDocument();
    expect(screen.getByText('États actions')).toBeInTheDocument();
    expect(screen.getByText('Extrait actions')).toBeInTheDocument();
    expect(screen.getByText('Extrait modale')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ouvrir la modale bottom-sheet' }),
    ).toBeInTheDocument();
  });
});
