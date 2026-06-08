// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignSystemSurfacePreview } from '../SurfacePreview';

describe('DesignSystemSurfacePreview', () => {
  it('illustre la taxonomie carte / bande / ligne KPI / micro-tuile plate', () => {
    render(<DesignSystemSurfacePreview />);

    expect(screen.getByText('Carte — surface élevée')).toBeInTheDocument();
    expect(screen.getByText(/Bande — section sans élévation/)).toBeInTheDocument();
    expect(screen.getByText('Patrimoine net')).toBeInTheDocument();
    expect(screen.getByText(/Micro-tuiles plates/)).toBeInTheDocument();
    expect(screen.getByText('Objectifs')).toBeInTheDocument();
  });
});
