import { useEffect, useMemo, useState } from 'react';
import {
  normalizeBaseCgRetraiteGestionFees,
  type BaseCgRetraiteContract,
  type BaseCgRetraiteContractType,
  type BaseCgRetraiteDocument,
} from '@/data/basecg';
import {
  buildBaseCgRetraiteStoragePath,
  uploadBaseCgRetraitePdf,
} from '@/utils/cache/baseCgRetraiteRepository';
import { COMPARTMENT_LABELS, COMPARTMENT_OPTIONS, TYPE_LABELS, TYPE_OPTIONS } from '../baseCgRetraiteOptions';
import { BaseCgRetraiteDocumentsTab } from './BaseCgRetraiteDocumentsTab';

function updateText(value: string): string | null {
  return value.trim() || null;
}

function parseRatePercent(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed / 100 : null;
}

function formatRatePercent(rate: number | null | undefined): string {
  return typeof rate === 'number' && Number.isFinite(rate) ? String(rate * 100) : '';
}

function formatRateLabel(rate: number | null): string | null {
  if (rate === null) return null;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(rate * 100)} %`;
}

// Taux pouvant venir du catalogue en string ("0,65 %") ou en number (0.0065).
// L'input modale affiche toujours un libellé "X,XX %" lisible et stocke en décimal au commit.
function rateInputValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value * 100)} %`;
  }
  return String(value);
}

function commitRate(value: string): string | number | null {
  if (!value.trim()) return null;
  // On accepte "0,65", "0,65 %", "0.65%". Le `%` et les espaces sont nettoyés, virgule fr-FR convertie.
  const cleaned = value.replace(/%|\s/g, '').replace(',', '.');
  const parsed = Number(cleaned);
  // Si la saisie est un nombre pur, on stocke en décimal (0.0065). Sinon on conserve le texte (rare).
  if (Number.isFinite(parsed)) return parsed / 100;
  return value.trim();
}

