import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  formatVersementConfigSummary,
  PlacementEpargneSection,
} from '../components/PlacementEpargneSection';

const noop = () => {};

describe('formatVersementConfigSummary', () => {
  const formatter = (value: number) => `${value}EUR`;

  it('invite à configurer les versements quand aucun flux n’est saisi', () => {
    expect(formatVersementConfigSummary(0, 0, formatter)).toBe('Configurer les versements');
  });

  it('résume les versements saisis dans un libellé compact', () => {
    expect(formatVersementConfigSummary(10000, 1200, formatter, 500)).toBe(
      '1200EUR/an · 10000EUR initial · 500EUR ponctuel',
    );
  });

  it('utilise les actions partagées pour ajouter et paramétrer un placement', () => {
    const product = {
      dureeEpargne: 10,
      envelope: 'AV',
      perBancaire: false,
      optionBaremeIR: false,
      versementConfig: {
        initial: { montant: 10000 },
        annuel: { montant: 1200 },
      },
    };

    const markup = renderToStaticMarkup(
      createElement(PlacementEpargneSection as any, {
        state: { products: [product, product], compareEnabled: false },
        isExpert: false,
        setProduct: noop,
        setModalOpen: noop,
        showAllColumns: false,
        setShowAllColumns: noop,
        produit1: null,
        produit2: null,
        detailRows1: [],
        detailRows2: [],
        columnsProduit1: [],
        columnsProduit2: [],
        renderEpargneRow: () => () => createElement('tr'),
        compareEnabled: false,
        setCompareEnabled: noop,
      }),
    );

    expect(markup).toContain('sim-action-btn--edit');
    expect(markup).toContain('sim-action-btn--add');
    expect(markup).toContain('+ Comparer un autre placement');
    expect(markup).toContain('1 k€/an');
    expect(markup).toContain('10 k€ initial');
    expect(markup).not.toContain('pl-btn--config');
    expect(markup).not.toContain('pl-add-product-btn');
  });
});
