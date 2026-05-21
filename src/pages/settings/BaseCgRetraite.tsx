import { useEffect, useMemo, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import {
  BASE_CG_RETRAITE_LEGAL_NOTICE,
  type BaseCgRetraiteContract,
  type BaseCgRetraiteDocument,
} from '@/data/base-cg-retraite';
import {
  bulkUpsertBaseCgRetraiteCatalog,
  createBaseCgRetraiteDocumentDownloadUrl,
  deleteBaseCgRetraiteContract,
  getBaseCgRetraiteCatalog,
  upsertBaseCgRetraiteContract,
} from '@/utils/cache/baseCgRetraiteRepository';
import { TYPE_LABELS, TYPE_OPTIONS } from './baseCgRetraiteOptions';
import BaseCgRetraiteAssistanceModal from './components/BaseCgRetraiteAssistanceModal';
import BaseCgRetraiteContractCards from './components/BaseCgRetraiteContractCards';
import { BaseCgRetraiteContractModal } from './components/BaseCgRetraiteContractModal';
import CompanyLogo from './components/CompanyLogo';
import { isRetraiteContractIncomplete } from './utils/retirementContractCompleteness';
import './styles/base-cg-retraite.css';

function generateContractId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `basecg-local-${crypto.randomUUID()}`;
  }
  return `basecg-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyContract(): BaseCgRetraiteContract {
  const id = generateContractId();
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

function plural(value: number, singular: string, pluralLabel: string = `${singular}s`): string {
  return `${value} ${value > 1 ? pluralLabel : singular}`;
}

function headerStatsLabel(
  totalContracts: number,
  configuredContracts: number,
  availableCg: number,
): string {
  return [
    `${plural(totalContracts, 'contrat')} disponible${totalContracts > 1 ? 's' : ''}`,
    `${plural(configuredContracts, 'contrat')} paramétré${configuredContracts > 1 ? 's' : ''}`,
    `${availableCg} CG disponible${availableCg > 1 ? 's' : ''}`,
  ].join(' - ');
}

function isCgDownloadable(document: BaseCgRetraiteDocument): boolean {
  if (!['conditions_generales', 'notice_information'].includes(document.type)) return false;
  if (!['linked', 'uploaded'].includes(document.status)) return false;
  return Boolean(document.sourceUrl || document.storagePath);
}

function firstCgDocument(contract: BaseCgRetraiteContract): BaseCgRetraiteDocument | null {
  return (contract.documents ?? []).find(isCgDownloadable) ?? null;
}

export default function BaseCgRetraite() {
  const { isAdmin } = useUserRole();
  const [catalog, setCatalog] = useState<BaseCgRetraiteContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editing, setEditing] = useState<BaseCgRetraiteContract | null>(null);
  const [openCompagnie, setOpenCompagnie] = useState<string | null>(null);
  const [initialAccordionApplied, setInitialAccordionApplied] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);

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
      .map(
        ([compagnie, contracts]) =>
          [
            compagnie,
            contracts.sort((left, right) =>
              left.nomContrat.localeCompare(right.nomContrat, 'fr-FR'),
            ),
          ] as const,
      )
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
    if (!isAdmin) return;
    await upsertBaseCgRetraiteContract(contract);
    setEditing(null);
    reload();
  }

  async function handleDelete(contract: BaseCgRetraiteContract) {
    if (!isAdmin) return;
    if (!window.confirm(`Supprimer ${contract.nomContrat} de la Base CG locale ?`)) return;
    await deleteBaseCgRetraiteContract(contract.id);
    reload();
  }

  async function handleDownload(document: BaseCgRetraiteDocument) {
    const url = await createBaseCgRetraiteDocumentDownloadUrl(document);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleBulkSave() {
    if (!isAdmin || bulkSaving) return;
    if (
      !window.confirm(
        "Sauvegarder l'ensemble du catalogue Base CG retraite dans Supabase ? Cette opération met à jour les overrides admin.",
      )
    ) {
      return;
    }
    setBulkSaving(true);
    setBulkStatus('Sauvegarde en cours…');
    try {
      const result = await bulkUpsertBaseCgRetraiteCatalog();
      if (result.errors.length > 0) {
        setBulkStatus(
          `Sauvegarde partielle : ${result.upserted} ok, ${result.skipped} en échec — ${result.errors[0]?.message ?? ''}`,
        );
      } else {
        setBulkStatus(`${result.upserted} contrats synchronisés avec Supabase.`);
      }
      reload();
    } catch (error) {
      setBulkStatus(error instanceof Error ? error.message : 'Sauvegarde impossible.');
    } finally {
      setBulkSaving(false);
    }
  }

  const configuredCount = useMemo(
    () => catalog.filter((contract) => !isRetraiteContractIncomplete(contract)).length,
    [catalog],
  );
  const cgAvailableCount = useMemo(
    () => catalog.reduce((count, contract) => count + (firstCgDocument(contract) ? 1 : 0), 0),
    [catalog],
  );

  return (
    <div className="base-cg-page">
      <UserInfoBanner />

      <section className="settings-premium-card base-cg-header-card">
        <div>
          <h2 className="settings-premium-title">
            <SettingsTitleWithIcon icon="file-text">Base CG retraite</SettingsTitleWithIcon>
          </h2>
          <p className="settings-premium-subtitle">
            {headerStatsLabel(catalog.length, configuredCount, cgAvailableCount)}
          </p>
        </div>
        <div className="base-cg-header-actions">
          <button
            type="button"
            className="base-cg-button base-cg-button--assistance"
            onClick={() => setShowAssistanceModal(true)}
          >
            Assistance & Suggestions
          </button>
          {isAdmin ? (
            <>
              <button
                type="button"
                className="base-cg-button base-cg-button--primary"
                onClick={handleBulkSave}
                disabled={bulkSaving}
              >
                {bulkSaving ? 'Sauvegarde…' : 'Enregistrer la base CG retraite'}
              </button>
              <button
                type="button"
                className="base-cg-button"
                onClick={() => setEditing(createEmptyContract())}
              >
                Ajouter
              </button>
            </>
          ) : null}
        </div>
      </section>

      {bulkStatus ? (
        <div className="base-cg-bulk-status" role="status">
          {bulkStatus}
        </div>
      ) : null}

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
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-premium-card base-cg-catalog-card">
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
                    <span className="base-cg-company__identity">
                      <CompanyLogo company={compagnie} />
                      <span className="base-cg-company__title">{compagnie}</span>
                    </span>
                    <span className="base-cg-company__badges">
                      <span className="base-cg-badge">
                        {contracts.length} contrat{contracts.length > 1 ? 's' : ''}
                      </span>
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
                      <BaseCgRetraiteContractCards
                        compagnie={compagnie}
                        contracts={contracts}
                        isAdmin={isAdmin}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                        onDownload={handleDownload}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <section className="settings-premium-card base-cg-limits">
        <h3>Limites de la Base CG</h3>
        <p>{BASE_CG_RETRAITE_LEGAL_NOTICE}</p>
      </section>

      {editing && isAdmin ? (
        <BaseCgRetraiteContractModal
          contract={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      ) : null}
      {showAssistanceModal ? (
        <BaseCgRetraiteAssistanceModal onClose={() => setShowAssistanceModal(false)} />
      ) : null}
    </div>
  );
}
