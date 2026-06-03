import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ExportMenu } from '@/components/ExportMenu';
import { ModeToggle } from '@/components/ModeToggle';
import { SimActionButton, SimInfoButton, SimPageShell } from '@/components/ui/sim';
import type { SimSelectOption } from '@/components/ui/sim';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { useUserMode } from '@/settings/userMode';
import { resolveEffectiveUserMode } from '@/settings/userModeDisplay';
import { useTheme } from '@/settings/ThemeProvider';
import type { BaseCgRetraiteContractType } from '@/data/base-cg-retraite';
import { isPointsContract, TYPE_LABELS } from '@/data/base-cg-retraite';
import { usePerTransfertSimulator } from './hooks/usePerTransfertSimulator';
import { usePerTransfertExportHandlers } from './hooks/usePerTransfertExportHandlers';
import { usePerTransfertPageUXContract } from './hooks/usePerTransfertPageUXContract';
import {
  PerTransfertIntegerField,
  PerTransfertMoneyField,
  PerTransfertRateField,
  PerTransfertSelectField,
} from './components/PerTransfertFields';
import { PerTransfertWizardSteps } from './components/PerTransfertWizardSteps';
import type { WizardStep } from './components/PerTransfertWizardSteps';
import { ContractAuditCards } from './components/ContractAuditCards';
import { PerTransfertHypotheses } from './components/PerTransfertHypotheses';
import { PerTransfertSidebar } from './components/PerTransfertSidebar';
import type { PerTransfertInfoKind } from './components/PerTransfertInfoModal';
import { PerTransfertNewPerPanel } from './components/PerTransfertNewPerPanel';
import { PerTransfertPrefonPocketsForm } from './components/PerTransfertPrefonPocketsForm';
import { PerTransfertSimulatorModals } from './components/PerTransfertSimulatorModals';
import {
  ConversionRateBadge,
  DateField,
  FieldGrid,
  FieldLabel,
  Panel,
} from './components/PerTransfertLayoutPrimitives';
import '@/styles/sim/index.css';
import './styles/index.css';

const SEX_OPTIONS: SimSelectOption[] = [
  { value: 'M', label: 'Homme' },
  { value: 'F', label: 'Femme' },
];

