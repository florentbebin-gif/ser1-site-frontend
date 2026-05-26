// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SimActionButton } from './SimActionButton';
import { SimDisclosureButton } from './SimDisclosureButton';
import { SimEmptyState } from './SimEmptyState';
import { SimKpiReference } from './SimKpiReference';
import { SimMetric } from './SimMetric';
import { SimModalSectionNav } from './SimModalSectionNav';
import { SimPageStepper } from './SimPageStepper';
import { SimSkeletonCard, SimSkeletonKpi, SimSkeletonText } from './SimSkeleton';
import { SimSparkline } from './SimSparkline';
import { SimDelta } from './SimDelta';
import { SimStatusBadge } from './SimStatusBadge';
import { SimTooltip } from './SimTooltip';
import { SimViewSynthesisCTA } from './SimViewSynthesisCTA';

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: {
      _raw_tax: {
        incomeTax: { currentYearLabel: 'IR test' },
        pfu: { current: { rateIR: 7.4 } },
        dmtg: { ligneDirecte: { abattement: 123456 } },
        corporateTax: { current: { normalRate: 21, reducedRate: 9 } },
      },
      _raw_ps: {
        labels: { currentYearLabel: 'PS test' },
        patrimony: { current: { generalRate: 8.5 } },
      },
      _raw_fiscality: {
        perIndividuel: {
          rente: { pensionAbatementRatePercent: 6 },
          sortieCapital: {
            retraite: {
              petiteRente: { monthlyThreshold: 234 },
            },
          },
        },
      },
    },
  }),
}));

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
        controls="disclosure-panel-closed"
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
        controls="disclosure-panel-open"
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
        controls="disclosure-panel-click"
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

describe('SimTooltip', () => {
  it('ouvre le panneau au clic avec aria-describedby', () => {
    render(<SimTooltip label="PFU" description="Définition du PFU." />);

    const trigger = screen.getByRole('button', { name: 'Définition : PFU' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-describedby');
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Définition du PFU.');
  });

  it('ferme le panneau avec la touche Echap', () => {
    render(<SimTooltip label="TMI" description="Définition du TMI." />);

    const trigger = screen.getByRole('button', { name: 'Définition : TMI' });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('positionne le panneau près du déclencheur à l’ouverture', () => {
    render(<SimTooltip label="IFI" description="Définition de l’IFI." />);

    const trigger = screen.getByRole('button', { name: 'Définition : IFI' });
    const panel = screen.getByRole('tooltip', { hidden: true });

    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 20,
      top: 20,
      right: 120,
      bottom: 52,
      left: 40,
      width: 80,
      height: 32,
      toJSON: () => ({}),
    });
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 320,
      bottom: 120,
      left: 0,
      width: 320,
      height: 120,
      toJSON: () => ({}),
    });

    fireEvent.click(trigger);

    expect(panel).toHaveStyle({ left: '40px', top: '56px' });
  });
});

describe('SimEmptyState', () => {
  it('rend un état vide illustré avec titre, description et action', () => {
    const html = renderToStaticMarkup(
      <SimEmptyState
        illustration="chart"
        title="Aucune synthèse"
        description="Complétez les champs pour afficher les indicateurs."
        cta={<button type="button">Compléter</button>}
      />,
    );

    expect(html).toContain('sim-empty-state');
    expect(html).toContain('sim-empty-state__illustration');
    expect(html).toContain('Aucune synthèse');
    expect(html).toContain('Complétez les champs');
    expect(html).toContain('Compléter');
  });

  it('rend une variante compacte pour les sidebars de synthèse', () => {
    const html = renderToStaticMarkup(
      <SimEmptyState
        variant="sidebar"
        illustration="docs"
        title="Synthèse en attente"
        description="Complétez les prérequis."
      />,
    );

    expect(html).toContain('sim-empty-state--sidebar');
    expect(html).toContain('Synthèse en attente');
  });
});

