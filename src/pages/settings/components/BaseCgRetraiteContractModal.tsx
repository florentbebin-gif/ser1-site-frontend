import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  normalizeBaseCgRetraiteGestionFees,
  type BaseCgRetraiteContract,
  type BaseCgRetraiteDocument,
} from '@/data/base-cg-retraite';
import {
  buildBaseCgRetraiteStoragePath,
  uploadBaseCgRetraitePdf,
} from '@/utils/cache/baseCgRetraiteRepository';
import { BaseCgRetraiteDocumentsTab } from './BaseCgRetraiteDocumentsTab';
import { BaseCgRetraiteEpargneTab } from './BaseCgRetraiteEpargneTab';
import { BaseCgRetraiteIdentityTab } from './BaseCgRetraiteIdentityTab';
import { BaseCgRetraiteLiquidationTab } from './BaseCgRetraiteLiquidationTab';
import { generateId, normalizeBaseCgRetraiteContractDraft } from './baseCgRetraiteModalUtils';

type ContractModalTab = 'identity' | 'epargne' | 'liquidation' | 'documents';

const CONTRACT_MODAL_TABS: Array<{ key: ContractModalTab; label: string }> = [
  { key: 'identity', label: 'Identité' },
  { key: 'epargne', label: 'Phase épargne' },
  { key: 'liquidation', label: 'Phase liquidation' },
  { key: 'documents', label: 'Documents' },
];

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function makeBaseCgDocument(): BaseCgRetraiteDocument {
  return {
    id: generateId('basecg-document'),
    label: 'Conditions Générales',
    type: 'conditions_generales',
    sourceUrl: '',
    versionLabel: '',
    storagePath: '',
    fileName: '',
    mime: 'application/pdf',
    bytes: null,
    status: 'missing',
  };
}

interface Props {
  contract: BaseCgRetraiteContract;
  initialTab?: ContractModalTab;
  onClose: () => void;
  onSave: (_contract: BaseCgRetraiteContract) => void;
}