export function PerTransfertSimulator() {
  const { fiscalContext, loading, error } = useFiscalContext({ strict: true });
  const { mode } = useUserMode();
  const [localMode, setLocalMode] = useState<typeof mode | null>(null);
  const effectiveMode = resolveEffectiveUserMode(mode, localMode);
  const isExpert = effectiveMode === 'expert';
  const theme = useTheme();
  const [step, setStep] = useState<WizardStep>('contrat');
  const [rentModalOpen, setRentModalOpen] = useState(false);
  const [annuitySettingsOpen, setAnnuitySettingsOpen] = useState(false);
  const [feesModalOpen, setFeesModalOpen] = useState(false);
  const [revaluationModalOpen, setRevaluationModalOpen] = useState(false);
  const [auditExpanded, setAuditExpanded] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [transferRulesOpen, setTransferRulesOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<PerTransfertInfoKind | null>(null);
  const [prefonPocketSettingsIndex, setPrefonPocketSettingsIndex] = useState<number | null>(null);

  const simulator = usePerTransfertSimulator(fiscalContext);
  const {
    state,
    update,
    applyContract,
    catalog,
    catalogLoading,
    catalogError,
    selectedContract,
    result,
    input,
  } = simulator;
  const { exportOptions, exportLoading } = usePerTransfertExportHandlers({
    state,
    result,
    input,
    selectedContract,
    themeColors: theme.pptxColors,
    logoUrl: theme.cabinetLogo,
    logoPlacement: theme.logoPlacement,
  });

  const pointContractCapital =
    input.capitalAcquis > 0 || state.prefonPockets.some((pocket) => (pocket.points ?? 0) > 0);
  const pageUX = usePerTransfertPageUXContract({
    selectedContract,
    contractName: selectedContract?.nomContrat ?? state.contractId,
  });
  const step1Done = Boolean(
    state.typeContrat &&
    (state.typeContrat === 'PER_POINTS'
      ? pointContractCapital
      : state.capitalAcquis > 0 && state.renteActuelleAnnuelleBrute > 0),
  );
  const isC3CapitalLocked = result.compartment === 'C3' && !result.smallAnnuityCapitalExitEligible;
  const currentConversionRate =
    input.capitalAcquis > 0 && state.renteActuelleAnnuelleBrute > 0
      ? state.renteActuelleAnnuelleBrute / input.capitalAcquis
      : null;
  const contractDetailsOpen = Boolean(selectedContract || manualEntryOpen);

  const typeOptions = useMemo<SimSelectOption[]>(
    () =>
      (Object.keys(TYPE_LABELS) as BaseCgRetraiteContractType[]).map((type) => ({
        value: type,
        label: TYPE_LABELS[type],
      })),
    [],
  );

  const tmiOptions = useMemo<SimSelectOption[]>(
    () =>
      fiscalContext.irScaleCurrent.map((bracket) => ({
        value: String(bracket.rate),
        label: `${bracket.rate.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} %`,
      })),
    [fiscalContext.irScaleCurrent],
  );

  // Quand "Contrat en points" est sélectionné, on élargit aux contrats détectés en points
  // via leur ligne "Rendement fonds €" (Système par points, NC\nPoints, Préfon, etc.).
  // Le moteur ne calcule la rente Préfon que pour les contrats dotés de `pointsParams` ;
  // les autres remontent un warning dans `result.warnings` (cf. compute.ts).
  const matchesSelectedType = useMemo(
    () => (contract: (typeof catalog)[number]) => {
      if (state.typeContrat === 'PER_POINTS') return isPointsContract(contract);
      return contract.typeContrat === state.typeContrat;
    },
    [state.typeContrat],
  );

  const compagnieOptions = useMemo<SimSelectOption[]>(
    () =>
      Array.from(new Set(catalog.filter(matchesSelectedType).map((contract) => contract.compagnie)))
        .sort((left, right) => left.localeCompare(right, 'fr-FR'))
        .map((compagnie) => ({ value: compagnie, label: compagnie })),
    [catalog, matchesSelectedType],
  );

  const contractOptions = useMemo<SimSelectOption[]>(
    () =>
      catalog
        .filter(matchesSelectedType)
        .filter((contract) => !state.compagnie || contract.compagnie === state.compagnie)
        .map((contract) => ({
          value: contract.id,
          label: contract.nomContrat,
        })),
    [catalog, matchesSelectedType, state.compagnie],
  );

  const handleTypeChange = (value: string) => {
    update('typeContrat', value as BaseCgRetraiteContractType);
    update('compagnie', '');
    update('contractId', '');
  };

  const handleCompagnieChange = (value: string) => {
    update('compagnie', value);
    update('contractId', '');
  };
  return (
    <>
      <SimPageShell
        title="PER — Transfert"
        subtitle="Auditer le contrat actuel, simuler le transfert immédiat vers un PER et comparer rente/capital."
        pageTestId="per-transfert-page"
        loading={loading || catalogLoading}
        error={error}
        actions={
          <>
            <ModeToggle
              value={isExpert}
              onChange={(next) => setLocalMode(next ? 'expert' : 'simplifie')}
            />
            <ExportMenu options={exportOptions} loading={exportLoading} />
          </>
        }
        controls={
          <PerTransfertWizardSteps step={step} step1Done={step1Done} onStepChange={setStep} />
        }
        pageClassName="per-transfert-page"
        auditTrailReady={pageUX.synthesisReady}
      >
        <SimPageShell.Main>
          {step === 'contrat' ? (
            <>
              <Panel
                title="Référencement"
                subtitle="Choisissez le contrat dans la Base CG, puis contrôlez les informations essentielles."
              >
                {catalogError ? (
                  <p role="alert" className="per-transfert-audit-disclaimer">
                    Catalogue Base CG retraite indisponible : {catalogError}
                  </p>
                ) : null}
                <FieldGrid>
                  <PerTransfertSelectField
                    label={
                      <FieldLabel text="Type de contrat">
                        <SimInfoButton
                          ariaLabel="Règles de transfert vers un PER individuel"
                          onClick={() => setTransferRulesOpen(true)}
                        />
                      </FieldLabel>
                    }
                    value={state.typeContrat}
                    onChange={handleTypeChange}
                    options={typeOptions}
                  />
                  <PerTransfertSelectField
                    label="Compagnie"
                    value={state.compagnie}
                    onChange={handleCompagnieChange}
                    options={compagnieOptions}
                    placeholder="Sélectionner"
                  />
                  <PerTransfertSelectField
                    label="Nom du contrat"
                    value={state.contractId}
                    onChange={applyContract}
                    options={contractOptions}
                    placeholder="Sélectionner"
                    clearable
                  />
                </FieldGrid>
                {!contractDetailsOpen ? (
                  <div className="per-transfert-inline-actions">
                    <SimActionButton
                      variant="edit"
                      mode="text"
                      label="Saisie manuelle"
                      onClick={() => setManualEntryOpen(true)}
                    />
                  </div>
                ) : null}
              </Panel>

              {selectedContract ? (
                <Panel
                  title="Audit Base CG"
                  subtitle="Grille indicative d’aide au devoir de conseil : frais, garanties, options de rente et conditions de sortie."
                  headerActions={
                    <Link
                      to="/settings/base-contrat-retraite"
                      className="per-transfert-base-cg-link"
                    >
                      Base CG
                    </Link>
                  }
                  collapsible
                  expanded={auditExpanded}
                  onToggleExpand={() => setAuditExpanded((current) => !current)}
                >
                  <p className="per-transfert-audit-disclaimer">
                    Base CG indicative : aide interne au devoir de conseil, sans validation
                    assureur. Vérifier auprès de la compagnie les Conditions Générales, notices et
                    avenants officiels applicables avant recommandation.
                  </p>
                  <ContractAuditCards contract={selectedContract} />
                </Panel>
              ) : null}

              {contractDetailsOpen ? (
                <>
                  <Panel
                    title="Relevé de situation"
                    subtitle="Saisissez les éléments du relevé client et les hypothèses si le contrat est conservé."
                  >
                    <FieldGrid>
                      {state.typeContrat !== 'PER_POINTS' ? (
                        <PerTransfertMoneyField
                          label="Capital acquis"
                          value={state.capitalAcquis}
                          onChange={(value) => update('capitalAcquis', value)}
                        />
                      ) : null}
                      {state.typeContrat !== 'PER_POINTS' ? (
                        <>
                          <PerTransfertMoneyField
                            label={
                              <FieldLabel text="Dont intérêts">
                                <SimInfoButton
                                  ariaLabel="Informations sur la quote-part d’intérêts"
                                  onClick={() => setInfoModal('interestsQuotePart')}
                                />
                              </FieldLabel>
                            }
                            ariaLabel="Dont intérêts"
                            value={state.interetsAcquis}
                            onChange={(value) => update('interetsAcquis', value)}
                          />
                          <PerTransfertMoneyField
                            label={
                              <FieldLabel text="Rente brute annuelle relevé">
                                {currentConversionRate !== null ? (
                                  <ConversionRateBadge value={currentConversionRate} />
                                ) : null}
                              </FieldLabel>
                            }
                            ariaLabel="Rente brute annuelle relevé"
                            value={state.renteActuelleAnnuelleBrute}
                            onChange={(value) => update('renteActuelleAnnuelleBrute', value)}
                          />
                          <DateField
                            label={
                              <FieldLabel text="Date de souscription">
                                <SimInfoButton
                                  ariaLabel="Informations sur la date de souscription"
                                  onClick={() => setInfoModal('subscriptionDate')}
                                />
                              </FieldLabel>
                            }
                            value={state.subscriptionDate}
                            onChange={(value) => update('subscriptionDate', value)}
                          />
                          <PerTransfertMoneyField
                            label={
                              <FieldLabel text="Versement annuel actuel">
                                <SimInfoButton
                                  ariaLabel="Informations sur le versement annuel actuel"
                                  onClick={() => setInfoModal('annualPayment')}
                                />
                              </FieldLabel>
                            }
                            ariaLabel="Versement annuel actuel"
                            value={state.annualCurrentPayment}
                            onChange={(value) => update('annualCurrentPayment', value)}
                          />
                          <PerTransfertRateField
                            label="Performance contrat actuel"
                            value={state.currentContractPerformanceUntilRetirementRate}
                            onChange={(value) =>
                              update('currentContractPerformanceUntilRetirementRate', value)
                            }
                            suffix="% / an"
                          />
                          <PerTransfertRateField
                            label={
                              <FieldLabel text="Frais de transfert sortant">
                                <SimInfoButton
                                  ariaLabel="Info frais sortants"
                                  onClick={() => setFeesModalOpen(true)}
                                />
                              </FieldLabel>
                            }
                            ariaLabel="Frais de transfert sortant"
                            value={state.transferFeeRate}
                            onChange={(value) => update('transferFeeRate', value)}
                          />
                          <PerTransfertRateField
                            label={
                              <FieldLabel text="Revalorisation rente actuelle">
                                <SimInfoButton
                                  ariaLabel="Comprendre la revalorisation de la rente actuelle"
                                  onClick={() => setRevaluationModalOpen(true)}
                                />
                              </FieldLabel>
                            }
                            ariaLabel="Revalorisation rente actuelle"
                            value={state.currentRentRevaluationRate}
                            onChange={(value) => update('currentRentRevaluationRate', value)}
                            suffix="% / an"
                          />
                        </>
                      ) : null}
                    </FieldGrid>

                    {state.typeContrat !== 'PER_POINTS' ? (
                      <div className="per-transfert-inline-actions">
                        <SimActionButton
                          variant="edit"
                          mode="text"
                          label="Personnaliser le calcul de rente"
                          onClick={() => setRentModalOpen(true)}
                        />
                      </div>
                    ) : null}

                    {state.typeContrat === 'PER_POINTS' ? (
                      <PerTransfertPrefonPocketsForm
                        pockets={state.prefonPockets}
                        onChange={(pockets) => update('prefonPockets', pockets)}
                        onOpenInfo={() => setInfoModal('prefonValues')}
                        onOpenPocketSettings={setPrefonPocketSettingsIndex}
                      />
                    ) : null}
                  </Panel>

                  <Panel
                    title="Profil assuré"
                    subtitle="Ces données pilotent la fiscalité et les calculs de rente."
                  >
                    <FieldGrid>
                      <PerTransfertSelectField
                        label="Sexe assuré"
                        value={state.sex}
                        onChange={(value) => update('sex', value as 'M' | 'F')}
                        options={SEX_OPTIONS}
                      />
                      <PerTransfertIntegerField
                        label="Année de naissance"
                        value={state.birthYear}
                        onChange={(value) => update('birthYear', value)}
                        min={1900}
                      />
                      <PerTransfertIntegerField
                        label="Âge actuel"
                        value={state.currentAge}
                        onChange={(value) => update('currentAge', value)}
                        min={0}
                        suffix="ans"
                      />
                      <PerTransfertIntegerField
                        label="Âge de liquidation"
                        value={state.liquidationAge}
                        onChange={(value) => update('liquidationAge', value)}
                        min={0}
                        suffix="ans"
                      />
                      <PerTransfertSelectField
                        label="TMI retraite"
                        value={String(state.tmiRetraite)}
                        onChange={(value) => update('tmiRetraite', Number(value))}
                        options={tmiOptions}
                      />
                    </FieldGrid>
                  </Panel>
                </>
              ) : null}
            </>
          ) : (
            <PerTransfertNewPerPanel
              state={state}
              update={update}
              isC3CapitalLocked={isC3CapitalLocked}
              onOpenAnnuitySettings={() => setAnnuitySettingsOpen(true)}
            />
          )}
        </SimPageShell.Main>

        <SimPageShell.Side>
          <PerTransfertSidebar
            result={result}
            selectedContract={selectedContract}
            typeContrat={state.typeContrat}
            subscriptionDate={state.subscriptionDate}
            step2Done={step === 'newper'}
            contractReady={pageUX.synthesisReady}
            horizonAgeShort={state.horizonAgeShort}
            horizonAgeLong={state.horizonAgeLong}
            onHorizonChange={(short, long) => {
              update('horizonAgeShort', short);
              update('horizonAgeLong', long);
            }}
            onOpenQuotientInfo={() => setInfoModal('quotient')}
            onOpenFractionalInfo={() => setInfoModal('fractionalCapital')}
          />
        </SimPageShell.Side>

        {pageUX.synthesisReady && (
          <SimPageShell.Section>
            <div id="per-transfert-hypotheses" data-sim-step-id="per-transfert-hypotheses">
              <PerTransfertHypotheses />
            </div>
          </SimPageShell.Section>
        )}
      </SimPageShell>

      <PerTransfertSimulatorModals
        state={state}
        update={update}
        rentModalOpen={rentModalOpen}
        setRentModalOpen={setRentModalOpen}
        feesModalOpen={feesModalOpen}
        setFeesModalOpen={setFeesModalOpen}
        revaluationModalOpen={revaluationModalOpen}
        setRevaluationModalOpen={setRevaluationModalOpen}
        annuitySettingsOpen={annuitySettingsOpen}
        setAnnuitySettingsOpen={setAnnuitySettingsOpen}
        transferRulesOpen={transferRulesOpen}
        setTransferRulesOpen={setTransferRulesOpen}
        infoModal={infoModal}
        setInfoModal={setInfoModal}
        prefonPocketSettingsIndex={prefonPocketSettingsIndex}
        setPrefonPocketSettingsIndex={setPrefonPocketSettingsIndex}
      />
    </>
  );
}
