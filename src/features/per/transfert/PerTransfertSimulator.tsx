import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ExportMenu } from '@/components/ExportMenu';
import { ModeToggle } from '@/components/ModeToggle';
import { SimPageShell } from '@/components/ui/sim';
import type { SimSelectOption } from '@/components/ui/sim';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { useUserMode } from '@/settings/userMode';
import { resolveEffectiveUserMode, ExpertOnly } from '@/settings/userModeDisplay';
import { useTheme } from '@/settings/ThemeProvider';
import type { BaseCgRetraiteContractType } from '@/data/basecg';
import { usePerTransfertSimulator } from './hooks/usePerTransfertSimulator';
import { usePerTransfertExportHandlers } from './hooks/usePerTransfertExportHandlers';
import {
  PerTransfertNumberField,
  PerTransfertSelectField,
} from './components/PerTransfertFields';
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

const MORTALITY_OPTIONS: SimSelectOption[] = [
  { value: 'TGH05', label: 'TGH05 hommes' },
  { value: 'TGF05', label: 'TGF05 femmes' },
  { value: 'TPRV93', label: 'TPRV93 ancienne table' },
  { value: 'TPG93', label: 'TPG93 générationnelle' },
];

const formatEuro = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const formatPercent = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function euro(value: number): string {
  return formatEuro.format(Math.round(Number.isFinite(value) ? value : 0));
}

