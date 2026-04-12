import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import SituationFiscaleStep from './SituationFiscaleStep';

const baseDeclarant = {
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
  situationFamiliale: 'celibataire' as const,
  isole: true,
  children: [{ id: 1, mode: 'charge' as const }],
  isCouple: false,
  mutualisationConjoints: false,
  declarant1: baseDeclarant,
  declarant2: baseDeclarant,
  incomeFilters: { tns: false, pension: false, foncier: false },
  abat10SalCfg: { plafond: 14522, plancher: 495 },
  abat10RetCfg: { plafond: 4399, plancher: 450 },
  onUpdateSituation: vi.fn(),
  onAddChild: vi.fn(),
  onUpdateChildMode: vi.fn(),
  onRemoveChild: vi.fn(),
  onToggleIncomeFilter: vi.fn(),
  onUpdateDeclarant: vi.fn(),
};

describe('SituationFiscaleStep', () => {
  it('renders foyer, revenus and versements in order without number of parts in the foyer', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        showFoyerCard
        {...baseProps}
      />,
    );

    expect(html).not.toContain('Nombre de parts calculÃ©');
    expect(html).not.toContain('AperÃ§u fiscal');
    expect(html.indexOf('Situation familiale')).toBeLessThan(html.indexOf('Revenus imposables'));
    expect(html.indexOf('Revenus imposables')).toBeLessThan(html.indexOf('Versements retraite'));
    expect(html).toContain('Ajouter un enfant');
    expect(html).not.toContain('Mutualisation des plafonds (case 6QR)');
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

  it('renders the conditional revenu rows from the IR-like filters', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        showFoyerCard={false}
        {...baseProps}
        incomeFilters={{ tns: true, pension: true, foncier: true }}
      />,
    );

    expect(html).toContain('TNS');
    expect(html).toContain('Pension');
    expect(html).toContain('Foncier');
    expect(html).toContain('Revenus des associés / gérants');
    expect(html).toContain('BIC / BNC / BA imposables');
    expect(html).toContain('Pensions, retraites et rentes');
    expect(html).toContain('Abattement 10 % pensions (foyer)');
    expect(html).toContain('Revenus fonciers nets');
  });

  it('uses the updated contribution notes without adding unsupported 2042 boxes', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        showFoyerCard={false}
        {...baseProps}
      />,
    );

    expect(html).toContain('2042 : 6OS / 6OT');
    expect(html).toContain('contrat retraite, distinct du PER 154 bis');
    expect(html).toContain('employeur, réduit le plafond 163Q');
  });
});
