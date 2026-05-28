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

function createContractRow(overrides: Record<string, unknown> = {}) {
  return {
    contract_id: 'swisslife-perin-swisslife-per-individuel-24',
    source_id: 'Contrat N°24',
    company: 'SWISSLIFE',
    contract_name: 'PERIN- SWISSLIFE PER INDIVIDUEL MAJ',
    contract_type: 'PERIN',
    per_compartment: 'C1',
    contract_data: {
      id: 'swisslife-perin-swisslife-per-individuel-24',
      sourceId: 'Contrat N°24',
      compagnie: 'SWISSLIFE',
      nomContrat: 'PERIN- SWISSLIFE PER INDIVIDUEL MAJ',
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
    },
    row_hash: 'row-hash',
    is_deleted: false,
    updated_at: '2026-05-16T00:00:00.000Z',
    ...overrides,
  };
}

function mockCatalogFetch({
  contractRows,
  documentRows = [],
  contractError = null,
  documentError = null,
}: {
  contractRows: unknown[];
  documentRows?: unknown[];
  contractError?: unknown;
  documentError?: unknown;
}) {
  fromMock.mockImplementation((table: string) => ({
    select: () => ({
      eq: () => ({
        order: () =>
          Promise.resolve({
            data: contractRows,
            error: contractError,
          }),
      }),
      order: () =>
        Promise.resolve({
          data: table === 'base_cg_retraite_documents' ? documentRows : [],
          error: table === 'base_cg_retraite_documents' ? documentError : null,
        }),
    }),
  }));
}

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

  it('lit le catalogue canonique Supabase avec les documents authentifiés', async () => {
    fromMock.mockImplementation((table: string) => ({
      select: () => ({
        eq: () => ({
          order: () =>
            Promise.resolve({
              data: [
                {
                  contract_id: 'swisslife-perin-swisslife-per-individuel-24',
                  source_id: 'Contrat N°24',
                  company: 'SWISSLIFE',
                  contract_name: 'PERIN- SWISSLIFE PER INDIVIDUEL MAJ',
                  contract_type: 'PERIN',
                  per_compartment: 'C1',
                  contract_data: {
                    id: 'swisslife-perin-swisslife-per-individuel-24',
                    sourceId: 'Contrat N°24',
                    compagnie: 'SWISSLIFE',
                    nomContrat: 'PERIN- SWISSLIFE PER INDIVIDUEL MAJ',
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
                  },
                  row_hash: 'row-hash',
                  is_deleted: false,
                  updated_at: '2026-05-16T00:00:00.000Z',
                },
              ],
              error: null,
            }),
        }),
        order: () =>
          Promise.resolve({
            data:
              table === 'base_cg_retraite_documents'
                ? [
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
                  ]
                : [],
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
    expect(fromMock).toHaveBeenCalledWith('base_cg_retraite_contracts');
  });

  it('ignore explicitement les contrats soft-deleted renvoyés par Supabase', async () => {
    const deletedData = {
      ...(createContractRow().contract_data as Record<string, unknown>),
      id: 'contract-deleted',
      nomContrat: 'Contrat supprimé',
    };
    mockCatalogFetch({
      contractRows: [
        createContractRow(),
        createContractRow({
          contract_id: 'contract-deleted',
          contract_name: 'Contrat supprimé',
          contract_data: deletedData,
          is_deleted: true,
        }),
      ],
    });

    const { getBaseCgRetraiteCatalog } = await import('./baseCgRetraiteRepository');
    const catalog = await getBaseCgRetraiteCatalog();

    expect(catalog.map((contract) => contract.id)).toEqual([
      'swisslife-perin-swisslife-per-individuel-24',
    ]);
  });

  it('remonte une erreur typée quand la table canonique Supabase manque', async () => {
    mockCatalogFetch({
      contractRows: [],
      contractError: {
        code: '42P01',
        message: 'relation "base_cg_retraite_contracts" does not exist',
      },
    });

    const { BaseCgRetraiteCatalogUnavailableError, getBaseCgRetraiteCatalog } =
      await import('./baseCgRetraiteRepository');

    await expect(getBaseCgRetraiteCatalog()).rejects.toBeInstanceOf(
      BaseCgRetraiteCatalogUnavailableError,
    );
  });

  it('sauvegarde un contrat canonique Supabase sans ses documents', async () => {
    const { upsertBaseCgRetraiteContract } = await import('./baseCgRetraiteRepository');

    const contract: Parameters<typeof upsertBaseCgRetraiteContract>[0] = {
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
    };

    await upsertBaseCgRetraiteContract(contract);

    expect(fromMock).toHaveBeenCalledWith('base_cg_retraite_contracts');
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contract_id: 'contract-test',
        source_id: 'Contrat test',
        company: 'Test',
        contract_name: 'Contrat Test',
        contract_type: 'PERIN',
        per_compartment: 'C1',
        is_deleted: false,
        contract_data: expect.not.objectContaining({
          documents: expect.anything(),
        }),
      }),
      { onConflict: 'contract_id' },
    );
    expect(upsertMock.mock.calls[0]?.[0]).not.toHaveProperty('row_hash');
  });

  it('supprime un contrat par soft-delete canonique', async () => {
    const { deleteBaseCgRetraiteContract } = await import('./baseCgRetraiteRepository');

    await deleteBaseCgRetraiteContract('contract-test');

    expect(fromMock).toHaveBeenCalledWith('base_cg_retraite_contracts');
    expect(updateMock).toHaveBeenCalledWith({
      is_deleted: true,
      updated_at: expect.any(String),
    });
    expect(eqMock).toHaveBeenCalledWith('contract_id', 'contract-test');
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
