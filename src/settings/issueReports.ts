export type IssueAttachmentKind = 'pdf' | 'image';

export interface IssueAttachment {
  storagePath: string;
  fileName: string;
  mime: string;
  bytes: number;
  kind: IssueAttachmentKind;
}

export interface IssueAttachmentFile {
  name: string;
  type: string;
  size: number;
}

export interface IssueAttachmentStoragePathInput {
  userId: string;
  fileName: string;
  mime: string;
  hash: string;
  timestamp?: number;
}

export const ISSUE_REPORTS_BUCKET = 'issue-reports';
export const ISSUE_REPORTS_MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const ISSUE_REPORTS_SIGNED_URL_TTL_SECONDS = 60;

const PDF_MIME = 'application/pdf';
const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function extensionForMime(mime: string): string {
  if (mime === PDF_MIME) return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

export function classifyIssueAttachmentFile(file: IssueAttachmentFile): IssueAttachmentKind {
  if (file.type === PDF_MIME) return 'pdf';
  if (IMAGE_MIMES.has(file.type)) return 'image';
  throw new Error('La pièce jointe doit être un PDF ou une image PNG, JPG ou WEBP.');
}

export function validateIssueAttachmentFile(
  file: IssueAttachmentFile,
  expectedKind: IssueAttachmentKind,
): IssueAttachmentKind {
  if (file.size > ISSUE_REPORTS_MAX_ATTACHMENT_BYTES) {
    throw new Error('La pièce jointe ne doit pas dépasser 25 Mo.');
  }

  const kind = classifyIssueAttachmentFile(file);
  if (kind !== expectedKind) {
    throw new Error(
      expectedKind === 'pdf'
        ? 'Le fichier sélectionné doit être un PDF.'
        : 'Le fichier sélectionné doit être une image PNG, JPG ou WEBP.',
    );
  }

  return kind;
}

export function buildIssueAttachmentStoragePath(input: IssueAttachmentStoragePathInput): string {
  const timestamp = input.timestamp ?? Date.now();
  const hashPrefix = input.hash.slice(0, 8);
  const extension = extensionForMime(input.mime);
  return `${input.userId}/${timestamp}-${hashPrefix}.${extension}`;
}

export function normalizeIssueReportAttachments(value: unknown): IssueAttachment[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((attachment): IssueAttachment[] => {
    if (typeof attachment !== 'object' || attachment === null) return [];
    const record = attachment as Record<string, unknown>;
    const storagePath = typeof record.storagePath === 'string' ? record.storagePath : '';
    const fileName = typeof record.fileName === 'string' ? record.fileName : '';
    const mime = typeof record.mime === 'string' ? record.mime : '';
    const bytes = typeof record.bytes === 'number' ? record.bytes : 0;
    const kind = record.kind === 'pdf' || record.kind === 'image' ? record.kind : null;

    if (!storagePath || !fileName || !mime || bytes < 0 || !kind) return [];
    return [{ storagePath, fileName, mime, bytes, kind }];
  });
}
