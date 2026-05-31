import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DossierAudit } from '@/domain/audit/types';
import type { ComparaisonScenarios, Strategie } from '@/domain/strategy/types';
import { DEFAULT_COLORS } from '../../settings/theme';

type RecordedSlide = {
  background?: unknown;
  texts: Array<{ text: unknown; options: unknown }>;
  tables: Array<{ rows: unknown; options: unknown }>;
  images: unknown[];
  addText: (_text: unknown, _options: unknown) => void;
  addTable: (_rows: unknown, _options: unknown) => void;
  addImage: (_options: unknown) => void;
};

type RecordedPptx = {
  title: string;
  author: string;
  company: string;
  slides: RecordedSlide[];
  writeFileArgs?: { fileName: string };
  addSlide: () => RecordedSlide;
  writeFile: (_args: { fileName: string }) => Promise<void>;
};

const pptxMock = vi.hoisted(() => {
  const instances: RecordedPptx[] = [];

  class FakeSlide implements RecordedSlide {
    background?: unknown;
    texts: Array<{ text: unknown; options: unknown }> = [];
    tables: Array<{ rows: unknown; options: unknown }> = [];
    images: unknown[] = [];

    addText(text: unknown, options: unknown): void {
      this.texts.push({ text, options });
    }

    addTable(rows: unknown, options: unknown): void {
      this.tables.push({ rows, options });
    }

    addImage(options: unknown): void {
      this.images.push(options);
    }
  }

  class FakePptx implements RecordedPptx {
    title = '';
    author = '';
    company = '';
    slides: RecordedSlide[] = [];
    writeFileArgs?: { fileName: string };

    constructor() {
      instances.push(this);
    }

    addSlide(): RecordedSlide {
      const slide = new FakeSlide();
      this.slides.push(slide);
      return slide;
    }

    async writeFile(args: { fileName: string }): Promise<void> {
      this.writeFileArgs = args;
    }
  }

  return { FakePptx, instances };
});

vi.mock('pptxgenjs', () => ({
  default: pptxMock.FakePptx,
}));

const dossier: DossierAudit = {
  id: 'audit-1',
  version: '1.0.0',
  dateCreation: '2026-01-01T00:00:00.000Z',
  dateModification: '2026-01-01T00:00:00.000Z',
  situationFamiliale: {
    mr: { prenom: 'Ada', nom: 'Dupont', dateNaissance: '1980-01-01' },
    mme: { prenom: 'Lou', nom: 'Dupont', dateNaissance: '1982-01-01' },
    situationMatrimoniale: 'marie',
    enfants: [{ prenom: 'Mila', dateNaissance: '2012-01-01', estCommun: true }],
  },
  situationCivile: {
    regimeMatrimonial: 'communaute_legale',
    contratMariage: false,
    donations: [],
    testaments: [],
  },
  actifs: [
    {
      id: 'actif-1',
      type: 'residence_principale',
      libelle: 'Residence principale',
      valeur: 420000,
      proprietaire: 'commun',
    },
  ],
  passif: {
    emprunts: [
      {
        id: 'pret-1',
        libelle: 'Credit residence principale',
        type: 'immobilier',
        capitalInitial: 250000,
        capitalRestantDu: 150000,
        mensualite: 1200,
        tauxInteret: 2.4,
        dateDebut: '2020-01-01',
        dateFin: '2040-01-01',
      },
    ],
    autresDettes: [],
  },
  situationFiscale: {
    anneeReference: 2025,
    revenus: [],
    revenuFiscalReference: 90000,
    nombreParts: 2.5,
    impotRevenu: 9200,
    tmi: 30,
  },
  objectifs: ['reduire_fiscalite', 'preparer_transmission'],
};

const strategie: Strategie = {
  id: 'strategie-1',
  dossierAuditId: dossier.id,
  dateCreation: '2026-01-01T00:00:00.000Z',
  dateModification: '2026-01-01T00:00:00.000Z',
  recommandations: [],
  produitsSelectionnes: [
    {
      id: 'per-1',
      type: 'per',
      libelle: 'PER individuel',
      montantInitial: 10000,
      versementsProgrammes: 300,
      dureeAnnees: 10,
      tauxRendementEstime: 0.03,
    },
  ],
};

