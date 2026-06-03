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
import SettingsModalShell from './SettingsModalShell';
import { generateId, normalizeBaseCgRetraiteContractDraft } from './baseCgRetraiteModalUtils';

type ContractModalTab = 'identity' | 'epargne' | 'liquidation' | 'documents';

const CONTRACT_MODAL_TABS: Array<{ key: ContractModalTab; label: string }> = [
  { key: 'identity', label: 'Identité' },
  { key: 'epargne', label: 'Phase épargne' },
  { key: 'liquidation', label: 'Phase liquidation' },
  { key: 'documents', label: 'Documents' },
];

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
  const panelId = `${modalId}-panel`;
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
    <SettingsModalShell
      title={contract.sourceId === 'Ajout local' ? 'Ajouter un contrat' : 'Modifier le contrat'}
      subtitle="Identité, phase épargne, liquidation et documents"
      onClose={onClose}
      size="lg"
      overlayClassName="base-cg-modal-overlay"
      modalClassName="base-cg-modal"
      headerClassName="base-cg-modal__header"
      footerClassName="base-cg-modal__footer"
      withBodyContainer={false}
      footer={
        <>
          <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="sim-modal-btn sim-modal-btn--primary"
            onClick={() => onSave(normalizeBaseCgRetraiteContractDraft(draft))}
          >
            Enregistrer
          </button>
        </>
      }
    >
      <div className="base-cg-modal__layout sim-modal-layout--with-nav">
        <div
          className="base-cg-modal__tabs sim-modal-section-nav sim-modal-layout__nav"
          role="tablist"
          aria-label="Fiche contrat retraite"
          aria-orientation="vertical"
        >
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
                className={`sim-modal-section-nav__item${selected ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div
          className="base-cg-modal__body sim-modal-layout__content"
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
      </div>
    </SettingsModalShell>
  );
}
