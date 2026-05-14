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

  it('ouvre le menu au-dessus quand le bas de la fenêtre est trop court', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });

    render(
      <SimSelect
        value="a"
        onChange={vi.fn()}
        ariaLabel="Choix"
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
      />,
    );

    const trigger = screen.getByLabelText('Choix');
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 760,
      top: 760,
      right: 300,
      bottom: 790,
      left: 100,
      width: 200,
      height: 30,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.click(trigger);

    const dropdown = document.body.querySelector('.sim-field__dropdown') as HTMLElement;
    expect(dropdown).toBeInTheDocument();
    expect(Number.parseFloat(dropdown.style.top)).toBeLessThan(760);
    expect(Number.parseFloat(dropdown.style.top)).toBeGreaterThan(620);
  });
});
