// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignSystemRailPreview } from '../RailPreview';

describe('DesignSystemRailPreview', () => {
  it('rend le fil de parcours discret et les états du switch Mode expert', () => {
    render(<DesignSystemRailPreview />);

    expect(screen.getByText('Fil de parcours (rail dossier)')).toBeInTheDocument();
    expect(screen.getByText('Bascule Mode expert')).toBeInTheDocument();
    expect(screen.getByTestId('dossier-rail-panel')).toBeInTheDocument();
    expect(screen.getAllByText('Mode expert')).toHaveLength(3);
  });
});
