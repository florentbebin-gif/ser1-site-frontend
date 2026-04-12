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

describe('SituationFiscaleStep', () => {
  it('renders foyer, revenus and versements in order without local fiscal preview', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        variant="revenus-n1"
        yearLabel="2025"
        showFoyerCard
        situationFamiliale="celibataire"
        nombreParts={1.5}
        isole
        children={[{ id: 1, mode: 'charge' }]}
        isCouple={false}
        mutualisationConjoints={false}
        declarant1={baseDeclarant}
        declarant2={baseDeclarant}
        onUpdateSituation={vi.fn()}
        onAddChild={vi.fn()}
        onUpdateChildMode={vi.fn()}
        onRemoveChild={vi.fn()}
        onUpdateDeclarant={vi.fn()}
      />,
    );

    expect(html).not.toContain('Aperçu fiscal');
    expect(html.indexOf('Situation familiale')).toBeLessThan(html.indexOf('Revenus imposables'));
    expect(html.indexOf('Revenus imposables')).toBeLessThan(html.indexOf('Montants 2025 par déclarant'));
    expect(html).toContain('Nombre de parts calculé');
    expect(html).toContain('Ajouter un enfant');
  });

  it('uses the updated contribution notes without adding unsupported 2042 boxes', () => {
    const html = renderToStaticMarkup(
      <SituationFiscaleStep
        variant="revenus-n1"
        yearLabel="2025"
        showFoyerCard={false}
        situationFamiliale="celibataire"
        nombreParts={1}
        isole={false}
        children={[]}
        isCouple={false}
        mutualisationConjoints={false}
        declarant1={baseDeclarant}
        declarant2={baseDeclarant}
        onUpdateSituation={vi.fn()}
        onAddChild={vi.fn()}
        onUpdateChildMode={vi.fn()}
        onRemoveChild={vi.fn()}
        onUpdateDeclarant={vi.fn()}
      />,
    );

    expect(html).toContain('2042 : 6OS / 6OT');
    expect(html).toContain('contrat retraite, distinct du PER 154 bis');
    expect(html).toContain('employeur, réduit le plafond 163Q');
  });
});
