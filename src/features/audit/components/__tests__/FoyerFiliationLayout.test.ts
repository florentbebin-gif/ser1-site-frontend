import { describe, expect, it } from 'vitest';

import type { AuditLandingMember } from '../../auditLandingViewModel';
import { buildFiliationLayout } from '../FoyerFiliationLayout';

function member(
  id: string,
  prenom: string,
  role: AuditLandingMember['role'],
  extra: Partial<AuditLandingMember> = {},
): AuditLandingMember {
  return {
    id,
    fullName: prenom,
    prenom,
    nom: null,
    age: 40,
    profession: null,
    statutSocial: null,
    role,
    estCommun: true,
    avatarKind: role === 'conjoint' ? 'femme' : role === 'enfant' ? 'garcon' : 'homme',
    ...extra,
  };
}

function centerX(node: { x: number }, width: number): number {
  return node.x + width / 2;
}

function expectNoHorizontalOverlap(layout: ReturnType<typeof buildFiliationLayout>): void {
  const rows = new Map<number, typeof layout.nodes>();
  layout.nodes.forEach((node) => {
    rows.set(node.y, [...(rows.get(node.y) ?? []), node]);
  });
  rows.forEach((nodes) => {
    const sorted = [...nodes].sort((a, b) => a.x - b.x);
    sorted.forEach((node, index) => {
      const next = sorted[index + 1];
      if (!next) return;
      expect(next.x - (node.x + layout.pillWidth)).toBeGreaterThanOrEqual(16);
    });
  });
}