export function BaseCgRetraiteContractModal({
  contract,
  initialTab = 'identity',
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<BaseCgRetraiteContract>(() => ({
    ...contract,
    documents: contract.documents ?? [],
  }));
  const [activeTab, setActiveTab] = useState<ContractModalTab>(initialTab);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const modalId = useId();
  const modalTitleId = `${modalId}-title`;
  const panelId = `${modalId}-panel`;
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Record<ContractModalTab, HTMLButtonElement | null>>({
    identity: null,
    epargne: null,
    liquidation: null,
    documents: null,
  });
  const gestionFees = normalizeBaseCgRetraiteGestionFees(draft.phaseEpargne);

  // Commit la normalisation des frais de gestion dans le draft au mount
  // pour qu'une sauvegarde sans édition manuelle préserve les ventilations dérivées.
  useEffect(() => {
    setDraft((previous) => {
      const normalized = normalizeBaseCgRetraiteGestionFees(previous.phaseEpargne);
      if (
        previous.phaseEpargne.fraisGestionFondsEuro === normalized.fraisGestionFondsEuro &&
        previous.phaseEpargne.fraisGestionUc === normalized.fraisGestionUc
      ) {
        return previous;
      }
      return {
        ...previous,
        phaseEpargne: {
          ...previous.phaseEpargne,
          fraisGestionFondsEuro: normalized.fraisGestionFondsEuro,
          fraisGestionUc: normalized.fraisGestionUc,
        },
      };
    });
  }, []);

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    function getFocusableElements(): HTMLElement[] {
      if (!modalRef.current) return [];
      return Array.from(modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.tabIndex >= 0 && element.getAttribute('aria-hidden') !== 'true',
      );
    }

    function handleFocusTrap(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Tab') return;
      if (!modalRef.current?.contains(document.activeElement)) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (!modalRef.current?.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    function handleDocumentKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      handleFocusTrap(event);
    }

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [onClose]);

  const contractIdentity = useMemo(
    () => ({
      id: draft.id,
      compagnie: draft.compagnie,
      nomContrat: draft.nomContrat,
    }),
    [draft.id, draft.compagnie, draft.nomContrat],
  );

  async function handleDocumentUpload(documentId: string, file: File) {
    const target = (draft.documents ?? []).find((document) => document.id === documentId);
    if (!target) return;
    setUploadError(null);
    setUploadingDocId(documentId);
    try {
      const storagePath =
        target.storagePath ||
        buildBaseCgRetraiteStoragePath(contractIdentity, target.versionLabel ?? '');
      const result = await uploadBaseCgRetraitePdf({
        contractId: contractIdentity.id,
        versionLabel: target.versionLabel ?? '',
        file,
        storagePath,
      });
      setDraft((previous) => ({
        ...previous,
        documents: (previous.documents ?? []).map((document) =>
          document.id === documentId
            ? {
                ...document,
                storagePath: result.storagePath,
                fileName: result.fileName,
                bytes: result.bytes,
                mime: result.mime,
                status: 'uploaded',
              }
            : document,
        ),
      }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload PDF impossible.');
    } finally {
      setUploadingDocId(null);
    }
  }

  function setRoot<K extends keyof BaseCgRetraiteContract>(
    key: K,
    value: BaseCgRetraiteContract[K],
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function setEpargne<K extends keyof BaseCgRetraiteContract['phaseEpargne']>(
    key: K,
    value: BaseCgRetraiteContract['phaseEpargne'][K],
  ) {
    setDraft((previous) => ({
      ...previous,
      phaseEpargne: { ...previous.phaseEpargne, [key]: value },
    }));
  }

  function setLiquidation<K extends keyof BaseCgRetraiteContract['phaseLiquidation']>(
    key: K,
    value: BaseCgRetraiteContract['phaseLiquidation'][K],
  ) {
    setDraft((previous) => ({
      ...previous,
      phaseLiquidation: { ...previous.phaseLiquidation, [key]: value },
    }));
  }

  function setDocument<K extends keyof BaseCgRetraiteDocument>(
    documentId: string,
    key: K,
    value: BaseCgRetraiteDocument[K],
  ) {
    setDraft((previous) => ({
      ...previous,
      documents: (previous.documents ?? []).map((document) =>
        document.id === documentId ? { ...document, [key]: value } : document,
      ),
    }));
  }

  function addDocument() {
    setDraft((previous) => ({
      ...previous,
      documents: [...(previous.documents ?? []), makeBaseCgDocument()],
    }));
  }

  function removeDocument(documentId: string) {
    setDraft((previous) => ({
      ...previous,
      documents: (previous.documents ?? []).filter((document) => document.id !== documentId),
    }));
  }

  function getTabId(tabKey: ContractModalTab): string {
    return `${modalId}-tab-${tabKey}`;
  }

  function focusTab(tabKey: ContractModalTab): void {
    tabRefs.current[tabKey]?.focus();
  }

  function handleTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    tabKey: ContractModalTab,
  ) {
    const currentIndex = CONTRACT_MODAL_TABS.findIndex((tab) => tab.key === tabKey);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % CONTRACT_MODAL_TABS.length;
    if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + CONTRACT_MODAL_TABS.length) % CONTRACT_MODAL_TABS.length;
    }
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = CONTRACT_MODAL_TABS.length - 1;
    if (nextIndex === currentIndex && !['Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const nextTab = CONTRACT_MODAL_TABS[nextIndex];
    if (!nextTab) return;
    setActiveTab(nextTab.key);
    focusTab(nextTab.key);
  }

  return (
    <div className="base-cg-modal-overlay">
      <div
        ref={modalRef}
        className="base-cg-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="base-cg-modal__header">
          <h3 id={modalTitleId}>
            {contract.sourceId === 'Ajout local' ? 'Ajouter un contrat' : 'Modifier le contrat'}
          </h3>
          <button type="button" ref={closeButtonRef} onClick={onClose} aria-label="Fermer">
            x
          </button>
        </div>

        <div className="base-cg-modal__tabs" role="tablist" aria-label="Fiche contrat retraite">
          {CONTRACT_MODAL_TABS.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={getTabId(tab.key)}
                ref={(node) => {
                  tabRefs.current[tab.key] = node;
                }}
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                className={selected ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="base-cg-modal__body"
          role="tabpanel"
          id={panelId}
          aria-labelledby={getTabId(activeTab)}
        >
          {activeTab === 'identity' ? (
            <BaseCgRetraiteIdentityTab draft={draft} onRootChange={setRoot} />
          ) : null}

          {activeTab === 'epargne' ? (
            <BaseCgRetraiteEpargneTab
              draft={draft}
              gestionFees={gestionFees}
              onEpargneChange={setEpargne}
            />
          ) : null}

          {activeTab === 'liquidation' ? (
            <BaseCgRetraiteLiquidationTab draft={draft} onLiquidationChange={setLiquidation} />
          ) : null}

          {activeTab === 'documents' ? (
            <BaseCgRetraiteDocumentsTab
              documents={draft.documents ?? []}
              uploadError={uploadError}
              uploadingDocId={uploadingDocId}
              onAdd={addDocument}
              onRemove={removeDocument}
              onChange={setDocument}
              onUpload={(id, file) => void handleDocumentUpload(id, file)}
            />
          ) : null}
        </div>

        <div className="base-cg-modal__footer">
          <button type="button" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => onSave(normalizeBaseCgRetraiteContractDraft(draft))}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
