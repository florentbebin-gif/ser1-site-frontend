import { useEffect, useState } from 'react';
import '@/styles/sim/index.css';
import './styles/index.css';
import { ExportMenu } from '@/components/ExportMenu';
import { ModeToggle } from '@/components/ModeToggle';
import {
  SimEmptyState,
  SimPageShell,
  SimPageStepper,
  SimViewSynthesisCTA,
} from '@/components/ui/sim';
import {
  PREVOYANCE_DEFAULT_REGIME_CODE,
  PREVOYANCE_MAINTIEN_LEGAL_CODE,
} from '@/domain/prevoyance/constants';
import { deriveContractKindFromRegime, resolveRegimeStack } from '@/domain/prevoyance/helpers';
import type {
  PrevoyanceContractAggregationMode,
  PrevoyanceContractDraft,
  PrevoyanceDeathTargetDraft,
  PrevoyanceRegimeSettings,
  PrevoyanceSituationDraft,
} from '@/domain/prevoyance/types';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { usePrevoyanceSettings } from '@/hooks/usePrevoyanceSettings';
import { useTheme } from '@/settings/ThemeProvider';
import { onResetEvent } from '@/utils/reset';
import { ContractsBlock } from './components/ContractsBlock';
import { FraisProModal } from './components/FraisProModal';
import { PrevoyanceHypotheses } from './components/PrevoyanceHypotheses';
import { Sidebar } from './components/Sidebar';
import { SituationBlock } from './components/SituationBlock';
import {
  createDefaultContract,
  DEFAULT_FRAIS_GENERAUX_ESTIMATE,
  DEFAULT_SITUATION,
  type FraisGenerauxEstimateState,
} from './defaults';
import { usePrevoyancePageUXContract } from './hooks/usePrevoyancePageUXContract';
import { usePrevoyanceExportHandlers } from './hooks/usePrevoyanceExportHandlers';
import { PREVOYANCE_STORAGE_KEY, parsePersistedPrevoyanceState } from './persistence';
import { DEFAULT_DEATH_TARGET } from './constants';

function resolvePass(passHistoryByYear: Record<number, number>): number {
  const currentYear = new Date().getFullYear();
  const latestYear = Math.max(...Object.keys(passHistoryByYear).map(Number));
  return passHistoryByYear[currentYear] ?? passHistoryByYear[latestYear] ?? 0;
}