describe('buildFiliationLayout', () => {
  it('place les tiers dans les coins sans les rattacher à la généalogie', () => {
    const principal = member('client', 'Jean', 'principal');
    const conjoint = member('conjoint', 'Tati', 'conjoint');
    const layout = buildFiliationLayout({
      principal,
      conjoint,
      enfants: [],
      proches: [
        member('tiers-1', 'Nino', 'proche', { lienParente: 'tierce_personne' }),
        member('tiers-2', 'Rita', 'proche', { lienParente: 'tierce_personne' }),
        member('tiers-3', 'John', 'proche', { lienParente: 'tierce_personne' }),
      ],
      mode: 'compact',
    });

    const jean = layout.nodes.find((node) => node.memberId === 'client')!;
    const tati = layout.nodes.find((node) => node.memberId === 'conjoint')!;
    const [nino, rita, john] = ['tiers-1', 'tiers-2', 'tiers-3'].map(
      (id) => layout.nodes.find((node) => node.memberId === id)!,
    );

    expect(nino.anchorKey).toBe('corner:left');
    expect(rita.anchorKey).toBe('corner:right');
    expect(john.anchorKey).toBe('corner:left');
    expect(nino.y).toBeLessThan(jean.y);
    expect(rita.y).toBeLessThan(tati.y);
    expect(john.y).toBeGreaterThan(nino.y);
    expect(centerX(nino, layout.pillWidth)).toBeLessThan(centerX(jean, layout.pillWidth));
    expect(centerX(rita, layout.pillWidth)).toBeGreaterThan(centerX(tati, layout.pillWidth));
    expect(layout.edges.some((edge) => edge.toId?.startsWith('tiers-'))).toBe(false);
  });

  it('affiche les âges du couple en mode compact', () => {
    const layout = buildFiliationLayout({
      principal: member('client', 'Jean', 'principal', { age: 46 }),
      conjoint: member('conjoint', 'Tati', 'conjoint', { age: 44 }),
      enfants: [],
      proches: [],
      mode: 'compact',
    });

    expect(layout.nodes.find((node) => node.memberId === 'client')).toMatchObject({
      label: 'Jean',
      sublabel: '46 ans',
    });
    expect(layout.nodes.find((node) => node.memberId === 'conjoint')).toMatchObject({
      label: 'Tati',
      sublabel: '44 ans',
    });
  });

  it('centre chaque petit-enfant sous son parent enfant', () => {
    const principal = member('client', 'Jean', 'principal');
    const conjoint = member('conjoint', 'Tati', 'conjoint');
    const mel = member('enfant-mel', 'Mel', 'enfant');
    const arthur = member('enfant-arthur', 'Arthur', 'enfant');
    const lou = member('petit-lou', 'Lou', 'proche', {
      lienParente: 'petit_enfant',
      parentEnfantId: 'enfant-mel',
    });

    const layout = buildFiliationLayout({
      principal,
      conjoint,
      enfants: [mel, arthur],
      proches: [lou],
      mode: 'compact',
    });

    const melNode = layout.nodes.find((node) => node.memberId === 'enfant-mel')!;
    const louNode = layout.nodes.find((node) => node.memberId === 'petit-lou')!;

    expect(centerX(louNode, layout.pillWidth)).toBeCloseTo(centerX(melNode, layout.pillWidth), 4);
    expect(louNode.y).toBeGreaterThan(melNode.y);
    expect(layout.edges).toContainEqual(
      expect.objectContaining({ fromId: 'enfant-mel', toId: 'petit-lou' }),
    );
  });

  it('place les enfants d’une première union sur le côté du parent quand il existe des enfants communs', () => {
    const layout = buildFiliationLayout({
      principal: member('client', 'Jean', 'principal'),
      conjoint: member('conjoint', 'Tati', 'conjoint'),
      enfants: [
        member('enfant-lima', 'Lima', 'enfant', {
          estCommun: false,
          parentPrincipal: 'client',
        }),
        member('enfant-mel', 'Mel', 'enfant'),
        member('enfant-arthur', 'Arthur', 'enfant'),
        member('enfant-rodrigo', 'Rodrigo', 'enfant'),
      ],
      proches: [],
      mode: 'compact',
    });

    const lima = layout.nodes.find((node) => node.memberId === 'enfant-lima')!;
    const commonChildren = ['enfant-mel', 'enfant-arthur', 'enfant-rodrigo'].map(
      (id) => layout.nodes.find((node) => node.memberId === id)!,
    );
    const commonLeft = Math.min(...commonChildren.map((node) => node.x));

    expect(lima.x + layout.pillWidth).toBeLessThanOrEqual(commonLeft - 16);
    expect(lima.y).toBe(commonChildren[0]!.y);
  });

  it('raccorde chaque enfant commun par une ramification dédiée', () => {
    const layout = buildFiliationLayout({
      principal: member('client', 'Jean', 'principal'),
      conjoint: member('conjoint', 'Tati', 'conjoint'),
      enfants: [
        member('enfant-mel', 'Mel', 'enfant'),
        member('enfant-arthur', 'Arthur', 'enfant'),
        member('enfant-rodrigo', 'Rodrigo', 'enfant'),
      ],
      proches: [],
      mode: 'compact',
    });

    layout.edges
      .filter((edge) => ['enfant-mel', 'enfant-arthur', 'enfant-rodrigo'].includes(edge.toId ?? ''))
      .forEach((edge) => {
        expect(edge.fromId).toBe('couple');
        expect(edge.className).toContain('audit-fil__edge--commun');
        expect(edge.d).toContain(' C ');
        expect(edge.d).not.toMatch(/\s[HV]\s/);
      });
  });

  it('garde le petit-enfant sous son parent avec enfant de première union et fratrie commune', () => {
    const layout = buildFiliationLayout({
      principal: member('client', 'Jean', 'principal'),
      conjoint: member('conjoint', 'Tati', 'conjoint'),
      enfants: [
        member('enfant-lima', 'Lima', 'enfant', {
          estCommun: false,
          parentPrincipal: 'client',
        }),
        member('enfant-mel', 'Mel', 'enfant', { localId: 'local-mel' }),
        member('enfant-arthur', 'Arthur', 'enfant'),
        member('enfant-rodrigo', 'Rodrigo', 'enfant'),
      ],
      proches: [
        member('petit-lou', 'Lou', 'proche', {
          lienParente: 'petit_enfant',
          parentEnfantId: 'local-mel',
        }),
      ],
      mode: 'compact',
    });

    const mel = layout.nodes.find((node) => node.memberId === 'enfant-mel')!;
    const lou = layout.nodes.find((node) => node.memberId === 'petit-lou')!;

    expect(centerX(lou, layout.pillWidth)).toBeCloseTo(centerX(mel, layout.pillWidth), 4);
  });

  it('ancre la zone enfants communs au centre du parent quand un seul parent est renseigné', () => {
    const principal = member('client', 'Jean', 'principal');
    const lou = member('enfant-lou', 'Lou', 'enfant');

    const layout = buildFiliationLayout({
      principal,
      conjoint: null,
      enfants: [lou],
      proches: [],
      mode: 'compact',
    });

    const jean = layout.nodes.find((node) => node.memberId === 'client')!;
    const commonEdge = layout.edges.find((edge) => edge.key === 'child-enfant-lou')!;
    const expectedStart = `M ${centerX(jean, layout.pillWidth)}`;

    expect(commonEdge.fromId).toBe('client');
    expect(commonEdge.d.startsWith(expectedStart)).toBe(true);
  });

  it('garde les frères et soeurs sur la ligne du couple sans décentrer les clients', () => {
    const principal = member('client', 'Jean', 'principal');
    const conjoint = member('conjoint', 'Tati', 'conjoint');

    const layout = buildFiliationLayout({
      principal,
      conjoint,
      enfants: [],
      proches: [
        member('frere-client', 'Marc', 'proche', {
          lienParente: 'frere_soeur',
          parentPrincipal: 'client',
        }),
        member('soeur-conjoint', 'Lina', 'proche', {
          lienParente: 'frere_soeur',
          parentPrincipal: 'conjoint',
        }),
      ],
      mode: 'compact',
    });

    const jean = layout.nodes.find((node) => node.memberId === 'client')!;
    const tati = layout.nodes.find((node) => node.memberId === 'conjoint')!;
    const marc = layout.nodes.find((node) => node.memberId === 'frere-client')!;
    const lina = layout.nodes.find((node) => node.memberId === 'soeur-conjoint')!;
    const coupleCenter = (centerX(jean, layout.pillWidth) + centerX(tati, layout.pillWidth)) / 2;

    expect(marc.y).toBe(jean.y);
    expect(lina.y).toBe(tati.y);
    expect(centerX(marc, layout.pillWidth)).toBeLessThan(centerX(jean, layout.pillWidth));
    expect(centerX(lina, layout.pillWidth)).toBeGreaterThan(centerX(tati, layout.pillWidth));
    expect(coupleCenter).toBeCloseTo(layout.width / 2, 4);
  });

  it('place les oncles et tantes sur la ligne des parents en gardant les parents centrés', () => {
    const principal = member('client', 'Jean', 'principal');
    const conjoint = member('conjoint', 'Tati', 'conjoint');

    const layout = buildFiliationLayout({
      principal,
      conjoint,
      enfants: [],
      proches: [
        member('parent-client', 'Anne', 'proche', {
          lienParente: 'parent',
          parentPrincipal: 'client',
        }),
        member('oncle-client', 'Paul', 'proche', {
          lienParente: 'oncle_tante',
          rattachementBranche: 'client_paternelle',
        }),
      ],
      mode: 'compact',
    });

    const jean = layout.nodes.find((node) => node.memberId === 'client')!;
    const anne = layout.nodes.find((node) => node.memberId === 'parent-client')!;
    const paul = layout.nodes.find((node) => node.memberId === 'oncle-client')!;

    expect(paul.y).toBe(anne.y);
    expect(centerX(anne, layout.pillWidth)).toBeCloseTo(centerX(jean, layout.pillWidth), 4);
    expect(centerX(paul, layout.pillWidth)).not.toBeCloseTo(centerX(jean, layout.pillWidth), 4);
    expect(layout.edges).toContainEqual(
      expect.objectContaining({ fromId: 'parent-client', toId: 'client' }),
    );
    expect(layout.edges).not.toContainEqual(
      expect.objectContaining({ fromId: 'oncle-client', toId: 'client' }),
    );
  });

  it('évite le chevauchement entre parents et oncles sur une même branche haute', () => {
    const layout = buildFiliationLayout({
      principal: member('client', 'Jean', 'principal'),
      conjoint: member('conjoint', 'Tati', 'conjoint'),
      enfants: [],
      proches: [
        member('parent-client-1', 'Anne', 'proche', {
          lienParente: 'parent',
          parentPrincipal: 'client',
        }),
        member('parent-client-2', 'Alain', 'proche', {
          lienParente: 'parent',
          parentPrincipal: 'client',
        }),
        member('oncle-client', 'Paul', 'proche', {
          lienParente: 'oncle_tante',
          rattachementBranche: 'client_paternelle',
        }),
      ],
      mode: 'compact',
    });

    expectNoHorizontalOverlap(layout);
  });

  it('écarte les groupes de parents des deux conjoints sur la ligne haute', () => {
    const layout = buildFiliationLayout({
      principal: member('client', 'Jean', 'principal'),
      conjoint: member('conjoint', 'Tati', 'conjoint'),
      enfants: [],
      proches: [
        member('parent-client-1', 'Anne', 'proche', {
          lienParente: 'parent',
          parentPrincipal: 'client',
        }),
        member('parent-client-2', 'Alain', 'proche', {
          lienParente: 'parent',
          parentPrincipal: 'client',
        }),
        member('parent-conjoint-1', 'Rita', 'proche', {
          lienParente: 'parent',
          parentPrincipal: 'conjoint',
        }),
        member('parent-conjoint-2', 'Nino', 'proche', {
          lienParente: 'parent',
          parentPrincipal: 'conjoint',
        }),
      ],
      mode: 'compact',
    });

    expectNoHorizontalOverlap(layout);
  });

  it('garde un schéma à quatre étages compact et sans chevauchement horizontal', () => {
    const layout = buildFiliationLayout({
      principal: member('client', 'Jean', 'principal', { age: 26 }),
      conjoint: member('conjoint', 'Tati', 'conjoint', { age: 26 }),
      enfants: [
        member('enfant-lima', 'Lima', 'enfant'),
        member('enfant-mel', 'Mel', 'enfant'),
        member('enfant-arthur', 'Arthur', 'enfant'),
        member('enfant-rodrigo', 'Rodrigo', 'enfant'),
      ],
      proches: [
        member('tiers-john', 'John POU', 'proche', {
          lienParente: 'tierce_personne',
          age: 46,
        }),
        member('oncle-nino', 'Nino DUPONT', 'proche', {
          lienParente: 'oncle_tante',
          rattachementBranche: 'client_paternelle',
          age: 76,
        }),
        member('parent-rita', 'Rita DUPONT', 'proche', {
          lienParente: 'parent',
          parentPrincipal: 'conjoint',
          age: 76,
        }),
        member('petit-lou', 'Lou DUPONT', 'proche', {
          lienParente: 'petit_enfant',
          parentEnfantId: 'enfant-mel',
          age: 0,
        }),
      ],
      mode: 'compact',
    });

    expect(layout.height).toBeGreaterThanOrEqual(352);
    expect(layout.height).toBeLessThanOrEqual(378);
    expectNoHorizontalOverlap(layout);
  });
});
