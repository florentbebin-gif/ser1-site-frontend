import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { InputNumber, InputPct } from './PlacementFormControls';
import { PlacementSelect as Select } from './PlacementSelect';

describe('contrôles de formulaire Placement', () => {
  it('conserve la ligne partagée sur les champs numériques', () => {
    const html = renderToStaticMarkup(
      <InputNumber label="Âge actuel" value={42} onChange={vi.fn()} unit="ans" />,
    );

    expect(html).toContain('sim-field__row pl-input');
    expect(html).toContain('sim-field__control');
    expect(html).toContain('sim-field__unit');
  });

  it('rend les pourcentages avec la classe de champ partagée', () => {
    const html = renderToStaticMarkup(<InputPct label="Taux" value={0.15} onChange={vi.fn()} />);

    expect(html).toContain('sim-field__control');
    expect(html).toContain('sim-field__unit');
  });

  it('rend SimSelect dans le shell partagé', () => {
    const html = renderToStaticMarkup(
      <Select
        label="Situation"
        value="single"
        onChange={vi.fn()}
        options={[
          { value: 'single', label: 'Célibataire' },
          { value: 'couple', label: 'Marié / Pacsé' },
        ]}
      />,
    );

    expect(html).toContain('sim-field');
    expect(html).toContain('sim-field__select-trigger');
    expect(html).toContain('sim-field__select-value');
  });
});
