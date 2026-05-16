import { useState } from 'react';
import {
  formatBaseCgRetraiteRateField,
  normalizeBaseCgRetraiteGestionFees,
  type BaseCgRetraiteContract,
  type BaseCgRetraiteContractType,
  type BaseCgRetraiteDocument,
} from '@/data/basecg';
import { COMPARTMENT_LABELS, COMPARTMENT_OPTIONS, TYPE_LABELS, TYPE_OPTIONS } from '../baseCgRetraiteOptions';

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

function formatFieldValue(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function parseOptionalInteger(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
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
    id: `basecg-document-${Date.now()}`,
    label: 'Conditions Générales',
    type: 'conditions_generales',
    sourceUrl: '',
    status: 'linked',
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
  const gestionFees = normalizeBaseCgRetraiteGestionFees(draft.phaseEpargne);

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
                Rendement fonds €
                <input
                  value={formatBaseCgRetraiteRateField(draft.phaseEpargne.rendementFondsEuro)}
                  onChange={(event) => setEpargne('rendementFondsEuro', updateText(event.target.value))}
                />
              </label>
              <label>
                Fonds € garantis
                <input
                  value={formatBaseCgRetraiteRateField(draft.phaseEpargne.fondsEuroGarantis)}
                  onChange={(event) => setEpargne('fondsEuroGarantis', updateText(event.target.value))}
                />
              </label>
              <label>
                Frais sur versements
                <input
                  value={formatBaseCgRetraiteRateField(draft.phaseEpargne.fraisVersements)}
                  onChange={(event) => setEpargne('fraisVersements', updateText(event.target.value))}
                />
              </label>
              <label>
                Frais gestion fonds €
                <input
                  value={formatBaseCgRetraiteRateField(gestionFees.fraisGestionFondsEuro)}
                  onChange={(event) => setEpargne('fraisGestionFondsEuro', updateText(event.target.value))}
                />
              </label>
              <label>
                Frais gestion UC
                <input
                  value={formatBaseCgRetraiteRateField(gestionFees.fraisGestionUc)}
                  onChange={(event) => setEpargne('fraisGestionUc', updateText(event.target.value))}
                />
              </label>
              <label>
                Frais d'arbitrage
                <input
                  value={formatBaseCgRetraiteRateField(draft.phaseEpargne.fraisArbitrage)}
                  onChange={(event) => setEpargne('fraisArbitrage', updateText(event.target.value))}
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
                Clause bénéficiaire
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
                  value={formatBaseCgRetraiteRateField(draft.phaseLiquidation.tauxTechnique)}
                  onChange={(event) => setLiquidation('tauxTechnique', updateText(event.target.value))}
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
            <div className="base-cg-documents">
              <div className="base-cg-documents__header">
                <div>
                  <h4>Documents contractuels</h4>
                  <p>Stockage PDF prévu pour l'étape Supabase Storage. En attendant, la fiche conserve un lien ou un chemin.</p>
                </div>
                <button type="button" className="base-cg-button" onClick={addDocument}>
                  Ajouter un document
                </button>
              </div>

              {(draft.documents ?? []).length === 0 ? (
                <p className="base-cg-documents__empty">Aucun document référencé.</p>
              ) : null}

              {(draft.documents ?? []).map((document) => (
                <div className="base-cg-document-row" key={document.id}>
                  <label>
                    Libellé du document
                    <input
                      value={document.label}
                      onChange={(event) => setDocument(document.id, 'label', event.target.value)}
                    />
                  </label>
                  <label>
                    Nature
                    <select
                      value={document.type}
                      onChange={(event) => setDocument(
                        document.id,
                        'type',
                        event.target.value as BaseCgRetraiteDocument['type'],
                      )}
                    >
                      <option value="conditions_generales">Conditions Générales</option>
                      <option value="notice_information">Notice d'information</option>
                      <option value="avenant">Avenant</option>
                      <option value="autre">Autre</option>
                    </select>
                  </label>
                  <label className="base-cg-modal__wide">
                    URL ou chemin du document
                    <input
                      value={document.sourceUrl ?? ''}
                      onChange={(event) => setDocument(document.id, 'sourceUrl', event.target.value)}
                    />
                  </label>
                  <div className="base-cg-document-row__actions">
                    <button type="button" disabled>
                      Uploader PDF
                    </button>
                    <button type="button" onClick={() => removeDocument(document.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
