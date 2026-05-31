import { describe, expect, it } from 'vitest';
import type { AssociateInput } from '@/engine/tresorerie/types';
import { updateAssociateOwnershipLot } from '@/domain/tresorerie/societeModel';

function makeAssociate(
  id: string,
  capitalPct: number,
  economicRightsPct = capitalPct,
): AssociateInput {
  return {
    id,
    label: id,
    kind: 'pp',
    ownershipLots: [{ right: 'pleine_propriete', capitalPct, economicRightsPct }],
    roles: ['associe_sans_statut'],
    cca: {
      currentBalance: 0,
      exceptionalContributions: [],
      annualContribution: { amount: 0, startYear: 2026 },
      remunerationRate: 0,
    },
    remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
  };
}

function firstLot(associates: AssociateInput[], id: string) {
  const associate = associates.find((item) => item.id === id);
  if (!associate) throw new Error(`Associé introuvable: ${id}`);
  return associate.ownershipLots[0];
}

describe('updateAssociateOwnershipLot', () => {
  it('réduit les autres associés au prorata quand le capital dépasserait 100 %', () => {
    const associates = [
      makeAssociate('associe-1', 60),
      makeAssociate('associe-2', 20),
      makeAssociate('associe-3', 20),
    ];

    const next = updateAssociateOwnershipLot(associates, 'associe-1', { capitalPct: 80 });

    expect(firstLot(next, 'associe-1').capitalPct).toBe(80);
    expect(firstLot(next, 'associe-2').capitalPct).toBe(10);
    expect(firstLot(next, 'associe-3').capitalPct).toBe(10);
  });

  it('borne la saisie à 100 % et annule les autres détentions sur le même droit', () => {
    const associates = [makeAssociate('associe-1', 60, 60), makeAssociate('associe-2', 40, 40)];

    const next = updateAssociateOwnershipLot(associates, 'associe-1', {
      capitalPct: 125,
      economicRightsPct: 120,
    });

    expect(firstLot(next, 'associe-1')).toMatchObject({
      capitalPct: 100,
      economicRightsPct: 100,
    });
    expect(firstLot(next, 'associe-2')).toMatchObject({
      capitalPct: 0,
      economicRightsPct: 0,
    });
  });

  it('synchronise les droits économiques avec le capital en pleine propriété', () => {
    const associates = [makeAssociate('associe-1', 60, 10), makeAssociate('associe-2', 40, 40)];

    const next = updateAssociateOwnershipLot(associates, 'associe-1', { capitalPct: 70 });

    expect(firstLot(next, 'associe-1')).toMatchObject({
      right: 'pleine_propriete',
      capitalPct: 70,
      economicRightsPct: 70,
    });
  });

  it('laisse les droits économiques libres en démembrement puis resynchronise au retour en pleine propriété', () => {
    const associates = [makeAssociate('associe-1', 60, 60), makeAssociate('associe-2', 40, 40)];

    const demembre = updateAssociateOwnershipLot(associates, 'associe-1', {
      right: 'usufruit',
      economicRightsPct: 35,
    });
    expect(firstLot(demembre, 'associe-1')).toMatchObject({
      right: 'usufruit',
      capitalPct: 60,
      economicRightsPct: 35,
    });

    const pleinePropriete = updateAssociateOwnershipLot(demembre, 'associe-1', {
      right: 'pleine_propriete',
    });
    expect(firstLot(pleinePropriete, 'associe-1')).toMatchObject({
      right: 'pleine_propriete',
      capitalPct: 60,
      economicRightsPct: 60,
    });
  });
});
