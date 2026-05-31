import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const upsertMock = vi.hoisted(() => vi.fn());

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('baseContratOverridesCache', () => {
  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
    selectMock.mockReset();
    upsertMock.mockReset();
    fromMock.mockReturnValue({
      select: selectMock,
      upsert: upsertMock,
    });
  });

  it('relit les overrides avec les colonnes de revue migrées', async () => {
    selectMock.mockResolvedValueOnce({
      data: [
        {
          product_id: 'assurance_vie',
          closed_date: null,
          note_admin: 'Note admin',
          review_status: 'a_revoir',
          review_reason: 'Source à relire',
          next_review_at: '2026-06-01',
          updated_at: '2026-05-14T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const { getBaseContratOverrides } = await import('./baseContratOverridesCache');
    const overrides = await getBaseContratOverrides();

    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(selectMock).toHaveBeenCalledWith(
      'product_id, closed_date, note_admin, review_status, review_reason, next_review_at, updated_at',
    );
    expect(overrides.assurance_vie).toMatchObject({
      product_id: 'assurance_vie',
      note_admin: 'Note admin',
      review_status: 'a_revoir',
      review_reason: 'Source à relire',
      next_review_at: '2026-06-01',
    });
  });

  it('sauvegarde les champs de revue sans chemin legacy', async () => {
    upsertMock.mockResolvedValueOnce({ error: null });

    const { upsertBaseContratOverride } = await import('./baseContratOverridesCache');
    await upsertBaseContratOverride({
      product_id: 'assurance_vie',
      closed_date: null,
      note_admin: 'Note admin',
      review_status: 'a_revoir',
      review_reason: 'Source à relire',
      next_review_at: '2026-06-01',
    });

    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 'assurance_vie',
        review_status: 'a_revoir',
        review_reason: 'Source à relire',
        next_review_at: '2026-06-01',
      }),
      { onConflict: 'product_id' },
    );
  });
});
