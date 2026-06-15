import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface MementoSaveResult {
  ok: boolean;
  message?: string;
}

export interface MementoSaveTargetRegistration {
  id: string;
  label: string;
  draft: unknown;
  blockingError?: string | null;
  save: (draft: unknown) => Promise<MementoSaveResult>;
}

export interface MementoSaveTargetState extends MementoSaveTargetRegistration {
  isDirty: boolean;
  message: string | null;
}

interface MementoSaveContextValue {
  targets: Readonly<Record<string, MementoSaveTargetState>>;
  registerTarget: (target: MementoSaveTargetRegistration) => void;
  markDirty: (targetId: string) => void;
  markClean: (targetId: string, message?: string) => void;
  saveAll: () => Promise<void>;
  saving: boolean;
  message: string | null;
  dirtyCount: number;
  blockingError: string | null;
}

const MementoSaveContext = createContext<MementoSaveContextValue | null>(null);

function firstBlockingError(
  targets: Readonly<Record<string, MementoSaveTargetState>>,
): string | null {
  const target = Object.values(targets).find(
    (candidate) => candidate.isDirty && candidate.blockingError,
  );
  if (!target?.blockingError) return null;
  return `${target.label} : ${target.blockingError}`;
}

export function MementoSaveProvider({ children }: { children: ReactNode }): ReactElement {
  const [targets, setTargets] = useState<Record<string, MementoSaveTargetState>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const registerTarget = useCallback((target: MementoSaveTargetRegistration): void => {
    setTargets((current) => {
      const previous = current[target.id];
      return {
        ...current,
        [target.id]: {
          ...target,
          isDirty: previous?.isDirty ?? false,
          message: previous?.message ?? null,
        },
      };
    });
  }, []);

  const markDirty = useCallback((targetId: string): void => {
    setTargets((current) => {
      const target = current[targetId];
      if (!target) return current;
      return {
        ...current,
        [targetId]: {
          ...target,
          isDirty: true,
          message: null,
        },
      };
    });
    setMessage(null);
  }, []);

  const markClean = useCallback((targetId: string, targetMessage?: string): void => {
    setTargets((current) => {
      const target = current[targetId];
      if (!target) return current;
      return {
        ...current,
        [targetId]: {
          ...target,
          isDirty: false,
          message: targetMessage ?? target.message,
        },
      };
    });
  }, []);

  const saveAll = useCallback(async (): Promise<void> => {
    const blocking = firstBlockingError(targets);
    if (blocking) {
      setMessage(blocking);
      return;
    }

    const dirtyTargets = Object.values(targets).filter((target) => target.isDirty);
    if (dirtyTargets.length === 0) {
      setMessage('Aucune modification à enregistrer.');
      return;
    }

    setSaving(true);
    setMessage(null);

    const savedLabels: string[] = [];
    const failedMessages: string[] = [];

    for (const target of dirtyTargets) {
      try {
        const result = await target.save(target.draft);
        if (result.ok) {
          savedLabels.push(target.label);
          markClean(target.id, result.message);
        } else {
          failedMessages.push(result.message ?? `${target.label} n’a pas pu être enregistré.`);
        }
      } catch (error) {
        failedMessages.push(
          error instanceof Error ? error.message : `${target.label} n’a pas pu être enregistré.`,
        );
      }
    }

    setSaving(false);

    if (failedMessages.length > 0) {
      setMessage(failedMessages.join(' '));
      return;
    }

    setMessage(
      savedLabels.length === 1
        ? `${savedLabels[0]} enregistré.`
        : `${savedLabels.length} domaines mémento enregistrés.`,
    );
  }, [markClean, targets]);

  const dirtyCount = useMemo(
    () => Object.values(targets).filter((target) => target.isDirty).length,
    [targets],
  );
  const blockingError = useMemo(() => firstBlockingError(targets), [targets]);

  const value = useMemo<MementoSaveContextValue>(
    () => ({
      targets,
      registerTarget,
      markDirty,
      markClean,
      saveAll,
      saving,
      message,
      dirtyCount,
      blockingError,
    }),
    [
      targets,
      registerTarget,
      markDirty,
      markClean,
      saveAll,
      saving,
      message,
      dirtyCount,
      blockingError,
    ],
  );

  return <MementoSaveContext.Provider value={value}>{children}</MementoSaveContext.Provider>;
}

export function useMementoSaveRegistry(): MementoSaveContextValue {
  const context = useContext(MementoSaveContext);
  if (!context) {
    throw new Error('useMementoSaveRegistry doit être utilisé dans MementoSaveProvider.');
  }
  return context;
}

export function useOptionalMementoSaveRegistry(): MementoSaveContextValue | null {
  return useContext(MementoSaveContext);
}

export function MementoGlobalSaveBar({ isAdmin }: { isAdmin: boolean }): ReactElement | null {
  const { dirtyCount, blockingError, saving, message, saveAll } = useMementoSaveRegistry();

  if (!isAdmin) return null;

  const disabled = saving || dirtyCount === 0 || blockingError !== null;

  return (
    <section className="settings-memento-save-bar" aria-label="Sauvegarde du mémento">
      {blockingError ? (
        <p className="settings-feedback-message settings-feedback-message--error">
          {blockingError}
        </p>
      ) : null}
      <button
        type="button"
        className="settings-btn settings-btn--primary settings-memento-save-bar__button"
        disabled={disabled}
        title={blockingError ?? undefined}
        onClick={() => void saveAll()}
      >
        {saving
          ? 'Enregistrement...'
          : dirtyCount > 0
            ? 'Enregistrer les modifications'
            : 'Aucune modification à enregistrer'}
      </button>
      {message ? (
        <p
          className={`settings-feedback-message ${
            message.includes('Erreur') || message.includes('bloqué') || message.includes('n’a pas')
              ? 'settings-feedback-message--error'
              : 'settings-feedback-message--success'
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
