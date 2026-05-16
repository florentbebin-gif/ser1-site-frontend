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
import { isRetraiteContractIncomplete } from './utils/retirementContractCompleteness';
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
  const [openCompagnie, setOpenCompagnie] = useState<string | null>(null);
  const [initialAccordionApplied, setInitialAccordionApplied] = useState(false);

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

  const groupedByCompagnie = useMemo(() => {
    const groups = new Map<string, BaseCgRetraiteContract[]>();
    for (const contract of filtered) {
      const compagnie = contract.compagnie || 'Compagnie non renseignée';
      groups.set(compagnie, [...(groups.get(compagnie) ?? []), contract]);
    }
    return Array.from(groups.entries())
      .map(([compagnie, contracts]) => [
        compagnie,
        contracts.sort((left, right) => left.nomContrat.localeCompare(right.nomContrat, 'fr-FR')),
      ] as const)
      .sort(([left], [right]) => left.localeCompare(right, 'fr-FR'));
  }, [filtered]);

  useEffect(() => {
    if (!initialAccordionApplied && groupedByCompagnie.length === 1) {
      setOpenCompagnie(groupedByCompagnie[0]?.[0] ?? null);
      setInitialAccordionApplied(true);
      return;
    }
    if (openCompagnie && !groupedByCompagnie.some(([compagnie]) => compagnie === openCompagnie)) {
      setOpenCompagnie(null);
    }
  }, [groupedByCompagnie, initialAccordionApplied, openCompagnie]);

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
        ) : groupedByCompagnie.length === 0 ? (
          <p>Aucun contrat ne correspond aux filtres.</p>
        ) : (
          <div className="fisc-accordion base-cg-accordion">
            {groupedByCompagnie.map(([compagnie, contracts]) => {
              const isOpen = openCompagnie === compagnie;
              const incompleteCount = contracts.filter(isRetraiteContractIncomplete).length;
              return (
                <div key={compagnie} className="fisc-acc-item base-cg-company">
                  <button
                    type="button"
                    className="fisc-acc-header base-cg-company__header"
                    onClick={() => setOpenCompagnie(isOpen ? null : compagnie)}
                  >
                    <span className="base-cg-company__title">{compagnie}</span>
                    <span className="base-cg-company__badges">
                      <span className="base-cg-badge">{contracts.length} contrat{contracts.length > 1 ? 's' : ''}</span>
                      {incompleteCount > 0 ? (
                        <span className="base-cg-badge base-cg-badge--warning">
                          {incompleteCount} à compléter
                        </span>
                      ) : null}
                    </span>
                    <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
                  </button>

                  {isOpen ? (
                    <div className="fisc-acc-body base-cg-company__body">
                      <table className="base-cg-table">
                        <thead>
                          <tr>
                            <th>Contrat</th>
                            <th>Type</th>
                            <th>Compartiment</th>
                            <th>Table rente</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contracts.map((contract) => {
                            const incomplete = isRetraiteContractIncomplete(contract);
                            return (
                              <tr key={contract.id}>
                                <td>
                                  <span className="base-cg-contract-name">
                                    {contract.nomContrat}
                                    {incomplete ? (
                                      <span className="base-cg-badge base-cg-badge--incomplete">
                                        À compléter
                                      </span>
                                    ) : null}
                                  </span>
                                </td>
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
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