describe('SimPageStepper', () => {
  it('rend un fil de progression discret et accessible', () => {
    const html = renderToStaticMarkup(
      <SimPageStepper
        steps={[
          { id: 'profil', label: 'Profil', status: 'done' },
          { id: 'saisie', label: 'Saisie', status: 'current' },
          { id: 'synthese', label: 'Synthèse', disabled: true },
        ]}
      />,
    );

    expect(html).toContain('sim-page-stepper');
    expect(html).toContain('<nav');
    expect(html).toContain('aria-label="Étapes du simulateur"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('Profil');
    expect(html).toContain('disabled=""');
  });

  it('fait défiler vers la section ciblée au clic', () => {
    const target = document.createElement('section');
    target.id = 'sim-synthese';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    render(
      <SimPageStepper steps={[{ id: 'synthese', label: 'Synthèse', targetId: 'sim-synthese' }]} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Synthèse' }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    target.remove();
  });
});

describe('SimViewSynthesisCTA', () => {
  it('reste masqué tant que la synthèse n’est pas prête', () => {
    const html = renderToStaticMarkup(<SimViewSynthesisCTA ready={false} targetId="synthese" />);

    expect(html).toBe('');
  });

  it('rend un CTA contextuel vers la synthèse prête', () => {
    const html = renderToStaticMarkup(
      <SimViewSynthesisCTA ready targetId="synthese" hint="Indicateurs calculés" />,
    );

    expect(html).toContain('sim-view-synthesis-cta');
    expect(html).toContain('Voir la synthèse');
    expect(html).toContain('Indicateurs calculés');
  });

  it('supporte la variante flottante prévue pour les pages simulateurs', () => {
    const html = renderToStaticMarkup(
      <SimViewSynthesisCTA ready targetId="synthese" variant="floating" />,
    );

    expect(html).toContain('sim-view-synthesis-cta--floating');
  });
});

describe('SimSparkline', () => {
  it('rend une ligne SVG décorative en couleur courante', () => {
    const html = renderToStaticMarkup(<SimSparkline />);

    expect(html).toContain('width="60"');
    expect(html).toContain('height="16"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('currentColor');
  });
});

describe('SimKpiReference', () => {
  it('rend la référence IR depuis le contexte fiscal brut', () => {
    const html = renderToStaticMarkup(<SimKpiReference kind="ir" />);

    expect(html).toContain('Barème IR test');
  });

  it('rend une référence PFU et PS depuis le contexte fiscal brut', () => {
    const html = renderToStaticMarkup(<SimKpiReference kind="pfu" />);

    expect(html).toContain('PFU IR 7,4 %');
    expect(html).toContain('PS 8,5 %');
  });

  it('rend les références DMTG, PER et IS', () => {
    const html = renderToStaticMarkup(
      <>
        <SimKpiReference kind="dmtg" />
        <SimKpiReference kind="per" />
        <SimKpiReference kind="is" />
      </>,
    );

    expect(html).toContain('DMTG ligne directe');
    expect(html).toContain('123 456 €');
    expect(html).toContain('PER retraite');
    expect(html).toContain('IS 21 %');
  });
});

describe('SimStatusBadge', () => {
  it('rend un badge optimal avec libelle visible', () => {
    const html = renderToStaticMarkup(<SimStatusBadge variant="optimal">Optimal</SimStatusBadge>);

    expect(html).toContain('sim-status-badge--optimal');
    expect(html).toContain('Optimal');
  });

  it('rend les variantes attention et info', () => {
    const html = renderToStaticMarkup(
      <>
        <SimStatusBadge variant="attention">À revoir</SimStatusBadge>
        <SimStatusBadge variant="info">Info</SimStatusBadge>
      </>,
    );

    expect(html).toContain('sim-status-badge--attention');
    expect(html).toContain('sim-status-badge--info');
    expect(html).toContain('À revoir');
  });
});

describe('SimDelta', () => {
  it('rend le signe positif, la valeur et l unité', () => {
    const html = renderToStaticMarkup(<SimDelta value={12.5} unit="%" />);

    expect(html).toContain('sim-delta--positive');
    expect(html).toContain('sim-delta__sign">+</span>');
    expect(html).toContain('12,5');
    expect(html).toContain('%');
  });

  it('rend un delta negatif avec formateur de valeur', () => {
    const html = renderToStaticMarkup(
      <SimDelta value={-4800} formatValue={(value) => `${value.toLocaleString('fr-FR')} €`} />,
    );

    expect(html).toContain('sim-delta--negative');
    expect(html).toContain('sim-delta__sign">−</span>');
    expect(html).toContain('4 800 €');
  });
});
