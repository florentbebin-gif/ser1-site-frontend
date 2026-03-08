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
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_DONATIONS,
  DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  DEFAULT_SUCCESSION_FAMILY_MEMBERS,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
  type FamilyBranch,
  type FamilyMember,
  type FamilyMemberType,
  type SuccessionDonationEntry,
  type SuccessionDonationEntryType,
  type SuccessionEnfant,
  type SuccessionDispositionTestamentaire,
  type SuccessionDonationEntreEpouxOption,
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

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

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
  { value: 'usufruit_total', label: 'Totalité en usufruit' },
  { value: 'pleine_propriete_quotite', label: 'Quotité disponible en pleine propriété' },
  { value: 'mixte', label: 'Option mixte 1/4 PP + 3/4 usufruit' },
  { value: 'pleine_propriete_totale', label: 'Totalité en pleine propriété' },
];

const DONATION_TYPE_OPTIONS: { value: SuccessionDonationEntryType; label: string }[] = [
  { value: 'rapportable', label: 'Avance de part successorale' },
  { value: 'hors_part', label: 'Hors part successorale' },
  { value: 'legs_particulier', label: 'Legs particulier' },
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

function createDonationId(): string {
  return `don-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildAggregateDonationEntries(values: Record<SuccessionDonationEntryType, number>): SuccessionDonationEntry[] {
  const order: SuccessionDonationEntryType[] = ['rapportable', 'hors_part', 'legs_particulier'];
  return order
    .filter((type) => values[type] > 0)
    .map((type) => ({
      id: createDonationId(),
      type,
      montant: values[type],
      description: 'Saisie agrégée',
    }));
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
    persistedForm, setActifNet, hydrateForm, reset,
  } = useSuccessionCalc({ dmtgSettings: fiscalSnapshot.dmtgSettings });

  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const { mode } = useUserMode();
  const { sessionExpired, canExport } = useContext(SessionGuardContext);
  const [exportLoading, setExportLoading] = useState(false);
  const [localMode, setLocalMode] = useState<null | 'expert' | 'simplifie'>(null);
  const isExpert = (localMode ?? mode) === 'expert';
  const [hypothesesOpen, setHypothesesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [civilContext, setCivilContext] = useState(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
  const [liquidationContext, setLiquidationContext] = useState(DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT);
  const [devolutionContext, setDevolutionContext] = useState(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
  const [patrimonialContext, setPatrimonialContext] = useState(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
  const [donationsContext, setDonationsContext] = useState<SuccessionDonationEntry[]>(DEFAULT_SUCCESSION_DONATIONS);
  const [enfantsContext, setEnfantsContext] = useState<SuccessionEnfant[]>(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(DEFAULT_SUCCESSION_FAMILY_MEMBERS);
  const [showAddMemberPanel, setShowAddMemberPanel] = useState(false);
  const [showDispositionsModal, setShowDispositionsModal] = useState(false);
  const [dispositionsDraft, setDispositionsDraft] = useState({
    attributionBiensCommunsPct: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.attributionBiensCommunsPct,
    donationEntreEpouxActive: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationEntreEpouxActive,
    donationEntreEpouxOption: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationEntreEpouxOption,
    preciputMontant: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.preciputMontant,
    attributionIntegrale: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.attributionIntegrale,
    testamentActif: DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentActif,
    typeDispositionTestamentaire: DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.typeDispositionTestamentaire,
    quotePartLegsTitreUniverselPct: DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.quotePartLegsTitreUniverselPct,
    ascendantsSurvivants: DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivants,
  });
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
  const donationTotals = useMemo(() => donationsContext.reduce((totals, entry) => {
    if (entry.type === 'rapportable') totals.rapportable += entry.montant;
    if (entry.type === 'hors_part') totals.horsPart += entry.montant;
    if (entry.type === 'legs_particulier') totals.legsParticuliers += entry.montant;
    return totals;
  }, {
    rapportable: 0,
    horsPart: 0,
    legsParticuliers: 0,
  }), [donationsContext]);

  const enfantRattachementOptions = useMemo(() => {
    const s = civilContext.situationMatrimoniale;
    if (s === 'marie') return [
      { value: 'commun', label: 'Enfant commun' },
      { value: 'epoux1', label: "Enfant de l'époux 1" },
      { value: 'epoux2', label: "Enfant de l'époux 2" },
    ];
    if (s === 'pacse' || s === 'concubinage') return [
      { value: 'commun', label: 'Enfant commun' },
      { value: 'epoux1', label: 'Enfant du partenaire 1' },
      { value: 'epoux2', label: 'Enfant du partenaire 2' },
    ];
    if (s === 'divorce') return [
      { value: 'epoux1', label: 'Enfant du/de la défunt(e)' },
      { value: 'commun', label: 'Enfant commun (ex-couple)' },
      { value: 'epoux2', label: "Enfant de l'ex-conjoint(e)" },
    ];
    return [{ value: 'epoux1', label: 'Enfant du/de la défunt(e)' }];
  }, [civilContext.situationMatrimoniale]);

  const branchOptions = useMemo((): { value: FamilyBranch; label: string }[] => {
    const s = civilContext.situationMatrimoniale;
    if (s === 'pacse' || s === 'concubinage') return [
      { value: 'epoux1', label: 'Côté Partenaire 1' },
      { value: 'epoux2', label: 'Côté Partenaire 2' },
    ];
    if (s === 'divorce') return [
      { value: 'epoux1', label: 'Côté Défunt(e)' },
      { value: 'epoux2', label: "Côté Ex-conjoint(e)" },
    ];
    if (s === 'celibataire' || s === 'veuf') return [
      { value: 'epoux1', label: 'Côté Défunt(e)' },
    ];
    return BRANCH_OPTIONS;
  }, [civilContext.situationMatrimoniale]);

  // Reset enfant rattachement invalide lors d'un changement de situation
  useEffect(() => {
    const validValues = new Set(enfantRattachementOptions.map((o) => o.value));
    const defaultValue = (enfantRattachementOptions[0]?.value ?? 'epoux1') as 'commun' | 'epoux1' | 'epoux2';
    setEnfantsContext((prev) =>
      prev.map((e) =>
        validValues.has(e.rattachement) ? e : { ...e, rattachement: defaultValue },
      ),
    );
  }, [enfantRattachementOptions]);

  const predecesAnalysis = useMemo(
    () => buildSuccessionPredecesAnalysis(
      civilContext,
      { ...liquidationContext, nbEnfants },
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
    ),
    [civilContext, liquidationContext, nbEnfants, fiscalSnapshot.dmtgSettings, patrimonialContext.attributionBiensCommunsPct],
  );
  const chainageAnalysis = useMemo(
    () => buildSuccessionChainageAnalysis({
      civil: civilContext,
      liquidation: { ...liquidationContext, nbEnfants },
      regimeUsed: predecesAnalysis.regimeUsed,
      order: chainOrder,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      attributionBiensCommunsPct: patrimonialContext.attributionBiensCommunsPct,
    }),
    [
      civilContext,
      liquidationContext,
      nbEnfants,
      predecesAnalysis.regimeUsed,
      chainOrder,
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
    ],
  );

  const alternateChainageAnalysis = useMemo(
    () => buildSuccessionChainageAnalysis({
      civil: civilContext,
      liquidation: { ...liquidationContext, nbEnfants },
      regimeUsed: predecesAnalysis.regimeUsed,
      order: chainOrder === 'epoux1' ? 'epoux2' : 'epoux1',
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      attributionBiensCommunsPct: patrimonialContext.attributionBiensCommunsPct,
    }),
    [
      civilContext,
      liquidationContext,
      nbEnfants,
      predecesAnalysis.regimeUsed,
      chainOrder,
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
    ],
  );
  const derivedActifNetSuccession = useMemo(() => {
    if (chainageAnalysis.step1) return chainageAnalysis.step1.actifTransmis;
    return liquidationContext.actifEpoux1;
  }, [chainageAnalysis.step1, liquidationContext.actifEpoux1]);
  const devolutionAnalysis = useMemo(
    () => buildSuccessionDevolutionAnalysis(
      civilContext,
      nbEnfants,
      {
        ...devolutionContext,
        nbEnfantsNonCommuns,
      },
      derivedActifNetSuccession,
      patrimonialContext.legsParticuliers,
    ),
    [
      civilContext,
      nbEnfants,
      devolutionContext,
      nbEnfantsNonCommuns,
      derivedActifNetSuccession,
      patrimonialContext.legsParticuliers,
    ],
  );
  const patrimonialAnalysis = useMemo(
    () => buildSuccessionPatrimonialAnalysis(
      civilContext,
      derivedActifNetSuccession,
      nbEnfants,
      patrimonialContext,
    ),
    [civilContext, derivedActifNetSuccession, nbEnfants, patrimonialContext],
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
  const canExportSimplified = chainageAnalysis.applicable && totalActifsLiquidation > 0;
  const canExportCurrentMode = canExport && canExportSimplified;
  const isMarried = civilContext.situationMatrimoniale === 'marie';
  const isPacsed = civilContext.situationMatrimoniale === 'pacse';
  const isConcubinage = civilContext.situationMatrimoniale === 'concubinage';
  const isCommunityRegime = isMarried && (
    civilContext.regimeMatrimonial === 'communaute_legale'
    || civilContext.regimeMatrimonial === 'communaute_universelle'
    || civilContext.regimeMatrimonial === 'communaute_meubles_acquets'
  );
  const isPacsIndivision = isPacsed && civilContext.pacsConvention === 'indivision';
  const showSharedTransmissionPct = isCommunityRegime || isPacsIndivision;
  const showDonationEntreEpoux = isMarried;
  const dispositionsButtonAnchorLabel = isMarried
    ? 'Régime matrimonial'
    : isPacsed
      ? 'Convention PACS'
      : 'Situation familiale';
  const attentions = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...predecesAnalysis.warnings,
      ...chainageAnalysis.warnings,
      ...devolutionAnalysis.warnings,
      ...patrimonialAnalysis.warnings,
    ].filter((warning) => {
      if (seen.has(warning)) return false;
      seen.add(warning);
      return true;
    });
  }, [
    predecesAnalysis.warnings,
    chainageAnalysis.warnings,
    devolutionAnalysis.warnings,
    patrimonialAnalysis.warnings,
  ]);

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
    setDonationsContext(DEFAULT_SUCCESSION_DONATIONS);
    setEnfantsContext(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
    setFamilyMembers(DEFAULT_SUCCESSION_FAMILY_MEMBERS);
    setShowAddMemberPanel(false);
    setAddMemberForm({ type: '', branch: '', parentEnfantId: '' });
    setChainOrder('epoux1');
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

  const addEnfant = useCallback(() => {
    setEnfantsContext((prev) => ([
      ...prev,
      { id: createEnfantId(), rattachement: enfantRattachementOptions[0].value as 'commun' | 'epoux1' | 'epoux2' },
    ]));
  }, [enfantRattachementOptions]);

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

  const setDonationAggregate = useCallback((
    type: SuccessionDonationEntryType,
    amount: number,
  ) => {
    setDonationsContext(buildAggregateDonationEntries({
      rapportable: type === 'rapportable' ? Math.max(0, amount) : donationTotals.rapportable,
      hors_part: type === 'hors_part' ? Math.max(0, amount) : donationTotals.horsPart,
      legs_particulier: type === 'legs_particulier' ? Math.max(0, amount) : donationTotals.legsParticuliers,
    }));
  }, [donationTotals.horsPart, donationTotals.legsParticuliers, donationTotals.rapportable]);

  const addDonationEntry = useCallback(() => {
    setDonationsContext((prev) => ([
      ...prev,
      {
        id: createDonationId(),
        type: 'rapportable',
        montant: 0,
      },
    ]));
  }, []);

  const updateDonationEntry = useCallback((
    id: string,
    field: keyof SuccessionDonationEntry,
    value: string | number,
  ) => {
    setDonationsContext((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      if (field === 'type') {
        return {
          ...entry,
          type: value as SuccessionDonationEntryType,
        };
      }
      if (field === 'montant') {
        return {
          ...entry,
          montant: Math.max(0, Number(value) || 0),
        };
      }
      const stringValue = typeof value === 'string' ? value : String(value);
      return {
        ...entry,
        [field]: stringValue,
      };
    }));
  }, []);

  const removeDonationEntry = useCallback((id: string) => {
    setDonationsContext((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const openDispositionsModal = useCallback(() => {
    setDispositionsDraft({
      attributionBiensCommunsPct: patrimonialContext.attributionBiensCommunsPct,
      donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
      donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
      preciputMontant: patrimonialContext.preciputMontant,
      attributionIntegrale: patrimonialContext.attributionIntegrale,
      testamentActif: devolutionContext.testamentActif,
      typeDispositionTestamentaire: devolutionContext.typeDispositionTestamentaire,
      quotePartLegsTitreUniverselPct: devolutionContext.quotePartLegsTitreUniverselPct,
      ascendantsSurvivants: devolutionContext.ascendantsSurvivants,
    });
    setShowDispositionsModal(true);
  }, [devolutionContext, patrimonialContext]);

  const validateDispositionsModal = useCallback(() => {
    setPatrimonialContext((prev) => ({
      ...prev,
      attributionBiensCommunsPct: dispositionsDraft.attributionBiensCommunsPct,
      donationEntreEpouxActive: dispositionsDraft.donationEntreEpouxActive,
      donationEntreEpouxOption: dispositionsDraft.donationEntreEpouxOption,
      preciputMontant: dispositionsDraft.preciputMontant,
      attributionIntegrale: dispositionsDraft.attributionBiensCommunsPct === 100,
    }));
    setDevolutionContext((prev) => ({
      ...prev,
      testamentActif: dispositionsDraft.testamentActif,
      typeDispositionTestamentaire: dispositionsDraft.testamentActif
        ? (dispositionsDraft.typeDispositionTestamentaire ?? 'legs_universel')
        : null,
      quotePartLegsTitreUniverselPct: dispositionsDraft.quotePartLegsTitreUniverselPct,
      ascendantsSurvivants: dispositionsDraft.ascendantsSurvivants,
    }));
    setShowDispositionsModal(false);
  }, [dispositionsDraft]);

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
          setDonationsContext(parsed.donations);
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
            donationsContext,
          ),
        ),
      );
    } catch {
      // ignore
    }
  }, [hydrated, persistedForm, civilContext, liquidationContext, devolutionContext, patrimonialContext, nbEnfantsNonCommuns, enfantsContext, familyMembers, donationsContext]);

  // Auto-dériver ascendantsSurvivants si des parents sont déclarés dans familyMembers
  useEffect(() => {
    const hasParents = familyMembers.some((m) => m.type === 'parent');
    setDevolutionContext((prev) => {
      if (prev.ascendantsSurvivants === hasParents) return prev;
      return { ...prev, ascendantsSurvivants: hasParents };
    });
  }, [familyMembers]);

  useEffect(() => {
    setPatrimonialContext((prev) => {
      if (
        prev.donationsRapportables === donationTotals.rapportable
        && prev.donationsHorsPart === donationTotals.horsPart
        && prev.legsParticuliers === donationTotals.legsParticuliers
      ) {
        return prev;
      }
      return {
        ...prev,
        donationsRapportables: donationTotals.rapportable,
        donationsHorsPart: donationTotals.horsPart,
        legsParticuliers: donationTotals.legsParticuliers,
      };
    });
  }, [donationTotals.horsPart, donationTotals.legsParticuliers, donationTotals.rapportable]);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'succession') return;
      handleReset();
    });
    return off || (() => {});
  }, [handleReset]);

  useEffect(() => {
    setActifNet(derivedActifNetSuccession);
  }, [derivedActifNetSuccession, setActifNet]);

  const handleExportPptx = useCallback(async () => {
    if (!canExport) return;
    try {
      setExportLoading(true);
      if (canExportSimplified) {
        await exportSuccessionPptx(
          {
            actifNetSuccession: derivedActifNetSuccession,
            totalDroits: chainageAnalysis.totalDroits,
            tauxMoyenGlobal: derivedActifNetSuccession > 0
              ? (chainageAnalysis.totalDroits / derivedActifNetSuccession) * 100
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
    canExportSimplified,
    pptxColors,
    cabinetLogo,
    logoPlacement,
    chainageExportPayload,
    derivedActifNetSuccession,
    chainageAnalysis.totalDroits,
  ]);

  const handleExportXlsx = useCallback(async () => {
    if (!canExport) return;
    try {
      setExportLoading(true);
      if (canExportSimplified) {
        await exportAndDownloadSuccessionXlsx(
          {
            actifNetSuccession: derivedActifNetSuccession,
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
    canExportSimplified,
    pptxColors,
    chainageExportPayload,
    derivedActifNetSuccession,
    nbEnfants,
  ]);

  const exportOptions = [
    {
      label: 'PowerPoint',
      onClick: handleExportPptx,
      disabled: !canExportCurrentMode,
      tooltip: !canExportCurrentMode
        ? 'Renseignez le contexte familial et les actifs pour exporter la chronologie.'
        : undefined,
    },
    {
      label: 'Excel',
      onClick: handleExportXlsx,
      disabled: !canExportCurrentMode,
      tooltip: !canExportCurrentMode
        ? 'Renseignez le contexte familial et les actifs pour exporter la chronologie.'
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
            Estimez les impacts civils d&apos;une succession à partir du contexte familial, du patrimoine et des dispositions saisies.
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
                <button
                  type="button"
                  className="sc-child-add-btn"
                  onClick={openDispositionsModal}
                >
                  + Dispositions
                </button>
                <p className="sc-hint sc-hint--compact">
                  Testament, ascendants et clauses civiles se gèrent ici, sous {dispositionsButtonAnchorLabel.toLowerCase()}.
                </p>
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
                    className="sc-member-add-icon-btn"
                    onClick={() => setShowAddMemberPanel((v) => !v)}
                    aria-label="Ajouter un membre de la famille"
                    title="Ajouter un membre"
                  >
                    +
                  </button>
                </div>


                {enfantsContext.length === 0 && familyMembers.length === 0 ? (
                  <p className="sc-hint sc-hint--compact">Aucun enfant ni membre déclaré pour l&apos;instant.</p>
                ) : (
                  <>
                    {enfantsContext.length > 0 && (
                      <div className="sc-children-list">
                        {enfantsContext.map((enfant, idx) => (
                          <div key={enfant.id} className="sc-child-row">
                            <span className="sc-child-row__label">E{idx + 1}</span>
                            {enfantRattachementOptions.length > 1 && (
                              <ScSelect
                                className="sc-child-select"
                                value={enfant.rattachement}
                                onChange={(value) => updateEnfantRattachement(enfant.id, value as 'commun' | 'epoux1' | 'epoux2')}
                                options={enfantRattachementOptions}
                              />
                            )}
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
                            <span className="sc-member-chip__icon">⊕</span>
                            <span className="sc-member-chip__label">{labelMember(m, enfantsContext)}</span>
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
              <h2 className="sc-card__title">Actifs / Passifs</h2>
              <p className="sc-card__subtitle">
                Saisie agrégée des masses patrimoniales utilisées par les analyses civiles et la chronologie.
              </p>
            </header>
            <div className="sc-card__divider" />

            <div className="sc-civil-grid">
              {(isMarried || isPacsed) && (
                <>
                  <div className="sc-field">
                    <label>{isPacsed ? 'Actif net partenaire 1 (€)' : 'Actif net époux 1 (€)'}</label>
                    <input
                      type="number"
                      min={0}
                      value={liquidationContext.actifEpoux1 || ''}
                      onChange={(e) => setLiquidationField('actifEpoux1', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                  <div className="sc-field">
                    <label>{isPacsed ? 'Actif net partenaire 2 (€)' : 'Actif net époux 2 (€)'}</label>
                    <input
                      type="number"
                      min={0}
                      value={liquidationContext.actifEpoux2 || ''}
                      onChange={(e) => setLiquidationField('actifEpoux2', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                  <div className="sc-field">
                    <label>{isPacsed ? 'Actif indivis (€)' : 'Actif commun (€)'}</label>
                    <input
                      type="number"
                      min={0}
                      value={liquidationContext.actifCommun || ''}
                      onChange={(e) => setLiquidationField('actifCommun', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                </>
              )}
              {isConcubinage && (
                <>
                  <div className="sc-field">
                    <label>Patrimoine du/de la défunt(e) (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={liquidationContext.actifEpoux1 || ''}
                      onChange={(e) => setLiquidationField('actifEpoux1', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                  <div className="sc-field">
                    <label>Patrimoine du concubin / de la concubine (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={liquidationContext.actifEpoux2 || ''}
                      onChange={(e) => setLiquidationField('actifEpoux2', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                </>
              )}
              {!isMarried && !isPacsed && !isConcubinage && (
                <div className="sc-field">
                  <label>Patrimoine net du/de la défunt(e) (€)</label>
                  <input
                    type="number"
                    min={0}
                    value={liquidationContext.actifEpoux1 || ''}
                    onChange={(e) => setLiquidationField('actifEpoux1', Number(e.target.value) || 0)}
                    placeholder="Montant"
                  />
                </div>
              )}
            </div>
            <p className="sc-hint">Enfants pris en compte automatiquement: {nbEnfants}</p>

            {predecesAnalysis.regimeLabel && (
              <p className="sc-hint">
                Régime appliqué pour le calcul: {predecesAnalysis.regimeLabel}.
              </p>
            )}

            <p className="sc-hint sc-hint--compact">
              {chainageAnalysis.applicable
                ? 'Les 2 étapes sont affichées dans la carte de chronologie à droite.'
                : 'La chronologie à 2 décès ne s&apos;applique pas à cette situation ; la masse civile reste analysée à droite.'}
            </p>

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
              <h2 className="sc-card__title">Donations</h2>
              <p className="sc-card__subtitle">
                {isExpert
                  ? 'Saisie détaillée des donations et legs, agrégée automatiquement pour l’analyse civile.'
                  : 'Montants agrégés utilisés pour la lecture civile des libéralités.'}
              </p>
            </header>
            <div className="sc-card__divider" />
            {isExpert ? (
              <>
                {donationsContext.length > 0 ? (
                  <div className="sc-donations-list">
                    {donationsContext.map((entry, idx) => (
                      <div key={entry.id} className="sc-donation-card">
                        <div className="sc-donation-card__header">
                          <strong className="sc-donation-card__title">Donation {idx + 1}</strong>
                          <button
                            type="button"
                            className="sc-remove-btn"
                            onClick={() => removeDonationEntry(entry.id)}
                            title="Supprimer cette donation"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="sc-donation-grid">
                          <div className="sc-field">
                            <label>Type</label>
                            <ScSelect
                              value={entry.type}
                              onChange={(value) => updateDonationEntry(entry.id, 'type', value)}
                              options={DONATION_TYPE_OPTIONS}
                            />
                          </div>
                          <div className="sc-field">
                            <label>Montant (€)</label>
                            <input
                              type="number"
                              min={0}
                              value={entry.montant || ''}
                              onChange={(e) => updateDonationEntry(entry.id, 'montant', Number(e.target.value) || 0)}
                              placeholder="Montant"
                            />
                          </div>
                          <div className="sc-field">
                            <label>Date</label>
                            <input
                              type="date"
                              value={entry.date ?? ''}
                              onChange={(e) => updateDonationEntry(entry.id, 'date', e.target.value)}
                            />
                          </div>
                          <div className="sc-field">
                            <label>Donataire</label>
                            <input
                              type="text"
                              value={entry.donataire ?? ''}
                              onChange={(e) => updateDonationEntry(entry.id, 'donataire', e.target.value)}
                              placeholder="Nom ou qualité"
                            />
                          </div>
                          <div className="sc-field sc-field--full">
                            <label>Description</label>
                            <input
                              type="text"
                              value={entry.description ?? ''}
                              onChange={(e) => updateDonationEntry(entry.id, 'description', e.target.value)}
                              placeholder="Commentaire libre"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="sc-hint sc-hint--compact">Aucune donation détaillée pour l’instant.</p>
                )}

                <div className="sc-inline-actions">
                  <button
                    type="button"
                    className="premium-btn sc-btn sc-btn--secondary"
                    onClick={addDonationEntry}
                  >
                    + Ajouter une donation
                  </button>
                </div>

                <div className="sc-donations-totals">
                  <div className="sc-summary-row">
                    <span>Donations rapportables</span>
                    <strong>{fmt(donationTotals.rapportable)}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Donations hors part</span>
                    <strong>{fmt(donationTotals.horsPart)}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Legs particuliers</span>
                    <strong>{fmt(donationTotals.legsParticuliers)}</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="sc-civil-grid">
                  <div className="sc-field">
                    <label>Donations rapportables (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={donationTotals.rapportable || ''}
                      onChange={(e) => setDonationAggregate('rapportable', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                  <div className="sc-field">
                    <label>Donations hors part (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={donationTotals.horsPart || ''}
                      onChange={(e) => setDonationAggregate('hors_part', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                  <div className="sc-field">
                    <label>Legs particuliers (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={donationTotals.legsParticuliers || ''}
                      onChange={(e) => setDonationAggregate('legs_particulier', Number(e.target.value) || 0)}
                      placeholder="Montant"
                    />
                  </div>
                </div>
                {donationsContext.length > 3 && (
                  <p className="sc-hint sc-hint--compact">
                    Modifier la saisie simplifiée regroupera les donations détaillées par type.
                  </p>
                )}
              </>
            )}
            <p className="sc-hint sc-hint--compact">
              Dispositions civiles et testamentaires : voir le bouton + Dispositions dans Contexte familial.
            </p>
          </div>
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

          {isExpert && (
            <div className="premium-card sc-summary-card sc-hero-card sc-hero-card--secondary">
              <h2 className="sc-summary-title">Analyse civile</h2>
              <div className="sc-card__divider sc-card__divider--tight" />
              <div className="sc-summary-row">
                <span>Masse de calcul estimée</span>
                <strong>{fmt(devolutionAnalysis.masseReference)}</strong>
              </div>
              <div className="sc-summary-row">
                <span>Enfants non communs</span>
                <strong>{nbEnfantsNonCommuns}</strong>
              </div>
              <div className="sc-summary-row">
                <span>Masse civile avant rapport</span>
                <strong>{fmt(patrimonialAnalysis.masseCivileReference)}</strong>
              </div>
              <div className="sc-summary-row">
                <span>Quotité disponible estimée</span>
                <strong>{fmt(patrimonialAnalysis.quotiteDisponibleMontant)}</strong>
              </div>
              <div className="sc-summary-row">
                <span>Libéralités à contrôler</span>
                <strong>{fmt(patrimonialAnalysis.liberalitesImputeesMontant)}</strong>
              </div>
              {patrimonialAnalysis.depassementQuotiteMontant > 0 && (
                <div className="sc-summary-row sc-summary-row--reserve">
                  <span>Dépassement estimé de quotité</span>
                  <strong>{fmt(patrimonialAnalysis.depassementQuotiteMontant)}</strong>
                </div>
              )}
              {devolutionAnalysis.reserve ? (
                <div className="sc-summary-row sc-summary-row--reserve">
                  <span>Réserve / quotité disponible</span>
                  <strong>{devolutionAnalysis.reserve.reserve} / {devolutionAnalysis.reserve.quotiteDisponible}</strong>
                </div>
              ) : (
                <p className="sc-summary-note sc-summary-note--muted">
                  Aucune réserve descendante calculable sans enfant déclaré.
                </p>
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
            </div>
          )}

          <div className="premium-card sc-summary-card sc-hero-card sc-hero-card--secondary">
            <h2 className="sc-summary-title">Points d’attention</h2>
            <div className="sc-card__divider sc-card__divider--tight" />
            <div className="sc-summary-placeholder">
              <div className="sc-summary-row">
                <span>Actif successoral estimé</span>
                <strong>{fmt(derivedActifNetSuccession)}</strong>
              </div>
              <div className="sc-summary-row">
                <span>Enfants pris en compte</span>
                <strong>{nbEnfants}</strong>
              </div>
              {attentions.length > 0 ? (
                <ul className="sc-warning-list sc-warning-list--compact">
                  {attentions.map((warning, idx) => (
                    <li key={`${warning}-${idx}`}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="sc-summary-note sc-summary-note--muted">
                  Aucun avertissement bloquant sur la situation saisie.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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
            <li>La lecture civile repose sur le contexte familial, les masses patrimoniales saisies et les dispositions déclarées.</li>
            <li>La chronologie 2 décès repose sur un chaînage simplifié avec warnings sur les cas non couverts.</li>
            <li>La dévolution légale est présentée en lecture civile simplifiée, sans gestion exhaustive des ordres successoraux.</li>
            <li>Les libéralités et avantages matrimoniaux sont qualifiés de façon indicative, sans recalcul automatique des droits dans ce module.</li>
            <li>L’intégration chiffrée fine (rapport civil détaillé, réduction, liquidation notariale) n’est pas encore modélisée.</li>
            <li>Résultat indicatif, à confirmer par une analyse patrimoniale et notariale.</li>
          </ul>
        )}
      </div>

      {showDispositionsModal && (
        <div
          className="sc-member-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDispositionsModal(false); }}
        >
          <div className="sc-member-modal">
            <div className="sc-member-modal__header">
              <h3 className="sc-member-modal__title">Dispositions particulières</h3>
              <button
                type="button"
                className="sc-member-modal__close"
                onClick={() => setShowDispositionsModal(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="sc-member-modal__body">
              {showSharedTransmissionPct && (
                <div className="sc-field">
                  <label>{isPacsIndivision ? 'Part indivise transmise au survivant (%)' : 'Attribution des biens communs au survivant (%)'}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={dispositionsDraft.attributionBiensCommunsPct}
                    onChange={(e) => setDispositionsDraft((prev) => ({
                      ...prev,
                      attributionBiensCommunsPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    }))}
                  />
                  <p className="sc-hint sc-hint--compact">
                    50 = partage usuel ; 100 = attribution intégrale économique.
                  </p>
                </div>
              )}

              {showDonationEntreEpoux && (
                <div className="sc-field">
                  <label>Donation entre époux</label>
                  <ScSelect
                    value={dispositionsDraft.donationEntreEpouxActive ? 'oui' : 'non'}
                    onChange={(value) => setDispositionsDraft((prev) => ({
                      ...prev,
                      donationEntreEpouxActive: value === 'oui',
                    }))}
                    options={OUI_NON_OPTIONS}
                  />
                </div>
              )}

              {showDonationEntreEpoux && dispositionsDraft.donationEntreEpouxActive && (
                <div className="sc-field">
                  <label>Type de donation entre époux</label>
                  <ScSelect
                    value={dispositionsDraft.donationEntreEpouxOption}
                    onChange={(value) => setDispositionsDraft((prev) => ({
                      ...prev,
                      donationEntreEpouxOption: value as SuccessionDonationEntreEpouxOption,
                    }))}
                    options={DONATION_ENTRE_EPOUX_OPTIONS}
                  />
                  <p className="sc-hint sc-hint--compact">
                    Le choix du type de donation entre époux se fait au moment du décès.
                  </p>
                </div>
              )}

              {isCommunityRegime && (
                <div className="sc-field">
                  <label>Clause de préciput (€)</label>
                  <input
                    type="number"
                    min={0}
                    value={dispositionsDraft.preciputMontant || ''}
                    onChange={(e) => setDispositionsDraft((prev) => ({
                      ...prev,
                      preciputMontant: Math.max(0, Number(e.target.value) || 0),
                    }))}
                    placeholder="Montant"
                  />
                </div>
              )}

              <div className="sc-field">
                <label>Testament actif</label>
                <ScSelect
                  value={dispositionsDraft.testamentActif ? 'oui' : 'non'}
                  onChange={(value) => setDispositionsDraft((prev) => ({
                    ...prev,
                    testamentActif: value === 'oui',
                    typeDispositionTestamentaire: value === 'oui'
                      ? (prev.typeDispositionTestamentaire ?? 'legs_universel')
                      : null,
                  }))}
                  options={OUI_NON_OPTIONS}
                />
              </div>

              {dispositionsDraft.testamentActif && (
                <div className="sc-field">
                  <label>Type de disposition testamentaire</label>
                  <ScSelect
                    value={dispositionsDraft.typeDispositionTestamentaire ?? 'legs_universel'}
                    onChange={(value) => setDispositionsDraft((prev) => ({
                      ...prev,
                      typeDispositionTestamentaire: value as SuccessionDispositionTestamentaire,
                    }))}
                    options={DISPOSITION_TESTAMENTAIRE_OPTIONS}
                  />
                </div>
              )}

              {dispositionsDraft.testamentActif
                && dispositionsDraft.typeDispositionTestamentaire === 'legs_titre_universel' && (
                <div className="sc-field">
                  <label>Quote-part du legs à titre universel (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={dispositionsDraft.quotePartLegsTitreUniverselPct}
                    onChange={(e) => setDispositionsDraft((prev) => ({
                      ...prev,
                      quotePartLegsTitreUniverselPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    }))}
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
                      value={dispositionsDraft.ascendantsSurvivants ? 'oui' : 'non'}
                      onChange={(value) => setDispositionsDraft((prev) => ({
                        ...prev,
                        ascendantsSurvivants: value === 'oui',
                      }))}
                      options={OUI_NON_OPTIONS}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="sc-member-modal__footer">
              <button
                type="button"
                className="sc-member-modal__btn sc-member-modal__btn--secondary"
                onClick={() => setShowDispositionsModal(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="sc-member-modal__btn sc-member-modal__btn--primary"
                onClick={validateDispositionsModal}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMemberPanel && (
        <div
          className="sc-member-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddMemberPanel(false); }}
        >
          <div className="sc-member-modal">
            <div className="sc-member-modal__header">
              <h3 className="sc-member-modal__title">Ajouter un membre</h3>
              <button
                type="button"
                className="sc-member-modal__close"
                onClick={() => setShowAddMemberPanel(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="sc-member-modal__body">
              <div className="sc-field">
                <label>Type de membre</label>
                <ScSelect
                  value={addMemberForm.type}
                  onChange={(value) => setAddMemberForm((prev) => ({ ...prev, type: value as FamilyMemberType, branch: '', parentEnfantId: '' }))}
                  options={[{ value: '', label: 'Choisir…', disabled: true }, ...MEMBER_TYPE_OPTIONS]}
                />
              </div>
              {MEMBER_TYPE_NEEDS_BRANCH.includes(addMemberForm.type as FamilyMemberType) && (
                <div className="sc-field">
                  <label>Branche familiale</label>
                  <ScSelect
                    value={addMemberForm.branch}
                    onChange={(value) => setAddMemberForm((prev) => ({ ...prev, branch: value as FamilyBranch }))}
                    options={[{ value: '', label: 'Choisir…', disabled: true }, ...branchOptions]}
                  />
                </div>
              )}
              {addMemberForm.type === 'petit_enfant' && (
                <div className="sc-field">
                  <label>Enfant parent</label>
                  <ScSelect
                    value={addMemberForm.parentEnfantId}
                    onChange={(value) => setAddMemberForm((prev) => ({ ...prev, parentEnfantId: value }))}
                    options={[
                      { value: '', label: 'Choisir…', disabled: true },
                      ...enfantsContext.map((e, i) => ({ value: e.id, label: `E${i + 1}` })),
                    ]}
                  />
                </div>
              )}
            </div>
            <div className="sc-member-modal__footer">
              <button
                type="button"
                className="sc-member-modal__btn sc-member-modal__btn--secondary"
                onClick={() => setShowAddMemberPanel(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="sc-member-modal__btn sc-member-modal__btn--primary"
                onClick={addFamilyMember}
                disabled={
                  !addMemberForm.type
                  || (MEMBER_TYPE_NEEDS_BRANCH.includes(addMemberForm.type as FamilyMemberType) && !addMemberForm.branch)
                  || (addMemberForm.type === 'petit_enfant' && !addMemberForm.parentEnfantId)
                }
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
