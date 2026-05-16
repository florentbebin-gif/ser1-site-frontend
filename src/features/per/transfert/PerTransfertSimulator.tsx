import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ExportMenu } from '@/components/ExportMenu';
import { ModeToggle } from '@/components/ModeToggle';
import { SimFieldShell, SimInfoButton, SimPageShell } from '@/components/ui/sim';
import type { SimSelectOption } from '@/components/ui/sim';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { useUserMode } from '@/settings/userMode';
import { ExpertOnly, resolveEffectiveUserMode } from '@/settings/userModeDisplay';
import { useTheme } from '@/settings/ThemeProvider';
import type { BaseCgRetraiteContractType } from '@/data/basecg';
import { usePerTransfertSimulator } from './hooks/usePerTransfertSimulator';
import { usePerTransfertExportHandlers } from './hooks/usePerTransfertExportHandlers';
import {
  PerTransfertIntegerField,
  PerTransfertMoneyField,
  PerTransfertRateField,
  PerTransfertSelectField,
} from './components/PerTransfertFields';
import { PerTransfertWizardSteps } from './components/PerTransfertWizardSteps';
import type { WizardStep } from './components/PerTransfertWizardSteps';
import { PerTransfertPivotTable } from './components/PerTransfertPivotTable';
import { PerTransfertCapitalScheduleTable } from './components/PerTransfertCapitalScheduleTable';
import { PerTransfertSummaryPanel } from './components/PerTransfertSummaryPanel';
import { ContractAuditCards } from './components/ContractAuditCards';
import { PerTransfertCurrentRentModal } from './components/PerTransfertCurrentRentModal';
import { PerTransfertFraisInfoModal } from './components/PerTransfertFraisInfoModal';
import { PerTransfertHypotheses } from './components/PerTransfertHypotheses';
import { RentRevaluationInfoModal } from './components/RentRevaluationInfoModal';
import '@/styles/sim/index.css';
import './styles/index.css';

const CONTRACT_TYPE_LABELS: Record<BaseCgRetraiteContractType, string> = {
  PERIN: 'PER individuel',
  PERP: 'PERP',
  MADELIN: 'Madelin',
  ARTICLE83: 'Article 83',
  PERCO: 'PERCO',
  PER_POINTS: 'Contrat en points',
  AUTRE: 'Autre',
};

const SEX_OPTIONS: SimSelectOption[] = [
  { value: 'M', label: 'Homme' },
  { value: 'F', label: 'Femme' },
];

const formatPercent = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function percent(value: number): string {
  return formatPercent.format(Number.isFinite(value) ? value : 0);
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="per-transfert-field-grid">{children}</div>;
}

function FieldLabel({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <span className="per-transfert-field-label">
      <span>{text}</span>
      {children}
    </span>
  );
}

function ConversionRateBadge({ value }: { value: number }) {
  return (
    <span className="per-transfert-taux-inline">
      <span>Taux conversion</span>
      <strong>{percent(value)}</strong>
    </span>
  );
}

