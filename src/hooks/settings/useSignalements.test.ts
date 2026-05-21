// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ISSUE_REPORTS_MAX_ATTACHMENT_BYTES,
  buildIssueAttachmentStoragePath,
  classifyIssueAttachmentFile,
  normalizeIssueReportAttachments,
  useSignalements,
  validateIssueAttachmentFile,
} from './useSignalements';

const supabaseMock = vi.hoisted(() => {
  const upload = vi.fn();
  const remove = vi.fn();
  const insert = vi.fn();
  const getUser = vi.fn();
  const queryBuilder: any = {};

  Object.assign(queryBuilder, {
    select: vi.fn(() => queryBuilder),
    eq: vi.fn(() => queryBuilder),
    order: vi.fn(() => queryBuilder),
    limit: vi.fn(() => queryBuilder),
    insert,
    then: (
      resolve: (value: { data: unknown[]; error: null }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
  });

  return {
    auth: { getUser },
    from: vi.fn(() => queryBuilder),
    storage: {
      from: vi.fn(() => ({ upload, remove })),
    },
    mocks: { getUser, upload, remove, insert },
  };
});

vi.mock('../../supabaseClient', () => ({
  supabase: supabaseMock,
}));

vi.mock('../../utils/crypto/sha256', () => ({
  sha256: vi.fn(async () => 'abcdef1234567890'),
}));

const PDF_FILE = {
  name: 'conditions-generales.pdf',
  type: 'application/pdf',
  size: 1024,
};

const IMAGE_FILE = {
  name: 'capture.png',
  type: 'image/png',
  size: 2048,
};

beforeEach(() => {
  supabaseMock.mocks.getUser.mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  });
  supabaseMock.mocks.upload.mockResolvedValue({ data: { path: 'ok' }, error: null });
  supabaseMock.mocks.remove.mockResolvedValue({ data: [], error: null });
  supabaseMock.mocks.insert.mockResolvedValue({ error: new Error('insert failed') });
  supabaseMock.mocks.upload.mockClear();
  supabaseMock.mocks.remove.mockClear();
  supabaseMock.mocks.insert.mockClear();
});

describe('helpers signalements PJ', () => {
  it('classe les fichiers autorisés en PDF ou image', () => {
    expect(classifyIssueAttachmentFile(PDF_FILE)).toBe('pdf');
    expect(classifyIssueAttachmentFile(IMAGE_FILE)).toBe('image');
  });

  it('refuse un PDF dans le slot image et un fichier trop lourd', () => {
    expect(() => validateIssueAttachmentFile(PDF_FILE, 'image')).toThrow(/image/i);
    expect(() =>
      validateIssueAttachmentFile(
        {
          name: 'scan.pdf',
          type: 'application/pdf',
          size: ISSUE_REPORTS_MAX_ATTACHMENT_BYTES + 1,
        },
        'pdf',
      ),
    ).toThrow(/25 Mo/i);
  });

  it('construit un chemin Storage préfixé par l’utilisateur', () => {
    expect(
      buildIssueAttachmentStoragePath({
        userId: 'user-123',
        fileName: 'CG retraite 2026.PDF',
        mime: 'application/pdf',
        hash: 'abcdef1234567890',
        timestamp: 123456789,
      }),
    ).toBe('user-123/123456789-abcdef12.pdf');
  });

  it('normalise uniquement les pièces jointes valides', () => {
    expect(
      normalizeIssueReportAttachments([
        {
          storagePath: 'user-123/a.pdf',
          fileName: 'a.pdf',
          mime: 'application/pdf',
          bytes: 123,
          kind: 'pdf',
        },
        {
          storagePath: '',
          fileName: 'bad.pdf',
          mime: 'application/pdf',
          bytes: 123,
          kind: 'pdf',
        },
        null,
      ]),
    ).toEqual([
      {
        storagePath: 'user-123/a.pdf',
        fileName: 'a.pdf',
        mime: 'application/pdf',
        bytes: 123,
        kind: 'pdf',
      },
    ]);
  });
});

describe('useSignalements', () => {
  it('supprime la pièce jointe uploadée si l’insertion du signalement échoue', async () => {
    const { result } = renderHook(() => useSignalements());

    await waitFor(() => expect(result.current.loadingReports).toBe(false));

    let success = true;
    await act(async () => {
      success = await result.current.submitReport({
        title: 'Mise à jour',
        description: 'CG à vérifier',
        pdfAttachment: new File(['pdf'], 'cg.pdf', { type: 'application/pdf' }),
      });
    });

    const insertPayload = supabaseMock.mocks.insert.mock.calls[0]?.[0] as {
      attachments: Array<{ storagePath: string }>;
    };

    expect(success).toBe(false);
    expect(insertPayload.attachments[0]?.storagePath).toMatch(/^user-123\//);
    expect(supabaseMock.mocks.remove).toHaveBeenCalledWith([
      insertPayload.attachments[0]?.storagePath,
    ]);
  });
});
