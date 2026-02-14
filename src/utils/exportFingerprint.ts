export type ExportMeta = Record<string, unknown>;

const FNV_OFFSET_BASIS_64 = 0xcbf29ce484222325n;
const FNV_PRIME_64 = 0x100000001b3n;
const UINT64_MASK = 0xffffffffffffffffn;

function normalizeValue(value: unknown): unknown {
  if (value === null) return null;
  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'boolean') return value;
  if (valueType === 'number') {
    if (!Number.isFinite(value as number)) return null;
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }
  if (valueType === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));

    const normalizedObject: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of entries) {
      normalizedObject[entryKey] = normalizeValue(entryValue);
    }
    return normalizedObject;
  }
  return String(value);
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(normalizeValue(value));
}

function fnv1a64(input: string): string {
  let hash = FNV_OFFSET_BASIS_64;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * FNV_PRIME_64) & UINT64_MASK;
  }
  return hash.toString(16).padStart(16, '0');
}

export function normalizeFilenameForFingerprint(filename: string): string {
  return filename
    .replace(/\d{4}-\d{2}-\d{2}/g, '<date>')
    .replace(/\d{8}/g, '<date>')
    .replace(/\d{2}-\d{2}-\d{2}/g, '<time>')
    .replace(/\d{6}/g, '<time>');
}

export function hashStringForFingerprint(value?: string | null): string {
  return fnv1a64(value || '');
}

export function fingerprintPptxExport(input: ExportMeta): string {
  const serialized = stableSerialize({ kind: 'pptx', input });
  return fnv1a64(serialized);
}

export function fingerprintXlsxExport(input: ExportMeta): string {
  const serialized = stableSerialize({ kind: 'xlsx', input });
  return fnv1a64(serialized);
}