function formatFieldValue(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function parseOptionalInteger(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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
  onClose: () => void;
  onSave: (_contract: BaseCgRetraiteContract) => void;
}

export function BaseCgRetraiteContractModal({ contract, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<BaseCgRetraiteContract>(() => ({
    ...contract,
    documents: contract.documents ?? [],
  }));
  const [activeTab, setActiveTab] = useState<ContractModalTab>('identity');
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const gestionFees = normalizeBaseCgRetraiteGestionFees(draft.phaseEpargne);

  // Commit la normalisation des frais de gestion dans le draft au mount
  // pour qu'une sauvegarde sans édition manuelle préserve les ventilations dérivées.
  useEffect(() => {
    setDraft((previous) => {
      const normalized = normalizeBaseCgRetraiteGestionFees(previous.phaseEpargne);
      if (
        previous.phaseEpargne.fraisGestionFondsEuro === normalized.fraisGestionFondsEuro
        && previous.phaseEpargne.fraisGestionUc === normalized.fraisGestionUc
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

  const contractIdentity = useMemo(() => ({
    id: draft.id,
    compagnie: draft.compagnie,
    nomContrat: draft.nomContrat,
  }), [draft.id, draft.compagnie, draft.nomContrat]);

  async function handleDocumentUpload(documentId: string, file: File) {
    const target = (draft.documents ?? []).find((document) => document.id === documentId);
    if (!target) return;
    setUploadError(null);
    setUploadingDocId(documentId);
    try {
      const storagePath = target.storagePath
        || buildBaseCgRetraiteStoragePath(contractIdentity, target.versionLabel ?? '');
      const result = await uploadBaseCgRetraitePdf({
        contractId: contractIdentity.id,
        versionLabel: target.versionLabel ?? '',
        file,
        storagePath,
      });
      setDraft((previous) => ({
        ...previous,
        documents: (previous.documents ?? []).map((document) => (
          document.id === documentId
            ? {
              ...document,
              storagePath: result.storagePath,
              fileName: result.fileName,
              bytes: result.bytes,
              mime: result.mime,
              status: 'uploaded',
            }
            : document
        )),
      }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload PDF impossible.');
    } finally {
      setUploadingDocId(null);
    }
  }

  function setRoot<K extends keyof BaseCgRetraiteContract>(key: K, value: BaseCgRetraiteContract[K]) {
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
      documents: (previous.documents ?? []).map((document) => (
        document.id === documentId ? { ...document, [key]: value } : document
      )),
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

  return (
    <div className="base-cg-modal-overlay">
      <div className="base-cg-modal">
        <div className="base-cg-modal__header">
          <h3>{contract.sourceId === 'Ajout local' ? 'Ajouter un contrat' : 'Modifier le contrat'}</h3>
          <button type="button" onClick={onClose} aria-label="Fermer">x</button>
        </div>

        <div className="base-cg-modal__tabs" role="tablist" aria-label="Fiche contrat retraite">
          {CONTRACT_MODAL_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={activeTab === tab.key ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="base-cg-modal__body" role="tabpanel">
          {activeTab === 'identity' ? (
            <>
              <label>
                Compagnie
                <input value={draft.compagnie} onChange={(event) => setRoot('compagnie', event.target.value)} />
              </label>
              <label>
                Nom du contrat
                <input value={draft.nomContrat} onChange={(event) => setRoot('nomContrat', event.target.value)} />
              </label>
              <label>
                Type
                <select
                  value={draft.typeContrat}
                  onChange={(event) => setRoot('typeContrat', event.target.value as BaseCgRetraiteContractType)}
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{TYPE_LABELS[type]}</option>
                  ))}
                </select>
              </label>
              <label>
                Compartiment PER cible
                <select
                  value={draft.perCompartment ?? ''}
                  onChange={(event) => setRoot(
                    'perCompartment',
                    (event.target.value || null) as BaseCgRetraiteContract['perCompartment'],
                  )}
                >
                  <option value="">Déduit du type</option>
                  {COMPARTMENT_OPTIONS.map((compartment) => (
                    <option key={compartment} value={compartment}>{COMPARTMENT_LABELS[compartment]}</option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {activeTab === 'epargne' ? (
            <>
              <label>
                Date de commercialisation
                <input
                  value={draft.phaseEpargne.dateCommercialisation ?? ''}
                  onChange={(event) => setEpargne('dateCommercialisation', updateText(event.target.value))}
                />
              </label>
              <label>
                Nombre de fonds
                <input
                  value={formatFieldValue(draft.phaseEpargne.nombreFonds)}
                  onChange={(event) => setEpargne('nombreFonds', updateText(event.target.value))}
                />
              </label>
              <label>
                Nombre d'UC
                <input
                  inputMode="numeric"
                  value={formatFieldValue(draft.phaseEpargne.nombreSupportsUc)}
                  onChange={(event) => setEpargne('nombreSupportsUc', parseOptionalInteger(event.target.value))}
                />
              </label>
              <label>
                Répartition UC / fonds €
                <input
                  value={draft.phaseEpargne.repartitionUcEuro ?? ''}
                  onChange={(event) => setEpargne('repartitionUcEuro', updateText(event.target.value))}
                />
              </label>
              <label>
                TMG du contrat (fonds €)
                <input
                  value={rateInputValue(draft.phaseEpargne.rendementFondsEuro)}
                  onChange={(event) => setEpargne('rendementFondsEuro', commitRate(event.target.value))}
                  placeholder="Ex : 3,5 % avant le 31/12/2016"
                />
                <small className="base-cg-modal__hint">
                  Taux Minimum Garanti historique. Encadré par l'arrêté du 9 décembre 2016 (loi Sapin 2)
                  et l'arrêté du 24 juillet 2018 (préparation loi PACTE). Les TMG anciens restent acquis
                  aux versements antérieurs à la date de cessation.
                </small>
              </label>
              <label>
                Fonds € garantis
                <input
                  value={rateInputValue(draft.phaseEpargne.fondsEuroGarantis)}
                  onChange={(event) => setEpargne('fondsEuroGarantis', commitRate(event.target.value))}
                />
              </label>
              <label>
                Frais sur versements
                <input
                  value={rateInputValue(draft.phaseEpargne.fraisVersements)}
                  onChange={(event) => setEpargne('fraisVersements', commitRate(event.target.value))}
                />
              </label>
              <label>
                Frais gestion fonds €
                <input
                  value={rateInputValue(gestionFees.fraisGestionFondsEuro)}
                  onChange={(event) => setEpargne('fraisGestionFondsEuro', commitRate(event.target.value))}
                />
              </label>
              <label>
                Frais gestion UC
                <input
                  value={rateInputValue(gestionFees.fraisGestionUc)}
                  onChange={(event) => setEpargne('fraisGestionUc', commitRate(event.target.value))}
                />
              </label>
              <label>
                Frais d'arbitrage
                <input
                  value={rateInputValue(draft.phaseEpargne.fraisArbitrage)}
                  onChange={(event) => setEpargne('fraisArbitrage', commitRate(event.target.value))}
                />
              </label>
              <label>
                Taux frais transfert sortant
                <input
                  type="number"
                  value={formatRatePercent(draft.phaseEpargne.fraisTransfertSortantRate)}
                  onChange={(event) => {
                    const rate = parseRatePercent(event.target.value);
                    setEpargne('fraisTransfertSortantRate', rate);
                    setEpargne('fraisTransfertSortant', formatRateLabel(rate));
                  }}
                />
              </label>
              <label className="base-cg-modal__wide">
                Modalités en cas de décès
                <textarea
                  value={draft.phaseEpargne.clauseBeneficiaire ?? ''}
                  onChange={(event) => setEpargne('clauseBeneficiaire', updateText(event.target.value))}
                  rows={3}
                />
              </label>
              <label className="base-cg-modal__wide">
                Garanties complémentaires
                <textarea
                  value={draft.phaseEpargne.garantiesComplementaires ?? ''}
                  onChange={(event) => setEpargne('garantiesComplementaires', updateText(event.target.value))}
                  rows={3}
                />
              </label>
            </>
          ) : null}

          {activeTab === 'liquidation' ? (
            <>
              <label>
                Âge limite de liquidation
                <input
                  value={formatFieldValue(draft.phaseLiquidation.ageLimiteLiquidation)}
                  onChange={(event) => setLiquidation('ageLimiteLiquidation', updateText(event.target.value))}
                />
              </label>
              <label>
                Sortie en capital à la retraite
                <input
                  value={draft.phaseLiquidation.sortieCapitalRetraite ?? ''}
                  onChange={(event) => setLiquidation('sortieCapitalRetraite', updateText(event.target.value))}
                />
              </label>
              <label>
                Fractionnement du capital
                <input
                  value={draft.phaseLiquidation.fractionnementCapital ?? ''}
                  onChange={(event) => setLiquidation('fractionnementCapital', updateText(event.target.value))}
                />
              </label>
              <label>
                Rachat libre
                <input
                  value={draft.phaseLiquidation.rachatLibre ?? ''}
                  onChange={(event) => setLiquidation('rachatLibre', updateText(event.target.value))}
                />
              </label>
              <label>
                Table conversion rente
                <input
                  value={draft.phaseLiquidation.tableConversionRente ?? ''}
                  onChange={(event) => setLiquidation('tableConversionRente', updateText(event.target.value))}
                />
              </label>
              <label>
                Table garantie à l'adhésion
                <input
                  value={draft.phaseLiquidation.tableGarantieAdhesion ?? ''}
                  onChange={(event) => setLiquidation('tableGarantieAdhesion', updateText(event.target.value))}
                />
              </label>
              <label>
                Taux technique
                <input
                  value={rateInputValue(draft.phaseLiquidation.tauxTechnique)}
                  onChange={(event) => setLiquidation('tauxTechnique', commitRate(event.target.value))}
                />
              </label>
              <label>
                Taux frais sur arrérages
                <input
                  type="number"
                  value={formatRatePercent(draft.phaseLiquidation.fraisArreragesRate)}
                  onChange={(event) => {
                    const rate = parseRatePercent(event.target.value);
                    setLiquidation('fraisArreragesRate', rate);
                    setLiquidation('fraisArrerages', formatRateLabel(rate));
                  }}
                />
              </label>
              <label>
                Annuités garanties
                <input
                  value={draft.phaseLiquidation.annuitesGaranties ?? ''}
                  onChange={(event) => setLiquidation('annuitesGaranties', updateText(event.target.value))}
                />
              </label>
              <label>
                Réversion incluse dans la rente
                <input
                  value={draft.phaseLiquidation.reversionIncluse ?? ''}
                  onChange={(event) => setLiquidation('reversionIncluse', updateText(event.target.value))}
                />
              </label>
              <label className="base-cg-modal__wide">
                Réversion possible
                <textarea
                  value={draft.phaseLiquidation.reversionPossible ?? ''}
                  onChange={(event) => setLiquidation('reversionPossible', updateText(event.target.value))}
                  rows={3}
                />
              </label>
              <label className="base-cg-modal__wide">
                Rente estimée
                <textarea
                  value={formatFieldValue(draft.phaseLiquidation.renteEstimee)}
                  onChange={(event) => setLiquidation('renteEstimee', updateText(event.target.value))}
                  rows={2}
                />
              </label>
            </>
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
          <button type="button" onClick={onClose}>Annuler</button>
          <button type="button" className="chip" onClick={() => onSave(draft)}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
