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

  it('relit les overrides sans colonnes de revue quand la migration prod manque', async () => {
    selectMock
      .mockResolvedValueOnce({
        data: null,
        error: {
          message: 'column base_contrat_overrides.review_status does not exist',
        },
      })
      .mockResolvedValueOnce({
        data: [{
          product_id: 'assurance_vie',
          closed_date: null,
          note_admin: 'Note admin',
          updated_at: '2026-05-14T00:00:00.000Z',
        }],
        error: null,
      });

    const { getBaseContratOverrides } = await import('./baseContratOverridesCache');
    const overrides = await getBaseContratOverrides();

    expect(selectMock).toHaveBeenNthCalledWith(
      1,
      'product_id, closed_date, note_admin, review_status, review_reason, next_review_at, updated_at',
    );
    expect(selectMock).toHaveBeenNthCalledWith(
      2,
      'product_id, closed_date, note_admin, updated_at',
    );
    expect(overrides.assurance_vie).toMatchObject({
      product_id: 'assurance_vie',
      note_admin: 'Note admin',
      review_status: 'ok',
      review_reason: null,
      next_review_at: null,
    });
  });

  it('sauvegarde en mode legacy si les colonnes de revue ne sont pas encore migrées', async () => {
    upsertMock
      .mockResolvedValueOnce({
        error: {
          message: 'column base_contrat_overrides.review_status does not exist',
        },
      })
      .mockResolvedValueOnce({ error: null });

    const { upsertBaseContratOverride } = await import('./baseContratOverridesCache');
    await upsertBaseContratOverride({
      product_id: 'assurance_vie',
      closed_date: null,
      note_admin: 'Note admin',
      review_status: 'a_revoir',
      review_reason: 'Source à relire',
      next_review_at: '2026-06-01',
    });

    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(upsertMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        product_id: 'assurance_vie',
        review_status: 'a_revoir',
        review_reason: 'Source à relire',
        next_review_at: '2026-06-01',
      }),
      { onConflict: 'product_id' },
    );
    expect(upsertMock).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({
        review_status: expect.anything(),
        review_reason: expect.anything(),
        next_review_at: expect.anything(),
      }),
      { onConflict: 'product_id' },
    );
  });
});
