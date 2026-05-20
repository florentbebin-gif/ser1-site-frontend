import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const upsertMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const deleteMock = vi.hoisted(() => vi.fn());
const eqMock = vi.hoisted(() => vi.fn());
const orderMock = vi.hoisted(() => vi.fn());
const createSignedUrlMock = vi.hoisted(() => vi.fn());

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
    storage: {
      from: () => ({
        createSignedUrl: createSignedUrlMock,
      }),
    },
  },
}));

describe('baseCgRetraiteRepository', () => {
  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
    selectMock.mockReset();
    upsertMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    eqMock.mockReset();
    orderMock.mockReset();
    createSignedUrlMock.mockReset();

    selectMock.mockReturnValue({ order: orderMock, eq: eqMock });
    orderMock.mockResolvedValue({ data: [], error: null });
    upsertMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    deleteMock.mockReturnValue({ eq: eqMock, in: eqMock });
    eqMock.mockResolvedValue({ data: [], error: null });
    fromMock.mockReturnValue({
      select: selectMock,
      upsert: upsertMock,
      update: updateMock,
      delete: deleteMock,
    });
  });

  it('merge les overrides et documents Supabase avec le catalogue statique', async () => {
    fromMock.mockImplementation((table: string) => ({
      select: () => ({
        order: () =>
          Promise.resolve({
            data:
              table === 'base_cg_retraite_overrides'
                ? [
                    {
                      contract_id: 'swisslife-perin-swisslife-per-individuel-24',
                      contract_data: {
                        nomContrat: 'PERIN- SWISSLIFE PER INDIVIDUEL MAJ',
                      },
                      is_deleted: false,
                      updated_at: '2026-05-16T00:00:00.000Z',
                    },
                    {
                      contract_id: 'ag2r-la-mondiale-madelin-retraite-agricole-373',
                      contract_data: {
                        id: 'ag2r-la-mondiale-madelin-retraite-agricole-373',
                        nomContrat: 'MADELIN- MONDIALE RETRAITE AGRICOLE',
                      },
                      is_deleted: false,
                      updated_at: '2026-05-20T00:04:00.000Z',
                    },
                    {
                      contract_id: 'abeille-perin-abeille-retraite-plurielle-394',
                      contract_data: {
                        id: 'abeille-perin-abeille-retraite-plurielle-394',
                        phaseEpargne: {
                          fraisGestionFondsEuro: 0.01,
                        },
                        phaseLiquidation: {
                          ageLimiteLiquidation: '80 ans',
                        },
                      },
                      is_deleted: false,
                      updated_at: '2026-05-20T00:04:00.000Z',
                    },
                  ]
                : [
                    {
                      id: 'doc-swisslife',
                      contract_id: 'swisslife-perin-swisslife-per-individuel-24',
                      label: 'Notice SwissLife PER Individuel',
                      document_type: 'notice_information',
                      status: 'uploaded',
                      version_label: '13124 – 09.2019',
                      storage_path: 'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
                      file_name: '13124-09-2019.pdf',
                      mime: 'application/pdf',
                      bytes: 462558,
                      uploaded_at: '2026-05-16T00:00:00.000Z',
                    },
                    {
                      id: 'abeille-perin-abeille-retraite-plurielle-394-conditions_generales-v6369o-06-2025-b3e85939',
                      contract_id: 'abeille-perin-abeille-retraite-plurielle-394',
                      label: 'Conditions générales PERIN- ABEILLE RETRAITE PLURIELLE',
                      document_type: 'conditions_generales',
                      status: 'uploaded',
                      version_label: 'V6369O 06/2025',
                      storage_path: 'abeille/perin-abeille-retraite-plurielle/v6369o-06-2025.pdf',
                      file_name: 'v6369o-06-2025.pdf',
                      mime: 'application/pdf',
                      bytes: 1212380,
                      uploaded_at: '2026-05-20T00:04:00.000Z',
                    },
                  ],
            error: null,
          }),
      }),
    }));

    const { getBaseCgRetraiteCatalog } = await import('./baseCgRetraiteRepository');
    const catalog = await getBaseCgRetraiteCatalog();
    const swisslife = catalog.find(
      (contract) => contract.id === 'swisslife-perin-swisslife-per-individuel-24',
    );

    expect(swisslife?.nomContrat).toBe('PERIN- SWISSLIFE PER INDIVIDUEL MAJ');
    expect(swisslife?.documents).toEqual([
      expect.objectContaining({
        id: 'doc-swisslife',
        type: 'notice_information',
        versionLabel: '13124 – 09.2019',
        storagePath: 'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
        bytes: 462558,
      }),
    ]);
    expect(
      catalog.find((contract) => contract.id === 'ag2r-la-mondiale-madelin-retraite-agricole-373')
        ?.nomContrat,
    ).toBe('MADELIN- MONDIALE RETRAITE AGRICOLE');
    const abeilleRetraitePlurielle = catalog.find(
      (contract) => contract.id === 'abeille-perin-abeille-retraite-plurielle-394',
    );
    expect(abeilleRetraitePlurielle?.phaseEpargne.fraisGestionFondsEuro).toBe(0.01);
    expect(abeilleRetraitePlurielle?.phaseLiquidation.ageLimiteLiquidation).toBe('80 ans');
    expect(abeilleRetraitePlurielle?.documents).toContainEqual(
      expect.objectContaining({
        id: 'abeille-perin-abeille-retraite-plurielle-394-conditions_generales-v6369o-06-2025-b3e85939',
        versionLabel: 'V6369O 06/2025',
        storagePath: 'abeille/perin-abeille-retraite-plurielle/v6369o-06-2025.pdf',
      }),
    );
  });

  it('sauvegarde un contrat en override Supabase sans ses documents', async () => {
    const { upsertBaseCgRetraiteContract } = await import('./baseCgRetraiteRepository');

    await upsertBaseCgRetraiteContract({
      id: 'contract-test',
      sourceId: 'Contrat test',
      compagnie: 'Test',
      nomContrat: 'Contrat Test',
      typeContrat: 'PERIN',
      perCompartment: 'C1',
      phaseEpargne: {
        dateCommercialisation: null,
        nombreFonds: null,
        repartitionUcEuro: null,
        rendementFondsEuro: null,
        fraisVersements: null,
        fraisGestion: null,
        fraisArbitrage: null,
        fraisTransfertSortant: null,
        fraisTransfertSortantRate: null,
        clauseBeneficiaire: null,
        garantiesComplementaires: null,
      },
      phaseLiquidation: {
        ageLimiteLiquidation: null,
        sortieCapitalRetraite: null,
        fractionnementCapital: null,
        rachatLibre: null,
        tableConversionRente: null,
        tableGarantieAdhesion: null,
        tauxTechnique: null,
        fraisArrerages: null,
        fraisArreragesRate: null,
        annuitesGaranties: null,
        reversionPossible: null,
        reversionIncluse: null,
        renteEstimee: null,
      },
      documents: [
        {
          id: 'doc-test',
          label: 'CG',
          type: 'conditions_generales',
          status: 'uploaded',
          storagePath: 'test/cg.pdf',
        },
      ],
    });

    expect(fromMock).toHaveBeenCalledWith('base_cg_retraite_overrides');
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contract_id: 'contract-test',
        is_deleted: false,
        contract_data: expect.not.objectContaining({
          documents: expect.anything(),
        }),
      }),
      { onConflict: 'contract_id' },
    );
  });

  it('crée une URL signée pour un document stocké en bucket privé', async () => {
    createSignedUrlMock.mockResolvedValue({
      data: { signedUrl: 'https://signed.example.test/cg.pdf' },
      error: null,
    });

    const { createBaseCgRetraiteDocumentDownloadUrl } = await import('./baseCgRetraiteRepository');
    const url = await createBaseCgRetraiteDocumentDownloadUrl({
      id: 'doc-test',
      label: 'CG',
      type: 'conditions_generales',
      status: 'uploaded',
      storagePath: 'test/cg.pdf',
    });

    expect(createSignedUrlMock).toHaveBeenCalledWith('test/cg.pdf', 300);
    expect(url).toBe('https://signed.example.test/cg.pdf');
  });

  it('construit un chemin storage stable pour les PDF Base CG', async () => {
    const { buildBaseCgRetraiteStoragePath } = await import('./baseCgRetraiteRepository');

    expect(
      buildBaseCgRetraiteStoragePath(
        {
          id: 'contract-test',
          compagnie: 'Abeille Vie',
          nomContrat: 'PERIN Retraite Sérénité',
        },
        'CG 2026 / client',
      ),
    ).toBe('abeille-vie/perin-retraite-serenite/cg-2026-client.pdf');
  });
});
