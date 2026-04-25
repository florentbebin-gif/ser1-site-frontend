import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import SituationFiscaleStep from './SituationFiscaleStep';
import { buildTnsFoyerTogglePatches } from './PerIncomeTable';

const baseDeclarant = {
  statutTns: false,
  salaires: 45000,
  fraisReels: false,
  fraisReelsMontant: 0,
  art62: 0,
  bic: 0,
  retraites: 0,
  fonciersNets: 0,
  autresRevenus: 0,
  cotisationsPer163Q: 2000,
  cotisationsPerp: 0,
  cotisationsArt83: 1200,
  cotisationsMadelin154bis: 0,
  cotisationsMadelinRetraite: 3000,
  abondementPerco: 500,
  cotisationsPrevo: 0,
};

const baseProps = {
  variant: 'revenus-n1' as const,
  yearLabel: '2025',
  showIncomeCard: true,
  situationFamiliale: 'celibataire' as const,
  isole: true,
  children: [{ id: 1, mode: 'charge' as const }],
  isCouple: false,
  mutualisationConjoints: false,
  declarant1: baseDeclarant,
  declarant2: baseDeclarant,
  plafondMadelin: undefined,
  incomeFilters: { pension: false, foncier: false },
  abat10SalCfg: { plafond: 14522, plancher: 495 },
  abat10RetCfg: { plafond: 4399, plancher: 450 },
  onUpdateSituation: vi.fn(),
  onAddChild: vi.fn(),
  onUpdateChildMode: vi.fn(),
  onRemoveChild: vi.fn(),
  onToggleIncomeFilter: vi.fn(),
  onUpdateDeclarant: vi.fn(),
  onUpdateDeclarants: vi.fn(),
};

describe('SituationFiscaleStep', () => {
  it('renders foyer, revenus and versements in order without number of parts in the foyer', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        showFoyerCard
        {...baseProps}
      />,
    );

    expect(html).not.toContain('Nombre de parts calcul');
    expect(html).not.toContain('Aperçu fiscal');
    expect(html.indexOf('Situation familiale')).toBeLessThan(html.indexOf('Revenus imposables'));
    expect(html.indexOf('Revenus imposables')).toBeLessThan(html.indexOf('Versements retraite'));
    expect(html).toContain('Ajouter un enfant');
    expect(html).not.toContain('Mutualisation des plafonds (case 6QR)');
    expect(html).toContain('per-checkbox-label--isole');
  });

  it('renders mutualisation des plafonds inside the versements block for couples', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        showFoyerCard
        {...baseProps}
        situationFamiliale="marie"
        isCouple
      />,
    );

    expect(html).toContain('Mutualisation des plafonds (case 6QR)');
    expect(html.indexOf('Versements retraite')).toBeLessThan(html.indexOf('Mutualisation des plafonds (case 6QR)'));
  });

  it('renders the conditional revenu rows from the toggles and filters', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        showFoyerCard={false}
        {...baseProps}
        declarant1={{ ...baseDeclarant, statutTns: true }}
        incomeFilters={{ pension: true, foncier: true }}
      />,
    );

    expect(html).toContain('TNS');
    expect(html).not.toContain('D1 TNS');
    expect(html).not.toContain('D2 TNS');
    expect(html).toContain('Pension');
    expect(html).toContain('Foncier');
    expect(html).toContain('Revenus des associés / gérants');
    expect(html).toContain('BIC / BNC / BA imposables');
    expect(html).toContain('Pensions, retraites et rentes');
    expect(html).toContain('Abattement 10 % pensions (foyer)');
    expect(html).toContain('Revenus fonciers nets');
  });

  it('peut masquer les revenus imposables sans masquer les versements retraite', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        showFoyerCard={false}
        {...baseProps}
        showIncomeCard={false}
      />,
    );

    expect(html).not.toContain('Revenus imposables');
    expect(html).toContain('Versements retraite');
    expect(html).toContain('PER 163 quatervicies');
  });

  it('uses the updated contribution notes and info button', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        showFoyerCard={false}
        {...baseProps}
        declarant1={{ ...baseDeclarant, statutTns: true }}
      />,
    );

    expect(html).toContain('2042 : 6OS / 6OT');
    expect(html).toContain('contribue à 6QS / 6QT');
    expect(html).toContain('nécessaire pour le calcul de l');
    expect(html).toContain('Afficher le détail des enveloppes Madelin 154 bis');
  });

  it('builds a global TNS toggle patch for the whole foyer', () => {
    expect(buildTnsFoyerTogglePatches({
      isCouple: true,
      declarant1: baseDeclarant,
      declarant2: baseDeclarant,
    })).toEqual([
      { decl: 1, patch: { statutTns: true } },
      { decl: 2, patch: { statutTns: true } },
    ]);

    expect(buildTnsFoyerTogglePatches({
      isCouple: true,
      declarant1: { ...baseDeclarant, statutTns: false },
      declarant2: { ...baseDeclarant, statutTns: true, bic: 50_000 },
    })).toEqual([
      {
        decl: 1,
        patch: {
          statutTns: false,
          art62: 0,
          bic: 0,
          cotisationsMadelin154bis: 0,
          cotisationsMadelinRetraite: 0,
          cotisationsPrevo: 0,
        },
      },
      {
        decl: 2,
        patch: {
          statutTns: false,
          art62: 0,
          bic: 0,
          cotisationsMadelin154bis: 0,
          cotisationsMadelinRetraite: 0,
          cotisationsPrevo: 0,
        },
      },
    ]);
  });
});
