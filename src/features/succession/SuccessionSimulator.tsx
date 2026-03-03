/**
 * SuccessionSimulator — Simulateur Succession
 *
 * PR1 scope:
 * - Alignement UI sur la norme /sim/* (shell, grille, sticky, accordéons)
 * - Aucun changement de formule métier
 */

import React, { useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useSuccessionCalc } from './useSuccessionCalc';
import { exportSuccessionPptx } from '../../pptx/exports/successionExport';
import {
  exportAndDownloadSuccessionXlsx,
  type SuccessionExportContext,
} from './successionXlsx';
import { useTheme } from '../../settings/ThemeProvider';
import { SessionGuardContext } from '../../App';
import { useFiscalContext } from '../../hooks/useFiscalContext';
import { ExportMenu } from '../../components/ExportMenu';
import { REGIMES_MATRIMONIAUX } from '../../engine/civil';
import { onResetEvent, storageKeyFor } from '../../utils/reset';
import type { LienParente } from '../../engine/succession';
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
  type SituationMatrimoniale,
} from './successionDraft';
import { buildSuccessionDevolutionAnalysis } from './successionDevolution';
import { buildSuccessionFiscalSnapshot } from './successionFiscalContext';
import { buildSuccessionPatrimonialAnalysis } from './successionPatrimonial';
import { buildSuccessionPredecesAnalysis } from './successionPredeces';
import '../../components/simulator/SimulatorShell.css';
import '../../styles/premium-shared.css';
import './Succession.css';

const STORE_KEY = storageKeyFor('succession');

const LIEN_OPTIONS: { value: LienParente; label: string }[] = [
  { value: 'conjoint', label: 'Conjoint' },
  { value: 'enfant', label: 'Enfant' },
  { value: 'petit_enfant', label: 'Petit-enfant' },
  { value: 'frere_soeur', label: 'Frère / Sœur' },
  { value: 'neveu_niece', label: 'Neveu / Nièce' },
  { value: 'autre', label: 'Autre' },
];

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' %';

const SITUATION_OPTIONS: { value: SituationMatrimoniale; label: string }[] = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'pacse', label: 'Pacsé(e)' },
  { value: 'concubinage', label: 'Union libre (concubinage)' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf / veuve' },
];

const PACS_CONVENTION_LABELS: Record<'separation' | 'indivision', string> = {
  separation: 'Séparation de biens',
  indivision: 'Indivision conventionnelle',
};

