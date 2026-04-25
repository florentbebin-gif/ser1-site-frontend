import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PerMadelinInfoModal } from './PerMadelinInfoModal';

const zeroDetail = {
  assietteVersement: 0,
  assietteReport: 0,
  enveloppe15Versement: 0,
  enveloppe15Report: 0,
  enveloppe10: 0,
  cotisationsVersees: 0,
  utilisation15Versement: { madelinRetraite: 0, per154bis: 0, total: 0 },
  depassement15Versement: { madelinRetraite: 0, per154bis: 0, total: 0 },
  utilisation15Report: { madelinRetraite: 0, per154bis: 0, total: 0 },
  depassement15Report: { madelinRetraite: 0, per154bis: 0, total: 0 },
  consommation10: { art83: 0, perco: 0, madelinRetraite: 0, per154bis: 0, total: 0 },
  reste15Versement: 0,
  reste15Report: 0,
  reste10: 0,
  disponibleRestant: 0,
  surplusAReintegrer: 0,
  depassement: false,
};

describe('PerMadelinInfoModal', () => {
  it('affiche uniquement le message d’absence de base TNS quand aucun revenu TNS n’est saisi', () => {
    const html = renderToStaticMarkup(
      <PerMadelinInfoModal
        declarant1={zeroDetail}
        isCouple={false}
        onClose={vi.fn()}
      />,
    );

    expect(html).toContain('Aucune base TNS saisie');
    expect(html).not.toContain('Assiette de versement');
    expect(html).not.toContain('Enveloppe 10 % commune');
    expect(html).not.toContain('0 €');
  });
});
