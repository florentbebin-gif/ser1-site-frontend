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
  type SuccessionAssetDetailEntry,
  type SuccessionAssetOwner,
  type SuccessionAssuranceVieEntry,
  type FamilyBranch,
  type FamilyMember,
  type SuccessionDonationEntry,
  type SuccessionEnfant,
  type SuccessionPrimarySide,
} from './successionDraft';
import { buildSuccessionDevolutionAnalysis } from './successionDevolution';
import {
  countEffectiveDescendantBranches,
  countEffectiveDescendantBranchesForDeceased,
  countLivingEnfants,
  countLivingNonCommuns,
  getEnfantRattachementOptions,
} from './successionEnfants';
import { buildSuccessionAvFiscalAnalysis } from './successionAvFiscal';
import { buildSuccessionFiscalSnapshot } from './successionFiscalContext';
import { buildSuccessionPatrimonialAnalysis } from './successionPatrimonial';
import { buildSuccessionPredecesAnalysis } from './successionPredeces';
import { canOpenDispositions } from './successionDispositions';
import { buildTestamentBeneficiaryOptions } from './successionTestament';
import {
  buildSuccessionChainageAnalysis,
  type SuccessionChainOrder,
} from './successionChainage';
import {
  buildSuccessionChainTransmissionRows,
  buildSuccessionDirectDisplayAnalysis,
  computeSuccessionDirectEstateBasis,
} from './successionDisplay';
import { getUsufruitValuationFromBirthDate } from './successionUsufruit';
import {
  ASSET_CATEGORY_OPTIONS,
  BRANCH_OPTIONS,
  DONATION_ENTRE_EPOUX_OPTIONS,
  TESTAMENT_SIDES,
} from './successionSimulator.constants';
import {
  buildInitialDispositionsDraft,
  EMPTY_ADD_FAMILY_MEMBER_FORM,
  fmt,
  getBirthDateLabels,
  getDonationEffectiveAmount,
  getTestamentParticularLegaciesTotal,
  isCoupleSituation,
  type AddFamilyMemberFormState,
  type DispositionsDraftState,
} from './successionSimulator.helpers';
import AddFamilyMemberModal from './components/AddFamilyMemberModal';
import AssuranceVieModal from './components/AssuranceVieModal';
import DispositionsModal from './components/DispositionsModal';
import ScAssetsPassifsCard from './components/ScAssetsPassifsCard';
import ScDeathTimelinePanel from './components/ScDeathTimelinePanel';
import ScDonationsCard from './components/ScDonationsCard';
import ScFamilyContextCard from './components/ScFamilyContextCard';
import ScSuccessionSummaryPanel from './components/ScSuccessionSummaryPanel';
import { FiliationOrgchart } from './components/FiliationOrgchart';
import { useSuccessionSimulatorHandlers } from './useSuccessionSimulatorHandlers';
import '../../components/simulator/SimulatorShell.css';
import '../../styles/premium-shared.css';
import './Succession.css';

