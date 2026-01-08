export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'request'): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`[${label}] Timeout après ${ms} ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }) as Promise<T>;
}

export interface RequestSequencer {
  nextId(): number;
  isLatest(id: number): boolean;
}

export function createRequestSequencer(): RequestSequencer {
  let lastId = 0;
  return {
    nextId() {
      lastId += 1;
      return lastId;
    },
    isLatest(id: number) {
      return id === lastId;
    },
  };
}
