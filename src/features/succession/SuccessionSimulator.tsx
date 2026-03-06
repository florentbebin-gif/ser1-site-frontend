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
import { exportAndDownloadSuccessionXlsx } from './successionXlsx';
import { useTheme } from '../../settings/ThemeProvider';
import { useUserMode } from '../../services/userModeService';
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
  DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  DEFAULT_SUCCESSION_FAMILY_MEMBERS,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
  type FamilyBranch,
  type FamilyMember,
  type FamilyMemberType,
  type SuccessionEnfant,
  type SuccessionDispositionTestamentaire,
  type SituationMatrimoniale,
} from './successionDraft';
import { buildSuccessionDevolutionAnalysis } from './successionDevolution';
import { buildSuccessionFiscalSnapshot } from './successionFiscalContext';
import { buildSuccessionPatrimonialAnalysis } from './successionPatrimonial';
import { buildSuccessionPredecesAnalysis } from './successionPredeces';
import {
  buildSuccessionChainageAnalysis,
  type SuccessionChainOrder,
} from './successionChainage';
import { ScSelect } from './components/ScSelect';
import { FiliationOrgchart } from './components/FiliationOrgchart';
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
  { value: 'concubinage', label: 'Union libre' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf / veuve' },
];

const PACS_CONVENTION_OPTIONS = [
  { value: 'separation', label: 'Séparation de biens (défaut)' },
  { value: 'indivision', label: 'Indivision conventionnelle' },
];

const OUI_NON_OPTIONS = [
  { value: 'non', label: 'Non' },
  { value: 'oui', label: 'Oui' },
];

const DISPOSITION_TESTAMENTAIRE_OPTIONS: { value: SuccessionDispositionTestamentaire; label: string }[] = [
  { value: 'legs_universel', label: 'Legs universel' },
  { value: 'legs_titre_universel', label: 'Legs à titre universel' },
  { value: 'legs_particulier', label: 'Legs particulier' },
];

const DONATION_ENTRE_EPOUX_OPTIONS = [
  { value: 'usufruit_total', label: 'Usufruit total' },
  { value: 'pleine_propriete_quotite', label: 'Pleine propriété (quotité disponible)' },
  { value: 'mixte', label: 'Option mixte' },
];

const ENFANT_RATTACHEMENT_OPTIONS = [
  { value: 'commun', label: 'Enfant commun' },
  { value: 'epoux1', label: "Enfant de l'époux 1" },
  { value: 'epoux2', label: "Enfant de l'époux 2" },
];

const MEMBER_TYPE_OPTIONS: { value: FamilyMemberType; label: string }[] = [
  { value: 'petit_enfant', label: 'Petit-enfant' },
  { value: 'parent', label: 'Parent' },
  { value: 'frere_soeur', label: 'Frère / Sœur' },
  { value: 'oncle_tante', label: 'Oncle / Tante' },
  { value: 'tierce_personne', label: 'Tierce personne' },
];

const BRANCH_OPTIONS: { value: FamilyBranch; label: string }[] = [
  { value: 'epoux1', label: 'Côté Époux 1' },
  { value: 'epoux2', label: 'Côté Époux 2' },
];

const MEMBER_TYPE_NEEDS_BRANCH: FamilyMemberType[] = ['parent', 'frere_soeur', 'oncle_tante'];

