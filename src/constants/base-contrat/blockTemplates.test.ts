import { describe, it, expect } from 'vitest';
import { BLOCK_TEMPLATES } from './blockTemplates';

function getTemplate(templateId: string) {
  const t = BLOCK_TEMPLATES.find((x) => x.templateId === templateId);
  expect(t, `Missing templateId: ${templateId}`).toBeTruthy();
  return t!;
}

describe('BLOCK_TEMPLATES — protections calculables (PR1b)', () => {
  it('capital-deces-prevoyance exposes calculable fields for capital + beneficiaries', () => {
    const t = getTemplate('capital-deces-prevoyance');
    expect(t.suggestedPhases).toContain('deces');

    const payload = t.defaultBlock.payload;
    expect(payload.capitalDeces).toBeTruthy();
    expect(payload.nombreBeneficiaires).toBeTruthy();
    expect(payload.capitalDeces.calc).toBe(true);
    expect(payload.nombreBeneficiaires.calc).toBe(true);
  });

  it('rentes-invalidite exposes calculable fields for benefits + conditions', () => {
    const t = getTemplate('rentes-invalidite');
    expect(t.suggestedPhases).toContain('sortie');

    const payload = t.defaultBlock.payload;
    expect(payload.prestationMensuelle).toBeTruthy();
    expect(payload.franchiseJours).toBeTruthy();
    expect(payload.dureeMaxMois).toBeTruthy();

    expect(payload.prestationMensuelle.calc).toBe(true);
    expect(payload.franchiseJours.calc).toBe(true);
    expect(payload.dureeMaxMois.calc).toBe(true);
  });
});
