import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PerPotentielResult } from '../../../../engine/per';
import { PerPotentielContextSidebar } from './PerPotentielContextSidebar';

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const result: PerPotentielResult = {
  situationFiscale: {
    revenuImposableD1: 32000,
    revenuImposableD2: 28000,
    revenuFiscalRef: 60000,
    tmi: 0.3,
    irEstime: 5400,
    decote: 0,
    cehr: 0,
    montantDansLaTMI: 1200,
  },
  plafond163Q: {
    declarant1: {
      plafondCalculeN: 0,
      nonUtiliseN1: 0,
      nonUtiliseN2: 0,
      nonUtiliseN3: 0,
      totalDisponible: 0,
      cotisationsDejaVersees: 0,
      disponibleRestant: 0,
      depassement: false,
    },
    declarant2: {
      plafondCalculeN: 0,
      nonUtiliseN1: 0,
      nonUtiliseN2: 0,
      nonUtiliseN3: 0,
      totalDisponible: 0,
      cotisationsDejaVersees: 0,
      disponibleRestant: 0,
      depassement: false,
    },
  },
  deductionFlow163Q: {
    declarant1: {
      plafondDisponible: 11111,
      plafondApresMutualisation: 11111,
      cotisationsVersees: 4568,
      cotisationsRetenuesIr: 4568,
      cotisationsNonDeductibles: 0,
      mutualisationRecue: 0,
      mutualisationCedee: 0,
      disponibleRestant: 6543,
    },
    declarant2: {
      plafondDisponible: 7777,
      plafondApresMutualisation: 7777,
      cotisationsVersees: 4567,
      cotisationsRetenuesIr: 4567,
      cotisationsNonDeductibles: 0,
      mutualisationRecue: 0,
      mutualisationCedee: 0,
      disponibleRestant: 3210,
    },
    totalDeductionsIr: 9135,
  },
  plafondMadelin: {
    declarant1: {
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
      disponibleRestant: 999,
      surplusAReintegrer: 0,
      depassement: false,
    },
    declarant2: {
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
      disponibleRestant: 888,
      surplusAReintegrer: 0,
      depassement: false,
    },
  },
  estTNS: false,
  declaration2042: {
    case6NS: 1200,
    case6NT: 1300,
    case6RS: 900,
    case6RT: 800,
    case6QS: 700,
    case6QT: 600,
    case6OS: 500,
    case6OT: 400,
    case6QR: true,
  },
  projectionAvisSuivant: {
    declarant1: {
      nonUtiliseN2: 2100,
      nonUtiliseN1: 2200,
      nonUtiliseN: 2300,
      plafondCalculeN: 2400,
      plafondTotal: 9000,
    },
    declarant2: {
      nonUtiliseN2: 1100,
      nonUtiliseN1: 1200,
      nonUtiliseN: 1300,
      plafondCalculeN: 1400,
      plafondTotal: 5000,
    },
  },
  warnings: [],
};

describe('PerPotentielContextSidebar', () => {
  it('uses the remaining 163 quatervicies and a single live preview on the revenus step', () => {
    const html = renderToStaticMarkup(
      <PerPotentielContextSidebar
        step={3}
        isCouple
        showRevenusPreview
        showAdjustedPotentiel
        fiscalPreviewTitle="Synthèse déclaration IR 2026"
        projectionPreviewTitle="Plafonds projetés"
        showProjectedPlafondCalcule
        parcoursPills={[{ label: 'Avis IR 2025', on: true }]}
        totalAvisIrD1={11111}
        totalAvisIrD2={7777}
        result={result}
      />,
    );

    expect(html).toContain('163 quatervicies disponible après saisie');
    expect(html).toContain(fmtCurrency(6543));
    expect(html).toContain(fmtCurrency(3210));
    expect(html).not.toContain(fmtCurrency(11111));
    expect(html).toContain('Déclaration 2042');
    expect(html).toContain('Prochain avis IR');
    expect(html).toContain('6NS');
    expect(html).toContain('6NT');
    expect(html).toContain('Déclarant 1');
    expect(html).toContain('Déclarant 2');
    expect(html).toContain('Enveloppes Madelin N');
    expect(html).toContain(fmtCurrency(999));
    expect(html).toContain(fmtCurrency(888));
    expect(html).not.toContain('D1 15 %');
    expect(html).not.toContain('D1 10 %');
    expect(html).not.toContain('D2 15 %');
    expect(html).not.toContain('D2 10 %');
    expect(html).toContain('Synthèse déclaration IR 2026');
    expect(html).not.toContain('Aperçu en direct');
  });

  it('keeps the split preview outside the revenus step with contextual titles', () => {
    const html = renderToStaticMarkup(
      <PerPotentielContextSidebar
        step={3}
        isCouple
        showRevenusPreview={false}
        showAdjustedPotentiel={false}
        fiscalPreviewTitle="Estimation fiscale 2026"
        projectionPreviewTitle="Plafonds projetés"
        showProjectedPlafondCalcule
        parcoursPills={[{ label: 'Avis IR 2025', on: true }]}
        totalAvisIrD1={11111}
        totalAvisIrD2={7777}
        result={result}
      />,
    );

    expect(html).toContain('Estimation fiscale 2026');
    expect(html).toContain('Plafonds projetés');
    expect(html).not.toContain('Aperçu en direct');
    expect(html).toContain(fmtCurrency(11111));
  });

  it('uses the remaining 163 quatervicies on the Versement N step', () => {
    const html = renderToStaticMarkup(
      <PerPotentielContextSidebar
        step={4}
        isCouple
        showRevenusPreview={false}
        showAdjustedPotentiel
        fiscalPreviewTitle="Contrôle versement 2026"
        projectionPreviewTitle="Plafonds projetés"
        showProjectedPlafondCalcule
        parcoursPills={[{ label: 'Avis IR 2025', on: true }]}
        totalAvisIrD1={11111}
        totalAvisIrD2={7777}
        result={result}
      />,
    );

    expect(html).toContain('163 quatervicies disponible après saisie');
    expect(html).toContain(fmtCurrency(6543));
    expect(html).toContain(fmtCurrency(3210));
    expect(html).not.toContain(fmtCurrency(11111));
    expect(html).not.toContain("163 quatervicies issu de l'avis IR");
  });

  it('masque le plafond calculé quand les revenus projetés ne sont pas renseignés', () => {
    const html = renderToStaticMarkup(
      <PerPotentielContextSidebar
        step={3}
        isCouple
        showRevenusPreview={false}
        showAdjustedPotentiel
        fiscalPreviewTitle="Contrôle versement 2026"
        projectionPreviewTitle="Plafonds projetés"
        showProjectedPlafondCalcule={false}
        parcoursPills={[{ label: 'Avis IR 2026', on: true }]}
        totalAvisIrD1={11111}
        totalAvisIrD2={7777}
        result={result}
      />,
    );

    expect(html).toContain('Plafond calculé');
    expect(html).toContain('À déterminer');
    expect(html).not.toContain(fmtCurrency(2400));
    expect(html).not.toContain(fmtCurrency(1400));
  });
});
