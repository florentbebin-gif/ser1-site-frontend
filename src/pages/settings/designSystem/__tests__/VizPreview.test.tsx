// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignSystemVizPreview } from '../VizPreview';

describe('DesignSystemVizPreview', () => {
  it('présente les tokens data-viz dérivés du thème', () => {
    render(<DesignSystemVizPreview />);

    expect(screen.getByText('Séries catégorielles')).toBeInTheDocument();
    expect(screen.getByText('--viz-1')).toBeInTheDocument();
    expect(screen.getByText('--viz-8')).toBeInTheDocument();

    expect(screen.getByText('Radar — actuel vs scénario')).toBeInTheDocument();
    expect(screen.getByText('--viz-current')).toBeInTheDocument();
    expect(screen.getByText('--viz-scenario')).toBeInTheDocument();

    expect(screen.getByText('Rampe séquentielle')).toBeInTheDocument();
    expect(screen.getByText('--viz-sequential-1')).toBeInTheDocument();

    expect(screen.getByText('Alerte distincte de la signature')).toBeInTheDocument();
    expect(screen.getByText('--state-warning')).toBeInTheDocument();
    expect(screen.getByText('--accent-signature')).toBeInTheDocument();
  });
});
