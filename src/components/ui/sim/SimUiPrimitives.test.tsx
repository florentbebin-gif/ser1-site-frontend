// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SimActionButton } from './SimActionButton';
import { SimDisclosureButton } from './SimDisclosureButton';
import { SimMetric } from './SimMetric';
import { SimModalSectionNav } from './SimModalSectionNav';
import { SimSkeletonCard, SimSkeletonKpi, SimSkeletonText } from './SimSkeleton';

describe('SimActionButton', () => {
  it('rend une action texte avec son libelle visible', () => {
    const html = renderToStaticMarkup(
      <SimActionButton variant="add" mode="text" label="Ajouter" onClick={vi.fn()} />,
    );

    expect(html).toContain('sim-action-btn--text');
    expect(html).toContain('sim-action-btn--add');
    expect(html).toContain('Ajouter');
  });

  it('rend une action icone avec aria-label obligatoire', () => {
    const html = renderToStaticMarkup(
      <SimActionButton
        variant="delete"
        mode="icon"
        label="Supprimer"
        ariaLabel="Supprimer le contrat"
        onClick={vi.fn()}
      />,
    );

    expect(html).toContain('aria-label="Supprimer le contrat"');
    expect(html).toContain('sim-action-btn--icon');
    expect(html).toContain('<svg');
  });

  it('marque les actions danger', () => {
    const html = renderToStaticMarkup(
      <SimActionButton variant="delete" mode="text" label="Supprimer" danger onClick={vi.fn()} />,
    );

    expect(html).toContain('sim-action-btn--danger');
  });

  it('propage disabled', () => {
    const html = renderToStaticMarkup(
      <SimActionButton variant="duplicate" mode="text" label="Dupliquer" disabled />,
    );

    expect(html).toContain('disabled=""');
  });

  it('utilise type button par defaut', () => {
    const html = renderToStaticMarkup(
      <SimActionButton variant="close" mode="text" label="Fermer" />,
    );

    expect(html).toContain('type="button"');
  });

  it('declenche le callback au clic', () => {
    const onClick = vi.fn();
    render(<SimActionButton variant="edit" mode="text" label="Modifier" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('SimDisclosureButton', () => {
  it('rend le libelle ferme avec aria-expanded false', () => {
    const html = renderToStaticMarkup(
      <SimDisclosureButton
        expanded={false}
        onToggle={vi.fn()}
        labelClosed="Afficher le detail"
        labelOpen="Masquer le detail"
      />,
    );

    expect(html).toContain('Afficher le detail');
    expect(html).toContain('aria-expanded="false"');
  });

  it('rend le libelle ouvert avec aria-expanded true', () => {
    const html = renderToStaticMarkup(
      <SimDisclosureButton
        expanded
        onToggle={vi.fn()}
        labelClosed="Afficher"
        labelOpen="Masquer"
      />,
    );

    expect(html).toContain('Masquer');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('is-open');
  });

  it('relie le panneau controle', () => {
    const html = renderToStaticMarkup(
      <SimDisclosureButton
        expanded={false}
        onToggle={vi.fn()}
        labelClosed="Afficher"
        labelOpen="Masquer"
        controls="panel-1"
      />,
    );

    expect(html).toContain('aria-controls="panel-1"');
  });

  it('declenche onToggle au clic', () => {
    const onToggle = vi.fn();
    render(
      <SimDisclosureButton
        expanded={false}
        onToggle={onToggle}
        labelClosed="Afficher"
        labelOpen="Masquer"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Afficher' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('SimMetric', () => {
  it('rend une metrique hero avec label, valeur et unite', () => {
    const html = renderToStaticMarkup(
      <SimMetric variant="hero" label="Impôt estimé" value="12 400" unit="€" />,
    );

    expect(html).toContain('sim-metric--hero');
    expect(html).toContain('Impôt estimé');
    expect(html).toContain('12 400');
    expect(html).toContain('€');
  });

  it('rend une note', () => {
    const html = renderToStaticMarkup(
      <SimMetric variant="secondary" label="Avancement" value="42" unit="%" note="Cycle courant" />,
    );

    expect(html).toContain('Cycle courant');
  });

  it('rend le slot delta', () => {
    const html = renderToStaticMarkup(
      <SimMetric variant="inline" label="Gain" value="1 000" delta={<span>+4 %</span>} />,
    );

    expect(html).toContain('sim-metric__delta');
    expect(html).toContain('+4 %');
  });

  it('expose les variantes secondary et inline', () => {
    const secondary = renderToStaticMarkup(
      <SimMetric variant="secondary" label="Mensualité" value="980" unit="€" />,
    );
    const inline = renderToStaticMarkup(<SimMetric variant="inline" label="Taux" value="2,1" />);

    expect(secondary).toContain('sim-metric--secondary');
    expect(inline).toContain('sim-metric--inline');
  });

  it('conserve un markup numerique stable', () => {
    const html = renderToStaticMarkup(
      <SimMetric variant="hero" label="Capital" value="250 000" unit="€" />,
    );

    expect(html).toContain('sim-metric__value');
    expect(html).toContain('sim-metric__unit');
  });
});

describe('SimModalSectionNav', () => {
  const sections = [
    { id: 'identite', label: 'Identité', controls: 'panel-identite' },
    { id: 'revenus', label: 'Revenus', controls: 'panel-revenus' },
    { id: 'sortie', label: 'Sortie', disabled: true },
  ];

  it('rend une navigation libellee', () => {
    const html = renderToStaticMarkup(
      <SimModalSectionNav
        sections={sections}
        activeId="identite"
        ariaLabel="Rubriques"
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('aria-label="Rubriques"');
    expect(html).toContain('sim-modal-section-nav');
  });

  it('marque la section active avec aria-current step', () => {
    const html = renderToStaticMarkup(
      <SimModalSectionNav
        sections={sections}
        activeId="revenus"
        ariaLabel="Rubriques"
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('aria-current="step"');
    expect(html).toContain('aria-controls="panel-revenus"');
  });

  it('respecte disabled sur une section', () => {
    const html = renderToStaticMarkup(
      <SimModalSectionNav
        sections={sections}
        activeId="identite"
        ariaLabel="Rubriques"
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('disabled=""');
  });

  it('declenche onChange avec l identifiant clique', () => {
    const onChange = vi.fn();
    render(
      <SimModalSectionNav
        sections={sections}
        activeId="identite"
        ariaLabel="Rubriques"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revenus' }));

    expect(onChange).toHaveBeenCalledWith('revenus');
  });

  it('ne declenche pas onChange sur la section deja active', () => {
    const onChange = vi.fn();
    render(
      <SimModalSectionNav
        sections={sections}
        activeId="identite"
        ariaLabel="Rubriques"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Identité' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('SimSkeleton', () => {
  it('rend des lignes de squelette sans contenu accessible', () => {
    const html = renderToStaticMarkup(<SimSkeletonText lines={3} />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('sim-skeleton-text');
    expect(html.match(/sim-skeleton--text/g)).toHaveLength(3);
  });

  it('rend les variantes carte et KPI', () => {
    const card = renderToStaticMarkup(<SimSkeletonCard />);
    const kpi = renderToStaticMarkup(<SimSkeletonKpi />);

    expect(card).toContain('sim-skeleton-card');
    expect(card).toContain('sim-skeleton-card__body');
    expect(kpi).toContain('sim-skeleton-kpi');
    expect(kpi).toContain('sim-skeleton-kpi__value');
  });
});
