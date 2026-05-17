import { describe, expect, it } from 'vitest';
import { BASECG_CATALOG } from '@/data/basecg';
import { formatBaseCgRetraiteRateField, normalizeBaseCgRetraiteGestionFees } from '../utils/baseCgRetraiteNormalization';

describe('baseCgRetraiteNormalization', () => {
  it('recopie le frais de gestion général vers les deux ventilations en lecture', () => {
    const normalized = normalizeBaseCgRetraiteGestionFees({
      fraisGestion: 0.00495,
      fraisGestionFondsEuro: null,
      fraisGestionUc: null,
    });

    expect(normalized.fraisGestionFondsEuro).toBe(0.00495);
    expect(normalized.fraisGestionUc).toBe(0.00495);
  });

  it('sépare les frais fonds euros et UC quand la base historique les mélange', () => {
    const normalized = normalizeBaseCgRetraiteGestionFees({
      fraisGestion: '0,65%€\n0,96%UC',
      fraisGestionFondsEuro: null,
      fraisGestionUc: null,
    });

    expect(formatBaseCgRetraiteRateField(normalized.fraisGestionFondsEuro)).toBe('0,65 %');
    expect(formatBaseCgRetraiteRateField(normalized.fraisGestionUc)).toBe('0,96 %');
  });

  it('sépare les frais collés sans séparateur (0,65%€0,96%UC)', () => {
    const cases = [
      '0,65%€0,96%UC',
      '0,65%€ 0,96%UC',
      '0,65% € 0,96% UC',
    ];
    for (const fraisGestion of cases) {
      const normalized = normalizeBaseCgRetraiteGestionFees({
        fraisGestion,
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
      });
      expect(formatBaseCgRetraiteRateField(normalized.fraisGestionFondsEuro)).toBe('0,65 %');
      expect(formatBaseCgRetraiteRateField(normalized.fraisGestionUc)).toBe('0,96 %');
    }
  });

  it('conserve la ventilation pertinente quand seul un support est identifié', () => {
    const normalized = normalizeBaseCgRetraiteGestionFees({
      fraisGestion: 'Variable en fonction des UC',
      fraisGestionFondsEuro: null,
      fraisGestionUc: null,
    });

    expect(normalized.fraisGestionFondsEuro).toBeNull();
    expect(normalized.fraisGestionUc).toBe('Variable en fonction des UC');
  });

  it('applique un taux commun quand la base indique UC et fonds euros ensemble', () => {
    const normalized = normalizeBaseCgRetraiteGestionFees({
      fraisGestion: '1%UC et €\n2%Pilotée',
      fraisGestionFondsEuro: null,
      fraisGestionUc: null,
    });

    expect(formatBaseCgRetraiteRateField(normalized.fraisGestionFondsEuro)).toBe('1 %');
    expect(formatBaseCgRetraiteRateField(normalized.fraisGestionUc)).toBe('1 %');
  });

  it('ventile les frais mixtes fonds euros / UC présents dans le catalogue statique', () => {
    const mixedContracts = BASECG_CATALOG.filter((contract) => {
      const value = contract.phaseEpargne.fraisGestion;
      return typeof value === 'string' && value.includes('€') && /\bUC\b/i.test(value);
    });

    expect(mixedContracts.length).toBeGreaterThan(0);
    for (const contract of mixedContracts) {
      const normalized = normalizeBaseCgRetraiteGestionFees(contract.phaseEpargne);
      expect(normalized.fraisGestionFondsEuro).not.toBe(contract.phaseEpargne.fraisGestion);
      expect(normalized.fraisGestionUc).not.toBe(contract.phaseEpargne.fraisGestion);
    }
  });

  it('formate les décimaux de taux en pourcentage sans modifier les textes contractuels', () => {
    expect(formatBaseCgRetraiteRateField(0.0495)).toBe('4,95 %');
    expect(formatBaseCgRetraiteRateField('TMG 2 % selon millésime')).toBe('TMG 2 % selon millésime');
  });

  describe('règles métier monosupport / multisupport', () => {
    it('monosupport (nombreFonds=1) : FG UC laissé vide, FG€ reçoit le taux unique (cas ART83- COREM CO)', () => {
      const normalized = normalizeBaseCgRetraiteGestionFees({
        fraisGestion: 0.003,
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
        nombreFonds: 1,
      });
      expect(normalized.fraisGestionFondsEuro).toBe(0.003);
      expect(normalized.fraisGestionUc).toBeNull();
    });

    it('monosupport avec rate string : FG UC reste vide (cas MADELIN- GARANTIE RETRAITE INDEPENDANTS)', () => {
      const normalized = normalizeBaseCgRetraiteGestionFees({
        fraisGestion: 0.00475,
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
        nombreFonds: 1,
      });
      expect(normalized.fraisGestionFondsEuro).toBe(0.00475);
      expect(normalized.fraisGestionUc).toBeNull();
    });

    it('ventilation explicite avec extras : concatène les autres frais en texte sur FG UC (cas PERIN- ORIGINEO BY CRYSTAL)', () => {
      const normalized = normalizeBaseCgRetraiteGestionFees({
        fraisGestion: '0,90% fonds €\n1% UC\n1,20% SCPI/pilotée/horizon',
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
        nombreFonds: 74,
      });
      expect(formatBaseCgRetraiteRateField(normalized.fraisGestionFondsEuro)).toBe('0,9 %');
      expect(typeof normalized.fraisGestionUc).toBe('string');
      expect(String(normalized.fraisGestionUc)).toContain('1 %');
      expect(String(normalized.fraisGestionUc)).toContain('1,20% SCPI/pilotée/horizon');
    });

    it('multisupport sans ventilation explicite : même taux pour FG€ et FG UC (cas PERP- SWISSLIFE PERP)', () => {
      const normalized = normalizeBaseCgRetraiteGestionFees({
        fraisGestion: 0.0096,
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
        nombreFonds: 568,
      });
      expect(normalized.fraisGestionFondsEuro).toBe(0.0096);
      expect(normalized.fraisGestionUc).toBe(0.0096);
    });

    it('nombreFonds non renseigné : fallback bilatéral (rétrocompat)', () => {
      const normalized = normalizeBaseCgRetraiteGestionFees({
        fraisGestion: 0.00495,
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
        nombreFonds: null,
      });
      expect(normalized.fraisGestionFondsEuro).toBe(0.00495);
      expect(normalized.fraisGestionUc).toBe(0.00495);
    });
  });
});
