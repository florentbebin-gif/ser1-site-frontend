import { useEffect, useState } from 'react';
import '@/styles/sim/index.css';
import './styles/index.css';
import { ExportMenu } from '@/components/ExportMenu';
import { SimPageShell } from '@/components/ui/sim';
import { PREVOYANCE_MAINTIEN_LEGAL_CODE } from '@/domain/prevoyance/constants';
import {
  deriveContractKindFromRegime,
  resolveContractKind,
  resolveRegimeStack,
} from '@/domain/prevoyance/helpers';
import type {
  PrevoyanceContractAggregationMode,
  PrevoyanceContractDraft,
  PrevoyanceDeathTargetDraft,
  PrevoyanceSituationDraft,
} from '@/domain/prevoyance/types';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { usePrevoyanceSettings } from '@/hooks/usePrevoyanceSettings';
import { useTheme } from '@/settings/ThemeProvider';
import { onResetEvent } from '@/utils/reset';
import { ContractsBlock } from './components/ContractsBlock';
import { FraisProModal } from './components/FraisProModal';
import { Sidebar } from './components/Sidebar';
import { SituationBlock } from './components/SituationBlock';
import { createDefaultContract, DEFAULT_SITUATION, type FraisProModalState } from './defaults';
import { usePrevoyanceExportHandlers } from './hooks/usePrevoyanceExportHandlers';
import { PREVOYANCE_STORAGE_KEY, parsePersistedPrevoyanceState } from './persistence';
import { DEFAULT_DEATH_TARGET } from './constants';

function resolvePass(passHistoryByYear: Record<number, number>): number {
  const currentYear = new Date().getFullYear();
  const latestYear = Math.max(...Object.keys(passHistoryByYear).map(Number));
  return passHistoryByYear[currentYear] ?? passHistoryByYear[latestYear] ?? 0;
}