function Panel({
  title,
  subtitle,
  headerActions,
  collapsible = false,
  expanded = true,
  onToggleExpand,
  children,
}: {
  title: string;
  subtitle: string;
  headerActions?: ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="premium-card premium-card--guide sim-card--guide per-transfert-panel">
      <div className="sim-card__header--bleed per-transfert-panel__header">
        <div className="per-transfert-panel__header-row">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {(headerActions || collapsible) ? (
            <div className="per-transfert-panel__actions">
              {headerActions}
              {collapsible ? (
                <button
                  type="button"
                  className="per-transfert-panel__toggle"
                  onClick={onToggleExpand}
                  aria-expanded={expanded}
                  aria-label={expanded ? `Replier ${title}` : `Déplier ${title}`}
                >
                  {expanded ? '−' : '+'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {(!collapsible || expanded) ? (
        <>
          <div className="per-transfert-panel__divider" aria-hidden="true" />
          {children}
        </>
      ) : null}
    </section>
  );
}

function DateField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (_value: string) => void;
  hint?: string;
}) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <input
        className="sim-field__control"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </SimFieldShell>
  );
}

export function PerTransfertSimulator() {
  const { fiscalContext, loading, error } = useFiscalContext({ strict: true });
  const { mode } = useUserMode();
  const [localMode, setLocalMode] = useState<typeof mode | null>(null);
  const effectiveMode = resolveEffectiveUserMode(mode, localMode);
  const isExpert = effectiveMode === 'expert';
  const theme = useTheme();
  const [step, setStep] = useState<WizardStep>('contrat');
  const [rentModalOpen, setRentModalOpen] = useState(false);
  const [feesModalOpen, setFeesModalOpen] = useState(false);
  const [revaluationModalOpen, setRevaluationModalOpen] = useState(false);
  const [auditExpanded, setAuditExpanded] = useState(true);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const simulator = usePerTransfertSimulator(fiscalContext);
  const { state, update, applyContract, catalog, catalogLoading, selectedContract, result, input } = simulator;
  const { exportOptions, exportLoading } = usePerTransfertExportHandlers({
    state,
    result,
    input,
    selectedContract,
    themeColors: theme.pptxColors,
    logoUrl: theme.cabinetLogo,
    logoPlacement: theme.logoPlacement,
  });

  const step1Done = Boolean(state.typeContrat && state.capitalAcquis > 0 && state.renteActuelleAnnuelleBrute > 0);
  const isC3CapitalLocked = result.compartment === 'C3' && !result.smallAnnuityCapitalExitEligible;
  const newPerMortalityLabel = state.sex === 'M' ? 'TGH05 hommes' : 'TGF05 femmes';
  const currentConversionRate = state.capitalAcquis > 0 && state.renteActuelleAnnuelleBrute > 0
    ? state.renteActuelleAnnuelleBrute / state.capitalAcquis
    : null;

  const typeOptions = useMemo<SimSelectOption[]>(() => (
    Array.from(new Set(catalog.map((contract) => contract.typeContrat)))
      .sort()
      .map((type) => ({ value: type, label: CONTRACT_TYPE_LABELS[type] }))
  ), [catalog]);

  const compagnieOptions = useMemo<SimSelectOption[]>(() => (
    Array.from(new Set(
      catalog
        .filter((contract) => contract.typeContrat === state.typeContrat)
        .map((contract) => contract.compagnie),
    ))
      .sort((left, right) => left.localeCompare(right, 'fr-FR'))
      .map((compagnie) => ({ value: compagnie, label: compagnie }))
  ), [catalog, state.typeContrat]);

  const contractOptions = useMemo<SimSelectOption[]>(() => (
    catalog
      .filter((contract) => contract.typeContrat === state.typeContrat)
      .filter((contract) => !state.compagnie || contract.compagnie === state.compagnie)
      .map((contract) => ({
        value: contract.id,
        label: contract.nomContrat,
      }))
  ), [catalog, state.compagnie, state.typeContrat]);

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
      title="Transfert épargne retraite"
      subtitle="Auditer le contrat actuel, simuler le transfert immédiat vers un PER et comparer rente/capital."
      loading={loading || catalogLoading}
      error={error}
      actions={(
        <>
          <ModeToggle value={isExpert} onChange={(next) => setLocalMode(next ? 'expert' : 'simplifie')} />
          <ExportMenu options={exportOptions} loading={exportLoading} />
        </>
      )}
      controls={(
        <PerTransfertWizardSteps
          step={step}
          step1Done={step1Done}
          onStepChange={setStep}
        />
      )}
      pageClassName="per-transfert-page"
      mobileSideFirst
    >
      <SimPageShell.Main>
        {step === 'contrat' ? (
          <>
            <Panel
              title="Référencement"
              subtitle="Choisissez le contrat dans la Base CG, puis contrôlez les informations essentielles."
            >
              <FieldGrid>
                <PerTransfertSelectField
                  label="Type de contrat"
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
                />
              </FieldGrid>
            </Panel>

            <Panel
              title="Audit Base CG"
              subtitle="Grille devoir de conseil issue du référentiel : frais, garanties, options de rente et conditions de sortie."
              headerActions={(
                <Link to="/settings/base-contrat-retraite" className="per-transfert-base-cg-link">
                  Base CG
                </Link>
              )}
              collapsible
              expanded={auditExpanded}
              onToggleExpand={() => setAuditExpanded((current) => !current)}
            >
              <ContractAuditCards contract={selectedContract} />
            </Panel>

            <Panel
              title="Relevé de situation"
              subtitle="Saisissez les éléments du relevé client et les hypothèses si le contrat est conservé."
            >
              <FieldGrid>
                <PerTransfertMoneyField label="Capital acquis" value={state.capitalAcquis} onChange={(value) => update('capitalAcquis', value)} />
                <PerTransfertMoneyField label="Dont intérêts" value={state.interetsAcquis} onChange={(value) => update('interetsAcquis', value)} />
                <PerTransfertMoneyField
                  label={(
                    <FieldLabel text="Rente brute annuelle relevé">
                      {currentConversionRate !== null ? <ConversionRateBadge value={currentConversionRate} /> : null}
                    </FieldLabel>
                  )}
                  ariaLabel="Rente brute annuelle relevé"
                  value={state.renteActuelleAnnuelleBrute}
                  onChange={(value) => update('renteActuelleAnnuelleBrute', value)}
                />
                <DateField label="Date de souscription" value={state.subscriptionDate} onChange={(value) => update('subscriptionDate', value)} hint="Optionnel, utile pour vérifier les frais sortants et garanties anciennes." />
                <PerTransfertMoneyField label="Versement annuel actuel" value={state.annualCurrentPayment} onChange={(value) => update('annualCurrentPayment', value)} hint="Alimente uniquement le scénario Conserver." />
                <PerTransfertRateField label="Performance contrat actuel" value={state.currentContractPerformanceUntilRetirementRate} onChange={(value) => update('currentContractPerformanceUntilRetirementRate', value)} suffix="% / an" />
                <PerTransfertRateField
                  label={(
                    <FieldLabel text="Frais de transfert sortant">
                      <SimInfoButton ariaLabel="Info frais sortants" onClick={() => setFeesModalOpen(true)} />
                    </FieldLabel>
                  )}
                  ariaLabel="Frais de transfert sortant"
                  value={state.transferFeeRate}
                  onChange={(value) => update('transferFeeRate', value)}
                />
                <PerTransfertRateField
                  label={(
                    <FieldLabel text="Revalorisation rente actuelle">
                      <SimInfoButton ariaLabel="Comprendre la revalorisation de la rente actuelle" onClick={() => setRevaluationModalOpen(true)} />
                    </FieldLabel>
                  )}
                  ariaLabel="Revalorisation rente actuelle"
                  value={state.currentRentRevaluationRate}
                  onChange={(value) => update('currentRentRevaluationRate', value)}
                  suffix="% / an"
                />
              </FieldGrid>

              <div className="per-transfert-inline-actions">
                <button type="button" className="per-transfert-secondary-button" onClick={() => setRentModalOpen(true)}>
                  Personnaliser le calcul de rente
                </button>
              </div>

              {state.typeContrat === 'PER_POINTS' ? (
                <div className="per-transfert-points-panel">
                  <PerTransfertIntegerField
                    label="Points acquis"
                    value={state.prefonPoints}
                    onChange={(value) => update('prefonPoints', value)}
                    min={0}
                    hint="Si le relevé indique les points, ils priment sur la conversion du capital."
                  />
                </div>
              ) : null}
            </Panel>

            <Panel
              title="Profil assuré"
              subtitle="Ces données pilotent la fiscalité et les calculs de rente."
            >
              <FieldGrid>
                <PerTransfertSelectField label="Sexe assuré" value={state.sex} onChange={(value) => update('sex', value as 'M' | 'F')} options={SEX_OPTIONS} />
                <PerTransfertIntegerField label="Année de naissance" value={state.birthYear} onChange={(value) => update('birthYear', value)} min={1900} />
                <PerTransfertIntegerField label="Âge actuel" value={state.currentAge} onChange={(value) => update('currentAge', value)} min={0} suffix="ans" />
                <PerTransfertIntegerField label="Âge de liquidation" value={state.liquidationAge} onChange={(value) => update('liquidationAge', value)} min={0} suffix="ans" />
                <PerTransfertRateField label="TMI retraite" value={state.tmiRetraite} onChange={(value) => update('tmiRetraite', value)} />
              </FieldGrid>
            </Panel>
          </>
        ) : (
          <Panel
            title="Nouveau PER"
            subtitle="Hypothèse de transfert immédiat, projection jusqu'à la retraite et sortie principalement en capital."
          >
            <div className="per-transfert-compartiment-callout">
              <div>
                <span>Compartiment cible</span>
                <strong>{result.compartment}</strong>
              </div>
              <p>Table de rente nouveau PER : {newPerMortalityLabel}, appliquée automatiquement selon le sexe.</p>
            </div>

            <FieldGrid>
              <PerTransfertRateField label="Frais d'entrée nouveau PER" value={state.newPerEntryFeeRate} onChange={(value) => update('newPerEntryFeeRate', value)} />
              <PerTransfertRateField label="Performance avant retraite" value={state.performanceUntilRetirementRate} onChange={(value) => update('performanceUntilRetirementRate', value)} suffix="% / an" />
              <PerTransfertRateField label="Revalorisation capital" value={state.capitalExitRevaluationRate} onChange={(value) => update('capitalExitRevaluationRate', value)} suffix="% / an" />
              <PerTransfertRateField
                label={(
                  <FieldLabel text="Revalorisation rente PER">
                    <SimInfoButton ariaLabel="Comprendre la revalorisation de la rente PER" onClick={() => setRevaluationModalOpen(true)} />
                  </FieldLabel>
                )}
                ariaLabel="Revalorisation rente PER"
                value={state.newRentRevaluationRate}
                onChange={(value) => update('newRentRevaluationRate', value)}
                suffix="% / an"
              />
              <PerTransfertIntegerField label="Horizon court" value={state.horizonAgeShort} onChange={(value) => update('horizonAgeShort', value)} suffix="ans" min={state.liquidationAge} />
              <PerTransfertIntegerField label="Horizon long" value={state.horizonAgeLong} onChange={(value) => update('horizonAgeLong', value)} suffix="ans" min={state.liquidationAge} />
            </FieldGrid>

            <section className="per-transfert-capital-choice">
              <h3>Sortie souhaitée</h3>
              {isC3CapitalLocked ? (
                <p>
                  Compartiment C3 : la sortie en capital est neutralisée hors petite rente. Le moteur affecte donc 100 % du capital à la rente.
                </p>
              ) : (
                <PerTransfertRateField
                  label="Part en sortie capital"
                  value={state.capitalShareRate}
                  onChange={(value) => update('capitalShareRate', value)}
                  min={0}
                  max={100}
                />
              )}
            </section>

            <ExpertOnly mode={effectiveMode}>
              <div className="per-transfert-expert-panel">
                <FieldGrid>
                  <PerTransfertRateField label="Taux technique PER" value={state.technicalRate} onChange={(value) => update('technicalRate', value)} />
                  <PerTransfertRateField label="Frais conversion rente PER" value={state.conversionFeeRate} onChange={(value) => update('conversionFeeRate', value)} />
                  <PerTransfertRateField label="Frais arrérages PER" value={state.arrearsFeeRate} onChange={(value) => update('arrearsFeeRate', value)} />
                  <PerTransfertIntegerField label="Annuités garanties PER" value={state.guaranteedYears} onChange={(value) => update('guaranteedYears', value)} min={0} suffix="ans" />
                  <PerTransfertRateField label="Taux de réversion PER" value={state.reversionRate} onChange={(value) => update('reversionRate', value)} />
                  <PerTransfertIntegerField label="Année naissance conjoint" value={state.spouseBirthYear} onChange={(value) => update('spouseBirthYear', value)} min={1900} />
                  <PerTransfertIntegerField label="Âge conjoint liquidation" value={state.spouseAgeAtLiquidation} onChange={(value) => update('spouseAgeAtLiquidation', value)} min={0} suffix="ans" />
                </FieldGrid>
                <label className="per-transfert-checkbox">
                  <input
                    type="checkbox"
                    checked={state.reversionEnabled}
                    onChange={(event) => update('reversionEnabled', event.target.checked)}
                  />
                  Activer la réversion dans le tarif de rente du nouveau PER
                </label>
              </div>
            </ExpertOnly>
          </Panel>
        )}

        <section className="premium-card sim-card--guide per-transfert-comparison-card">
          <div className="per-transfert-comparison-header">
            <h3>Comparaison rente / capital sur {state.horizonAgeShort} et {state.horizonAgeLong} ans</h3>
            <button
              type="button"
              className="per-transfert-detail-toggle"
              onClick={() => setComparisonOpen((current) => !current)}
              aria-expanded={comparisonOpen}
            >
              {comparisonOpen ? 'Masquer' : 'Afficher'}
              <svg
                viewBox="0 0 12 8"
                className={`per-transfert-detail-chevron${comparisonOpen ? ' is-open' : ''}`}
                aria-hidden="true"
              >
                <path d="M1 1l5 5 5-5" stroke="currentColor" fill="none" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
          {comparisonOpen ? (
            <>
              <PerTransfertPivotTable result={result} liquidationAge={state.liquidationAge} />

              <details className="per-transfert-projection-details">
                <summary>Voir la projection capital année par année</summary>
                <PerTransfertCapitalScheduleTable input={input} result={result} />
              </details>
            </>
          ) : null}
        </section>
      </SimPageShell.Main>

      <SimPageShell.Side>
        <PerTransfertSummaryPanel
          result={result}
          capitalShareRatePercent={result.capitalExit.shareRate * 100}
          selectedContract={selectedContract}
          subscriptionDate={state.subscriptionDate}
        />
      </SimPageShell.Side>

      <SimPageShell.Section>
        <PerTransfertHypotheses />
      </SimPageShell.Section>

      </SimPageShell>

      {rentModalOpen ? (
        <PerTransfertCurrentRentModal
          state={state}
          update={update}
          onClose={() => setRentModalOpen(false)}
        />
      ) : null}
      {feesModalOpen ? <PerTransfertFraisInfoModal onClose={() => setFeesModalOpen(false)} /> : null}
      {revaluationModalOpen ? <RentRevaluationInfoModal onClose={() => setRevaluationModalOpen(false)} /> : null}
    </>
  );
}
