export function normalizeForSnapshot<T>(input: T): T {
  // Structured clone to avoid mutating the input.
  // Node 22 supports structuredClone.
  const v: any = structuredClone(input as any);

  const visit = (x: any): any => {
    if (!x || typeof x !== 'object') return x;

    if (Array.isArray(x)) {
      return x.map(visit);
    }

    for (const k of Object.keys(x)) {
      const val = x[k];

      // Generic sanitizers
      if (k.toLowerCase().includes('date') || k.toLowerCase().includes('time') || k === 'savedAt') {
        x[k] = '<DATE>';
        continue;
      }
      if (k.toLowerCase().includes('uuid') || k.toLowerCase().includes('requestid') || k === 'rid') {
        x[k] = '<ID>';
        continue;
      }

      x[k] = visit(val);
    }

    return x;
  };

  return visit(v);
}
