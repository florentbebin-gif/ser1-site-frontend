import { useEffect, useMemo, useState } from 'react';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { BASECG_EXTRACTED_COUNT, BASECG_VERSION, type BaseCgRetraiteContract, type BaseCgRetraiteContractType } from '@/data/basecg';
import {
  deleteBaseCgRetraiteContract,
  getBaseCgRetraiteCatalog,
  resetBaseCgRetraiteOverlay,
  upsertBaseCgRetraiteContract,
} from '@/utils/cache/baseCgRetraiteRepository';
import './styles/base-cg-retraite.css';

const TYPE_LABELS: Record<BaseCgRetraiteContractType, string> = {
  PERIN: 'PER individuel',
  PERP: 'PERP',
  MADELIN: 'Madelin',
  ARTICLE83: 'Article 83',
  PERCO: 'PERCO',
  PER_POINTS: 'Contrat en points',
  AUTRE: 'Autre',
};

const TYPE_OPTIONS = Object.keys(TYPE_LABELS) as BaseCgRetraiteContractType[];

function createEmptyContract(): BaseCgRetraiteContract {
  const id = `basecg-local-${Date.now()}`;
  return {
    id,
    sourceId: 'Ajout local',
    compagnie: '',
    nomContrat: '',
    typeContrat: 'PERIN',
    phaseEpargne: {
      dateCommercialisation: null,
      nombreFonds: null,
      repartitionUcEuro: null,
      rendementFondsEuro: null,
      fraisVersements: null,
      fraisGestion: null,
      fraisArbitrage: null,
      fraisTransfertSortant: null,
      fraisTransfertSortantRate: null,
      clauseBeneficiaire: null,
      garantiesComplementaires: null,
    },
    phaseLiquidation: {
      ageLimiteLiquidation: null,
      sortieCapitalRetraite: null,
      fractionnementCapital: null,
      rachatLibre: null,
      tableConversionRente: null,
      tableGarantieAdhesion: null,
      tauxTechnique: null,
      fraisArrerages: null,
      fraisArreragesRate: null,
      annuitesGaranties: null,
      reversionPossible: null,
      reversionIncluse: null,
      renteEstimee: null,
    },
    pointsParams: null,
  };
}

function updateText(value: string): string | null {
  return value.trim() || null;
}

function ContractModal({
  contract,
  onClose,
  onSave,
}: {
  contract: BaseCgRetraiteContract;
  onClose: () => void;
  onSave: (_contract: BaseCgRetraiteContract) => void;
}) {
  const [draft, setDraft] = useState(contract);

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

  return (
    <div className="base-cg-modal-overlay">
      <div className="base-cg-modal">
        <div className="base-cg-modal__header">
          <h3>{contract.sourceId === 'Ajout local' ? 'Ajouter un contrat' : 'Modifier le contrat'}</h3>
          <button type="button" onClick={onClose} aria-label="Fermer">x</button>
        </div>

        <div className="base-cg-modal__body">
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
            Frais transfert sortant
            <input
              value={draft.phaseEpargne.fraisTransfertSortant?.toString() ?? ''}
              onChange={(event) => setEpargne('fraisTransfertSortant', updateText(event.target.value))}
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
            Frais arrérages
            <input
              value={draft.phaseLiquidation.fraisArrerages?.toString() ?? ''}
              onChange={(event) => setLiquidation('fraisArrerages', updateText(event.target.value))}
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
          <label className="base-cg-modal__wide">
            Réversion possible
            <textarea
              value={draft.phaseLiquidation.reversionPossible ?? ''}
              onChange={(event) => setLiquidation('reversionPossible', updateText(event.target.value))}
              rows={3}
            />
          </label>
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

export default function BaseCgRetraite() {
  const [catalog, setCatalog] = useState<BaseCgRetraiteContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editing, setEditing] = useState<BaseCgRetraiteContract | null>(null);

  const reload = () => {
    setLoading(true);
    getBaseCgRetraiteCatalog()
      .then((contracts) => {
        setCatalog(contracts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return catalog.filter((contract) => {
      if (typeFilter && contract.typeContrat !== typeFilter) return false;
      if (!query) return true;
      return `${contract.compagnie} ${contract.nomContrat}`.toLowerCase().includes(query);
    });
  }, [catalog, searchQuery, typeFilter]);

  async function handleSave(contract: BaseCgRetraiteContract) {
    await upsertBaseCgRetraiteContract(contract);
    setEditing(null);
    reload();
  }

  async function handleDelete(contract: BaseCgRetraiteContract) {
    if (!window.confirm(`Supprimer ${contract.nomContrat} de la Base CG locale ?`)) return;
    await deleteBaseCgRetraiteContract(contract.id);
    reload();
  }

  async function handleReset() {
    if (!window.confirm('Réinitialiser toutes les modifications locales de la Base CG retraite ?')) return;
    await resetBaseCgRetraiteOverlay();
    reload();
  }

  return (
    <div className="base-cg-page">
      <UserInfoBanner />

      <section className="settings-premium-card base-cg-header-card">
        <div>
          <h2 className="settings-premium-title">Base CG retraite</h2>
          <p className="settings-premium-subtitle">
            {catalog.length} contrats disponibles - extraction {BASECG_EXTRACTED_COUNT} contrats - version {BASECG_VERSION}
          </p>
        </div>
        <div className="base-cg-header-actions">
          <button type="button" className="base-cg-button" onClick={() => setEditing(createEmptyContract())}>
            Ajouter
          </button>
          <button type="button" className="base-cg-button base-cg-button--ghost" onClick={handleReset}>
            Réinitialiser
          </button>
        </div>
      </section>

      <div className="base-cg-filters">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Rechercher compagnie ou contrat"
        />
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">Tous les types</option>
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>{TYPE_LABELS[type]}</option>
          ))}
        </select>
      </div>

      <div className="settings-premium-card base-cg-table-card">
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <table className="base-cg-table">
            <thead>
              <tr>
                <th>Compagnie</th>
                <th>Contrat</th>
                <th>Type</th>
                <th>Table rente</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contract) => (
                <tr key={contract.id}>
                  <td>{contract.compagnie}</td>
                  <td>{contract.nomContrat}</td>
                  <td>{TYPE_LABELS[contract.typeContrat]}</td>
                  <td>{contract.phaseLiquidation.tableConversionRente ?? 'A compléter'}</td>
                  <td>
                    <div className="base-cg-row-actions">
                      <button type="button" onClick={() => setEditing(contract)}>Modifier</button>
                      <button type="button" onClick={() => handleDelete(contract)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing ? (
        <ContractModal
          contract={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