function dedupeWarnings(warnings: string[]): string[] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = warning.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function SuccessionSimulator() {
  const { loading: settingsLoading, fiscalContext } = useFiscalContext({ strict: true });
  const fiscalSnapshot = useMemo(
    () => buildSuccessionFiscalSnapshot(fiscalContext),
    [fiscalContext],
  );
  const {
    form, persistedForm, result, setActifNet, addHeritier, removeHeritier,
    updateHeritier, hydrateForm, distributeEqually, compute, reset, hasResult,
  } = useSuccessionCalc({ dmtgSettings: fiscalSnapshot.dmtgSettings });

  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const { sessionExpired, canExport } = useContext(SessionGuardContext);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [hypothesesOpen, setHypothesesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [civilContext, setCivilContext] = useState(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
  const [liquidationContext, setLiquidationContext] = useState(DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT);
  const [devolutionContext, setDevolutionContext] = useState(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
  const [patrimonialContext, setPatrimonialContext] = useState(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);

  const predecesAnalysis = useMemo(
    () => buildSuccessionPredecesAnalysis(civilContext, liquidationContext, fiscalSnapshot.dmtgSettings),
    [civilContext, liquidationContext, fiscalSnapshot.dmtgSettings],
  );
  const devolutionAnalysis = useMemo(
    () => buildSuccessionDevolutionAnalysis(civilContext, liquidationContext.nbEnfants, devolutionContext),
    [civilContext, liquidationContext.nbEnfants, devolutionContext],
  );
  const patrimonialAnalysis = useMemo(
    () => buildSuccessionPatrimonialAnalysis(civilContext, form.actifNetSuccession, liquidationContext.nbEnfants, patrimonialContext),
    [civilContext, form.actifNetSuccession, liquidationContext.nbEnfants, patrimonialContext],
  );
  const exportContext = useMemo<SuccessionExportContext>(() => {
    const situationFamiliale = SITUATION_OPTIONS.find((option) => option.value === civilContext.situationMatrimoniale)?.label
      ?? civilContext.situationMatrimoniale;
    const regimeMatrimonial = civilContext.situationMatrimoniale === 'marie' && civilContext.regimeMatrimonial
      ? (REGIMES_MATRIMONIAUX[civilContext.regimeMatrimonial]?.label ?? civilContext.regimeMatrimonial)
      : null;
    const pacsConvention = civilContext.situationMatrimoniale === 'pacse'
      ? PACS_CONVENTION_LABELS[civilContext.pacsConvention]
      : null;
    const predecesCalc = predecesAnalysis.calc?.result;

    return {
      situationFamiliale,
      regimeMatrimonial,
      pacsConvention,
      nbEnfants: liquidationContext.nbEnfants,
      nbEnfantsNonCommuns: devolutionAnalysis.nbEnfantsNonCommuns,
      testamentActif: devolutionContext.testamentActif,
      liquidationRegime: predecesAnalysis.regimeLabel,
      predecesApplicable: predecesAnalysis.applicable,
      predecesDroitsMrDecede: predecesCalc?.scenarioMrDecede.droitsSuccession ?? null,
      predecesDroitsMmeDecedee: predecesCalc?.scenarioMmeDecede.droitsSuccession ?? null,
      devolutionReserve: devolutionAnalysis.reserve?.reserve ?? null,
      devolutionQuotiteDisponible: devolutionAnalysis.reserve?.quotiteDisponible ?? null,
      devolutionLignes: devolutionAnalysis.lines.map((line) => ({ heritier: line.heritier, droits: line.droits })),
      masseCivileReference: patrimonialAnalysis.masseCivileReference,
      quotiteDisponibleMontant: patrimonialAnalysis.quotiteDisponibleMontant,
      liberalitesImputeesMontant: patrimonialAnalysis.liberalitesImputeesMontant,
      depassementQuotiteMontant: patrimonialAnalysis.depassementQuotiteMontant,
      warnings: dedupeWarnings([
        ...predecesAnalysis.warnings,
        ...devolutionAnalysis.warnings,
        ...patrimonialAnalysis.warnings,
      ]),
    };
  }, [
    civilContext,
    liquidationContext.nbEnfants,
    devolutionAnalysis,
    devolutionContext.testamentActif,
    predecesAnalysis,
    patrimonialAnalysis,
  ]);
  const pptxHighlights = useMemo(() => {
    const civilHighlights = [
      `Situation familiale: ${exportContext.situationFamiliale}`,
      ...(exportContext.regimeMatrimonial ? [`Régime matrimonial: ${exportContext.regimeMatrimonial}`] : []),
      ...(exportContext.pacsConvention ? [`Convention PACS: ${exportContext.pacsConvention}`] : []),
      `Nombre d'enfants (scénarios civils): ${exportContext.nbEnfants}`,
      `Testament actif: ${exportContext.testamentActif ? 'oui' : 'non'}`,
      ...(exportContext.liquidationRegime ? [`Régime de liquidation retenu: ${exportContext.liquidationRegime}`] : []),
      ...(exportContext.predecesApplicable && exportContext.predecesDroitsMrDecede !== null
        ? [`Prédécès (M. décédé): ${fmt(exportContext.predecesDroitsMrDecede)} de droits`]
        : []),
      ...(exportContext.predecesApplicable && exportContext.predecesDroitsMmeDecedee !== null
        ? [`Prédécès (Mme décédée): ${fmt(exportContext.predecesDroitsMmeDecedee)} de droits`]
        : []),
    ];

    const devolutionHighlights = [
      ...(exportContext.devolutionReserve && exportContext.devolutionQuotiteDisponible
        ? [
          `Réserve héréditaire / quotité disponible: ${exportContext.devolutionReserve} / ${exportContext.devolutionQuotiteDisponible}`,
        ]
        : []),
      ...exportContext.devolutionLignes.slice(0, 4).map((line) => `${line.heritier}: ${line.droits}`),
    ];

    const patrimonialHighlights = [
      `Masse civile de référence: ${fmt(exportContext.masseCivileReference)}`,
      `Quotité disponible estimée: ${fmt(exportContext.quotiteDisponibleMontant)}`,
      `Libéralités à contrôler: ${fmt(exportContext.liberalitesImputeesMontant)}`,
      ...(exportContext.depassementQuotiteMontant > 0
        ? [`Dépassement estimé de quotité: ${fmt(exportContext.depassementQuotiteMontant)}`]
        : []),
    ];

    return {
      civilHighlights: civilHighlights.slice(0, 8),
      devolutionHighlights: devolutionHighlights.slice(0, 8),
      patrimonialHighlights: patrimonialHighlights.slice(0, 8),
      warningHighlights: exportContext.warnings.slice(0, 5),
    };
  }, [exportContext]);

  const handleSituationChange = useCallback((situationMatrimoniale: SituationMatrimoniale) => {
    setCivilContext((prev) => ({
      situationMatrimoniale,
      regimeMatrimonial: situationMatrimoniale === 'marie'
        ? (prev.regimeMatrimonial ?? 'communaute_legale')
        : null,
      pacsConvention: situationMatrimoniale === 'pacse'
        ? prev.pacsConvention
        : DEFAULT_SUCCESSION_CIVIL_CONTEXT.pacsConvention,
    }));
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setCivilContext(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
    setLiquidationContext(DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT);
    setDevolutionContext(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
    setPatrimonialContext(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
    setShowDetails(false);
    setHypothesesOpen(false);
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      // ignore
    }
  }, [reset]);

  const setLiquidationField = useCallback(
    (field: 'actifEpoux1' | 'actifEpoux2' | 'actifCommun' | 'nbEnfants', value: number) => {
      setLiquidationContext((prev) => ({
        ...prev,
        [field]: field === 'nbEnfants'
          ? Math.max(0, Math.floor(value || 0))
          : Math.max(0, value || 0),
      }));
    },
    [],
  );

  const setDevolutionField = useCallback(
    (field: 'nbEnfantsNonCommuns' | 'testamentActif', value: number | boolean) => {
      setDevolutionContext((prev) => ({
        ...prev,
        [field]: field === 'nbEnfantsNonCommuns'
          ? Math.max(0, Math.floor(Number(value) || 0))
          : Boolean(value),
      }));
    },
    [],
  );

  const setPatrimonialField = useCallback(
    (
      field:
        | 'donationsRapportables'
        | 'donationsHorsPart'
        | 'legsParticuliers'
        | 'donationEntreEpouxActive'
        | 'preciputMontant'
        | 'attributionIntegrale',
      value: number | boolean,
    ) => {
      setPatrimonialContext((prev) => ({
        ...prev,
        [field]: field === 'donationEntreEpouxActive' || field === 'attributionIntegrale'
          ? Boolean(value)
          : Math.max(0, Number(value) || 0),
      }));
    },
    [],
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = parseSuccessionDraftPayload(raw);
        if (parsed) {
          hydrateForm(parsed.form);
          setCivilContext(parsed.civil);
          setLiquidationContext(parsed.liquidation);
          setDevolutionContext(parsed.devolution);
          setPatrimonialContext(parsed.patrimonial);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [hydrateForm]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        STORE_KEY,
        JSON.stringify(
          buildSuccessionDraftPayload(
            persistedForm,
            civilContext,
            liquidationContext,
            devolutionContext,
            patrimonialContext,
          ),
        ),
      );
    } catch {
      // ignore
    }
  }, [hydrated, persistedForm, civilContext, liquidationContext, devolutionContext, patrimonialContext]);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'succession') return;
      handleReset();
    });
    return off || (() => {});
  }, [handleReset]);

  const handleExportPptx = useCallback(async () => {
    if (!result || !canExport) return;
    try {
      setExportLoading(true);
      await exportSuccessionPptx(
        {
          actifNetSuccession: result.result.actifNetSuccession,
          totalDroits: result.result.totalDroits,
          tauxMoyenGlobal: result.result.tauxMoyenGlobal,
          heritiers: result.result.detailHeritiers,
          civilHighlights: pptxHighlights.civilHighlights,
          devolutionHighlights: pptxHighlights.devolutionHighlights,
          patrimonialHighlights: pptxHighlights.patrimonialHighlights,
          warningHighlights: pptxHighlights.warningHighlights,
        },
        pptxColors,
        { logoUrl: cabinetLogo, logoPlacement },
      );
    } finally {
      setExportLoading(false);
    }
  }, [result, canExport, pptxColors, cabinetLogo, logoPlacement, pptxHighlights]);

  const handleExportXlsx = useCallback(async () => {
    if (!result || !canExport) return;
    try {
      setExportLoading(true);
      await exportAndDownloadSuccessionXlsx(
        {
          actifNetSuccession: form.actifNetSuccession,
          nbHeritiers: form.heritiers.length,
          heritiers: form.heritiers.map((h) => ({ lien: h.lien, partSuccession: h.partSuccession })),
          context: exportContext,
        },
        result.result,
        pptxColors.c1,
      );
    } finally {
      setExportLoading(false);
    }
  }, [result, canExport, form, pptxColors, exportContext]);

  const exportOptions = [
    {
      label: 'PowerPoint',
      onClick: handleExportPptx,
      disabled: !result,
      tooltip: !result ? 'Calculez d’abord les droits pour exporter.' : undefined,
    },
    {
      label: 'Excel',
      onClick: handleExportXlsx,
      disabled: !result,
      tooltip: !result ? 'Calculez d’abord les droits pour exporter.' : undefined,
    },
  ];

  if (settingsLoading) {
    return (
      <div className="sim-page sc-page" data-testid="succession-page">
        <div className="premium-header sc-header">
          <h1 className="premium-title">Simulateur succession</h1>
          <p className="premium-subtitle">Estimez les droits de mutation à titre gratuit.</p>
        </div>
        <div className="sc-settings-loading" data-testid="succession-settings-loading">
          Chargement des paramètres fiscaux…
        </div>
      </div>
    );
  }

  return (
    <div className="sim-page sc-page" data-testid="succession-page">
      <div className="premium-header sc-header">
        <h1 className="premium-title">Simulateur succession</h1>
        <div className="sc-header__subtitle-row">
          <p className="premium-subtitle">
            Estimez les droits de succession à partir de l&apos;actif net et de la répartition entre héritiers.
          </p>
          <div className="sim-header__actions">
            <ExportMenu options={exportOptions} loading={exportLoading} />
          </div>
        </div>
      </div>

      {sessionExpired && (
        <p className="sc-session-msg">
          Session expirée — reconnectez-vous pour exporter.
        </p>
      )}

      <div className="sc-grid">
        <div className="sc-left">
          <div className="premium-card sc-card">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Contexte familial</h2>
              <p className="sc-card__subtitle">Prépare les scénarios civils avancés tout en gardant un calcul simple.</p>
            </header>
            <div className="sc-card__divider" />
            <div className="sc-civil-grid">
              <div className="sc-field">
                <label>Situation familiale</label>
                <select
                  value={civilContext.situationMatrimoniale}
                  onChange={(e) => handleSituationChange(e.target.value as SituationMatrimoniale)}
                >
                  {SITUATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {civilContext.situationMatrimoniale === 'marie' && (
                <div className="sc-field">
                  <label>Régime matrimonial</label>
                  <select
                    value={civilContext.regimeMatrimonial ?? 'communaute_legale'}
                    onChange={(e) =>
                      setCivilContext((prev) => ({
                        ...prev,
                        regimeMatrimonial: e.target.value as keyof typeof REGIMES_MATRIMONIAUX,
                      }))}
                  >
                    {Object.values(REGIMES_MATRIMONIAUX).map((regime) => (
                      <option key={regime.id} value={regime.id}>{regime.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {civilContext.situationMatrimoniale === 'pacse' && (
                <div className="sc-field">
                  <label>Convention PACS</label>
                  <select
                    value={civilContext.pacsConvention}
                    onChange={(e) =>
                      setCivilContext((prev) => ({
                        ...prev,
                        pacsConvention: e.target.value as 'separation' | 'indivision',
                      }))}
                  >
                    <option value="separation">Séparation de biens (défaut)</option>
                    <option value="indivision">Indivision conventionnelle</option>
                  </select>
                </div>
              )}
            </div>
            <p className="sc-hint">
              Ces paramètres impactent le module de prédécès ci-dessous, sans modifier le calcul principal des droits.
            </p>
          </div>

          <div className="premium-card sc-card">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Liquidation matrimoniale (prédécès)</h2>
              <p className="sc-card__subtitle">
                Estimation simplifiée de la masse transmise selon l&apos;ordre des décès.
              </p>
            </header>
            <div className="sc-card__divider" />

            {predecesAnalysis.applicable ? (
              <>
                <div className="sc-civil-grid">
                  <div className="sc-field">
                    <label>Actif propre époux 1 (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={liquidationContext.actifEpoux1 || ''}
                      onChange={(e) => setLiquidationField('actifEpoux1', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                  <div className="sc-field">
                    <label>Actif propre époux 2 (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={liquidationContext.actifEpoux2 || ''}
                      onChange={(e) => setLiquidationField('actifEpoux2', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                  <div className="sc-field">
                    <label>{civilContext.situationMatrimoniale === 'pacse' ? 'Actif indivis (€)' : 'Actif commun (€)'}</label>
                    <input
                      type="number"
                      min={0}
                      value={liquidationContext.actifCommun || ''}
                      onChange={(e) => setLiquidationField('actifCommun', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                  <div className="sc-field">
                    <label>Nombre d&apos;enfants</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={liquidationContext.nbEnfants}
                      onChange={(e) => setLiquidationField('nbEnfants', Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {predecesAnalysis.regimeLabel && (
                  <p className="sc-hint">
                    Régime appliqué pour le calcul: {predecesAnalysis.regimeLabel}.
                  </p>
                )}

                {predecesAnalysis.calc && (
                  <table className="premium-table sc-predeces-table">
                    <thead>
                      <tr>
                        <th>Scénario</th>
                        <th className="align-right">Masse transmise</th>
                        <th className="align-right">Droits estimés</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Décès époux 1</td>
                        <td className="align-right">{fmt(predecesAnalysis.calc.result.scenarioMrDecede.actifTransmis)}</td>
                        <td className="align-right value-cell">{fmt(predecesAnalysis.calc.result.scenarioMrDecede.droitsSuccession)}</td>
                      </tr>
                      <tr>
                        <td>Décès époux 2</td>
                        <td className="align-right">{fmt(predecesAnalysis.calc.result.scenarioMmeDecede.actifTransmis)}</td>
                        <td className="align-right value-cell">{fmt(predecesAnalysis.calc.result.scenarioMmeDecede.droitsSuccession)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <p className="sc-hint">
                Ce module s&apos;active pour les situations marié(e) ou pacsé(e).
              </p>
            )}

            {predecesAnalysis.warnings.length > 0 && (
              <ul className="sc-warning-list">
                {predecesAnalysis.warnings.map((warning, idx) => (
                  <li key={`${warning}-${idx}`}>{warning}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="premium-card sc-card">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Dévolution légale simplifiée</h2>
              <p className="sc-card__subtitle">
                Lecture civile indicative des droits théoriques avant ajustements patrimoniaux.
              </p>
            </header>
            <div className="sc-card__divider" />

            <div className="sc-civil-grid">
              <div className="sc-field">
                <label>Enfants non communs</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={devolutionContext.nbEnfantsNonCommuns}
                  onChange={(e) => setDevolutionField('nbEnfantsNonCommuns', Number(e.target.value) || 0)}
                />
              </div>
              <div className="sc-field">
                <label>Testament actif</label>
                <select
                  value={devolutionContext.testamentActif ? 'oui' : 'non'}
                  onChange={(e) => setDevolutionField('testamentActif', e.target.value === 'oui')}
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>
            </div>

            {devolutionAnalysis.reserve ? (
              <div className="sc-summary-row sc-summary-row--reserve">
                <span>Réserve héréditaire / Quotité disponible</span>
                <strong>{devolutionAnalysis.reserve.reserve} / {devolutionAnalysis.reserve.quotiteDisponible}</strong>
              </div>
            ) : (
              <p className="sc-hint">Aucune réserve descendante calculable sans enfant déclaré.</p>
            )}

            <table className="premium-table sc-predeces-table">
              <thead>
                <tr>
                  <th>Bénéficiaire</th>
                  <th>Droits civils théoriques</th>
                </tr>
              </thead>
              <tbody>
                {devolutionAnalysis.lines.map((line, idx) => (
                  <tr key={`${line.heritier}-${idx}`}>
                    <td>{line.heritier}</td>
                    <td>{line.droits}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {devolutionAnalysis.warnings.length > 0 && (
              <ul className="sc-warning-list">
                {devolutionAnalysis.warnings.map((warning, idx) => (
                  <li key={`${warning}-${idx}`}>{warning}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="premium-card sc-card">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Libéralités & avantages matrimoniaux (simplifié)</h2>
              <p className="sc-card__subtitle">
                Qualification patrimoniale indicative, sans recalcul DMTG automatique à ce stade.
              </p>
            </header>
            <div className="sc-card__divider" />

            <div className="sc-civil-grid">
              <div className="sc-field">
                <label>Donations rapportables (€)</label>
                <input
                  type="number"
                  min={0}
                  value={patrimonialContext.donationsRapportables || ''}
                  onChange={(e) => setPatrimonialField('donationsRapportables', Number(e.target.value) || 0)}
                  placeholder="Montant"
                />
              </div>
              <div className="sc-field">
                <label>Donations hors part (€)</label>
                <input
                  type="number"
                  min={0}
                  value={patrimonialContext.donationsHorsPart || ''}
                  onChange={(e) => setPatrimonialField('donationsHorsPart', Number(e.target.value) || 0)}
                  placeholder="Montant"
                />
              </div>
              <div className="sc-field">
                <label>Legs particuliers (€)</label>
                <input
                  type="number"
                  min={0}
                  value={patrimonialContext.legsParticuliers || ''}
                  onChange={(e) => setPatrimonialField('legsParticuliers', Number(e.target.value) || 0)}
                  placeholder="Montant"
                />
              </div>
              <div className="sc-field">
                <label>Donation entre époux</label>
                <select
                  value={patrimonialContext.donationEntreEpouxActive ? 'oui' : 'non'}
                  onChange={(e) => setPatrimonialField('donationEntreEpouxActive', e.target.value === 'oui')}
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>
              <div className="sc-field">
                <label>Clause de préciput (€)</label>
                <input
                  type="number"
                  min={0}
                  value={patrimonialContext.preciputMontant || ''}
                  onChange={(e) => setPatrimonialField('preciputMontant', Number(e.target.value) || 0)}
                  placeholder="Montant"
                />
              </div>
              <div className="sc-field">
                <label>Attribution intégrale</label>
                <select
                  value={patrimonialContext.attributionIntegrale ? 'oui' : 'non'}
                  onChange={(e) => setPatrimonialField('attributionIntegrale', e.target.value === 'oui')}
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>
            </div>

            <div className="sc-summary-row sc-summary-row--reserve">
              <span>Masse civile de référence</span>
              <strong>{fmt(patrimonialAnalysis.masseCivileReference)}</strong>
            </div>
            <div className="sc-summary-row sc-summary-row--reserve">
              <span>Quotité disponible estimée</span>
              <strong>{fmt(patrimonialAnalysis.quotiteDisponibleMontant)}</strong>
            </div>
            <div className="sc-summary-row sc-summary-row--reserve">
              <span>Libéralités à contrôler</span>
              <strong>{fmt(patrimonialAnalysis.liberalitesImputeesMontant)}</strong>
            </div>
            {patrimonialAnalysis.depassementQuotiteMontant > 0 && (
              <div className="sc-summary-row sc-summary-row--reserve">
                <span>Dépassement estimé de quotité</span>
                <strong>{fmt(patrimonialAnalysis.depassementQuotiteMontant)}</strong>
              </div>
            )}

            {patrimonialAnalysis.warnings.length > 0 && (
              <ul className="sc-warning-list">
                {patrimonialAnalysis.warnings.map((warning, idx) => (
                  <li key={`${warning}-${idx}`}>{warning}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="premium-card sc-card sc-card--guide">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Patrimoine transmis</h2>
              <p className="sc-card__subtitle">Actif net successoral pris en compte pour le calcul.</p>
            </header>
            <div className="sc-card__divider" />
            <div className="sc-field">
              <label htmlFor="actif-net">Actif net successoral (€)</label>
              <input
                id="actif-net"
                type="number"
                min={0}
                value={form.actifNetSuccession || ''}
                onChange={(e) => setActifNet(Number(e.target.value) || 0)}
                placeholder="Ex : 500 000"
              />
            </div>
          </div>

          <div className="premium-card sc-card">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Héritiers</h2>
              <p className="sc-card__subtitle">Renseignez le lien de parenté et la part transmise.</p>
            </header>
            <div className="sc-card__divider" />

            <div className="sc-heirs-list">
              {form.heritiers.map((h) => (
                <div key={h.id} className="sc-heir-row">
                  <div className="sc-field">
                    <label>Lien de parenté</label>
                    <select
                      value={h.lien}
                      onChange={(e) => updateHeritier(h.id, 'lien', e.target.value as LienParente)}
                    >
                      {LIEN_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sc-field">
                    <label>Part succession (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={h.partSuccession || ''}
                      onChange={(e) => updateHeritier(h.id, 'partSuccession', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                  {form.heritiers.length > 1 && (
                    <button
                      type="button"
                      className="sc-remove-btn"
                      onClick={() => removeHeritier(h.id)}
                      title="Supprimer cet héritier"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="sc-inline-actions">
              <button
                type="button"
                className="premium-btn sc-btn sc-btn--secondary"
                onClick={() => addHeritier('enfant')}
              >
                + Ajouter un héritier
              </button>
              <button
                type="button"
                className="premium-btn sc-btn sc-btn--secondary"
                onClick={distributeEqually}
                disabled={form.heritiers.length === 0 || form.actifNetSuccession <= 0}
              >
                Répartir également
              </button>
            </div>
          </div>

          <div className="sc-primary-actions">
            <button
              type="button"
              className="premium-btn sc-btn sc-btn--primary"
              onClick={compute}
              disabled={form.actifNetSuccession <= 0 || form.heritiers.length === 0}
            >
              Calculer les droits
            </button>
            <button
              type="button"
              className="premium-btn sc-btn sc-btn--secondary"
              onClick={handleReset}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="sc-right">
          <div className="premium-card sc-summary-card">
            <h2 className="sc-summary-title">Synthèse</h2>
            <div className="sc-card__divider sc-card__divider--tight" />
            {hasResult && result ? (
              <div className="sc-kpis">
                <div className="sc-kpi">
                  <div className="sc-kpi__label">Actif net successoral</div>
                  <div className="sc-kpi__value">{fmt(result.result.actifNetSuccession)}</div>
                </div>
                <div className="sc-kpi">
                  <div className="sc-kpi__label">Total droits</div>
                  <div className="sc-kpi__value">{fmt(result.result.totalDroits)}</div>
                </div>
                <div className="sc-kpi">
                  <div className="sc-kpi__label">Taux moyen global</div>
                  <div className="sc-kpi__value">{fmtPct(result.result.tauxMoyenGlobal)}</div>
                </div>
              </div>
            ) : (
              <div className="sc-summary-placeholder">
                <div className="sc-summary-row">
                  <span>Actif saisi</span>
                  <strong>{fmt(form.actifNetSuccession)}</strong>
                </div>
                <div className="sc-summary-row">
                  <span>Nombre d&apos;héritiers</span>
                  <strong>{form.heritiers.length}</strong>
                </div>
                <p className="sc-summary-note">
                  Lancez le calcul pour afficher le détail des droits.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasResult && result && (
        <div className="premium-card sc-detail-card" data-testid="succession-detail-accordion">
          <div className="sc-detail-header">
            <h3 className="sc-detail-title">Détail du calcul</h3>
            <button
              type="button"
              className="sc-detail-toggle"
              aria-expanded={showDetails}
              onClick={() => setShowDetails((v) => !v)}
            >
              {showDetails ? 'Masquer' : 'Afficher'}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`sc-chevron${showDetails ? ' is-open' : ''}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {showDetails && (
            <table className="premium-table sc-detail-table">
              <thead>
                <tr>
                  <th>Héritier</th>
                  <th className="align-right">Part brute</th>
                  <th className="align-right">Abattement</th>
                  <th className="align-right">Base imposable</th>
                  <th className="align-right">Droits</th>
                  <th className="align-right">Taux moyen</th>
                </tr>
              </thead>
              <tbody>
                {result.result.detailHeritiers.map((h, i) => (
                  <tr key={i}>
                    <td>{LIEN_OPTIONS.find((o) => o.value === h.lien)?.label ?? h.lien}</td>
                    <td className="align-right">{fmt(h.partBrute)}</td>
                    <td className="align-right">{fmt(h.abattement)}</td>
                    <td className="align-right">{fmt(h.baseImposable)}</td>
                    <td className="align-right value-cell">{fmt(h.droits)}</td>
                    <td className="align-right">{fmtPct(h.tauxMoyen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="sc-hypotheses">
        <button
          type="button"
          className="sc-hypotheses__toggle"
          onClick={() => setHypothesesOpen((v) => !v)}
          aria-expanded={hypothesesOpen}
          data-testid="succession-hypotheses-toggle"
        >
          <span className="sc-hypotheses__title">Hypothèses et limites</span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`sc-hypotheses__chevron${hypothesesOpen ? ' is-open' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {hypothesesOpen && (
          <ul>
            <li>Barèmes DMTG et abattements appliqués depuis les paramètres de l&apos;application.</li>
            <li>
              Paramètres transmis au module:
              rappel fiscal donations {fiscalSnapshot.donation.rappelFiscalAnnees} ans,
              AV décès 990 I {fmt(fiscalSnapshot.avDeces.primesApres1998.allowancePerBeneficiary)} / bénéficiaire,
              AV décès après {fiscalSnapshot.avDeces.agePivotPrimes} ans {fmt(fiscalSnapshot.avDeces.apres70ans.globalAllowance)} (global).
            </li>
            <li>Le calcul repose sur les parts de succession saisies pour chaque héritier.</li>
            <li>Le module prédécès repose sur une liquidation matrimoniale simplifiée avec warnings sur les cas non couverts.</li>
            <li>La dévolution légale est présentée en lecture civile simplifiée, sans gestion exhaustive des ordres successoraux.</li>
            <li>Les libéralités et avantages matrimoniaux sont qualifiés de façon indicative, sans recalcul automatique des droits dans ce module.</li>
            <li>L’intégration chiffrée fine (rapport civil détaillé, réduction, liquidation notariale) n’est pas encore modélisée.</li>
            <li>Résultat indicatif, à confirmer par une analyse patrimoniale et notariale.</li>
          </ul>
        )}
      </div>
    </div>
  );
}