function percent(value: number): string {
  return formatPercent.format(Number.isFinite(value) ? value : 0);
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="per-transfert-field-grid">{children}</div>;
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="sim-card per-transfert-panel">
      <div className="per-transfert-panel__header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'accent' | 'muted' }) {
  return (
    <div className={`per-transfert-kpi${tone ? ` per-transfert-kpi--${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function PerTransfertSimulator() {
  const { fiscalContext, loading, error } = useFiscalContext({ strict: true });
  const { mode } = useUserMode();
  const [localMode, setLocalMode] = useState<typeof mode | null>(null);
  const effectiveMode = resolveEffectiveUserMode(mode, localMode);
  const isExpert = effectiveMode === 'expert';
  const theme = useTheme();

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
        description: contract.sourceId,
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
    <SimPageShell
      title="Transfert épargne retraite"
      subtitle="Analyse devoir de conseil, projection du nouveau PER et comparaison rente/capital."
      loading={loading || catalogLoading}
      error={error}
      actions={(
        <>
          <ModeToggle value={isExpert} onChange={(next) => setLocalMode(next ? 'expert' : 'simplifie')} />
          <ExportMenu options={exportOptions} loading={exportLoading} />
        </>
      )}
      notice={(
        <div className="per-transfert-notice">
          <span>Base CG locale enrichissable en v1.</span>
          <Link to="/settings/base-contrat-retraite">Mettre à jour le référentiel</Link>
        </div>
      )}
      pageClassName="per-transfert-page"
      mobileSideFirst
    >
      <SimPageShell.Main>
        <Panel
          title="Contrat à transférer"
          subtitle="Le parcours reprend le triptyque Excel : type, compagnie, nom du contrat."
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

          {selectedContract ? (
            <div className="per-transfert-contract-grid">
              <div>
                <span>Phase épargne</span>
                <strong>{selectedContract.phaseEpargne.dateCommercialisation ?? 'Non renseigné'}</strong>
                <p>{selectedContract.phaseEpargne.fraisGestion ?? 'Frais de gestion non renseignés'}</p>
              </div>
              <div>
                <span>Phase liquidation</span>
                <strong>{selectedContract.phaseLiquidation.tableConversionRente ?? 'Table non renseignée'}</strong>
                <p>{selectedContract.phaseLiquidation.reversionPossible ?? 'Réversion à compléter'}</p>
              </div>
            </div>
          ) : (
            <div className="per-transfert-empty-analysis">
              Aucun contrat Base CG sélectionné : la grille reste éditable avec les hypothèses ci-dessous.
            </div>
          )}
        </Panel>

        <Panel
          title="Données du relevé client"
          subtitle="Capital acquis, intérêts et rente indiquée sur le relevé déterminent le taux de rente actuel."
        >
          <FieldGrid>
            <PerTransfertNumberField label="Capital acquis" value={state.capitalAcquis} onChange={(value) => update('capitalAcquis', value)} suffix="€" min={0} />
            <PerTransfertNumberField label="Dont intérêts" value={state.interetsAcquis} onChange={(value) => update('interetsAcquis', value)} suffix="€" min={0} />
            <PerTransfertNumberField label="Rente brute annuelle relevé" value={state.renteActuelleAnnuelleBrute} onChange={(value) => update('renteActuelleAnnuelleBrute', value)} suffix="€" min={0} />
            <PerTransfertSelectField label="Sexe assuré" value={state.sex} onChange={(value) => update('sex', value as 'M' | 'F')} options={SEX_OPTIONS} />
            <PerTransfertNumberField label="Année de naissance" value={state.birthYear} onChange={(value) => update('birthYear', value)} min={1900} step={1} />
            <PerTransfertNumberField label="Âge actuel" value={state.currentAge} onChange={(value) => update('currentAge', value)} min={0} step={1} />
            <PerTransfertNumberField label="Âge de liquidation" value={state.liquidationAge} onChange={(value) => update('liquidationAge', value)} min={0} step={1} />
            <PerTransfertNumberField label="TMI retraite" value={state.tmiRetraite} onChange={(value) => update('tmiRetraite', value)} suffix="%" min={0} step={0.1} />
          </FieldGrid>

          {state.typeContrat === 'PER_POINTS' ? (
            <div className="per-transfert-points-panel">
              <PerTransfertNumberField
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
          title="Nouveau PER"
          subtitle="Affectation automatique du compartiment, frais, performance et liquidation."
        >
          <FieldGrid>
            <PerTransfertNumberField label="Frais de transfert sortant" value={state.transferFeeRate} onChange={(value) => update('transferFeeRate', value)} suffix="%" min={0} step={0.1} />
            <PerTransfertNumberField label="Performance avant retraite" value={state.performanceUntilRetirementRate} onChange={(value) => update('performanceUntilRetirementRate', value)} suffix="% / an" step={0.1} />
            <PerTransfertNumberField label="Part en sortie capital" value={state.capitalShareRate} onChange={(value) => update('capitalShareRate', value)} suffix="%" min={0} max={100} step={1} />
            <PerTransfertNumberField label="Revalorisation capital" value={state.capitalExitRevaluationRate} onChange={(value) => update('capitalExitRevaluationRate', value)} suffix="% / an" step={0.1} />
            <PerTransfertNumberField label="Revalorisation rente actuelle" value={state.currentRentRevaluationRate} onChange={(value) => update('currentRentRevaluationRate', value)} suffix="% / an" step={0.1} />
            <PerTransfertNumberField label="Revalorisation rente PER" value={state.newRentRevaluationRate} onChange={(value) => update('newRentRevaluationRate', value)} suffix="% / an" step={0.1} />
            <PerTransfertNumberField label="Horizon court" value={state.horizonAgeShort} onChange={(value) => update('horizonAgeShort', value)} suffix="ans" min={0} step={1} />
            <PerTransfertNumberField label="Horizon long" value={state.horizonAgeLong} onChange={(value) => update('horizonAgeLong', value)} suffix="ans" min={0} step={1} />
          </FieldGrid>

          <ExpertOnly mode={effectiveMode}>
            <div className="per-transfert-expert-panel">
              <FieldGrid>
                <PerTransfertSelectField label="Table mortalité" value={state.mortalityTable} onChange={(value) => update('mortalityTable', value as typeof state.mortalityTable)} options={MORTALITY_OPTIONS} />
                <PerTransfertNumberField label="Taux technique" value={state.technicalRate} onChange={(value) => update('technicalRate', value)} suffix="%" step={0.1} />
                <PerTransfertNumberField label="Frais conversion rente" value={state.conversionFeeRate} onChange={(value) => update('conversionFeeRate', value)} suffix="%" min={0} step={0.1} />
                <PerTransfertNumberField label="Frais arrérages" value={state.arrearsFeeRate} onChange={(value) => update('arrearsFeeRate', value)} suffix="%" min={0} step={0.1} />
                <PerTransfertNumberField label="Annuités garanties" value={state.guaranteedYears} onChange={(value) => update('guaranteedYears', value)} suffix="ans" min={0} step={1} />
                <PerTransfertNumberField label="Taux de réversion" value={state.reversionRate} onChange={(value) => update('reversionRate', value)} suffix="%" min={0} max={100} step={1} />
                <PerTransfertNumberField label="Année naissance conjoint" value={state.spouseBirthYear} onChange={(value) => update('spouseBirthYear', value)} min={1900} step={1} />
                <PerTransfertNumberField label="Âge conjoint liquidation" value={state.spouseAgeAtLiquidation} onChange={(value) => update('spouseAgeAtLiquidation', value)} min={0} step={1} />
              </FieldGrid>
              <label className="per-transfert-checkbox">
                <input
                  type="checkbox"
                  checked={state.reversionEnabled}
                  onChange={(event) => update('reversionEnabled', event.target.checked)}
                />
                Activer la réversion dans le tarif de rente
              </label>
            </div>
          </ExpertOnly>
        </Panel>
      </SimPageShell.Main>

      <SimPageShell.Side>
        <div className="per-transfert-side-stack">
          <section className="sim-card per-transfert-summary-card">
            <h3>Synthèse</h3>
            <Kpi label="Compartiment PER" value={result.compartment} tone="accent" />
            <Kpi label="Taux rente actuel" value={percent(result.currentConversionRate)} />
            <Kpi label="Capital net transféré" value={euro(result.capitalAfterTransfer)} />
            <Kpi label="Capital à la retraite" value={euro(result.capitalAtLiquidation)} />
          </section>

          <section className="sim-card per-transfert-summary-card">
            <h3>Comparaison rente</h3>
            <Kpi label="Rente actuelle nette estimée" value={euro(result.currentRent.netAnnualRent)} />
            <Kpi label="Rente nouveau PER nette" value={euro(result.newPerFiscal.netAnnualRent)} tone="accent" />
            <Kpi label="Rente mensuelle PER" value={euro(result.newPerRent.monthlyRent)} />
            <Kpi label="Petite rente" value={result.smallAnnuityCapitalExitEligible ? 'Eligible' : 'Non'} tone="muted" />
          </section>

          <section className="sim-card per-transfert-summary-card">
            <h3>Sortie capital</h3>
            <Kpi label="Capital unique net" value={euro(result.capitalExit.unique.netIRPS)} />
            <Kpi label={`Cumul net à ${result.capitalExit.shortHorizon.horizonAge} ans`} value={euro(result.capitalExit.shortHorizon.cumulativeNetWithdrawals)} />
            <Kpi label={`Cumul net à ${result.capitalExit.longHorizon.horizonAge} ans`} value={euro(result.capitalExit.longHorizon.cumulativeNetWithdrawals)} />
            <Kpi label={`Sans retrait à ${result.capitalExit.longHorizon.horizonAge} ans`} value={euro(result.capitalExit.withoutWithdrawalToLongHorizon)} />
          </section>

          {result.warnings.length > 0 ? (
            <section className="sim-card per-transfert-warning-card">
              <h3>Points de vigilance</h3>
              <ul>
                {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </section>
          ) : null}
        </div>
      </SimPageShell.Side>
    </SimPageShell>
  );
}