function resolveDefaultRegime(
  regimes: PrevoyanceRegimeSettings[],
): PrevoyanceRegimeSettings | null {
  return (
    regimes.find((regime) => regime.code === PREVOYANCE_DEFAULT_REGIME_CODE) ?? regimes[0] ?? null
  );
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
  const [fraisModalOpen, setFraisModalOpen] = useState(false);
  const [fraisGenerauxEstimate, setFraisGenerauxEstimate] = useState<FraisGenerauxEstimateState>(
    DEFAULT_FRAIS_GENERAUX_ESTIMATE,
  );

  const selectedRegime = regimes.find((regime) => regime.code === situation.regimeCode) ?? null;
  const regimeStack = resolveRegimeStack(selectedRegime, regimes);
  const kind = deriveContractKindFromRegime(selectedRegime);
  const annualBase = kind === 'collectif' ? situation.salaireBrutAnnuel : situation.revenuImposable;
  const referenceAnnual = kind === 'collectif' ? situation.salaireNetImposable : annualBase;
  const maintienLegal =
    maintien.find((item) => item.code === PREVOYANCE_MAINTIEN_LEGAL_CODE) ?? null;
  const visibleContracts = contracts.filter((contract) => contract.kind === kind);
  const hasBirthDate = Boolean(situation.birthDate);
  const synthesisReady = hasBirthDate && Boolean(selectedRegime);
  const pageUX = usePrevoyancePageUXContract({ synthesisReady });
  const hasConjoint = ['couple', 'marie', 'pacs'].includes(situation.familyStatus);
  const hasChildren = situation.childrenCount > 0;
  const sidebarContracts =
    contractAggregationMode === 'compare' ? visibleContracts.slice(0, 1) : visibleContracts;
  const fraisGenerauxAssiette = Object.values(fraisGenerauxEstimate).reduce(
    (sum, amount) => sum + amount,
    0,
  );
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
    fraisGenerauxAssiette,
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
      if (persisted.fraisGenerauxEstimate) {
        setFraisGenerauxEstimate(persisted.fraisGenerauxEstimate);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (regimes.length === 0) return;
    if (regimes.some((regime) => regime.code === situation.regimeCode)) return;
    const defaultRegime = resolveDefaultRegime(regimes);
    if (defaultRegime) {
      setSituation((prev) => ({ ...prev, regimeCode: defaultRegime.code }));
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
        JSON.stringify({
          situation,
          contracts,
          contractAggregationMode,
          deathTarget,
          fraisGenerauxEstimate,
        }),
      );
    } catch {
      // ignore
    }
  }, [contractAggregationMode, contracts, deathTarget, fraisGenerauxEstimate, hydrated, situation]);

  useEffect(() => {
    const off = onResetEvent(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'prevoyance') return;
      const defaultRegime = resolveDefaultRegime(regimes);
      setSituation({ ...DEFAULT_SITUATION, regimeCode: defaultRegime?.code ?? '' });
      setContracts([
        createDefaultContract(deriveContractKindFromRegime(defaultRegime), 1, annualBase),
      ]);
      setContractAggregationMode('compare');
      setDeathTarget(DEFAULT_DEATH_TARGET);
      setFraisGenerauxEstimate(DEFAULT_FRAIS_GENERAUX_ESTIMATE);
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

  const openFraisModal = () => {
    setFraisModalOpen(true);
  };

  return (
    <>
      <SimPageShell
        title="Prévoyance"
        subtitle="Protection arrêt de travail, invalidité, décès et frais généraux."
        loading={loading}
        loadingContent={
          <div className="premium-card sim-state-card">Chargement des régimes...</div>
        }
        pageClassName="prevoyance-page"
        pageTestId="prevoyance-page"
        actions={
          <>
            <ModeToggle
              value
              disabled
              disabledReason="Mode expert affiché comme repère : le parcours simplifié reste à définir."
            />
            <ExportMenu options={exportOptions} loading={exportLoading} />
          </>
        }
        nav={pageUX.stepperSteps ? <SimPageStepper steps={pageUX.stepperSteps} /> : undefined}
      >
        <SimPageShell.Main>
          <div id="prevoyance-situation" data-sim-step-id="prevoyance-situation">
            <SituationBlock
              situation={situation}
              regimes={regimes}
              kind={kind}
              onChange={updateSituation}
            />
          </div>

          {synthesisReady ? (
            <div id="prevoyance-garanties" data-sim-step-id="prevoyance-garanties">
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
            </div>
          ) : null}

          <SimViewSynthesisCTA
            ready={synthesisReady}
            targetId={pageUX.synthesisTargetId ?? 'prevoyance-synthese'}
            variant="floating"
            hint="Régime obligatoire, garanties souscrites et besoin décès."
          />
        </SimPageShell.Main>

        <SimPageShell.Side>
          {synthesisReady ? (
            <div
              id="prevoyance-synthese"
              className="sim-sidebar-reveal"
              data-sim-step-id="prevoyance-synthese"
            >
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
                fraisGenerauxAssiette={fraisGenerauxAssiette}
              />
            </div>
          ) : (
            <SimEmptyState
              variant="sidebar"
              illustration="docs"
              title="Synthèse en attente"
              description="Renseignez le régime et la date de naissance pour afficher la synthèse de garanties."
              cta={
                <span>La couverture arrêt, invalidité, décès et cotisation apparaîtra ici.</span>
              }
            />
          )}
        </SimPageShell.Side>

        <SimPageShell.Section>
          <div id="prevoyance-hypotheses" data-sim-step-id="prevoyance-hypotheses">
            <PrevoyanceHypotheses />
          </div>
        </SimPageShell.Section>
      </SimPageShell>

      {fraisModalOpen ? (
        <FraisProModal
          state={fraisGenerauxEstimate}
          onClose={() => setFraisModalOpen(false)}
          onValidate={() => setFraisModalOpen(false)}
          onChange={(patch) => setFraisGenerauxEstimate((prev) => ({ ...prev, ...patch }))}
        />
      ) : null}
    </>
  );
}