export default function PrevoyancePage() {
  const { fiscalContext } = useFiscalContext();
  const { regimes, maintien, loading } = usePrevoyanceSettings();
  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const pass = resolvePass(fiscalContext.passHistoryByYear);

  const [situation, setSituation] = useState<PrevoyanceSituationDraft>(DEFAULT_SITUATION);
  const [contracts, setContracts] = useState<PrevoyanceContractDraft[]>([]);
  const [contractAggregationMode, setContractAggregationMode] =
    useState<PrevoyanceContractAggregationMode>('compare');
  const [deathTarget, setDeathTarget] = useState<PrevoyanceDeathTargetDraft>(DEFAULT_DEATH_TARGET);
  const [hydrated, setHydrated] = useState(false);
  const [fraisModal, setFraisModal] = useState<FraisProModalState | null>(null);

  const selectedRegime = regimes.find((regime) => regime.code === situation.regimeCode) ?? null;
  const regimeStack = resolveRegimeStack(selectedRegime, regimes);
  const kind = resolveContractKind(selectedRegime, situation.kindOverride);
  const annualBase = kind === 'collectif' ? situation.salaireBrutAnnuel : situation.revenuImposable;
  const referenceAnnual = kind === 'collectif' ? situation.salaireNetImposable : annualBase;
  const maintienLegal =
    maintien.find((item) => item.code === PREVOYANCE_MAINTIEN_LEGAL_CODE) ?? null;
  const visibleContracts = contracts.filter((contract) => contract.kind === kind);
  const hasBirthDate = Boolean(situation.birthDate);
  const hasConjoint = ['couple', 'marie', 'pacs'].includes(situation.familyStatus);
  const hasChildren = situation.childrenCount > 0;
  const sidebarContracts =
    contractAggregationMode === 'compare' ? visibleContracts.slice(0, 1) : visibleContracts;
  const { exportOptions, exportLoading } = usePrevoyanceExportHandlers({
    situation,
    kind,
    regimeStack,
    maintien: maintienLegal,
    contracts: visibleContracts,
    contractAggregationMode,
    deathTarget,
    annualBase,
    referenceAnnual,
    themeColors: pptxColors,
    cabinetLogo,
    logoPlacement,
  });

  useEffect(() => {
    const persisted = parsePersistedPrevoyanceState(sessionStorage.getItem(PREVOYANCE_STORAGE_KEY));
    if (persisted) {
      setSituation({ ...DEFAULT_SITUATION, ...persisted.situation });
      if (persisted.contracts?.length) setContracts(persisted.contracts.slice(0, 3));
      if (persisted.contractAggregationMode) {
        setContractAggregationMode(persisted.contractAggregationMode);
      }
      if (persisted.deathTarget) setDeathTarget(persisted.deathTarget);
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
      sessionStorage.setItem(
        PREVOYANCE_STORAGE_KEY,
        JSON.stringify({ situation, contracts, contractAggregationMode, deathTarget }),
      );
    } catch {
      // ignore
    }
  }, [contractAggregationMode, contracts, deathTarget, hydrated, situation]);

  useEffect(() => {
    const off = onResetEvent(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'prevoyance') return;
      const firstRegime = regimes[0] ?? null;
      setSituation({ ...DEFAULT_SITUATION, regimeCode: firstRegime?.code ?? '' });
      setContracts([
        createDefaultContract(deriveContractKindFromRegime(firstRegime), 1, annualBase),
      ]);
      setContractAggregationMode('compare');
      setDeathTarget(DEFAULT_DEATH_TARGET);
      try {
        sessionStorage.removeItem(PREVOYANCE_STORAGE_KEY);
      } catch {
        // ignore
      }
    });

    return off;
  }, [annualBase, regimes]);

  const updateSituation = (patch: Partial<PrevoyanceSituationDraft>) => {
    setSituation((prev) => ({ ...prev, ...patch }));
  };

  const openFraisModal = (contract: Extract<PrevoyanceContractDraft, { kind: 'individuel' }>) => {
    setFraisModal({
      contractId: contract.id,
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
    <>
      <SimPageShell
        title="Prévoyance"
        subtitle="Protection arrêt de travail, invalidité, décès et frais professionnels."
        loading={loading}
        loadingContent={
          <div className="premium-card sim-state-card">Chargement des régimes...</div>
        }
        pageClassName="prevoyance-page"
        pageTestId="prevoyance-page"
        mobileSideFirst
        actions={<ExportMenu options={exportOptions} loading={exportLoading} />}
      >
        <SimPageShell.Main>
          <SituationBlock
            situation={situation}
            regimes={regimes}
            kind={kind}
            onChange={updateSituation}
          />

          {hasBirthDate ? (
            <ContractsBlock
              kind={kind}
              contracts={visibleContracts}
              contractAggregationMode={contractAggregationMode}
              annualBase={annualBase}
              pass={pass}
              salaireBrutAnnuel={situation.salaireBrutAnnuel}
              hasConjoint={hasConjoint}
              hasChildren={hasChildren}
              onContractsChange={setContracts}
              onContractAggregationModeChange={setContractAggregationMode}
              onOpenFrais={openFraisModal}
            />
          ) : null}
        </SimPageShell.Main>

        <SimPageShell.Side>
          <Sidebar
            kind={kind}
            regimeStack={regimeStack}
            maintien={maintienLegal}
            contracts={sidebarContracts}
            contractAggregationMode={contractAggregationMode}
            deathTarget={deathTarget}
            onDeathTargetChange={setDeathTarget}
            annualBase={annualBase}
            referenceAnnual={referenceAnnual}
            pass={pass}
            salaireBrutAnnuel={situation.salaireBrutAnnuel}
            ancienneteYears={situation.ancienneteYears}
            hasConjoint={hasConjoint}
            hasChildren={hasChildren}
          />
        </SimPageShell.Side>
      </SimPageShell>

      {fraisModal ? (
        <FraisProModal
          state={fraisModal}
          onClose={() => setFraisModal(null)}
          onApply={applyFraisRecommendation}
          onChange={(patch) => setFraisModal((prev) => (prev ? { ...prev, ...patch } : prev))}
        />
      ) : null}
    </>
  );
}
