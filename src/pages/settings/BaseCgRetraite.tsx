import { useEffect, useMemo, useState } from 'react';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import {
  BASECG_EXTRACTED_COUNT,
  BASECG_VERSION,
  type BaseCgRetraiteContract,
} from '@/data/basecg';
import {
  deleteBaseCgRetraiteContract,
  getBaseCgRetraiteCatalog,
  resetBaseCgRetraiteOverlay,
  upsertBaseCgRetraiteContract,
} from '@/utils/cache/baseCgRetraiteRepository';
import { COMPARTMENT_LABELS, TYPE_LABELS, TYPE_OPTIONS } from './baseCgRetraiteOptions';
import { BaseCgRetraiteContractModal } from './components/BaseCgRetraiteContractModal';
import './styles/base-cg-retraite.css';

function createEmptyContract(): BaseCgRetraiteContract {
  const id = `basecg-local-${Date.now()}`;
  return {
    id,
    sourceId: 'Ajout local',
    compagnie: '',
    nomContrat: '',
    typeContrat: 'PERIN',
    perCompartment: 'C1',
    phaseEpargne: {
      dateCommercialisation: null,
      nombreFonds: null,
      nombreSupportsUc: null,
      repartitionUcEuro: null,
      rendementFondsEuro: null,
      fondsEuroGarantis: null,
      fraisVersements: null,
      fraisGestion: null,
      fraisGestionFondsEuro: null,
      fraisGestionUc: null,
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
    documents: [],
    pointsParams: null,
  };
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
                <th>Compartiment</th>
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
                  <td>{contract.perCompartment ? COMPARTMENT_LABELS[contract.perCompartment] : '-'}</td>
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
        <BaseCgRetraiteContractModal
          contract={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
