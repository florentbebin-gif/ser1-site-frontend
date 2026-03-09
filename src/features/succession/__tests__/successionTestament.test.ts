import { describe, expect, it } from 'vitest';
import {
  buildTestamentBeneficiaryOptions,
  getQuotiteDisponiblePctForSide,
  getReserveHintForSide,
  getTestamentCardTitle,
} from '../successionTestament';

describe('successionTestament helpers', () => {
  it('construit les beneficiaires testamentaires avec reserve sur la branche concernee', () => {
    const enfants = [
      { id: 'E1', prenom: 'Alice', rattachement: 'commun' as const },
      { id: 'E2', prenom: 'Bastien', rattachement: 'epoux2' as const },
    ];
    const familyMembers = [
      { id: 'F1', type: 'parent' as const, branch: 'epoux1' as const },
      { id: 'F2', type: 'tierce_personne' as const },
    ];

    const options = buildTestamentBeneficiaryOptions('pacse', 'epoux1', enfants, familyMembers);

    expect(options.find((option) => option.value === 'principal:epoux2')?.label).toBe('Partenaire 2');
    expect(options.find((option) => option.value === 'enfant:E1')?.label).toContain('reservataire');
    expect(options.find((option) => option.value === 'enfant:E2')?.label).not.toContain('reservataire');
    expect(options.find((option) => option.value === 'family:F1')?.label).toContain('Parent');
  });

  it('calcule la quotite disponible et le libelle de reserve par cote', () => {
    const enfants = [
      { id: 'E1', rattachement: 'epoux1' as const },
      { id: 'E2', rattachement: 'epoux1' as const },
    ];

    expect(getQuotiteDisponiblePctForSide(enfants, [], 'epoux1')).toBeCloseTo(33.333, 2);
    expect(getReserveHintForSide(enfants, [], 'epoux1')).toContain('33.33 %');
    expect(getQuotiteDisponiblePctForSide(enfants, [], 'epoux2')).toBe(100);
    expect(getReserveHintForSide(enfants, [], 'epoux2')).toBeNull();
  });

  it('retourne un titre de carte coherent avec la situation', () => {
    expect(getTestamentCardTitle('marie', 'epoux1')).toBe('Epoux 1');
    expect(getTestamentCardTitle('pacse', 'epoux2')).toBe('Partenaire 2');
    expect(getTestamentCardTitle('celibataire', 'epoux1')).toBe('Defunt(e)');
  });
});
