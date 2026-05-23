import { useEffect, useState } from 'react';
import '@/styles/sim/index.css';
import './styles/index.css';
import { SimPageShell } from '@/components/ui/sim';
import { deriveContractKindFromRegime, resolveContractKind } from '@/domain/prevoyance/helpers';
import type {
  PrevoyanceContractDraft,
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
  PrevoyanceSituationDraft,
} from '@/domain/prevoyance/types';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { storageKeyFor, onResetEvent } from '@/utils/reset';
import {
  getPrevoyanceMaintienEmployeurSettings,
  getPrevoyanceRegimeSettings,
} from '@/utils/cache/prevoyanceSettingsCache';
import { ContractsBlock } from './components/ContractsBlock';
import { FraisProModal } from './components/FraisProModal';
import { Sidebar } from './components/Sidebar';
import { SituationBlock } from './components/SituationBlock';
import {
  createDefaultContract,
  DEFAULT_SITUATION,
  type FraisProModalState,
  type PersistedPrevoyanceState,
} from './defaults';

const STORE_KEY = storageKeyFor('prevoyance');

function usePrevoyanceSettings() {
  const [regimes, setRegimes] = useState<PrevoyanceRegimeSettings[]>([]);
  const [maintien, setMaintien] = useState<PrevoyanceMaintienEmployeurSettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getPrevoyanceRegimeSettings(), getPrevoyanceMaintienEmployeurSettings()])
      .then(([nextRegimes, nextMaintien]) => {
        if (!mounted) return;
        setRegimes(nextRegimes);
        setMaintien(nextMaintien);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { regimes, maintien, loading };
}

function resolvePass(passHistoryByYear: Record<number, number>): number {
  const currentYear = new Date().getFullYear();
  const latestYear = Math.max(...Object.keys(passHistoryByYear).map(Number));
  return passHistoryByYear[currentYear] ?? passHistoryByYear[latestYear] ?? 0;
}

export default function PrevoyancePage() {
  const { fiscalContext } = useFiscalContext();
  const { regimes, maintien, loading } = usePrevoyanceSettings();
  const pass = resolvePass(fiscalContext.passHistoryByYear);

  const [situation, setSituation] = useState<PrevoyanceSituationDraft>(DEFAULT_SITUATION);
  const [contracts, setContracts] = useState<PrevoyanceContractDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [fraisModal, setFraisModal] = useState<FraisProModalState | null>(null);

  const selectedRegime = regimes.find((regime) => regime.code === situation.regimeCode) ?? null;
  const kind = resolveContractKind(selectedRegime, situation.kindOverride);
  const annualBase = kind === 'collectif' ? situation.salaireBrutAnnuel : situation.revenuImposable;
  const maintienLegal = maintien[0] ?? null;
  const visibleContracts = contracts.filter((contract) => contract.kind === kind);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const persisted = JSON.parse(raw) as PersistedPrevoyanceState;
        setSituation({ ...DEFAULT_SITUATION, ...persisted.situation });
        if (persisted.contracts?.length) setContracts(persisted.contracts.slice(0, 3));
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const firstRegime = regimes[0];
    if (!situation.regimeCode && firstRegime) {
      setSituation((prev) => ({ ...prev, regimeCode: firstRegime.code }));
    }
  }, [regimes, situation.regimeCode]);

  useEffect(() => {
    setContracts((prev) => {
      if (prev.length === 0) return [createDefaultContract(kind, 1, annualBase)];
      if (prev.every((contract) => contract.kind === kind)) return prev;
      return prev.map((_, index) => createDefaultContract(kind, index + 1, annualBase));
    });
  }, [annualBase, kind]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ situation, contracts }));
    } catch {
      // ignore
    }
  }, [contracts, hydrated, situation]);

  useEffect(() => {
    const off = onResetEvent(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'prevoyance') return;
      const firstRegime = regimes[0] ?? null;
      setSituation({ ...DEFAULT_SITUATION, regimeCode: firstRegime?.code ?? '' });
      setContracts([
        createDefaultContract(deriveContractKindFromRegime(firstRegime), 1, annualBase),
      ]);
      try {
        sessionStorage.removeItem(STORE_KEY);
      } catch {
        // ignore
      }
    });

    return off;
  }, [annualBase, regimes]);

  const updateSituation = (patch: Partial<PrevoyanceSituationDraft>) => {
    setSituation((prev) => ({ ...prev, ...patch }));
  };

  const openFraisModal = (contractId: string) => {
    const contract = contracts.find((item) => item.id === contractId && item.kind === 'individuel');
    if (!contract || contract.kind !== 'individuel') return;
    setFraisModal({
      contractId,
      chargesExternes: Math.round(contract.fraisPro.amount * 0.35),
      loyers: Math.round(contract.fraisPro.amount * 0.25),
      assurances: Math.round(contract.fraisPro.amount * 0.1),
      salaires: Math.round(contract.fraisPro.amount * 0.2),
      amortissements: Math.round(contract.fraisPro.amount * 0.07),
      fraisBancaires: Math.round(contract.fraisPro.amount * 0.03),
    });
  };

  const applyFraisRecommendation = (amount: number) => {
    if (!fraisModal) return;
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === fraisModal.contractId && contract.kind === 'individuel'
          ? { ...contract, fraisPro: { ...contract.fraisPro, amount } }
          : contract,
      ),
    );
    setFraisModal(null);
  };

  return (
    <SimPageShell
      title="Prévoyance"
      subtitle="Protection arrêt de travail, invalidité, décès et frais professionnels."
      loading={loading}
      loadingContent={<div className="premium-card sim-state-card">Chargement des régimes...</div>}
      pageClassName="prevoyance-page"
      pageTestId="prevoyance-page"
      mobileSideFirst
    >
      <SimPageShell.Main>
        <SituationBlock
          situation={situation}
          regimes={regimes}
          selectedRegime={selectedRegime}
          kind={kind}
          onChange={updateSituation}
        />

        <ContractsBlock
          kind={kind}
          contracts={visibleContracts}
          annualBase={annualBase}
          pass={pass}
          salaireBrutAnnuel={situation.salaireBrutAnnuel}
          onContractsChange={setContracts}
          onOpenFrais={openFraisModal}
        />
      </SimPageShell.Main>

      <SimPageShell.Side>
        <Sidebar
          kind={kind}
          regime={selectedRegime}
          maintien={maintienLegal}
          contracts={visibleContracts}
          annualBase={annualBase}
          pass={pass}
          salaireBrutAnnuel={situation.salaireBrutAnnuel}
          ancienneteYears={situation.ancienneteYears}
        />
      </SimPageShell.Side>

      {fraisModal ? (
        <FraisProModal
          state={fraisModal}
          onClose={() => setFraisModal(null)}
          onApply={applyFraisRecommendation}
          onChange={(patch) => setFraisModal((prev) => (prev ? { ...prev, ...patch } : prev))}
        />
      ) : null}
    </SimPageShell>
  );
}