const STORE_KEY = storageKeyFor('succession');

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
  const [assuranceVieDraft, setAssuranceVieDraft] = useState<SuccessionAssuranceVieEntry[]>(DEFAULT_SUCCESSION_ASSURANCE_VIE);
  const [dispositionsDraft, setDispositionsDraft] = useState<DispositionsDraftState>(buildInitialDispositionsDraft);
  const [addMemberForm, setAddMemberForm] = useState<AddFamilyMemberFormState>(EMPTY_ADD_FAMILY_MEMBER_FORM);
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
    return totals;
  }, {
    rapportable: 0,
    horsPart: 0,
    legsParticuliers: getTestamentParticularLegaciesTotal(devolutionContext.testamentsBySide),
  }), [donationsContext, devolutionContext.testamentsBySide]);

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
      patrimonial: {
        donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
        donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
      },
      enfantsContext,
      familyMembers,
      devolution: devolutionContext,
    }),
    [
      civilContext,
      liquidationContext,
      nbDescendantBranches,
      predecesAnalysis.regimeUsed,
      chainOrder,
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
      patrimonialContext.donationEntreEpouxActive,
      patrimonialContext.donationEntreEpouxOption,
      enfantsContext,
      familyMembers,
      devolutionContext,
    ],
  );
  const directEstateBasis = useMemo(
    () => computeSuccessionDirectEstateBasis(civilContext, liquidationContext, chainOrder),
    [civilContext, liquidationContext, chainOrder],
  );

  const derivedActifNetSuccession = chainageAnalysis.step1?.actifTransmis ?? directEstateBasis.actifNetSuccession;
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
      {
        patrimonial: {
          donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
          donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
        },
        simulatedDeceased: chainOrder,
      },
    ),
    [
      civilContext,
      nbDescendantBranches,
      devolutionContext,
      nbEnfantsNonCommuns,
      derivedActifNetSuccession,
      patrimonialContext.legsParticuliers,
      patrimonialContext.donationEntreEpouxActive,
      patrimonialContext.donationEntreEpouxOption,
      enfantsContext,
      familyMembers,
      chainOrder,
    ],
  );
  const patrimonialSimulatedDeceased = civilContext.situationMatrimoniale === 'marie'
    ? chainOrder
    : directEstateBasis.simulatedDeceased;
  const patrimonialAnalysis = useMemo(
    () => buildSuccessionPatrimonialAnalysis(
      civilContext,
      derivedActifNetSuccession,
      nbDescendantBranches,
      patrimonialContext,
      donationsContext,
      fiscalSnapshot,
      {
        simulatedDeceased: patrimonialSimulatedDeceased,
        testament: devolutionContext.testamentsBySide[patrimonialSimulatedDeceased],
      },
    ),
    [
      civilContext,
      derivedActifNetSuccession,
      nbDescendantBranches,
      patrimonialContext,
      donationsContext,
      fiscalSnapshot,
      patrimonialSimulatedDeceased,
      devolutionContext.testamentsBySide,
    ],
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
  const birthDateLabels = useMemo(
    () => getBirthDateLabels(civilContext.situationMatrimoniale),
    [civilContext.situationMatrimoniale],
  );
  const showSecondBirthDate = isCoupleSituation(civilContext.situationMatrimoniale);
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
        { value: 'commun', label: 'Indivision' },
      ];
    }
    return [{ value: 'epoux1', label: 'Défunt(e)' }];
  }, [isConcubinage, isMarried, isPacsed]);
  const assuranceViePartyOptions = useMemo(
    () => assetOwnerOptions.filter((option) => option.value !== 'commun') as { value: 'epoux1' | 'epoux2'; label: string }[],
    [assetOwnerOptions],
  );
  const canOpenDispositionsModal = useMemo(
    () => canOpenDispositions(civilContext.situationMatrimoniale, enfantsContext, familyMembers),
    [civilContext.situationMatrimoniale, enfantsContext, familyMembers],
  );
  const testamentSides = useMemo(
    () => (isCoupleSituation(civilContext.situationMatrimoniale) ? TESTAMENT_SIDES : ['epoux1']) as SuccessionPrimarySide[],
    [civilContext.situationMatrimoniale],
  );
  const descendantBranchesBySide = useMemo(() => ({
    epoux1: countEffectiveDescendantBranchesForDeceased(enfantsContext, familyMembers, 'epoux1'),
    epoux2: countEffectiveDescendantBranchesForDeceased(enfantsContext, familyMembers, 'epoux2'),
  }), [enfantsContext, familyMembers]);
  const testamentBeneficiaryOptionsBySide = useMemo(
    () => ({
      epoux1: buildTestamentBeneficiaryOptions(
        civilContext.situationMatrimoniale,
        'epoux1',
        enfantsContext,
        familyMembers,
      ),
      epoux2: buildTestamentBeneficiaryOptions(
        civilContext.situationMatrimoniale,
        'epoux2',
        enfantsContext,
        familyMembers,
      ),
    }),
    [civilContext.situationMatrimoniale, enfantsContext, familyMembers],
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
  const assuranceVieDraftTotals = useMemo(() => assuranceVieDraft.reduce((totals, entry) => ({
    capitaux: totals.capitaux + entry.capitauxDeces,
    versementsApres70: totals.versementsApres70 + entry.versementsApres70,
  }), {
    capitaux: 0,
    versementsApres70: 0,
  }), [assuranceVieDraft]);
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
  const displayActifNetSuccession = useMemo(
    () => (displayUsesChainage ? derivedActifNetSuccession : directEstateBasis.actifNetSuccession),
    [displayUsesChainage, derivedActifNetSuccession, directEstateBasis.actifNetSuccession],
  );
  const directDisplayAnalysis = useMemo(
    () => buildSuccessionDirectDisplayAnalysis({
      civil: civilContext,
      devolution: devolutionAnalysis,
      devolutionContext,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      enfantsContext,
      familyMembers,
      order: chainOrder,
      actifNetSuccession: directEstateBasis.actifNetSuccession,
      baseWarnings: directEstateBasis.warnings,
    }),
    [
      civilContext,
      devolutionAnalysis,
      devolutionContext,
      fiscalSnapshot.dmtgSettings,
      enfantsContext,
      familyMembers,
      chainOrder,
      directEstateBasis.actifNetSuccession,
      directEstateBasis.warnings,
    ],
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
      const spouseBirthDate = chainOrder === 'epoux1'
        ? civilContext.dateNaissanceEpoux2
        : civilContext.dateNaissanceEpoux1;
      const valuationBase = patrimonialContext.donationEntreEpouxOption === 'mixte'
        ? derivedActifNetSuccession * 0.75
        : derivedActifNetSuccession;
      const valuation = (
        patrimonialContext.donationEntreEpouxOption === 'usufruit_total'
        || patrimonialContext.donationEntreEpouxOption === 'mixte'
      )
        ? getUsufruitValuationFromBirthDate(spouseBirthDate, valuationBase)
        : null;
      const baseLabel = `Donation entre époux : ${opt?.label ?? patrimonialContext.donationEntreEpouxOption}`;
      if (valuation) {
        return `${baseLabel} — valorisation art. 669 CGI : usufruit ${Math.round(valuation.tauxUsufruit * 100)}%, nue-propriété ${Math.round(valuation.tauxNuePropriete * 100)}% (usufruitier ${valuation.age} ans)`;
      }
      if (
        patrimonialContext.donationEntreEpouxOption === 'usufruit_total'
        || patrimonialContext.donationEntreEpouxOption === 'mixte'
      ) {
        return `${baseLabel} — valorisation art. 669 CGI en attente de la date de naissance du conjoint survivant`;
      }
      return baseLabel;
    }
    if (nbEnfantsNonCommuns > 0) {
      return 'Art. 757 CC : 1/4 en pleine propriété imposé au conjoint survivant en présence d’enfant(s) non commun(s).';
    }
    if (devolutionContext.choixLegalConjointSansDDV === 'usufruit') {
      const spouseBirthDate = chainOrder === 'epoux1'
        ? civilContext.dateNaissanceEpoux2
        : civilContext.dateNaissanceEpoux1;
      const valuation = getUsufruitValuationFromBirthDate(spouseBirthDate, derivedActifNetSuccession);
      if (valuation) {
        return `Art. 757 CC : usufruit de la totalité retenu — valorisation art. 669 CGI : usufruit ${Math.round(valuation.tauxUsufruit * 100)}%, nue-propriété ${Math.round(valuation.tauxNuePropriete * 100)}% (usufruitier ${valuation.age} ans)`;
      }
      return 'Art. 757 CC : usufruit de la totalité demandé — valorisation art. 669 CGI en attente de la date de naissance du conjoint survivant (repli moteur sur 1/4 en pleine propriété).';
    }
    if (devolutionContext.choixLegalConjointSansDDV === 'quart_pp') {
      return 'Art. 757 CC : 1/4 en pleine propriété retenu au titre du choix légal du conjoint survivant.';
    }
    return 'Hypothèse moteur : 1/4 en pleine propriété pour le conjoint survivant (choix légal non précisé).';
  }, [
    isMarried,
    nbDescendantBranches,
    nbEnfantsNonCommuns,
    devolutionContext.choixLegalConjointSansDDV,
    patrimonialContext.donationEntreEpouxActive,
    patrimonialContext.donationEntreEpouxOption,
    chainOrder,
    civilContext.dateNaissanceEpoux1,
    civilContext.dateNaissanceEpoux2,
    derivedActifNetSuccession,
  ]);
  const transmissionRows = useMemo(() => {
    if (displayUsesChainage) {
      const { order, step1, step2 } = chainageAnalysis;
      if (!step1 || !step2) return [];
      const otherOrder = order === 'epoux1' ? 'epoux2' : 'epoux1';
      const avCapital = assuranceVieByAssure[order] + assuranceVieByAssure[otherOrder];
      return [
        ...buildSuccessionChainTransmissionRows(chainageAnalysis),
        ...(avCapital > 0 ? [{
          id: 'assurance-vie',
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
        id: 'assurance-vie',
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
        beneficiaries: chainageAnalysis.step1.beneficiaries.map((beneficiary) => ({
          label: beneficiary.label,
          brut: beneficiary.brut,
          droits: beneficiary.droits,
          net: beneficiary.net,
          exonerated: beneficiary.exonerated ?? false,
        })),
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
        beneficiaries: chainageAnalysis.step2.beneficiaries.map((beneficiary) => ({
          label: beneficiary.label,
          brut: beneficiary.brut,
          droits: beneficiary.droits,
          net: beneficiary.net,
          exonerated: beneficiary.exonerated ?? false,
        })),
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

  const {
    handleSituationChange,
    handleReset,
    setSimplifiedBalanceField,
    addEnfant,
    updateEnfantRattachement,
    toggleEnfantDeceased,
    removeEnfant,
    addFamilyMember,
    removeFamilyMember,
    addDonationEntry,
    updateDonationEntry,
    removeDonationEntry,
    addAssetEntry,
    updateAssetEntry,
    removeAssetEntry,
    openAssuranceVieModal,
    closeAssuranceVieModal,
    validateAssuranceVieModal,
    addAssuranceVieEntry,
    updateAssuranceVieEntry,
    removeAssuranceVieEntry,
    getFirstTestamentBeneficiaryRef,
    updateDispositionsTestament,
    addDispositionsParticularLegacy,
    updateDispositionsParticularLegacy,
    removeDispositionsParticularLegacy,
    openDispositionsModal,
    validateDispositionsModal,
  } = useSuccessionSimulatorHandlers({
    storeKey: STORE_KEY,
    reset,
    assetBreakdown,
    enfantRattachementOptions,
    addMemberForm,
    assetOwnerOptions,
    assuranceVieEntries,
    assuranceVieDraft,
    assuranceViePartyOptions,
    testamentBeneficiaryOptionsBySide,
    canOpenDispositionsModal,
    civilContext,
    devolutionContext,
    patrimonialContext,
    dispositionsDraft,
    setCivilContext,
    setLiquidationContext,
    setAssetEntries,
    setAssuranceVieEntries,
    setDevolutionContext,
    setPatrimonialContext,
    setDonationsContext,
    setEnfantsContext,
    setFamilyMembers,
    setShowAddMemberPanel,
    setShowDispositionsModal,
    setShowAssuranceVieModal,
    setAssuranceVieDraft,
    setDispositionsDraft,
    setAddMemberForm,
    setChainOrder,
    setHypothesesOpen,
  });

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
          setAssuranceVieDraft(parsed.assuranceVieEntries);
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

  // Auto-deriver les ascendants survivants par branche si des parents sont declarés.
  useEffect(() => {
    const hasParentsBySide = {
      epoux1: familyMembers.some((m) => m.type === 'parent' && (!m.branch || m.branch === 'epoux1')),
      epoux2: familyMembers.some((m) => m.type === 'parent' && m.branch === 'epoux2'),
    };
    setDevolutionContext((prev) => {
      if (
        prev.ascendantsSurvivantsBySide.epoux1 === hasParentsBySide.epoux1
        && prev.ascendantsSurvivantsBySide.epoux2 === hasParentsBySide.epoux2
      ) {
        return prev;
      }
      return {
        ...prev,
        ascendantsSurvivantsBySide: hasParentsBySide,
      };
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
          <ScFamilyContextCard
            civilContext={civilContext}
            birthDateLabels={birthDateLabels}
            showSecondBirthDate={showSecondBirthDate}
            canOpenDispositionsModal={canOpenDispositionsModal}
            enfantRattachementOptions={enfantRattachementOptions}
            enfantsContext={enfantsContext}
            familyMembers={familyMembers}
            onSituationChange={handleSituationChange}
            setCivilContext={setCivilContext}
            onOpenDispositions={openDispositionsModal}
            onAddEnfant={addEnfant}
            onToggleAddMemberPanel={() => setShowAddMemberPanel((prev) => !prev)}
            onUpdateEnfantRattachement={updateEnfantRattachement}
            onToggleEnfantDeceased={toggleEnfantDeceased}
            onRemoveEnfant={removeEnfant}
            onRemoveFamilyMember={removeFamilyMember}
          />

          <ScAssetsPassifsCard
            isExpert={isExpert}
            isMarried={isMarried}
            isPacsed={isPacsed}
            isConcubinage={isConcubinage}
            assetEntriesByCategory={assetEntriesByCategory}
            assetOwnerOptions={assetOwnerOptions}
            assetBreakdown={assetBreakdown}
            assetNetTotals={assetNetTotals}
            assuranceVieEntries={assuranceVieEntries}
            assuranceViePartyOptions={assuranceViePartyOptions}
            onAddAssetEntry={addAssetEntry}
            onUpdateAssetEntry={updateAssetEntry}
            onRemoveAssetEntry={removeAssetEntry}
            onOpenAssuranceVieModal={openAssuranceVieModal}
            onSetSimplifiedBalanceField={setSimplifiedBalanceField}
          />

          {isExpert && (
            <ScDonationsCard
              donationsContext={donationsContext}
              donationTotals={donationTotals}
              donateurOptions={donateurOptions}
              donatairesOptions={donatairesOptions}
              onAddDonationEntry={addDonationEntry}
              onUpdateDonationEntry={updateDonationEntry}
              onRemoveDonationEntry={removeDonationEntry}
            />
          )}
        </div>

        <div className="sc-right">
          <FiliationOrgchart
            civilContext={civilContext}
            enfantsContext={enfantsContext}
            familyMembers={familyMembers}
          />

          <ScSuccessionSummaryPanel
            displayUsesChainage={displayUsesChainage}
            derivedTotalDroits={derivedTotalDroits}
            synthDonutTransmis={synthDonutTransmis}
            derivedMasseTransmise={derivedMasseTransmise}
            transmissionRows={transmissionRows}
            synthHypothese={synthHypothese}
            isPacsed={isPacsed}
            chainageAnalysis={{
              order: chainageAnalysis.order,
              step1: chainageAnalysis.step1
                ? { droitsEnfants: chainageAnalysis.step1.droitsEnfants }
                : null,
              step2: chainageAnalysis.step2
                ? { droitsEnfants: chainageAnalysis.step2.droitsEnfants }
                : null,
            }}
            avFiscalByAssure={avFiscalAnalysis.byAssure}
            directDisplay={{
              simulatedDeceased: directDisplayAnalysis.simulatedDeceased,
              result: directDisplayAnalysis.result
                ? { totalDroits: directDisplayAnalysis.result.totalDroits }
                : null,
            }}
          />

          <ScDeathTimelinePanel
            chainOrder={chainOrder}
            onToggleOrder={() => setChainOrder((prev) => (prev === 'epoux2' ? 'epoux1' : 'epoux2'))}
            displayUsesChainage={displayUsesChainage}
            derivedMasseTransmise={derivedMasseTransmise}
            derivedTotalDroits={derivedTotalDroits}
            isPacsed={isPacsed}
            chainageAnalysis={{
              order: chainageAnalysis.order,
              firstDecedeLabel: chainageAnalysis.firstDecedeLabel,
              secondDecedeLabel: chainageAnalysis.secondDecedeLabel,
              step1: chainageAnalysis.step1
                ? {
                  actifTransmis: chainageAnalysis.step1.actifTransmis,
                  droitsEnfants: chainageAnalysis.step1.droitsEnfants,
                }
                : null,
              step2: chainageAnalysis.step2
                ? {
                  actifTransmis: chainageAnalysis.step2.actifTransmis,
                  droitsEnfants: chainageAnalysis.step2.droitsEnfants,
                }
                : null,
            }}
            assuranceVieByAssure={assuranceVieByAssure}
            avFiscalByAssure={avFiscalAnalysis.byAssure}
            directDisplay={{
              simulatedDeceased: directDisplayAnalysis.simulatedDeceased,
              result: directDisplayAnalysis.result
                ? { totalDroits: directDisplayAnalysis.result.totalDroits }
                : null,
            }}
          />
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
        <DispositionsModal
          dispositionsDraft={dispositionsDraft}
          setDispositionsDraft={setDispositionsDraft}
          testamentSides={testamentSides}
          testamentBeneficiaryOptionsBySide={testamentBeneficiaryOptionsBySide}
          descendantBranchesBySide={descendantBranchesBySide}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
          civilSituation={civilContext.situationMatrimoniale}
          showSharedTransmissionPct={showSharedTransmissionPct}
          isPacsIndivision={isPacsIndivision}
          showDonationEntreEpoux={showDonationEntreEpoux}
          nbDescendantBranches={nbDescendantBranches}
          nbEnfantsNonCommuns={nbEnfantsNonCommuns}
          isCommunityRegime={isCommunityRegime}
          updateDispositionsTestament={updateDispositionsTestament}
          getFirstTestamentBeneficiaryRef={getFirstTestamentBeneficiaryRef}
          onAddParticularLegacy={addDispositionsParticularLegacy}
          onUpdateParticularLegacy={updateDispositionsParticularLegacy}
          onRemoveParticularLegacy={removeDispositionsParticularLegacy}
          onClose={() => setShowDispositionsModal(false)}
          onValidate={validateDispositionsModal}
        />
      )}

      {showAssuranceVieModal && (
        <AssuranceVieModal
          assuranceVieDraft={assuranceVieDraft}
          assuranceVieDraftTotals={assuranceVieDraftTotals}
          assuranceViePartyOptions={assuranceViePartyOptions}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
          isMarried={isMarried}
          isPacsed={isPacsed}
          onClose={closeAssuranceVieModal}
          onValidate={validateAssuranceVieModal}
          onAddContract={addAssuranceVieEntry}
          onRemoveContract={removeAssuranceVieEntry}
          onUpdateContract={updateAssuranceVieEntry}
        />
      )}

      {showAddMemberPanel && (
        <AddFamilyMemberModal
          form={addMemberForm}
          setForm={setAddMemberForm}
          branchOptions={branchOptions}
          enfantsContext={enfantsContext}
          onClose={() => setShowAddMemberPanel(false)}
          onValidate={addFamilyMember}
        />
      )}
    </div>
  );
}