const comparaison: ComparaisonScenarios = {
  baseline: {
    id: 'baseline',
    nom: 'Situation actuelle',
    description: 'Projection sans action',
    hypotheses: ['Rendement prudent'],
    projections: [
      {
        annee: 0,
        patrimoineTotal: 300000,
        actifs: 420000,
        passifs: 150000,
        revenusAnnuels: 90000,
        impotRevenu: 9200,
      },
      {
        annee: 5,
        patrimoineTotal: 360000,
        actifs: 460000,
        passifs: 100000,
        revenusAnnuels: 94000,
        impotRevenu: 9500,
      },
      {
        annee: 10,
        patrimoineTotal: 420000,
        actifs: 500000,
        passifs: 80000,
        revenusAnnuels: 98000,
        impotRevenu: 9800,
      },
    ],
  },
  strategie: {
    id: 'strategie',
    nom: 'Strategie CGP',
    description: 'Projection avec plan',
    hypotheses: ['Versements PER maintenus'],
    projections: [
      {
        annee: 0,
        patrimoineTotal: 300000,
        actifs: 420000,
        passifs: 150000,
        revenusAnnuels: 90000,
        impotRevenu: 9200,
      },
      {
        annee: 5,
        patrimoineTotal: 380000,
        actifs: 480000,
        passifs: 100000,
        revenusAnnuels: 94000,
        impotRevenu: 8800,
      },
      {
        annee: 10,
        patrimoineTotal: 460000,
        actifs: 540000,
        passifs: 80000,
        revenusAnnuels: 98000,
        impotRevenu: 9000,
      },
    ],
  },
  ecarts: {
    patrimoineTotal: 40000,
    economieImpots: 1500,
    economieSuccession: 0,
  },
};

function allSlideTexts(pptx: RecordedPptx): string {
  return pptx.slides
    .flatMap((slide) => slide.texts)
    .map(({ text }) => String(text))
    .join('\n');
}

describe('Audit et strategie PPTX smoke tests', () => {
  beforeEach(() => {
    pptxMock.instances.length = 0;
  });

  it('genere le PPTX Audit avec les sections attendues', async () => {
    const { generateAuditPptx } = await import('../auditPptx');

    await generateAuditPptx({ dossier, colors: DEFAULT_COLORS });

    const pptx = pptxMock.instances[0];
    expect(pptx).toBeDefined();
    expect(pptx.title).toBe('Audit Patrimonial');
    expect(pptx.slides).toHaveLength(8);
    expect(pptx.writeFileArgs?.fileName).toMatch(/^Audit_Ada_Dupont_\d{4}-\d{2}-\d{2}\.pptx$/);

    const slideTexts = allSlideTexts(pptx);
    expect(slideTexts).toContain('a) Situation familiale');
    expect(slideTexts).toContain('e) Fiscalité');
    expect(slideTexts).toContain('g) Pistes de réflexion');
  });

  it('genere le PPTX Strategie avec les sections attendues', async () => {
    const { generateStrategyPptx } = await import('../strategyPptx');

    await generateStrategyPptx({ dossier, strategie, comparaison, colors: DEFAULT_COLORS });

    const pptx = pptxMock.instances[0];
    expect(pptx).toBeDefined();
    expect(pptx.title).toBe('Stratégie Patrimoniale');
    expect(pptx.slides).toHaveLength(6);
    expect(pptx.writeFileArgs?.fileName).toMatch(/^Strategie_Ada_Dupont_\d{4}-\d{2}-\d{2}\.pptx$/);

    const slideTexts = allSlideTexts(pptx);
    expect(slideTexts).toContain('Projection : Situation actuelle');
    expect(slideTexts).toContain('Réponse aux objectifs');
    expect(slideTexts).toContain('Annexe : Hypothèses et calculs');
  });
});
