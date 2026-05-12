// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SimSelect } from './SimSelect';

describe('SimSelect', () => {
  it('rend le menu dans un portal pour éviter le clipping des modales scrollables', () => {
    const { container } = render(
      <div className="scrollable-modal-body">
        <SimSelect
          value="a"
          onChange={vi.fn()}
          ariaLabel="Choix"
          options={[
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ]}
        />
      </div>,
    );

    fireEvent.click(screen.getByLabelText('Choix'));

    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument();
    expect(container.querySelector('.sim-field__dropdown')).toBeNull();
    expect(document.body.querySelector('.sim-field__dropdown')).toBeInTheDocument();
  });
});
