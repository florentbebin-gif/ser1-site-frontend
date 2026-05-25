// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SimAmountInputEuro } from '../SimAmountInputEuro';
import { SimAmountInputNumeric } from '../SimAmountInputNumeric';
import { SimAmountInputPercent } from '../SimAmountInputPercent';
import { formatPercentInput, parseDecimalInput, parsePercentInput } from '@/utils/numbers';

describe('helpers numériques de saisie', () => {
  it('parse une décimale saisie avec virgule', () => {
    expect(parseDecimalInput('3,5')).toBe(3.5);
  });

  it('parse une décimale saisie avec point', () => {
    expect(parseDecimalInput('3.75')).toBe(3.75);
  });

  it('parse un montant collé avec espaces', () => {
    expect(parseDecimalInput('1 000 000')).toBe(1000000);
  });

  it('parse un montant collé avec espaces insécables', () => {
    expect(parseDecimalInput('1\u00a0000\u202f500,25')).toBe(1000500.25);
  });

  it('renvoie le fallback sur une saisie non numérique', () => {
    expect(parseDecimalInput('abc', 7)).toBe(7);
  });

  it('parse un pourcentage avec signe et virgule', () => {
    expect(parsePercentInput('2,75 %')).toBe(2.75);
  });

  it('formate un pourcentage avec virgule française sans zéros inutiles', () => {
    expect(formatPercentInput(2.5)).toBe('2,5');
  });

  it('peut conserver des décimales fixes quand un simulateur en a besoin', () => {
    expect(formatPercentInput(2.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe(
      '2,50',
    );
  });
});

describe('SimAmountInputEuro', () => {
  it('affiche un montant en euros formaté hors focus', () => {
    render(<SimAmountInputEuro value={1000000} onChange={vi.fn()} aria-label="Capital" />);

    expect(screen.getByRole('textbox', { name: 'Capital' })).toHaveValue('1\u202f000\u202f000');
  });

  it('affiche la valeur brute au focus', () => {
    render(<SimAmountInputEuro value={1000000} onChange={vi.fn()} aria-label="Capital" />);

    const input = screen.getByRole('textbox', { name: 'Capital' });
    fireEvent.focus(input);

    expect(input).toHaveValue('1000000');
  });

  it('notifie le parent au blur avec un montant collé avec espaces', () => {
    const onChange = vi.fn();
    render(<SimAmountInputEuro value={0} onChange={onChange} aria-label="Capital" />);

    const input = screen.getByRole('textbox', { name: 'Capital' });
    fireEvent.focus(input);
    fireEvent.change(input, {
      target: { value: '1 000 000' },
    });

    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(input);

    expect(onChange).toHaveBeenLastCalledWith(1000000);
  });

  it('borne le montant selon min et max', () => {
    const onChange = vi.fn();
    render(
      <SimAmountInputEuro
        value={0}
        onChange={onChange}
        min={1000}
        max={2000}
        aria-label="Capital"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Capital' });
    fireEvent.focus(input);
    fireEvent.change(input, {
      target: { value: '999999' },
    });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenLastCalledWith(2000);
  });

  it('expose un clavier numérique et enterKeyHint next par défaut', () => {
    render(<SimAmountInputEuro value={0} onChange={vi.fn()} aria-label="Capital" />);

    const input = screen.getByRole('textbox', { name: 'Capital' });
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('enterkeyhint', 'next');
  });
});

describe('SimAmountInputPercent', () => {
  it('affiche un pourcentage formaté avec virgule hors focus', () => {
    render(<SimAmountInputPercent value={2.5} onChange={vi.fn()} aria-label="Rendement" />);

    expect(screen.getByRole('textbox', { name: 'Rendement' })).toHaveValue('2,5');
  });

  it('affiche le suffixe pourcentage et le clavier décimal', () => {
    render(<SimAmountInputPercent value={0} onChange={vi.fn()} aria-label="Rendement" />);

    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Rendement' })).toHaveAttribute(
      'inputmode',
      'decimal',
    );
    expect(screen.getByRole('textbox', { name: 'Rendement' })).toHaveAttribute(
      'enterkeyhint',
      'next',
    );
  });

  it('convertit une saisie avec virgule en nombre décimal au blur', () => {
    const onChange = vi.fn();
    render(<SimAmountInputPercent value={0} onChange={onChange} aria-label="Rendement" />);

    const input = screen.getByRole('textbox', { name: 'Rendement' });
    fireEvent.focus(input);
    fireEvent.change(input, {
      target: { value: '3,5' },
    });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenLastCalledWith(3.5);
  });

  it('borne le pourcentage selon min et max', () => {
    const onChange = vi.fn();
    render(
      <SimAmountInputPercent
        value={0}
        onChange={onChange}
        min={0}
        max={5}
        aria-label="Rendement"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Rendement' });
    fireEvent.focus(input);
    fireEvent.change(input, {
      target: { value: '8,5' },
    });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});

describe('SimAmountInputNumeric', () => {
  it('utilise un suffixe métier optionnel', () => {
    render(
      <SimAmountInputNumeric
        value={4}
        onChange={vi.fn()}
        unit="parts"
        aria-label="Nombre de parts"
      />,
    );

    expect(screen.getByText('parts')).toBeInTheDocument();
  });

  it('convertit les décimales et relaie le testId sur le champ', () => {
    const onChange = vi.fn();
    render(
      <SimAmountInputNumeric
        value={0}
        onChange={onChange}
        testId="parts-input"
        aria-label="Nombre de parts"
      />,
    );

    const input = screen.getByTestId('parts-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '2,25' } });
    fireEvent.blur(input);

    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveAttribute('enterkeyhint', 'next');
    expect(onChange).toHaveBeenLastCalledWith(2.25);
  });

  it('signale une saisie vidée quand le consommateur accepte null', () => {
    const onEmpty = vi.fn();
    render(
      <SimAmountInputNumeric
        value={4}
        onChange={vi.fn()}
        onEmpty={onEmpty}
        aria-label="Nombre de parts"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Nombre de parts' });
    fireEvent.focus(input);
    fireEvent.change(input, {
      target: { value: '' },
    });

    expect(onEmpty).not.toHaveBeenCalled();
    fireEvent.blur(input);

    expect(onEmpty).toHaveBeenCalledOnce();
  });

  it('affiche une précision décimale configurée', () => {
    render(
      <SimAmountInputNumeric
        value={2.2}
        onChange={vi.fn()}
        minimumFractionDigits={4}
        maximumFractionDigits={4}
        aria-label="Valeur du point"
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Valeur du point' })).toHaveValue('2,2000');
  });

  it('respecte disabled et enterKeyHint personnalisé', () => {
    render(
      <SimAmountInputNumeric
        value={1}
        onChange={vi.fn()}
        disabled
        enterKeyHint="done"
        aria-label="Nombre de parts"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Nombre de parts' });
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('enterkeyhint', 'done');
  });

  it('reformate la valeur contrôlée après le blur', () => {
    function Harness() {
      const [value, setValue] = useState(0);
      return <SimAmountInputNumeric value={value} onChange={setValue} aria-label="Nombre" />;
    }

    render(<Harness />);

    const input = screen.getByRole('textbox', { name: 'Nombre' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12,5' } });
    fireEvent.blur(input);

    expect(input).toHaveValue('12,5');
  });
});
