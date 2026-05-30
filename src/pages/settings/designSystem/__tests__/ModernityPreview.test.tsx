// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignSystemModernityPreview } from '../ModernityPreview';

describe('DesignSystemModernityPreview', () => {
  it('rend les skeletons et l’état vide isolément', () => {
    const { container } = render(<DesignSystemModernityPreview />);

    expect(screen.getByText('Squelette page')).toBeInTheDocument();
    expect(screen.getByText('Squelette KPI')).toBeInTheDocument();
    expect(screen.getByText('État vide')).toBeInTheDocument();
    expect(container.querySelector('.sim-skeleton-card')).toBeInTheDocument();
    expect(container.querySelector('.sim-skeleton-kpi')).toBeInTheDocument();
    expect(container.querySelector('.sim-empty-state')).toBeInTheDocument();
  });
});