function createEnfantId(): string {
  return `enf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMemberId(): string {
  return `mbr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function labelMember(m: FamilyMember, enfants: SuccessionEnfant[]): string {
  const typeLabel = MEMBER_TYPE_OPTIONS.find((o) => o.value === m.type)?.label ?? m.type;
  if (m.type === 'petit_enfant' && m.parentEnfantId) {
    const idx = enfants.findIndex((e) => e.id === m.parentEnfantId);
    return idx >= 0 ? `${typeLabel} (fils/fille de E${idx + 1})` : typeLabel;
  }
  if (m.branch) {
    const branchLabel = BRANCH_OPTIONS.find((o) => o.value === m.branch)?.label ?? m.branch;
    return `${typeLabel} (${branchLabel})`;
  }
  return typeLabel;
}

const CHAIN_ORDER_OPTIONS: { value: SuccessionChainOrder; label: string }[] = [
  { value: 'epoux1', label: 'Époux 1 décède en premier' },
  { value: 'epoux2', label: 'Époux 2 décède en premier' },
];

export default function SuccessionSimulator() {
  const { loading: settingsLoading, fiscalContext } = useFiscalContext({ strict: true });
  const fiscalSnapshot = useMemo(
    () => buildSuccessionFiscalSnapshot(fiscalContext),
    [fiscalContext],
  );
  const {
    form, persistedForm, result, setActifNet, addHeritier, removeHeritier,
    updateHeritier, hydrateForm, distributeEqually, reset, hasResult,
  } = useSuccessionCalc({ dmtgSettings: fiscalSnapshot.dmtgSettings });

  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const { mode } = useUserMode();
  const { sessionExpired, canExport } = useContext(SessionGuardContext);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [localMode, setLocalMode] = useState<null | 'expert' | 'simplifie'>(null);
  const isExpert = (localMode ?? mode) === 'expert';
  const [hypothesesOpen, setHypothesesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [civilContext, setCivilContext] = useState(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
  const [liquidationContext, setLiquidationContext] = useState(DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT);
  const [devolutionContext, setDevolutionContext] = useState(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
  const [patrimonialContext, setPatrimonialContext] = useState(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
  const [enfantsContext, setEnfantsContext] = useState<SuccessionEnfant[]>(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(DEFAULT_SUCCESSION_FAMILY_MEMBERS);
  const [showAddMemberPanel, setShowAddMemberPanel] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState<{
    type: FamilyMemberType | '';
    branch: FamilyBranch | '';
    parentEnfantId: string;
  }>({ type: '', branch: '', parentEnfantId: '' });
  const [chainOrder, setChainOrder] = useState<SuccessionChainOrder>('epoux1');

  const nbEnfants = enfantsContext.length;
  const nbEnfantsNonCommuns = useMemo(
    () => enfantsContext.filter((enfant) => enfant.rattachement !== 'commun').length,
    [enfantsContext],
  );

  const predecesAnalysis = useMemo(
    () => buildSuccessionPredecesAnalysis(
      civilContext,
      { ...liquidationContext, nbEnfants },
      fiscalSnapshot.dmtgSettings,
    ),
    [civilContext, liquidationContext, nbEnfants, fiscalSnapshot.dmtgSettings],
  );
  const patrimonialAnalysis = useMemo(
    () => buildSuccessionPatrimonialAnalysis(civilContext, form.actifNetSuccession, nbEnfants, patrimonialContext),
    [civilContext, form.actifNetSuccession, nbEnfants, patrimonialContext],
  );
  const chainageAnalysis = useMemo(
    () => buildSuccessionChainageAnalysis({
      civil: civilContext,
      liquidation: { ...liquidationContext, nbEnfants },
      regimeUsed: predecesAnalysis.regimeUsed,
      order: chainOrder,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
    }),
    [
      civilContext,
      liquidationContext,
      nbEnfants,
      predecesAnalysis.regimeUsed,
      chainOrder,
      fiscalSnapshot.dmtgSettings,
    ],
  );

  const alternateChainageAnalysis = useMemo(
    () => buildSuccessionChainageAnalysis({
      civil: civilContext,
      liquidation: { ...liquidationContext, nbEnfants },
      regimeUsed: predecesAnalysis.regimeUsed,
      order: chainOrder === 'epoux1' ? 'epoux2' : 'epoux1',
      dmtgSettings: fiscalSnapshot.dmtgSettings,
    }),
    [
      civilContext,
      liquidationContext,
      nbEnfants,
      predecesAnalysis.regimeUsed,
      chainOrder,
      fiscalSnapshot.dmtgSettings,
    ],
  );
  const devolutionAnalysis = useMemo(
    () => buildSuccessionDevolutionAnalysis(
      civilContext,
      nbEnfants,
      {
        ...devolutionContext,
        nbEnfantsNonCommuns,
      },
      chainageAnalysis.step1?.actifTransmis ?? 0,
      patrimonialContext.legsParticuliers,
    ),
    [
      civilContext,
      nbEnfants,
      devolutionContext,
      nbEnfantsNonCommuns,
      chainageAnalysis.step1?.actifTransmis,
      patrimonialContext.legsParticuliers,
    ],
  );
  const chainageExportPayload = useMemo(
    () => ({
      applicable: chainageAnalysis.applicable,
      order: chainageAnalysis.order,
      firstDecedeLabel: chainageAnalysis.firstDecedeLabel,
      secondDecedeLabel: chainageAnalysis.secondDecedeLabel,
      step1: chainageAnalysis.step1 ? {
        actifTransmis: chainageAnalysis.step1.actifTransmis,
        partConjoint: chainageAnalysis.step1.partConjoint,
        partEnfants: chainageAnalysis.step1.partEnfants,
        droitsEnfants: chainageAnalysis.step1.droitsEnfants,
      } : null,
      step2: chainageAnalysis.step2 ? {
        actifTransmis: chainageAnalysis.step2.actifTransmis,
        partConjoint: chainageAnalysis.step2.partConjoint,
        partEnfants: chainageAnalysis.step2.partEnfants,
        droitsEnfants: chainageAnalysis.step2.droitsEnfants,
      } : null,
      totalDroits: chainageAnalysis.totalDroits,
      totalDroitsOrdreInverse: alternateChainageAnalysis.applicable
        ? alternateChainageAnalysis.totalDroits
        : undefined,
      warnings: chainageAnalysis.warnings,
    }),
    [chainageAnalysis, alternateChainageAnalysis],
  );
  const totalActifsLiquidation = useMemo(
    () => Math.max(
      0,
      liquidationContext.actifEpoux1 + liquidationContext.actifEpoux2 + liquidationContext.actifCommun,
    ),
    [liquidationContext],
  );
  const canExportExpert = isExpert && hasResult && Boolean(result);
  const canExportSimplified = !isExpert && chainageAnalysis.applicable && totalActifsLiquidation > 0;
  const canExportCurrentMode = canExport && (canExportExpert || canExportSimplified);
  const isMarried = civilContext.situationMatrimoniale === 'marie';
  const isCommunityRegime = isMarried && (
    civilContext.regimeMatrimonial === 'communaute_legale'
    || civilContext.regimeMatrimonial === 'communaute_universelle'
    || civilContext.regimeMatrimonial === 'communaute_meubles_acquets'
  );

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
    if (situationMatrimoniale !== 'marie') {
      setPatrimonialContext((prev) => ({
        ...prev,
        donationEntreEpouxActive: false,
        preciputMontant: 0,
        attributionIntegrale: false,
      }));
    }
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setCivilContext(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
    setLiquidationContext(DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT);
    setDevolutionContext(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
    setPatrimonialContext(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
    setEnfantsContext(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
    setFamilyMembers(DEFAULT_SUCCESSION_FAMILY_MEMBERS);
    setShowAddMemberPanel(false);
    setAddMemberForm({ type: '', branch: '', parentEnfantId: '' });
    setChainOrder('epoux1');
    setShowDetails(false);
    setHypothesesOpen(false);
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      // ignore
    }
  }, [reset]);

  const setLiquidationField = useCallback(
    (field: 'actifEpoux1' | 'actifEpoux2' | 'actifCommun', value: number) => {
      setLiquidationContext((prev) => ({
        ...prev,
        [field]: Math.max(0, value || 0),
      }));
    },
    [],
  );

  const setDevolutionField = useCallback(
    (
      field:
        | 'testamentActif'
        | 'typeDispositionTestamentaire'
        | 'quotePartLegsTitreUniverselPct'
        | 'ascendantsSurvivants',
      value: boolean | number | SuccessionDispositionTestamentaire | null,
    ) => {
      setDevolutionContext((prev) => {
        if (field === 'testamentActif') {
          const testamentActif = Boolean(value);
          return {
            ...prev,
            testamentActif,
            typeDispositionTestamentaire: testamentActif
              ? (prev.typeDispositionTestamentaire ?? 'legs_universel')
              : null,
          };
        }
        if (field === 'typeDispositionTestamentaire') {
          return {
            ...prev,
            typeDispositionTestamentaire: value as SuccessionDispositionTestamentaire | null,
          };
        }
        if (field === 'quotePartLegsTitreUniverselPct') {
          return {
            ...prev,
            quotePartLegsTitreUniverselPct: Math.min(100, Math.max(0, Number(value) || 0)),
          };
        }
        return {
          ...prev,
          ascendantsSurvivants: Boolean(value),
        };
      });
    },
    [],
  );

  const addEnfant = useCallback(() => {
    setEnfantsContext((prev) => ([
      ...prev,
      { id: createEnfantId(), rattachement: 'commun' },
    ]));
  }, []);

  const updateEnfantRattachement = useCallback((id: string, rattachement: 'commun' | 'epoux1' | 'epoux2') => {
    setEnfantsContext((prev) => prev.map((enfant) => (
      enfant.id === id
        ? { ...enfant, rattachement }
        : enfant
    )));
  }, []);

  const removeEnfant = useCallback((id: string) => {
    setEnfantsContext((prev) => prev.filter((enfant) => enfant.id !== id));
  }, []);

  const addFamilyMember = useCallback(() => {
    const { type, branch, parentEnfantId } = addMemberForm;
    if (!type) return;
    const needsBranch = MEMBER_TYPE_NEEDS_BRANCH.includes(type as FamilyMemberType);
    if (needsBranch && !branch) return;
    if (type === 'petit_enfant' && !parentEnfantId) return;
    const member: FamilyMember = {
      id: createMemberId(),
      type: type as FamilyMemberType,
      branch: branch ? (branch as FamilyBranch) : undefined,
      parentEnfantId: type === 'petit_enfant' ? parentEnfantId : undefined,
    };
    setFamilyMembers((prev) => [...prev, member]);
    setAddMemberForm({ type: '', branch: '', parentEnfantId: '' });
    setShowAddMemberPanel(false);
  }, [addMemberForm]);

  const removeFamilyMember = useCallback((id: string) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const setPatrimonialField = useCallback(
    (
      field:
        | 'donationsRapportables'
        | 'donationsHorsPart'
        | 'legsParticuliers'
        | 'donationEntreEpouxActive'
        | 'donationEntreEpouxOption'
        | 'preciputMontant'
        | 'attributionIntegrale',
      value: number | boolean | string,
    ) => {
      setPatrimonialContext((prev) => ({
        ...prev,
        [field]: field === 'donationEntreEpouxActive' || field === 'attributionIntegrale'
          ? Boolean(value)
          : field === 'donationEntreEpouxOption'
            ? value
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
          setEnfantsContext(parsed.enfants);
          setFamilyMembers(parsed.familyMembers);
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
            {
              ...devolutionContext,
              nbEnfantsNonCommuns,
            },
            patrimonialContext,
            enfantsContext,
            familyMembers,
          ),
        ),
      );
    } catch {
      // ignore
    }
  }, [hydrated, persistedForm, civilContext, liquidationContext, devolutionContext, patrimonialContext, nbEnfantsNonCommuns, enfantsContext, familyMembers]);

  // Auto-dériver ascendantsSurvivants si des parents sont déclarés dans familyMembers
  useEffect(() => {
    const hasParents = familyMembers.some((m) => m.type === 'parent');
    setDevolutionContext((prev) => {
      if (prev.ascendantsSurvivants === hasParents) return prev;
      return { ...prev, ascendantsSurvivants: hasParents };
    });
  }, [familyMembers]);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'succession') return;
      handleReset();
    });
    return off || (() => {});
  }, [handleReset]);

  const handleExportPptx = useCallback(async () => {
    if (!canExport) return;
    try {
      setExportLoading(true);
      if (canExportExpert && result) {
        await exportSuccessionPptx(
          {
            actifNetSuccession: result.result.actifNetSuccession,
            totalDroits: result.result.totalDroits,
            tauxMoyenGlobal: result.result.tauxMoyenGlobal,
            heritiers: result.result.detailHeritiers,
            predecesChronologie: chainageExportPayload,
          },
          pptxColors,
          { logoUrl: cabinetLogo, logoPlacement },
        );
      } else if (canExportSimplified) {
        await exportSuccessionPptx(
          {
            actifNetSuccession: totalActifsLiquidation,
            totalDroits: chainageAnalysis.totalDroits,
            tauxMoyenGlobal: totalActifsLiquidation > 0
              ? (chainageAnalysis.totalDroits / totalActifsLiquidation) * 100
              : 0,
            heritiers: [],
            predecesChronologie: chainageExportPayload,
          },
          pptxColors,
          { logoUrl: cabinetLogo, logoPlacement },
        );
      }
    } finally {
      setExportLoading(false);
    }
  }, [
    canExport,
    canExportExpert,
    canExportSimplified,
    result,
    pptxColors,
    cabinetLogo,
    logoPlacement,
    chainageExportPayload,
    totalActifsLiquidation,
    chainageAnalysis.totalDroits,
  ]);

  const handleExportXlsx = useCallback(async () => {
    if (!canExport) return;
    try {
      setExportLoading(true);
      if (canExportExpert && result) {
        await exportAndDownloadSuccessionXlsx(
          {
            actifNetSuccession: form.actifNetSuccession,
            nbHeritiers: form.heritiers.length,
            heritiers: form.heritiers.map((h) => ({ lien: h.lien, partSuccession: h.partSuccession })),
          },
          result.result,
          pptxColors.c1,
          undefined,
          chainageExportPayload,
        );
      } else if (canExportSimplified) {
        await exportAndDownloadSuccessionXlsx(
          {
            actifNetSuccession: totalActifsLiquidation,
            nbHeritiers: nbEnfants,
            heritiers: [],
          },
          null,
          pptxColors.c1,
          undefined,
          chainageExportPayload,
        );
      }
    } finally {
      setExportLoading(false);
    }
  }, [
    canExport,
    canExportExpert,
    canExportSimplified,
    result,
    form,
    pptxColors,
    chainageExportPayload,
    totalActifsLiquidation,
    nbEnfants,
  ]);

  const exportOptions = [
    {
      label: 'PowerPoint',
      onClick: handleExportPptx,
      disabled: !canExportCurrentMode,
      tooltip: !canExportCurrentMode
        ? (isExpert
          ? 'Renseignez patrimoine et héritiers pour exporter.'
          : 'Renseignez le contexte familial et les actifs pour exporter.')
        : undefined,
    },
    {
      label: 'Excel',
      onClick: handleExportXlsx,
      disabled: !canExportCurrentMode,
      tooltip: !canExportCurrentMode
        ? (isExpert
          ? 'Renseignez patrimoine et héritiers pour exporter.'
          : 'Renseignez le contexte familial et les actifs pour exporter.')
        : undefined,
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
            <button
              className="chip premium-btn sc-mode-btn"
              onClick={() => setLocalMode(isExpert ? 'simplifie' : 'expert')}
              title={isExpert ? 'Passer en mode simplifié' : 'Passer en mode expert'}
            >
              {isExpert ? 'Mode expert' : 'Mode simplifié'}
            </button>
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
            <div className="sc-context-grid">
              <div className="sc-civil-grid">
                <div className="sc-field">
                  <label>Situation familiale</label>
                  <ScSelect
                    value={civilContext.situationMatrimoniale}
                    onChange={(value) => handleSituationChange(value as SituationMatrimoniale)}
                    options={SITUATION_OPTIONS}
                  />
                </div>

                {civilContext.situationMatrimoniale === 'marie' && (
                  <div className="sc-field">
                    <label>Régime matrimonial</label>
                    <ScSelect
                      value={civilContext.regimeMatrimonial ?? 'communaute_legale'}
                      onChange={(value) =>
                        setCivilContext((prev) => ({
                          ...prev,
                          regimeMatrimonial: value as keyof typeof REGIMES_MATRIMONIAUX,
                        }))}
                      options={Object.values(REGIMES_MATRIMONIAUX).map((regime) => ({
                        value: regime.id,
                        label: regime.label,
                      }))}
                    />
                  </div>
                )}

                {civilContext.situationMatrimoniale === 'pacse' && (
                  <div className="sc-field">
                    <label>Convention PACS</label>
                    <ScSelect
                      value={civilContext.pacsConvention}
                      onChange={(value) =>
                        setCivilContext((prev) => ({
                          ...prev,
                          pacsConvention: value as 'separation' | 'indivision',
                        }))}
                      options={PACS_CONVENTION_OPTIONS}
                    />
                  </div>
                )}
              </div>

              <div className="sc-children-zone">
                <div className="sc-children-actions">
                  <button
                    type="button"
                    className="sc-child-add-btn"
                    onClick={addEnfant}
                  >
                    + Ajouter un enfant
                  </button>
                  <button
                    type="button"
                    className="sc-member-add-btn"
                    onClick={() => setShowAddMemberPanel((v) => !v)}
                  >
                    + Ajouter un membre
                  </button>
                </div>

                {showAddMemberPanel && (
                  <div className="sc-add-member-panel">
                    <ScSelect
                      value={addMemberForm.type}
                      onChange={(value) => setAddMemberForm((prev) => ({ ...prev, type: value as FamilyMemberType, branch: '', parentEnfantId: '' }))}
                      options={[{ value: '', label: 'Type de membre…', disabled: true }, ...MEMBER_TYPE_OPTIONS]}
                    />
                    {MEMBER_TYPE_NEEDS_BRANCH.includes(addMemberForm.type as FamilyMemberType) && (
                      <ScSelect
                        value={addMemberForm.branch}
                        onChange={(value) => setAddMemberForm((prev) => ({ ...prev, branch: value as FamilyBranch }))}
                        options={[{ value: '', label: 'Branche familiale…', disabled: true }, ...BRANCH_OPTIONS]}
                      />
                    )}
                    {addMemberForm.type === 'petit_enfant' && (
                      <ScSelect
                        value={addMemberForm.parentEnfantId}
                        onChange={(value) => setAddMemberForm((prev) => ({ ...prev, parentEnfantId: value }))}
                        options={[
                          { value: '', label: 'Enfant parent…', disabled: true },
                          ...enfantsContext.map((e, i) => ({ value: e.id, label: `E${i + 1}` })),
                        ]}
                      />
                    )}
                    <div className="sc-add-member-panel__actions">
                      <button
                        type="button"
                        className="sc-child-add-btn"
                        onClick={addFamilyMember}
                        disabled={
                          !addMemberForm.type
                          || (MEMBER_TYPE_NEEDS_BRANCH.includes(addMemberForm.type as FamilyMemberType) && !addMemberForm.branch)
                          || (addMemberForm.type === 'petit_enfant' && !addMemberForm.parentEnfantId)
                        }
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        className="sc-child-remove-btn"
                        onClick={() => setShowAddMemberPanel(false)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {enfantsContext.length === 0 && familyMembers.length === 0 ? (
                  <p className="sc-hint sc-hint--compact">Aucun enfant ni membre déclaré pour l&apos;instant.</p>
                ) : (
                  <>
                    {enfantsContext.length > 0 && (
                      <div className="sc-children-list">
                        {enfantsContext.map((enfant, idx) => (
                          <div key={enfant.id} className="sc-child-row">
                            <span className="sc-child-row__label">E{idx + 1}</span>
                            <ScSelect
                              className="sc-child-select"
                              value={enfant.rattachement}
                              onChange={(value) => updateEnfantRattachement(enfant.id, value as 'commun' | 'epoux1' | 'epoux2')}
                              options={ENFANT_RATTACHEMENT_OPTIONS}
                            />
                            <button
                              type="button"
                              className="sc-child-remove-btn"
                              onClick={() => removeEnfant(enfant.id)}
                              aria-label={`Supprimer enfant ${idx + 1}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {familyMembers.length > 0 && (
                      <div className="sc-members-list">
                        {familyMembers.map((m) => (
                          <div key={m.id} className="sc-member-chip">
                            <span>{labelMember(m, enfantsContext)}</span>
                            <button
                              type="button"
                              className="sc-child-remove-btn"
                              onClick={() => removeFamilyMember(m.id)}
                              aria-label={`Supprimer ${labelMember(m, enfantsContext)}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
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
                </div>
                <p className="sc-hint">Enfants pris en compte automatiquement: {nbEnfants}</p>

                {predecesAnalysis.regimeLabel && (
                  <p className="sc-hint">
                    Régime appliqué pour le calcul: {predecesAnalysis.regimeLabel}.
                  </p>
                )}

                <p className="sc-hint sc-hint--compact">
                  Les droits des 2 étapes sont affichés dans la carte de chronologie à droite.
                </p>
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

          {isExpert && (
          <div className="premium-card sc-card">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Dévolution légale simplifiée</h2>
              <p className="sc-card__subtitle">
                Qualification civile avec estimation des masses transmises à partir de la chronologie.
              </p>
            </header>
            <div className="sc-card__divider" />

            <div className="sc-civil-grid">
              <div className="sc-field">
                <label>Testament actif</label>
                <ScSelect
                  value={devolutionContext.testamentActif ? 'oui' : 'non'}
                  onChange={(value) => setDevolutionField('testamentActif', value === 'oui')}
                  options={OUI_NON_OPTIONS}
                />
              </div>
              {devolutionContext.testamentActif && (
                <div className="sc-field">
                  <label>Type de disposition testamentaire</label>
                  <ScSelect
                    value={devolutionContext.typeDispositionTestamentaire ?? 'legs_universel'}
                    onChange={(value) => setDevolutionField(
                      'typeDispositionTestamentaire',
                      value as SuccessionDispositionTestamentaire,
                    )}
                    options={DISPOSITION_TESTAMENTAIRE_OPTIONS}
                  />
                </div>
              )}
              {devolutionContext.testamentActif
                && devolutionContext.typeDispositionTestamentaire === 'legs_titre_universel' && (
                <div className="sc-field">
                  <label>Quote-part du legs à titre universel (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={devolutionContext.quotePartLegsTitreUniverselPct}
                    onChange={(e) => setDevolutionField(
                      'quotePartLegsTitreUniverselPct',
                      Number(e.target.value) || 0,
                    )}
                    placeholder="Ex : 50"
                  />
                </div>
              )}
              {nbEnfants === 0 && (
                <div className="sc-field">
                  <label>Ascendants survivants</label>
                  {familyMembers.some((m) => m.type === 'parent') ? (
                    <span className="sc-auto-derived">
                      Oui — déduit des membres ajoutés
                    </span>
                  ) : (
                    <ScSelect
                      value={devolutionContext.ascendantsSurvivants ? 'oui' : 'non'}
                      onChange={(value) => setDevolutionField('ascendantsSurvivants', value === 'oui')}
                      options={OUI_NON_OPTIONS}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="sc-summary-row sc-summary-row--reserve">
              <span>Masse de calcul estimée (1er décès)</span>
              <strong>{fmt(devolutionAnalysis.masseReference)}</strong>
            </div>
            <div className="sc-summary-row sc-summary-row--reserve">
              <span>Enfants non communs (auto)</span>
              <strong>{nbEnfantsNonCommuns}</strong>
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
                  <th className="align-right">Montant estimé</th>
                </tr>
              </thead>
              <tbody>
                {devolutionAnalysis.lines.map((line, idx) => (
                  <tr key={`${line.heritier}-${idx}`}>
                    <td>{line.heritier}</td>
                    <td>{line.droits}</td>
                    <td className="align-right">{line.montantEstime === null ? 'N/A' : fmt(line.montantEstime)}</td>
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
          )}

          {isExpert && (
          <div className="premium-card sc-card">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Libéralités & avantages matrimoniaux</h2>
              <p className="sc-card__subtitle">
                Renseignez les montants et clauses pour qualifier les impacts civils et fiscaux.
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
              {isMarried && (
                <div className="sc-field">
                  <label>Donation entre époux active</label>
                  <ScSelect
                    value={patrimonialContext.donationEntreEpouxActive ? 'oui' : 'non'}
                    onChange={(value) => setPatrimonialField('donationEntreEpouxActive', value === 'oui')}
                    options={OUI_NON_OPTIONS}
                  />
                </div>
              )}
              {isMarried && patrimonialContext.donationEntreEpouxActive && (
                <div className="sc-field">
                  <label>Option donation entre époux</label>
                  <ScSelect
                    value={patrimonialContext.donationEntreEpouxOption}
                    onChange={(value) => setPatrimonialField('donationEntreEpouxOption', value)}
                    options={DONATION_ENTRE_EPOUX_OPTIONS}
                  />
                </div>
              )}
              {isCommunityRegime && (
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
              )}
              {isCommunityRegime && (
                <div className="sc-field">
                  <label>Attribution intégrale</label>
                  <ScSelect
                    value={patrimonialContext.attributionIntegrale ? 'oui' : 'non'}
                    onChange={(value) => setPatrimonialField('attributionIntegrale', value === 'oui')}
                    options={OUI_NON_OPTIONS}
                  />
                </div>
              )}
            </div>
            {!isMarried && (
              <p className="sc-hint">
                Les avantages matrimoniaux (donation entre époux, préciput, attribution intégrale)
                s&apos;appliquent uniquement aux couples mariés.
              </p>
            )}
            {isMarried && !isCommunityRegime && (
              <p className="sc-hint">
                Préciput et attribution intégrale non affichés: ces clauses relèvent des régimes communautaires.
              </p>
            )}

            <div className="sc-summary-row sc-summary-row--reserve">
              <span>Masse de calcul estimée (avant rapport)</span>
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
          )}

          {isExpert && (
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
          )}

          {isExpert && (
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
                    <ScSelect
                      value={h.lien}
                      onChange={(value) => updateHeritier(h.id, 'lien', value as LienParente)}
                      options={LIEN_OPTIONS}
                    />
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
          )}

          {isExpert && (
          <div className="sc-primary-actions">
            <p className="sc-hint sc-hint--compact">Calcul des droits en direct selon la saisie.</p>
            <button
              type="button"
              className="premium-btn sc-btn sc-btn--secondary"
              onClick={handleReset}
            >
              Réinitialiser
            </button>
          </div>
          )}
        </div>

        <div className="sc-right">
          <FiliationOrgchart
            civilContext={civilContext}
            enfantsContext={enfantsContext}
            familyMembers={familyMembers}
          />

          <div className="premium-card sc-summary-card sc-hero-card">
            <div className="sc-hero-header">
              <h2 className="sc-summary-title">Chronologie des décès</h2>
              <ScSelect
                className="sc-hero-order-select"
                value={chainOrder}
                onChange={(value) => setChainOrder(value as SuccessionChainOrder)}
                options={CHAIN_ORDER_OPTIONS}
              />
            </div>
            <div className="sc-card__divider sc-card__divider--tight" />
            {chainageAnalysis.applicable && chainageAnalysis.step1 && chainageAnalysis.step2 ? (
              <div className="sc-chain">
                <div className="sc-chain-step">
                  <div className="sc-chain-step__title">Étape 1 - décès {chainageAnalysis.firstDecedeLabel}</div>
                  <div className="sc-summary-row">
                    <span>Masse transmise</span>
                    <strong>{fmt(chainageAnalysis.step1.actifTransmis)}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Part conjoint survivant</span>
                    <strong>{fmt(chainageAnalysis.step1.partConjoint)}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Droits descendants</span>
                    <strong>{fmt(chainageAnalysis.step1.droitsEnfants)}</strong>
                  </div>
                </div>

                <div className="sc-chain-step">
                  <div className="sc-chain-step__title">Étape 2 - décès {chainageAnalysis.secondDecedeLabel}</div>
                  <div className="sc-summary-row">
                    <span>Masse transmise</span>
                    <strong>{fmt(chainageAnalysis.step2.actifTransmis)}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Part descendants</span>
                    <strong>{fmt(chainageAnalysis.step2.partEnfants)}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Droits descendants</span>
                    <strong>{fmt(chainageAnalysis.step2.droitsEnfants)}</strong>
                  </div>
                </div>

                <div className="sc-summary-row sc-summary-row--reserve">
                  <span>Total cumulé des droits (2 décès)</span>
                  <strong>{fmt(chainageAnalysis.totalDroits)}</strong>
                </div>
                {alternateChainageAnalysis.applicable && (
                  <div className="sc-summary-row sc-summary-row--reserve">
                    <span>
                      Ordre inverse ({alternateChainageAnalysis.firstDecedeLabel}
                      {' '}puis{' '}
                      {alternateChainageAnalysis.secondDecedeLabel})
                    </span>
                    <strong>{fmt(alternateChainageAnalysis.totalDroits)}</strong>
                  </div>
                )}
              </div>
            ) : (
              <p className="sc-summary-note">
                Activez un contexte marié ou pacsé pour afficher la chronologie en 2 décès.
              </p>
            )}
          </div>

          <div className="premium-card sc-summary-card sc-hero-card sc-hero-card--secondary">
            <h2 className="sc-summary-title">{isExpert ? 'Synthèse fiscale' : 'Points d’attention'}</h2>
            <div className="sc-card__divider sc-card__divider--tight" />
            {isExpert && hasResult && result ? (
              <div className="sc-kpis">
                <div className="sc-kpi">
                  <div className="sc-kpi__label">Actif net successoral (direct)</div>
                  <div className="sc-kpi__value">{fmt(result.result.actifNetSuccession)}</div>
                </div>
                <div className="sc-kpi">
                  <div className="sc-kpi__label">Droits totaux DMTG (direct)</div>
                  <div className="sc-kpi__value">{fmt(result.result.totalDroits)}</div>
                </div>
                <div className="sc-kpi">
                  <div className="sc-kpi__label">Taux moyen global</div>
                  <div className="sc-kpi__value">{fmtPct(result.result.tauxMoyenGlobal)}</div>
                </div>
                <button
                  type="button"
                  className="sc-summary-link"
                  onClick={() => setShowDetails(true)}
                >
                  Voir le détail du calcul
                </button>
              </div>
            ) : isExpert ? (
              <div className="sc-summary-placeholder">
                <div className="sc-summary-row">
                  <span>Actif saisi</span>
                  <strong>{fmt(form.actifNetSuccession)}</strong>
                </div>
                <div className="sc-summary-row">
                  <span>Nombre d&apos;héritiers</span>
                  <strong>{form.heritiers.length}</strong>
                </div>
              </div>
            ) : (
              <div className="sc-summary-placeholder">
                <p className="sc-summary-note">
                  Résultat indicatif: simulation simplifiée des 2 décès, hors liquidation notariale fine.
                </p>
                {chainageAnalysis.warnings.length > 0 ? (
                  <ul className="sc-warning-list sc-warning-list--compact">
                    {chainageAnalysis.warnings.map((warning, idx) => (
                      <li key={`${warning}-${idx}`}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="sc-summary-note sc-summary-note--muted">
                    Aucun avertissement bloquant sur la chronologie saisie.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpert && hasResult && result && (
        <div
          className="premium-card sc-detail-card"
          data-testid="succession-detail-accordion"
          id="succession-detail-accordion"
        >
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
            <li>La chronologie 2 décès repose sur un chaînage simplifié avec warnings sur les cas non couverts.</li>
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
