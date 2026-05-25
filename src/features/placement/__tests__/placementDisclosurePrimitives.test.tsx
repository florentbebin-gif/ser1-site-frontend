// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlacementHypotheses } from '../components/PlacementHypotheses';
import { CollapsibleTable } from '../components/PlacementTables';

describe('PlacementHypotheses', () => {
  it('utilise le bouton disclosure partagé', async () => {
    render(<PlacementHypotheses />);
    const toggle = screen.getByRole('button', { name: /Afficher les hypothèses et limites/i });

    expect(toggle).toHaveClass('sim-disclosure-btn');
    expect(toggle).toHaveAttribute('aria-controls', 'placement-hypotheses-list');

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/résultats sont indicatifs/i)).toBeInTheDocument();
  });
});

describe('CollapsibleTable', () => {
  it('utilise le bouton disclosure partagé pour ouvrir le détail', () => {
    const html = renderToStaticMarkup(
      <CollapsibleTable
        title="Détail assurance-vie"
        rows={[{ year: 1 }]}
        columns={['Année']}
        renderRow={(row) => (
          <tr>
            <td>{row.year}</td>
          </tr>
        )}
      />,
    );

    expect(html).toContain('sim-disclosure-btn');
    expect(html).toContain('Afficher Détail assurance-vie');
    expect(html).not.toContain('pl-collapsible__chevron');
  });
});
