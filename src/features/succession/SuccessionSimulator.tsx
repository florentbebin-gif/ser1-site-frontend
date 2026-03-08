/**
 * SuccessionSimulator — Simulateur Succession
 *
 * PR1-PR3 scope:
 * - Alignement UI sur la norme /sim/*
 * - Saisie guidée civile / patrimoniale
 * - Actifs détaillés expert + assurance-vie informative
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
  DEFAULT_SUCCESSION_ASSET_DETAILS,
  DEFAULT_SUCCESSION_ASSURANCE_VIE,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
  type SuccessionAssetCategory,
  type SuccessionAssetDetailEntry,
  type SuccessionAssetOwner,
  type SuccessionAssuranceVieContractType,
  type SuccessionAssuranceVieEntry,
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
import {
  countEffectiveDescendantBranches,
  countLivingEnfants,
  countLivingNonCommuns,
  getEnfantNodeLabel,
  getEnfantParentLabel,
  getEnfantRattachementOptions,
} from './successionEnfants';
import { buildSuccessionAvFiscalAnalysis } from './successionAvFiscal';
import { buildSuccessionFiscalSnapshot } from './successionFiscalContext';
import { buildSuccessionPatrimonialAnalysis } from './successionPatrimonial';
import { buildSuccessionPredecesAnalysis } from './successionPredeces';
import {
  buildSuccessionChainageAnalysis,
  type SuccessionChainOrder,
} from './successionChainage';
import { buildSuccessionDirectDisplayAnalysis } from './successionDisplay';
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

const ASSET_CATEGORY_OPTIONS: { value: SuccessionAssetCategory; label: string }[] = [
  { value: 'immobilier', label: 'Biens immobiliers' },
  { value: 'financier', label: 'Biens financiers et autres biens' },
  { value: 'professionnel', label: 'Biens professionnels' },
  { value: 'divers', label: 'Biens divers' },
  { value: 'passif', label: 'Passifs' },
];

const ASSET_SUBCATEGORY_OPTIONS: Record<SuccessionAssetCategory, string[]> = {
  immobilier: [
    'Résidence principale',
    'Résidence secondaire',
    'Immobilier locatif',
    'Autre immobilier',
    'Droits en usufruit',
  ],
  financier: [
    'Comptes bancaires',
    'Valeurs mobilières',
    'Épargne réglementée',
    'Autres biens financiers',
  ],
  professionnel: [
    'Parts sociales',
    'Fonds de commerce',
    'Autres biens professionnels',
  ],
  divers: [
    'Véhicules',
    'Mobilier',
    'Autres biens divers',
  ],
  passif: [
    'Emprunts immobiliers',
    'Dettes diverses',
    'Passifs professionnels',
  ],
};

const ASSURANCE_VIE_TYPE_OPTIONS: { value: SuccessionAssuranceVieContractType; label: string }[] = [
  { value: 'standard', label: 'Clause standard' },
  { value: 'demembree', label: 'Clause démembrée' },
  { value: 'personnalisee', label: 'Clause personnalisée' },
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

function createAssetId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAssuranceVieId(): string {
  return `av-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDonationEffectiveAmount(entry: SuccessionDonationEntry): number {
  return Math.max(0, entry.valeurActuelle ?? entry.montant);
}

function buildAggregateAssetEntries(values: {
  actifs: Record<SuccessionAssetOwner, number>;
  passifs: Record<SuccessionAssetOwner, number>;
}): SuccessionAssetDetailEntry[] {
  const order: SuccessionAssetOwner[] = ['epoux1', 'epoux2', 'commun'];
  const entries: SuccessionAssetDetailEntry[] = [];

  order.forEach((owner) => {
    if (values.actifs[owner] > 0) {
      entries.push({
        id: createAssetId(),
        owner,
        category: 'divers',
        subCategory: 'Saisie agrégée',
        amount: values.actifs[owner],
        label: 'Actifs simplifiés',
      });
    }
    if (values.passifs[owner] > 0) {
      entries.push({
        id: createAssetId(),
        owner,
        category: 'passif',
        subCategory: 'Saisie agrégée',
        amount: values.passifs[owner],
        label: 'Passifs simplifiés',
      });
    }
  });

  return entries;
}

function labelMember(m: FamilyMember, enfants: SuccessionEnfant[]): string {
  const typeLabel = MEMBER_TYPE_OPTIONS.find((o) => o.value === m.type)?.label ?? m.type;
  if (m.type === 'petit_enfant' && m.parentEnfantId) {
    const idx = enfants.findIndex((e) => e.id === m.parentEnfantId);
    return idx >= 0 ? `${typeLabel} (fils/fille de ${getEnfantNodeLabel(idx, enfants[idx]?.deceased)})` : typeLabel;
  }
  if (m.branch) {
    const branchLabel = BRANCH_OPTIONS.find((o) => o.value === m.branch)?.label ?? m.branch;
    return `${typeLabel} (${branchLabel})`;
  }
  return typeLabel;
}

const CLAUSE_BENEFICIAIRE_PRESETS: { value: string; label: string }[] = [
  { value: 'conjoint_enfants', label: 'Conjoint survivant, à défaut enfants, à défaut héritiers' },
  { value: 'enfants_parts_egales', label: 'Les enfants par parts égales' },
  { value: 'personnalisee', label: 'Personnalisée' },
];

const CLAUSE_CONJOINT_LABEL = 'Conjoint survivant, à défaut enfants, à défaut héritiers';
const CLAUSE_ENFANTS_LABEL = 'Les enfants par parts égales';

function getClausePreset(clause?: string): string {
  if (!clause || clause === CLAUSE_CONJOINT_LABEL) return 'conjoint_enfants';
  if (clause === CLAUSE_ENFANTS_LABEL) return 'enfants_parts_egales';
  return 'personnalisee';
}

function parseCustomClause(clause: string): Record<string, number> {
  if (!clause.startsWith('CUSTOM:')) return {};
  const result: Record<string, number> = {};
  for (const part of clause.slice(7).split(';')) {
    const sep = part.indexOf(':');
    if (sep > 0) result[part.slice(0, sep)] = Number(part.slice(sep + 1)) || 0;
  }
  return result;
}

function serializeCustomClause(parts: Record<string, number>): string {
  return 'CUSTOM:' + Object.entries(parts).map(([id, pct]) => `${id}:${pct}`).join(';');
}

const CHAIN_ORDER_OPTIONS: { value: SuccessionChainOrder; label: string }[] = [
  { value: 'epoux1', label: 'Époux 1 décède en premier' },
  { value: 'epoux2', label: 'Époux 2 décède en premier' },
];

const SC_DONUT_R = 27;
const SC_DONUT_CIRC = 2 * Math.PI * SC_DONUT_R;

function ScDonut({ transmis, droits }: { transmis: number; droits: number }) {
  const total = transmis + droits;
  if (total <= 0) {
    return (
      <svg width="68" height="68" viewBox="0 0 68 68" className="sc-synth-donut" aria-hidden="true">
        <circle cx={34} cy={34} r={SC_DONUT_R} fill="none" stroke="var(--color-c8)" strokeWidth="9" />
      </svg>
    );
  }
  const netLen = (transmis / total) * SC_DONUT_CIRC;
  const droitsLen = SC_DONUT_CIRC - netLen;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" className="sc-synth-donut" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={34} cy={34} r={SC_DONUT_R} fill="none" stroke="var(--color-c8)" strokeWidth="9" />
      <circle cx={34} cy={34} r={SC_DONUT_R} fill="none" stroke="var(--color-c5)" strokeWidth="9"
        strokeDasharray={`${netLen} ${SC_DONUT_CIRC}`} strokeDashoffset="0" strokeLinecap="butt" />
      <circle cx={34} cy={34} r={SC_DONUT_R} fill="none" stroke="var(--color-c6)" strokeWidth="9"
        strokeDasharray={`${droitsLen} ${SC_DONUT_CIRC}`} strokeDashoffset={`${-netLen}`} strokeLinecap="butt" />
    </svg>
  );
}

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
  const [assetEntries, setAssetEntries] = useState<SuccessionAssetDetailEntry[]>(DEFAULT_SUCCESSION_ASSET_DETAILS);
  const [assuranceVieEntries, setAssuranceVieEntries] = useState<SuccessionAssuranceVieEntry[]>(DEFAULT_SUCCESSION_ASSURANCE_VIE);
  const [devolutionContext, setDevolutionContext] = useState(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
  const [patrimonialContext, setPatrimonialContext] = useState(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
  const [donationsContext, setDonationsContext] = useState<SuccessionDonationEntry[]>(DEFAULT_SUCCESSION_DONATIONS);
  const [enfantsContext, setEnfantsContext] = useState<SuccessionEnfant[]>(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(DEFAULT_SUCCESSION_FAMILY_MEMBERS);
  const [showAddMemberPanel, setShowAddMemberPanel] = useState(false);
  const [showDispositionsModal, setShowDispositionsModal] = useState(false);
  const [showAssuranceVieModal, setShowAssuranceVieModal] = useState(false);
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

  const nbEnfants = useMemo(() => countLivingEnfants(enfantsContext), [enfantsContext]);
  const nbDescendantBranches = useMemo(
    () => countEffectiveDescendantBranches(enfantsContext, familyMembers),
    [enfantsContext, familyMembers],
  );
  const nbEnfantsNonCommuns = useMemo(
    () => countLivingNonCommuns(enfantsContext),
    [enfantsContext],
  );
  const donationTotals = useMemo(() => donationsContext.reduce((totals, entry) => {
    const amount = getDonationEffectiveAmount(entry);
    if (entry.type === 'rapportable') totals.rapportable += amount;
    if (entry.type === 'hors_part') totals.horsPart += amount;
    if (entry.type === 'legs_particulier') totals.legsParticuliers += amount;
    return totals;
  }, {
    rapportable: 0,
    horsPart: 0,
    legsParticuliers: 0,
  }), [donationsContext]);

  const enfantRattachementOptions = useMemo(
    () => getEnfantRattachementOptions(civilContext.situationMatrimoniale),
    [civilContext.situationMatrimoniale],
  );

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
      { ...liquidationContext, nbEnfants: nbDescendantBranches },
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
    ),
    [civilContext, liquidationContext, nbDescendantBranches, fiscalSnapshot.dmtgSettings, patrimonialContext.attributionBiensCommunsPct],
  );
  const chainageAnalysis = useMemo(
    () => buildSuccessionChainageAnalysis({
      civil: civilContext,
      liquidation: { ...liquidationContext, nbEnfants: nbDescendantBranches },
      regimeUsed: predecesAnalysis.regimeUsed,
      order: chainOrder,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      attributionBiensCommunsPct: patrimonialContext.attributionBiensCommunsPct,
      enfantsContext,
      familyMembers,
    }),
    [
      civilContext,
      liquidationContext,
      nbDescendantBranches,
      predecesAnalysis.regimeUsed,
      chainOrder,
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
      enfantsContext,
      familyMembers,
    ],
  );

  const derivedActifNetSuccession = useMemo(() => {
    if (chainageAnalysis.step1) return chainageAnalysis.step1.actifTransmis;
    return liquidationContext.actifEpoux1;
  }, [chainageAnalysis.step1, liquidationContext.actifEpoux1]);
  const devolutionAnalysis = useMemo(
    () => buildSuccessionDevolutionAnalysis(
      civilContext,
      nbDescendantBranches,
      {
        ...devolutionContext,
        nbEnfantsNonCommuns,
      },
      derivedActifNetSuccession,
      patrimonialContext.legsParticuliers,
      enfantsContext,
      familyMembers,
    ),
    [
      civilContext,
      nbDescendantBranches,
      devolutionContext,
      nbEnfantsNonCommuns,
      derivedActifNetSuccession,
      patrimonialContext.legsParticuliers,
      enfantsContext,
      familyMembers,
    ],
  );
  const patrimonialAnalysis = useMemo(
    () => buildSuccessionPatrimonialAnalysis(
      civilContext,
      derivedActifNetSuccession,
      nbDescendantBranches,
      patrimonialContext,
      donationsContext,
      fiscalSnapshot,
    ),
    [civilContext, derivedActifNetSuccession, nbDescendantBranches, patrimonialContext, donationsContext, fiscalSnapshot],
  );
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
  const assetOwnerOptions = useMemo((): { value: SuccessionAssetOwner; label: string }[] => {
    if (isMarried) {
      return [
        { value: 'epoux1', label: 'Époux 1' },
        { value: 'epoux2', label: 'Époux 2' },
        { value: 'commun', label: 'Communauté' },
      ];
    }
    if (isPacsed) {
      return [
        { value: 'epoux1', label: 'Partenaire 1' },
        { value: 'epoux2', label: 'Partenaire 2' },
        { value: 'commun', label: 'Indivision' },
      ];
    }
    if (isConcubinage) {
      return [
        { value: 'epoux1', label: 'Personne 1' },
        { value: 'epoux2', label: 'Personne 2' },
      ];
    }
    return [{ value: 'epoux1', label: 'Défunt(e)' }];
  }, [isConcubinage, isMarried, isPacsed]);
  const assuranceViePartyOptions = useMemo(
    () => assetOwnerOptions.filter((option) => option.value !== 'commun') as { value: 'epoux1' | 'epoux2'; label: string }[],
    [assetOwnerOptions],
  );

  const donateurOptions = useMemo(
    () => assetOwnerOptions.filter((o) => o.value !== 'commun'),
    [assetOwnerOptions],
  );

  const donatairesOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    if (isMarried) opts.push({ value: 'conjoint', label: 'Conjoint(e)' });
    else if (isPacsed) opts.push({ value: 'conjoint', label: 'Partenaire' });
    enfantsContext.forEach((enfant, idx) => {
      const prenom = enfant.prenom?.trim();
      opts.push({ value: enfant.id, label: prenom ? prenom : `Enfant ${idx + 1}` });
    });
    const memberTypeLabel: Record<string, string> = {
      petit_enfant: 'Petit-enfant',
      parent: 'Parent',
      frere_soeur: 'Frère/Sœur',
      oncle_tante: 'Oncle/Tante',
      tierce_personne: 'Tierce personne',
    };
    familyMembers.forEach((member) => {
      opts.push({ value: member.id, label: memberTypeLabel[member.type] ?? 'Membre' });
    });
    opts.push({ value: 'autre', label: 'Autre' });
    return opts;
  }, [isMarried, isPacsed, enfantsContext, familyMembers]);
  const assetBreakdown = useMemo(() => assetEntries.reduce((totals, entry) => {
    if (entry.category === 'passif') {
      totals.passifs[entry.owner] += entry.amount;
    } else {
      totals.actifs[entry.owner] += entry.amount;
    }
    return totals;
  }, {
    actifs: {
      epoux1: 0,
      epoux2: 0,
      commun: 0,
    },
    passifs: {
      epoux1: 0,
      epoux2: 0,
      commun: 0,
    },
  } as {
    actifs: Record<SuccessionAssetOwner, number>;
    passifs: Record<SuccessionAssetOwner, number>;
  }), [assetEntries]);
  const assetNetTotals = useMemo(() => ({
    epoux1: Math.max(0, assetBreakdown.actifs.epoux1 - assetBreakdown.passifs.epoux1),
    epoux2: Math.max(0, assetBreakdown.actifs.epoux2 - assetBreakdown.passifs.epoux2),
    commun: Math.max(0, assetBreakdown.actifs.commun - assetBreakdown.passifs.commun),
  }), [assetBreakdown]);
  const assuranceVieTotals = useMemo(() => assuranceVieEntries.reduce((totals, entry) => ({
    capitaux: totals.capitaux + entry.capitauxDeces,
    versementsApres70: totals.versementsApres70 + entry.versementsApres70,
  }), {
    capitaux: 0,
    versementsApres70: 0,
  }), [assuranceVieEntries]);
  const avFiscalAnalysis = useMemo(
    () => buildSuccessionAvFiscalAnalysis(
      assuranceVieEntries,
      civilContext,
      enfantsContext,
      familyMembers,
      fiscalSnapshot,
    ),
    [assuranceVieEntries, civilContext, enfantsContext, familyMembers, fiscalSnapshot],
  );
  const assuranceVieByAssure = useMemo(() => assuranceVieEntries.reduce((totals, entry) => {
    totals[entry.assure] += entry.capitauxDeces;
    return totals;
  }, {
    epoux1: 0,
    epoux2: 0,
  } as Record<'epoux1' | 'epoux2', number>), [assuranceVieEntries]);
  const assetEntriesByCategory = useMemo(() => ASSET_CATEGORY_OPTIONS.map((category) => ({
    ...category,
    entries: assetEntries.filter((entry) => entry.category === category.value),
  })), [assetEntries]);
  const displayUsesChainage = Boolean(isMarried
    && chainageAnalysis.applicable
    && chainageAnalysis.step1
    && chainageAnalysis.step2);
  const directDisplayAnalysis = useMemo(
    () => buildSuccessionDirectDisplayAnalysis({
      civil: civilContext,
      devolution: devolutionAnalysis,
      devolutionContext,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      enfantsContext,
      familyMembers,
      order: chainOrder,
    }),
    [
      civilContext,
      devolutionAnalysis,
      devolutionContext,
      fiscalSnapshot.dmtgSettings,
      enfantsContext,
      familyMembers,
      chainOrder,
    ],
  );
  const displayActifNetSuccession = useMemo(
    () => (displayUsesChainage ? derivedActifNetSuccession : directDisplayAnalysis.actifNetSuccession),
    [displayUsesChainage, derivedActifNetSuccession, directDisplayAnalysis.actifNetSuccession],
  );
  const displayAssuranceVieTransmise = useMemo(() => {
    if (displayUsesChainage) return assuranceVieByAssure[chainageAnalysis.order];
    return assuranceVieByAssure[directDisplayAnalysis.simulatedDeceased];
  }, [
    assuranceVieByAssure,
    chainageAnalysis.order,
    directDisplayAnalysis.simulatedDeceased,
    displayUsesChainage,
  ]);
  const derivedMasseTransmise = useMemo(
    () => displayActifNetSuccession + displayAssuranceVieTransmise,
    [displayActifNetSuccession, displayAssuranceVieTransmise],
  );
  const derivedTotalDroits = useMemo(
    () => (displayUsesChainage
      ? chainageAnalysis.totalDroits
      : (directDisplayAnalysis.result?.totalDroits ?? 0)) + avFiscalAnalysis.totalDroits,
    [displayUsesChainage, chainageAnalysis.totalDroits, directDisplayAnalysis.result?.totalDroits, avFiscalAnalysis.totalDroits],
  );
  const synthDonutTransmis = useMemo(() => {
    if (displayUsesChainage) {
      const step1 = chainageAnalysis.step1;
      const step2 = chainageAnalysis.step2;
      if (!step1 || !step2) return derivedMasseTransmise;
      return step1.actifTransmis
        + step2.actifTransmis
        + assuranceVieByAssure.epoux1
        + assuranceVieByAssure.epoux2;
    }
    return derivedMasseTransmise;
  }, [displayUsesChainage, chainageAnalysis, assuranceVieByAssure, derivedMasseTransmise]);
  const synthHypothese = useMemo(() => {
    if (!isMarried || nbDescendantBranches === 0) return null;
    if (patrimonialContext.donationEntreEpouxActive) {
      const opt = DONATION_ENTRE_EPOUX_OPTIONS.find((o) => o.value === patrimonialContext.donationEntreEpouxOption);
      return `Disposition : ${opt?.label ?? patrimonialContext.donationEntreEpouxOption}`;
    }
    return 'Hypothèse moteur : 1/4 en pleine propriété pour le conjoint survivant';
  }, [isMarried, nbDescendantBranches, patrimonialContext.donationEntreEpouxActive, patrimonialContext.donationEntreEpouxOption]);
  const transmissionRows = useMemo(() => {
    if (displayUsesChainage) {
      const { step1, step2, order } = chainageAnalysis;
      if (!step1 || !step2) return [];
      const otherOrder = order === 'epoux1' ? 'epoux2' : 'epoux1';
      const avCapital = assuranceVieByAssure[order] + assuranceVieByAssure[otherOrder];
      return [
        {
          label: 'Descendants',
          brut: step1.partEnfants + step2.partEnfants,
          droits: step1.droitsEnfants + step2.droitsEnfants,
          net: (step1.partEnfants + step2.partEnfants) - (step1.droitsEnfants + step2.droitsEnfants),
        },
        ...(step1.partConjoint > 0 ? [{
          label: 'Conjoint survivant',
          brut: step1.partConjoint,
          droits: 0,
          net: step1.partConjoint,
          exonerated: true,
        }] : []),
        ...(avCapital > 0 ? [{
          label: 'Assurance-vie',
          brut: avCapital,
          droits: avFiscalAnalysis.totalDroits,
          net: avCapital - avFiscalAnalysis.totalDroits,
        }] : []),
      ];
    }

    return [
      ...directDisplayAnalysis.transmissionRows,
      ...(displayAssuranceVieTransmise > 0 ? [{
        label: 'Assurance-vie',
        brut: displayAssuranceVieTransmise,
        droits: avFiscalAnalysis.byAssure[directDisplayAnalysis.simulatedDeceased].totalDroits,
        net: displayAssuranceVieTransmise - avFiscalAnalysis.byAssure[directDisplayAnalysis.simulatedDeceased].totalDroits,
      }] : []),
    ];
  }, [
    displayUsesChainage,
    chainageAnalysis,
    assuranceVieByAssure,
    avFiscalAnalysis.totalDroits,
    avFiscalAnalysis.byAssure,
    directDisplayAnalysis.transmissionRows,
    directDisplayAnalysis.simulatedDeceased,
    displayAssuranceVieTransmise,
  ]);
  const chainageExportPayload = useMemo(
    () => ({
      applicable: displayUsesChainage,
      order: chainageAnalysis.order,
      firstDecedeLabel: chainageAnalysis.firstDecedeLabel,
      secondDecedeLabel: chainageAnalysis.secondDecedeLabel,
      step1: displayUsesChainage && chainageAnalysis.step1 ? {
        actifTransmis: chainageAnalysis.step1.actifTransmis,
        assuranceVieTransmise: assuranceVieByAssure[chainageAnalysis.order],
        masseTotaleTransmise: chainageAnalysis.step1.actifTransmis + assuranceVieByAssure[chainageAnalysis.order],
        droitsAssuranceVie: avFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits,
        partConjoint: chainageAnalysis.step1.partConjoint,
        partEnfants: chainageAnalysis.step1.partEnfants,
        droitsEnfants: chainageAnalysis.step1.droitsEnfants,
      } : null,
      step2: displayUsesChainage && chainageAnalysis.step2 ? {
        actifTransmis: chainageAnalysis.step2.actifTransmis,
        assuranceVieTransmise: assuranceVieByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        masseTotaleTransmise: chainageAnalysis.step2.actifTransmis
          + assuranceVieByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        droitsAssuranceVie: avFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits,
        partConjoint: chainageAnalysis.step2.partConjoint,
        partEnfants: chainageAnalysis.step2.partEnfants,
        droitsEnfants: chainageAnalysis.step2.droitsEnfants,
      } : null,
      assuranceVieTotale: assuranceVieTotals.capitaux,
      totalDroits: derivedTotalDroits,
      warnings: displayUsesChainage
        ? [...chainageAnalysis.warnings, ...avFiscalAnalysis.warnings]
        : [
          ...(isPacsed
            ? ['PACS: la synthèse fiscale affichée repose sur le décès simulé du partenaire sélectionné, pas sur une chronologie 2 décès.']
            : ['Chronologie 2 décès non utilisée pour cette situation : la synthèse repose sur la succession directe du défunt simulé.']),
          ...directDisplayAnalysis.warnings,
          ...avFiscalAnalysis.warnings,
        ],
    }),
    [
      displayUsesChainage,
      chainageAnalysis,
      assuranceVieByAssure,
      assuranceVieTotals.capitaux,
      avFiscalAnalysis,
      derivedTotalDroits,
      isPacsed,
      directDisplayAnalysis.warnings,
    ],
  );
  const totalActifsLiquidation = useMemo(
    () => Math.max(
      0,
      liquidationContext.actifEpoux1 + liquidationContext.actifEpoux2 + liquidationContext.actifCommun,
    ),
    [liquidationContext],
  );
  const canExportSimplified = (displayActifNetSuccession > 0 || totalActifsLiquidation > 0 || assuranceVieTotals.capitaux > 0);
  const canExportCurrentMode = canExport && canExportSimplified;
  const attentions = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...predecesAnalysis.warnings,
      ...chainageAnalysis.warnings,
      ...devolutionAnalysis.warnings,
      ...(!displayUsesChainage ? directDisplayAnalysis.warnings : []),
      ...patrimonialAnalysis.warnings,
      ...avFiscalAnalysis.warnings,
    ].filter((warning) => {
      if (seen.has(warning)) return false;
      seen.add(warning);
      return true;
    });
  }, [
    predecesAnalysis.warnings,
    chainageAnalysis.warnings,
    devolutionAnalysis.warnings,
    displayUsesChainage,
    directDisplayAnalysis.warnings,
    patrimonialAnalysis.warnings,
    avFiscalAnalysis.warnings,
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
    setAssetEntries(DEFAULT_SUCCESSION_ASSET_DETAILS);
    setAssuranceVieEntries(DEFAULT_SUCCESSION_ASSURANCE_VIE);
    setDevolutionContext(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
    setPatrimonialContext(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
    setDonationsContext(DEFAULT_SUCCESSION_DONATIONS);
    setEnfantsContext(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
    setFamilyMembers(DEFAULT_SUCCESSION_FAMILY_MEMBERS);
    setShowAddMemberPanel(false);
    setShowAssuranceVieModal(false);
    setAddMemberForm({ type: '', branch: '', parentEnfantId: '' });
    setChainOrder('epoux1');
    setHypothesesOpen(false);
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      // ignore
    }
  }, [reset]);

  const setSimplifiedBalanceField = useCallback((
    type: 'actifs' | 'passifs',
    owner: SuccessionAssetOwner,
    value: number,
  ) => {
    setAssetEntries(buildAggregateAssetEntries({
      actifs: {
        epoux1: owner === 'epoux1' && type === 'actifs' ? Math.max(0, value) : assetBreakdown.actifs.epoux1,
        epoux2: owner === 'epoux2' && type === 'actifs' ? Math.max(0, value) : assetBreakdown.actifs.epoux2,
        commun: owner === 'commun' && type === 'actifs' ? Math.max(0, value) : assetBreakdown.actifs.commun,
      },
      passifs: {
        epoux1: owner === 'epoux1' && type === 'passifs' ? Math.max(0, value) : assetBreakdown.passifs.epoux1,
        epoux2: owner === 'epoux2' && type === 'passifs' ? Math.max(0, value) : assetBreakdown.passifs.epoux2,
        commun: owner === 'commun' && type === 'passifs' ? Math.max(0, value) : assetBreakdown.passifs.commun,
      },
    }));
  }, [assetBreakdown.actifs.commun, assetBreakdown.actifs.epoux1, assetBreakdown.actifs.epoux2, assetBreakdown.passifs.commun, assetBreakdown.passifs.epoux1, assetBreakdown.passifs.epoux2]);

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

  const toggleEnfantDeceased = useCallback((id: string, deceased: boolean) => {
    setEnfantsContext((prev) => prev.map((enfant) => (
      enfant.id === id
        ? { ...enfant, deceased: deceased || undefined }
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
    value: string | number | boolean,
  ) => {
    setDonationsContext((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      if (field === 'type') return { ...entry, type: value as SuccessionDonationEntryType };
      if (field === 'montant' || field === 'valeurDonation' || field === 'valeurActuelle') {
        return { ...entry, [field]: Math.max(0, Number(value) || 0) };
      }
      if (field === 'donSommeArgentExonere' || field === 'avecReserveUsufruit') {
        return { ...entry, [field]: Boolean(value) };
      }
      return { ...entry, [field]: typeof value === 'string' ? value : String(value) };
    }));
  }, []);

  const removeDonationEntry = useCallback((id: string) => {
    setDonationsContext((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const addAssetEntry = useCallback((category: SuccessionAssetCategory) => {
    setAssetEntries((prev) => ([
      ...prev,
      {
        id: createAssetId(),
        owner: assetOwnerOptions[0]?.value ?? 'epoux1',
        category,
        subCategory: ASSET_SUBCATEGORY_OPTIONS[category][0] ?? 'Saisie libre',
        amount: 0,
      },
    ]));
  }, [assetOwnerOptions]);

  const updateAssetEntry = useCallback((
    id: string,
    field: keyof SuccessionAssetDetailEntry,
    value: string | number,
  ) => {
    setAssetEntries((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      if (field === 'amount') {
        return {
          ...entry,
          amount: Math.max(0, Number(value) || 0),
        };
      }
      if (field === 'category') {
        const category = value as SuccessionAssetCategory;
        return {
          ...entry,
          category,
          subCategory: ASSET_SUBCATEGORY_OPTIONS[category][0] ?? 'Saisie libre',
        };
      }
      return {
        ...entry,
        [field]: value,
      };
    }));
  }, []);

  const removeAssetEntry = useCallback((id: string) => {
    setAssetEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const addAssuranceVieEntry = useCallback(() => {
    setAssuranceVieEntries((prev) => ([
      ...prev,
      {
        id: createAssuranceVieId(),
        typeContrat: 'standard',
        souscripteur: assuranceViePartyOptions[0]?.value ?? 'epoux1',
        assure: assuranceViePartyOptions[0]?.value ?? 'epoux1',
        capitauxDeces: 0,
        versementsApres70: 0,
      },
    ]));
  }, [assuranceViePartyOptions]);

  const updateAssuranceVieEntry = useCallback((
    id: string,
    field: keyof SuccessionAssuranceVieEntry,
    value: string | number | undefined,
  ) => {
    setAssuranceVieEntries((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      if (field === 'capitauxDeces' || field === 'versementsApres70') {
        return {
          ...entry,
          [field]: Math.max(0, Number(value) || 0),
        };
      }
      if (field === 'ageUsufruitier') {
        const age = Number(value);
        return {
          ...entry,
          ageUsufruitier: Number.isFinite(age) && age > 0 ? age : undefined,
        };
      }
      return {
        ...entry,
        [field]: value,
      };
    }));
  }, []);

  const removeAssuranceVieEntry = useCallback((id: string) => {
    setAssuranceVieEntries((prev) => prev.filter((entry) => entry.id !== id));
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
          setAssetEntries(parsed.assetEntries);
          setAssuranceVieEntries(parsed.assuranceVieEntries);
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
            assetEntries,
            assuranceVieEntries,
          ),
        ),
      );
    } catch {
      // ignore
    }
  }, [hydrated, persistedForm, civilContext, liquidationContext, devolutionContext, patrimonialContext, nbEnfantsNonCommuns, enfantsContext, familyMembers, donationsContext, assetEntries, assuranceVieEntries]);

  // Auto-dériver ascendantsSurvivants si des parents sont déclarés dans familyMembers
  useEffect(() => {
    const hasParents = familyMembers.some((m) => m.type === 'parent');
    setDevolutionContext((prev) => {
      if (prev.ascendantsSurvivants === hasParents) return prev;
      return { ...prev, ascendantsSurvivants: hasParents };
    });
  }, [familyMembers]);

  useEffect(() => {
    setLiquidationContext((prev) => {
      const next = {
        actifEpoux1: assetNetTotals.epoux1,
        actifEpoux2: assetNetTotals.epoux2,
        actifCommun: assetNetTotals.commun,
        nbEnfants,
      };
      if (
        prev.actifEpoux1 === next.actifEpoux1
        && prev.actifEpoux2 === next.actifEpoux2
        && prev.actifCommun === next.actifCommun
        && prev.nbEnfants === next.nbEnfants
      ) {
        return prev;
      }
      return next;
    });
  }, [assetNetTotals.commun, assetNetTotals.epoux1, assetNetTotals.epoux2, nbEnfants]);

  useEffect(() => {
    const validOwners = new Set(assetOwnerOptions.map((option) => option.value));
    const fallbackOwner = assetOwnerOptions[0]?.value ?? 'epoux1';
    setAssetEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        if (validOwners.has(entry.owner)) return entry;
        changed = true;
        return { ...entry, owner: fallbackOwner };
      });
      return changed ? next : prev;
    });
  }, [assetOwnerOptions]);

  useEffect(() => {
    const validOwners = new Set(assuranceViePartyOptions.map((option) => option.value));
    const fallbackOwner = assuranceViePartyOptions[0]?.value ?? 'epoux1';
    setAssuranceVieEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const souscripteur = validOwners.has(entry.souscripteur) ? entry.souscripteur : fallbackOwner;
        const assure = validOwners.has(entry.assure) ? entry.assure : fallbackOwner;
        if (souscripteur === entry.souscripteur && assure === entry.assure) return entry;
        changed = true;
        return {
          ...entry,
          souscripteur,
          assure,
        };
      });
      return changed ? next : prev;
    });
  }, [assuranceViePartyOptions]);

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
    setActifNet(displayActifNetSuccession);
  }, [displayActifNetSuccession, setActifNet]);

  const exportHeirs = useMemo(
    () => (displayUsesChainage ? [] : directDisplayAnalysis.heirs).map((heir) => ({
      lien: heir.lien,
      partSuccession: heir.partSuccession,
    })),
    [displayUsesChainage, directDisplayAnalysis.heirs],
  );

  const handleExportPptx = useCallback(async () => {
    if (!canExport) return;
    try {
      setExportLoading(true);
      if (canExportSimplified) {
        await exportSuccessionPptx(
          {
            actifNetSuccession: derivedMasseTransmise,
            totalDroits: derivedTotalDroits,
            tauxMoyenGlobal: derivedMasseTransmise > 0
              ? (derivedTotalDroits / derivedMasseTransmise) * 100
              : 0,
            heritiers: displayUsesChainage ? [] : (directDisplayAnalysis.result?.detailHeritiers ?? []),
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
    displayUsesChainage,
    directDisplayAnalysis.result,
    derivedMasseTransmise,
    derivedTotalDroits,
  ]);

  const handleExportXlsx = useCallback(async () => {
    if (!canExport) return;
    try {
      setExportLoading(true);
      if (canExportSimplified) {
        await exportAndDownloadSuccessionXlsx(
          {
            actifNetSuccession: derivedMasseTransmise,
            nbHeritiers: exportHeirs.length,
            heritiers: exportHeirs,
          },
          displayUsesChainage ? null : (directDisplayAnalysis.result ?? null),
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
    displayUsesChainage,
    directDisplayAnalysis.result,
    derivedMasseTransmise,
    exportHeirs,
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
                          <div key={enfant.id} className={`sc-child-row${enfant.deceased ? ' sc-child-row--deceased' : ''}`}>
                            <span className="sc-child-row__label">{getEnfantNodeLabel(idx, enfant.deceased)}</span>
                            {enfantRattachementOptions.length > 1 && (
                              <ScSelect
                                className="sc-child-select"
                                value={enfant.rattachement}
                                onChange={(value) => updateEnfantRattachement(enfant.id, value as 'commun' | 'epoux1' | 'epoux2')}
                                options={enfantRattachementOptions}
                              />
                            )}
                            <label className="sc-checkbox-label">
                              <input
                                type="checkbox"
                                className="sc-checkbox"
                                checked={!!enfant.deceased}
                                onChange={(e) => toggleEnfantDeceased(enfant.id, e.target.checked)}
                              />
                              Décédé
                            </label>
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
                {isExpert
                  ? 'Saisie détaillée des actifs et passifs, agrégée automatiquement pour les analyses civiles.'
                  : 'Saisie simplifiée des actifs et passifs, agrégée automatiquement pour les analyses civiles et la chronologie.'}
              </p>
            </header>
            <div className="sc-card__divider" />

            {isExpert ? (
              <div className="sc-assets-sections">
                {assetEntriesByCategory.map((category) => (
                  <section key={category.value} className="sc-asset-section">
                    <div className="sc-asset-section__header">
                      <h3 className="sc-asset-section__title">{category.label}</h3>
                      <div className="sc-asset-section__actions">
                        <button
                          type="button"
                          className="sc-member-add-icon-btn"
                          onClick={() => addAssetEntry(category.value)}
                          title="Ajouter une ligne"
                        >
                          +
                        </button>
                        {category.value === 'financier' && (
                          <button
                            type="button"
                            className="sc-child-add-btn"
                            onClick={() => setShowAssuranceVieModal(true)}
                          >
                            + Assurance vie
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="sc-assets-list">
                      {category.entries.map((entry) => (
                        <div key={entry.id} className="sc-asset-row">
                          <div className="sc-field">
                            <label>Porteur</label>
                            <ScSelect
                              value={entry.owner}
                              onChange={(value) => updateAssetEntry(entry.id, 'owner', value)}
                              options={assetOwnerOptions}
                            />
                          </div>
                          <div className="sc-field">
                            <label>Sous-catégorie</label>
                            <ScSelect
                              value={entry.subCategory}
                              onChange={(value) => updateAssetEntry(entry.id, 'subCategory', value)}
                              options={ASSET_SUBCATEGORY_OPTIONS[entry.category].map((option) => ({
                                value: option,
                                label: option,
                              }))}
                            />
                          </div>
                          <div className="sc-field">
                            <label>Montant (€)</label>
                            <input
                              type="number"
                              min={0}
                              value={entry.amount || ''}
                              onChange={(e) => updateAssetEntry(entry.id, 'amount', Number(e.target.value) || 0)}
                              placeholder="Montant"
                            />
                          </div>
                          <button
                            type="button"
                            className="sc-remove-btn"
                            onClick={() => removeAssetEntry(entry.id)}
                            title="Supprimer cette ligne"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {category.value === 'financier' && assuranceVieEntries.map((av) => (
                        <div key={av.id} className="sc-asset-row sc-asset-row--av">
                          <div className="sc-field">
                            <label>Porteur</label>
                            <span className="sc-asset-row__value">{assuranceViePartyOptions.find((o) => o.value === av.assure)?.label ?? av.assure}</span>
                          </div>
                          <div className="sc-field">
                            <label>Sous-catégorie</label>
                            <span className="sc-asset-row__value">Assurance-vie</span>
                          </div>
                          <div className="sc-field">
                            <label>Capitaux décès (€)</label>
                            <span className="sc-asset-row__value">{fmt(av.capitauxDeces)}</span>
                          </div>
                          <div />
                        </div>
                      ))}
                      {category.entries.length === 0 && !(category.value === 'financier' && assuranceVieEntries.length > 0) && (
                        <p className="sc-hint sc-hint--compact">Aucune ligne détaillée dans cette catégorie.</p>
                      )}
                    </div>
                  </section>
                ))}

                <div className="sc-assets-summary">
                  <div className="sc-summary-row">
                    <span>{isPacsed ? 'Actif net partenaire 1' : isMarried ? 'Actif net époux 1' : 'Actif net personne 1'}</span>
                    <strong>{fmt(assetNetTotals.epoux1)}</strong>
                  </div>
                  {assetOwnerOptions.some((option) => option.value === 'epoux2') && (
                    <div className="sc-summary-row">
                      <span>{isPacsed ? 'Actif net partenaire 2' : isMarried ? 'Actif net époux 2' : 'Actif net personne 2'}</span>
                      <strong>{fmt(assetNetTotals.epoux2)}</strong>
                    </div>
                  )}
                  {assetOwnerOptions.some((option) => option.value === 'commun') && (
                    <div className="sc-summary-row">
                      <span>{isPacsed ? 'Masse indivise nette' : 'Masse commune nette'}</span>
                      <strong>{fmt(assetNetTotals.commun)}</strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="sc-balance-grid">
                <div
                  className="sc-balance-grid__row"
                  style={{ gridTemplateColumns: `88px repeat(${assetOwnerOptions.length}, minmax(0, 1fr))` }}
                >
                  <div className="sc-balance-grid__label">Actifs</div>
                  {assetOwnerOptions.map((option) => (
                    <div key={`actifs-${option.value}`} className="sc-field">
                      <label>{option.label} (€)</label>
                      <input
                        type="number"
                        min={0}
                        value={assetBreakdown.actifs[option.value] || ''}
                        onChange={(e) => setSimplifiedBalanceField('actifs', option.value, Number(e.target.value) || 0)}
                        placeholder="Montant"
                      />
                    </div>
                  ))}
                </div>
                <div
                  className="sc-balance-grid__row"
                  style={{ gridTemplateColumns: `88px repeat(${assetOwnerOptions.length}, minmax(0, 1fr))` }}
                >
                  <div className="sc-balance-grid__label">Passifs</div>
                  {assetOwnerOptions.map((option) => (
                    <div key={`passifs-${option.value}`} className="sc-field">
                      <label>{option.label} (€)</label>
                      <input
                        type="number"
                        min={0}
                        value={assetBreakdown.passifs[option.value] || ''}
                        onChange={(e) => setSimplifiedBalanceField('passifs', option.value, Number(e.target.value) || 0)}
                        placeholder="Montant"
                      />
                    </div>
                  ))}
                </div>
                <div className="sc-assets-summary">
                  <div className="sc-summary-row">
                    <span>{isPacsed ? 'Actif net partenaire 1' : isMarried ? 'Actif net époux 1' : isConcubinage ? 'Actif net personne 1' : 'Actif net du/de la défunt(e)'}</span>
                    <strong>{fmt(assetNetTotals.epoux1)}</strong>
                  </div>
                  {assetOwnerOptions.some((option) => option.value === 'epoux2') && (
                    <div className="sc-summary-row">
                      <span>{isPacsed ? 'Actif net partenaire 2' : isMarried ? 'Actif net époux 2' : 'Actif net personne 2'}</span>
                      <strong>{fmt(assetNetTotals.epoux2)}</strong>
                    </div>
                  )}
                  {assetOwnerOptions.some((option) => option.value === 'commun') && (
                    <div className="sc-summary-row">
                      <span>{isPacsed ? 'Masse indivise nette' : 'Masse commune nette'}</span>
                      <strong>{fmt(assetNetTotals.commun)}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {isExpert && (
          <div className="premium-card sc-card">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Donations</h2>
            </header>
            <div className="sc-card__divider sc-card__divider--tight" />
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
                          placeholder="0"
                        />
                      </div>
                      <div className="sc-field">
                        <label>Date</label>
                        <input
                          type="month"
                          className="sc-input-month"
                          value={entry.date ?? ''}
                          onChange={(e) => updateDonationEntry(entry.id, 'date', e.target.value)}
                        />
                      </div>
                      <div className="sc-field">
                        <label>Donateur</label>
                        <ScSelect
                          value={entry.donateur ?? ''}
                          onChange={(value) => updateDonationEntry(entry.id, 'donateur', value)}
                          options={donateurOptions}
                        />
                      </div>
                      <div className="sc-field sc-field--full">
                        <label>Donataire</label>
                        <ScSelect
                          value={entry.donataire ?? ''}
                          onChange={(value) => updateDonationEntry(entry.id, 'donataire', value)}
                          options={donatairesOptions}
                        />
                      </div>
                      <div className="sc-field">
                        <label>Valeur à la donation (€)</label>
                        <input
                          type="number"
                          min={0}
                          value={entry.valeurDonation || ''}
                          onChange={(e) => updateDonationEntry(entry.id, 'valeurDonation', Number(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="sc-field">
                        <label>Valeur actuelle (€)</label>
                        <input
                          type="number"
                          min={0}
                          value={entry.valeurActuelle || ''}
                          onChange={(e) => updateDonationEntry(entry.id, 'valeurActuelle', Number(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="sc-field sc-field--full sc-donation-flags">
                        <label className="sc-checkbox-label">
                          <input
                            type="checkbox"
                            className="sc-checkbox"
                            checked={entry.donSommeArgentExonere ?? false}
                            onChange={(e) => updateDonationEntry(entry.id, 'donSommeArgentExonere', e.target.checked)}
                          />
                          Don de somme d&apos;argent exonéré
                        </label>
                        <label className="sc-checkbox-label">
                          <input
                            type="checkbox"
                            className="sc-checkbox"
                            checked={entry.avecReserveUsufruit ?? false}
                            onChange={(e) => updateDonationEntry(entry.id, 'avecReserveUsufruit', e.target.checked)}
                          />
                          Avec réserve d&apos;usufruit
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sc-hint sc-hint--compact">Aucune donation détaillée pour l&apos;instant.</p>
            )}

            <div className="sc-inline-actions">
              <button
                type="button"
                className="sc-child-add-btn"
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
          </div>
          )}
        </div>

        <div className="sc-right">
          <FiliationOrgchart
            civilContext={civilContext}
            enfantsContext={enfantsContext}
            familyMembers={familyMembers}
          />

          {transmissionRows.length > 0 && (
            <div className="premium-card sc-summary-card">
              <h2 className="sc-summary-title">Résultat pour les héritiers</h2>
              <div className="sc-card__divider sc-card__divider--tight" />
              <div className="sc-transmission-grid">
                <div className="sc-transmission-grid__head">
                  <span />
                  <span>Reçoit (brut)</span>
                  <span>Droits</span>
                  <span>Net estimé</span>
                </div>
                {transmissionRows.map((row) => (
                  <div
                    key={row.label}
                    className={`sc-transmission-row${row.exonerated ? ' sc-transmission-row--exo' : ''}${row.label === 'Assurance-vie' ? ' sc-transmission-row--av' : ''}`}
                  >
                    <span>{row.label}</span>
                    <span>{fmt(row.brut)}</span>
                    <span>{row.exonerated ? 'Exonéré' : fmt(row.droits)}</span>
                    <span>{fmt(row.net)}</span>
                  </div>
                ))}
              </div>
              <p className="sc-summary-note sc-summary-note--muted">
                {displayUsesChainage
                  ? 'Cumul 2 décès — droits DMTG descendants, conjoint exonéré'
                  : isPacsed
                    ? "Succession directe du partenaire simulé - le PACS n'ouvre pas de droit successoral automatique sans testament."
                    : 'Succession directe du/de la défunt(e) simulé(e).'}
              </p>
            </div>
          )}

          <div className="premium-card sc-summary-card sc-hero-card sc-hero-card--secondary">
            <h2 className="sc-summary-title">Synthèse</h2>
            <div className="sc-card__divider sc-card__divider--tight" />
            <div className="sc-synth-hero">
              <div className="sc-synth-hero__left">
                <div className="sc-synth-hero__label">Coût de transmission estimé</div>
                <div className="sc-synth-hero__value">{fmt(derivedTotalDroits)}</div>
                {synthDonutTransmis > 0 && (
                  <div className="sc-synth-hero__sub">
                    sur {fmt(synthDonutTransmis)} transmis
                  </div>
                )}
              </div>
              <ScDonut
                transmis={Math.max(0, synthDonutTransmis - derivedTotalDroits)}
                droits={derivedTotalDroits}
              />
            </div>
            {devolutionAnalysis.lines.length > 0 && (
              <>
                <div className="sc-card__divider sc-card__divider--tight" />
                <div className="sc-synth-beneficiaires">
                  {devolutionAnalysis.lines.map((line, idx) => (
                    line.montantEstime !== null && (
                      <div key={idx} className="sc-summary-row">
                        <span>{line.heritier}</span>
                        <strong>{fmt(line.montantEstime)}</strong>
                      </div>
                    )
                  ))}
                </div>
                {synthHypothese && (
                  <p className="sc-summary-note sc-summary-note--muted">{synthHypothese}</p>
                )}
              </>
            )}
          </div>

          <div className="premium-card sc-summary-card sc-hero-card">
            <div className="sc-hero-header">
              <h2 className="sc-summary-title">Chronologie des décès</h2>
              <div className="sc-pill-toggle">
                <button
                  type="button"
                  className={`sc-pill-toggle__btn${chainOrder === 'epoux2' ? ' is-active' : ''}`}
                  onClick={() => setChainOrder(chainOrder === 'epoux2' ? 'epoux1' : 'epoux2')}
                >
                  Ordre inversé
                </button>
              </div>
            </div>
            <div className="sc-card__divider sc-card__divider--tight" />
            {displayUsesChainage && chainageAnalysis.step1 && chainageAnalysis.step2 ? (
              <div className="sc-chain">
                <div className="sc-chain-step">
                  <div className="sc-chain-step__title">Étape 1 - décès {chainageAnalysis.firstDecedeLabel}</div>
                  <div className="sc-summary-row">
                    <span>Masse transmise</span>
                    <strong>{fmt(chainageAnalysis.step1.actifTransmis + assuranceVieByAssure[chainageAnalysis.order])}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Droits descendants</span>
                    <strong>{fmt(chainageAnalysis.step1.droitsEnfants)}</strong>
                  </div>
                  {avFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits > 0 && (
                    <div className="sc-summary-row">
                      <span>Droits assurance-vie</span>
                      <strong>{fmt(avFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits)}</strong>
                    </div>
                  )}
                </div>

                <div className="sc-chain-step">
                  <div className="sc-chain-step__title">Étape 2 - décès {chainageAnalysis.secondDecedeLabel}</div>
                  <div className="sc-summary-row">
                    <span>Masse transmise</span>
                    <strong>{fmt(chainageAnalysis.step2.actifTransmis + assuranceVieByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'])}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Droits descendants</span>
                    <strong>{fmt(chainageAnalysis.step2.droitsEnfants)}</strong>
                  </div>
                  {avFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits > 0 && (
                    <div className="sc-summary-row">
                      <span>Droits assurance-vie</span>
                      <strong>{fmt(avFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits)}</strong>
                    </div>
                  )}
                </div>

                <div className="sc-summary-row sc-summary-row--reserve">
                  <span>Total cumulé des droits (2 décès + assurance-vie)</span>
                  <strong>{fmt(derivedTotalDroits)}</strong>
                </div>
              </div>
            ) : (
              <p className="sc-summary-note">
                {isPacsed
                  ? "PACS: la synthèse s'appuie sur le décès simulé du partenaire sélectionné ; la chronologie 2 décès n'est pas utilisée ici."
                  : 'Activez un contexte marié pour afficher la chronologie en 2 décès.'}
              </p>
            )}
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
            {attentions.map((warning, idx) => (
              <li key={`att-${idx}`}>{warning}</li>
            ))}
            <li>Barèmes DMTG et abattements appliqués depuis les paramètres de l&apos;application.</li>
            <li>
              Paramètres transmis au module:
              rappel fiscal donations {fiscalSnapshot.donation.rappelFiscalAnnees} ans,
              AV décès 990 I {fmt(fiscalSnapshot.avDeces.primesApres1998.allowancePerBeneficiary)} / bénéficiaire,
              AV décès après {fiscalSnapshot.avDeces.agePivotPrimes} ans {fmt(fiscalSnapshot.avDeces.apres70ans.globalAllowance)} (global).
            </li>
            <li>La lecture civile repose sur le contexte familial, les masses patrimoniales saisies et les dispositions déclarées.</li>
            <li>Les capitaux décès d'assurance-vie sont ventilés par bénéficiaire à partir des clauses saisies, avec une lecture simplifiée des régimes 990 I / 757 B.</li>
            <li>La chronologie 2 décès repose sur un chaînage simplifié avec warnings sur les cas non couverts.</li>
            <li>La dévolution légale est présentée en lecture civile simplifiée, sans gestion exhaustive des ordres successoraux.</li>
            <li>Les libéralités et avantages matrimoniaux sont qualifiés de façon indicative, sans recalcul automatique des droits dans ce module.</li>
            <li>L'intégration chiffrée fine (rapport civil détaillé, réduction, liquidation notariale) n'est pas encore modélisée.</li>
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

      {showAssuranceVieModal && (
        <div
          className="sc-member-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAssuranceVieModal(false); }}
        >
          <div className="sc-member-modal sc-member-modal--wide">
            <div className="sc-member-modal__header">
              <h3 className="sc-member-modal__title">Assurance-vie</h3>
              <button
                type="button"
                className="sc-member-modal__close"
                onClick={() => setShowAssuranceVieModal(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="sc-member-modal__body">
              {assuranceVieEntries.length > 0 ? (
                <div className="sc-assurance-vie-list">
                  {assuranceVieEntries.map((entry, idx) => (
                    <div key={entry.id} className="sc-assurance-vie-card">
                      <div className="sc-donation-card__header">
                        <strong className="sc-donation-card__title">Contrat {idx + 1}</strong>
                        <button
                          type="button"
                          className="sc-remove-btn"
                          onClick={() => removeAssuranceVieEntry(entry.id)}
                          title="Supprimer ce contrat"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="sc-assurance-vie-grid">
                        <div className="sc-field">
                          <label>Type de clause</label>
                          <ScSelect
                            value={entry.typeContrat}
                            onChange={(value) => updateAssuranceVieEntry(entry.id, 'typeContrat', value as SuccessionAssuranceVieContractType)}
                            options={ASSURANCE_VIE_TYPE_OPTIONS}
                          />
                        </div>
                        {entry.typeContrat === 'demembree' && (
                          <div className="sc-field">
                            <label>Âge de l&apos;usufruitier</label>
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={entry.ageUsufruitier ?? ''}
                              onChange={(e) => updateAssuranceVieEntry(entry.id, 'ageUsufruitier', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="ex. 68"
                            />
                            <p className="sc-hint sc-hint--compact">
                              Ventilation art. 669 CGI — conjoint = usufruit, enfants = nu-propriété.
                            </p>
                          </div>
                        )}
                        <div className="sc-field">
                          <label>Souscripteur</label>
                          <ScSelect
                            value={entry.souscripteur}
                            onChange={(value) => updateAssuranceVieEntry(entry.id, 'souscripteur', value)}
                            options={assuranceViePartyOptions}
                          />
                        </div>
                        <div className="sc-field">
                          <label>Assuré</label>
                          <ScSelect
                            value={entry.assure}
                            onChange={(value) => updateAssuranceVieEntry(entry.id, 'assure', value)}
                            options={assuranceViePartyOptions}
                          />
                        </div>
                        <div className="sc-field sc-field--full">
                          <label>Clause bénéficiaire</label>
                          <ScSelect
                            value={getClausePreset(entry.clauseBeneficiaire)}
                            onChange={(preset) => {
                              if (preset === 'conjoint_enfants') updateAssuranceVieEntry(entry.id, 'clauseBeneficiaire', CLAUSE_CONJOINT_LABEL);
                              else if (preset === 'enfants_parts_egales') updateAssuranceVieEntry(entry.id, 'clauseBeneficiaire', CLAUSE_ENFANTS_LABEL);
                              else updateAssuranceVieEntry(entry.id, 'clauseBeneficiaire', 'CUSTOM:');
                            }}
                            options={CLAUSE_BENEFICIAIRE_PRESETS}
                          />
                        </div>
                        {getClausePreset(entry.clauseBeneficiaire) === 'conjoint_enfants' && (
                          <div className="sc-field sc-field--full">
                            <p className="sc-hint sc-hint--compact">Le conjoint survivant est exonéré de droits de succession (art. 796-0 bis CGI).</p>
                          </div>
                        )}
                        {getClausePreset(entry.clauseBeneficiaire) === 'personnalisee' && (
                          <div className="sc-field sc-field--full sc-clause-custom">
                            <label>Répartition (%)</label>
                            {[
                              ...(isMarried || isPacsed ? [{ id: 'conjoint', label: isPacsed ? 'Partenaire' : 'Conjoint(e)' }] : []),
                              ...enfantsContext.map((e, i) => ({ id: e.id, label: getEnfantParentLabel(e, i) })),
                              ...familyMembers.map((m) => ({ id: m.id, label: labelMember(m, enfantsContext) })),
                            ].map(({ id, label }) => {
                              const parts = parseCustomClause(entry.clauseBeneficiaire ?? '');
                              return (
                                <div key={id} className="sc-clause-custom-row">
                                  <span className="sc-clause-custom-row__label">{label}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={parts[id] || ''}
                                    onChange={(e) => {
                                      const newParts = { ...parts, [id]: Number(e.target.value) || 0 };
                                      updateAssuranceVieEntry(entry.id, 'clauseBeneficiaire', serializeCustomClause(newParts));
                                    }}
                                    placeholder="0"
                                  />
                                  <span className="sc-clause-custom-row__unit">%</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="sc-field">
                          <label>Capitaux décès (€)</label>
                          <input
                            type="number"
                            min={0}
                            value={entry.capitauxDeces || ''}
                            onChange={(e) => updateAssuranceVieEntry(entry.id, 'capitauxDeces', Number(e.target.value) || 0)}
                            placeholder="Montant"
                          />
                        </div>
                        <div className="sc-field">
                          <label>Versements après 70 ans (€)</label>
                          <input
                            type="number"
                            min={0}
                            value={entry.versementsApres70 || ''}
                            onChange={(e) => updateAssuranceVieEntry(entry.id, 'versementsApres70', Number(e.target.value) || 0)}
                            placeholder="Montant"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sc-hint sc-hint--compact">
                  Aucun contrat d'assurance-vie saisi pour l'instant.
                </p>
              )}

              <div className="sc-inline-actions">
                <button
                  type="button"
                  className="premium-btn sc-btn sc-btn--secondary"
                  onClick={addAssuranceVieEntry}
                >
                  + Ajouter un contrat
                </button>
              </div>

              {assuranceVieEntries.length > 0 && (
                <div className="sc-donations-totals">
                  <div className="sc-summary-row">
                    <span>Capitaux décès</span>
                    <strong>{fmt(assuranceVieTotals.capitaux)}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Versements après 70 ans</span>
                    <strong>{fmt(assuranceVieTotals.versementsApres70)}</strong>
                  </div>
                </div>
              )}
            </div>
            <div className="sc-member-modal__footer">
              <button
                type="button"
                className="sc-member-modal__btn sc-member-modal__btn--secondary"
                onClick={() => setShowAssuranceVieModal(false)}
              >
                Fermer
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
                      ...enfantsContext.map((e, i) => ({ value: e.id, label: getEnfantParentLabel(e, i) })),
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
