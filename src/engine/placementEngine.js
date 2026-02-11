/**
 * placementEngine.js - Moteur de calcul pour le simulateur de placement
 * 
 * Architecture settings-driven : tous les paramètres fiscaux proviennent
 * des settings Supabase (/settings/base-contrat, /settings/prelevements, /settings/impots)
 * 
 * Phases : Épargne → Liquidation → Décès/Transmission
 */

// ============================================================================
// TYPES & CONSTANTES
// ============================================================================

import { DEFAULT_VERSEMENT_CONFIG, normalizeVersementConfig } from '../utils/versementConfig.js';

export const ENVELOPES = {
  AV: 'AV',
  PER: 'PER',
  PEA: 'PEA',
  CTO: 'CTO',
  SCPI: 'SCPI',
};

export const ENVELOPE_LABELS = {
  AV: 'Assurance-vie',
  PER: 'PER individuel déductible',
  PEA: 'PEA',
  CTO: 'Compte-titres',
  SCPI: 'SCPI',
};

// Valeurs par défaut si les settings ne sont pas chargés
const DEFAULT_FISCAL_PARAMS = {
  pfuIR: 0.128,
  pfuPS: 0.172,
  pfuTotal: 0.30,
  psPatrimoine: 0.172,
  avAbattement8ansSingle: 4600,
  avAbattement8ansCouple: 9200,
  avSeuilPrimes150k: 150000,
  avTauxSousSeuil8ans: 0.075,
  avTauxSurSeuil8ans: 0.128,
  av990IAbattement: 152500,
  av990ITranche1Taux: 0.20,
  av990ITranche1Plafond: 700000,
  av990ITranche2Taux: 0.3125,
  av757BAbattement: 30500,
  peaAncienneteMin: 5,
  dividendesAbattementPercent: 0.40,
};

const REQUIRED_NUMERIC_FISCAL_KEYS = [
  'pfuIR',
  'pfuPS',
  'pfuTotal',
  'psPatrimoine',
  'avAbattement8ansSingle',
  'avAbattement8ansCouple',
  'avSeuilPrimes150k',
  'avTauxSousSeuil8ans',
  'avTauxSurSeuil8ans',
  'av990IAbattement',
  'av990ITranche1Taux',
  'av990ITranche1Plafond',
  'av990ITranche2Taux',
  'av757BAbattement',
  'peaAncienneteMin',
  'dividendesAbattementPercent',
];

let hasWarnedMissingFiscalParams = false;

// ============================================================================
// HELPERS
// ============================================================================

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Extrait les paramètres fiscaux depuis les settings Supabase
 * @param {Object} fiscalitySettings - Settings de /settings/base-contrat (legacy: fiscality_settings)
 * @param {Object} psSettings - Settings de /settings/prelevements
 * @returns {Object} Paramètres normalisés
 */
export function extractFiscalParams(fiscalitySettings, psSettings) {
  const params = { ...DEFAULT_FISCAL_PARAMS };

  // PS patrimoine
  if (psSettings?.patrimony?.current?.totalRate) {
    params.psPatrimoine = psSettings.patrimony.current.totalRate / 100;
    params.pfuPS = params.psPatrimoine;
    params.pfuTotal = params.pfuIR + params.pfuPS;
  }

  // Assurance-vie
  const av = fiscalitySettings?.assuranceVie;
  if (av) {
    // Retraits capital
    const rc = av.retraitsCapital;
    if (rc) {
      if (rc.psRatePercent) params.psPatrimoine = rc.psRatePercent / 100;
      
      const d2017 = rc.depuis2017;
      if (d2017) {
        if (d2017.moins8Ans?.irRatePercent) {
          params.pfuIR = d2017.moins8Ans.irRatePercent / 100;
        }
        if (d2017.plus8Ans) {
          const p8 = d2017.plus8Ans;
          if (p8.abattementAnnuel?.single) params.avAbattement8ansSingle = p8.abattementAnnuel.single;
          if (p8.abattementAnnuel?.couple) params.avAbattement8ansCouple = p8.abattementAnnuel.couple;
          if (p8.primesNettesSeuil) params.avSeuilPrimes150k = p8.primesNettesSeuil;
          if (p8.irRateUnderThresholdPercent) params.avTauxSousSeuil8ans = p8.irRateUnderThresholdPercent / 100;
          if (p8.irRateOverThresholdPercent) params.avTauxSurSeuil8ans = p8.irRateOverThresholdPercent / 100;
        }
      }
    }

    // Décès
    const deces = av.deces;
    if (deces?.primesApres1998) {
      if (deces.primesApres1998.allowancePerBeneficiary) {
        params.av990IAbattement = deces.primesApres1998.allowancePerBeneficiary;
      }
      if (deces.primesApres1998.brackets?.[0]) {
        params.av990ITranche1Taux = deces.primesApres1998.brackets[0].ratePercent / 100;
        if (deces.primesApres1998.brackets[0].upTo) {
          params.av990ITranche1Plafond = deces.primesApres1998.brackets[0].upTo - params.av990IAbattement;
        }
      }
      if (deces.primesApres1998.brackets?.[1]) {
        params.av990ITranche2Taux = deces.primesApres1998.brackets[1].ratePercent / 100;
      }
    }
    if (deces?.apres70ans?.globalAllowance) {
      params.av757BAbattement = deces.apres70ans.globalAllowance;
    }
  }

  // PER individuel
  const per = fiscalitySettings?.perIndividuel;
  if (per?.sortieCapital?.pfu) {
    if (per.sortieCapital.pfu.irRatePercent) {
      params.pfuIR = per.sortieCapital.pfu.irRatePercent / 100;
    }
    if (per.sortieCapital.pfu.psRatePercent) {
      params.pfuPS = per.sortieCapital.pfu.psRatePercent / 100;
    }
    params.pfuTotal = params.pfuIR + params.pfuPS;
  }

  // Dividendes (CTO au barème)
  const dividendes = fiscalitySettings?.dividendes;
  if (dividendes?.abattementBaremePercent != null) {
    params.dividendesAbattementPercent = clamp(dividendes.abattementBaremePercent / 100, 0, 1);
  }

  // Vérifications finales et warnings centralisés
  const missingKeys = [];
  for (const key of REQUIRED_NUMERIC_FISCAL_KEYS) {
    const value = params[key];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      params[key] = DEFAULT_FISCAL_PARAMS[key];
      missingKeys.push(key);
    }
  }

  if (typeof params.pfuPS !== 'number' || Number.isNaN(params.pfuPS)) {
    params.pfuPS = params.psPatrimoine;
  }
  if (typeof params.pfuTotal !== 'number' || Number.isNaN(params.pfuTotal)) {
    params.pfuTotal = (params.pfuIR ?? 0) + (params.pfuPS ?? params.psPatrimoine ?? 0);
  }

  if (missingKeys.length && !hasWarnedMissingFiscalParams) {
    console.warn(
      '[Placement] Paramètres fiscaux incomplets, fallback appliqué pour :',
      missingKeys.join(', ')
    );
    hasWarnedMissingFiscalParams = true;
  }

  return params;
}

// ============================================================================
// PHASE 1 : ÉPARGNE
// ============================================================================

/**
 * Simule la phase d'épargne pour un produit
 * @param {Object} product - Configuration du produit
 * @param {Object} client - Données client (TMI, âges, etc.)
 * @param {Object} fiscalParams - Paramètres fiscaux extraits
 * @param {Object} options - Options de simulation
 * @returns {Object} Résultats de la phase épargne
 */
export function simulateEpargne(product, client, fiscalParams, options = {}) {
  const {
    envelope,
    dureeEpargne = 20,
    perBancaire = false,
    fraisGestion = 0,
    optionBaremeIR = false,
  } = product;

  const versementConfig = normalizeVersementConfig(product.versementConfig || DEFAULT_VERSEMENT_CONFIG);
  const { initial, annuel, ponctuels = [], capitalisation, distribution } = versementConfig;

  const { tmiEpargne = 0.30, ageActuel = 45 } = client;
  const fp = fiscalParams;

  const isSCPI = envelope === ENVELOPES.SCPI;

  const pct = (value) => Math.max(0, Math.min(100, value ?? 0)) / 100;

  const sanitizeSplit = (pctCapi, pctDistrib) => {
    let capi = pctCapi;
    let distrib = pctDistrib;
    if (isSCPI) {
      capi = 0;
      distrib = 1;
    } else {
      const total = capi + distrib;
      if (total === 0) {
        capi = 1;
        distrib = 0;
      } else {
        capi = capi / total;
        distrib = distrib / total;
      }
    }
    return { capi, distrib };
  };

  const initialSplitRatio = sanitizeSplit(pct(initial.pctCapitalisation), pct(initial.pctDistribution));
  const annualSplitRatio = sanitizeSplit(pct(annuel.pctCapitalisation), pct(annuel.pctDistribution));

  const splitAmount = (amount, splitRatio) => ({
    capi: amount * splitRatio.capi,
    distrib: amount * splitRatio.distrib,
  });

  const ponctuelsByYear = ponctuels.reduce((acc, p) => {
    const key = Math.max(1, Math.min(dureeEpargne, p.annee || 1));
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const capitalisationRate = capitalisation.rendementAnnuel ?? product.rendement ?? 0.03;
  const distributionYield = distribution.tauxDistribution ?? 0;
  const distributionRevalo = distribution.rendementAnnuel ?? product.tauxRevalorisation ?? 0.02;
  const distributionStrategyRaw = distribution.strategie || 'stocker';
  const distributionStrategy = isSCPI && distributionStrategyRaw === 'stocker'
    ? 'apprehender'
    : distributionStrategyRaw;
  const delaiJouissance = distribution.delaiJouissance ?? product.delaiJouissance ?? 0;
  const coeffDelaiJouissance = delaiJouissance > 0 ? (12 - delaiJouissance) / 12 : 1;

  const dureeProduit = distribution.dureeProduit ?? product.dureeProduit ?? null;

  const rows = [];
  let capitalCapi = 0;
  let capitalDistrib = 0;
  let compteEspece = 0;
  let pendingReinvestCapi = 0; // coupon net de N, réinvesti en N+1
  let pendingReinvestDistrib = 0; // loyer/dividende net de N, réinvesti en N+1 dans la poche distribution (SCPI)
  let cumulVersements = 0;
  let cumulVersementsNets = 0;
  let cumulInterets = 0;
  let cumulGains = 0;
  let cumulEffort = 0;
  let cumulEconomieIR = 0;
  let cumulPSFondsEuro = 0;
  let cumulRevenusDistribues = 0;
  let cumulFiscaliteRevenus = 0;
  let cumulRevenusNetsPercus = 0;
  let cumulCompteEspece = 0;
  let plusValueLatenteCTO = 0;
  let anneeDepuisDernierCycleDistrib = 0;

  const initialAmount = initial.montant ?? product.versementInitial ?? 0;
  const initialFrais = initial.fraisEntree ?? product.fraisEntree ?? 0;
  const initialNet = initialAmount * (1 - initialFrais);
  const splitInitial = splitAmount(initialNet, initialSplitRatio);
  capitalCapi += splitInitial.capi;
  capitalDistrib += splitInitial.distrib;
  if (isSCPI) {
    // Invariant : SCPI = 100% distribution
    capitalCapi = 0;
  }
  cumulVersements += initialAmount;
  cumulVersementsNets += initialNet;

  if (envelope === ENVELOPES.PER && initialAmount > 0) {
    const eco = initialAmount * tmiEpargne;
    cumulEconomieIR += eco;
    cumulEffort += initialAmount - eco;
  } else {
    cumulEffort += initialAmount;
  }

  for (let annee = 1; annee <= dureeEpargne; annee++) {
    const age = ageActuel + annee - 1;

    // Réinvestissement en capitalisation (coupon net de N-1)
    let reinvestCapiN = pendingReinvestCapi;
    let reinvestDistribN = pendingReinvestDistrib;
    if (isSCPI) {
      // SCPI : aucun flux ne doit alimenter la capitalisation
      reinvestCapiN = 0;
      pendingReinvestCapi = 0;
    }
    if (reinvestCapiN > 0) {
      // Le réinvestissement provient d'un cash (compte espèce) accumulé en N-1
      const deducted = Math.min(compteEspece, reinvestCapiN);
      compteEspece -= deducted;
      capitalCapi += reinvestCapiN;
      pendingReinvestCapi = 0;
    }
    if (reinvestDistribN > 0) {
      const deducted = Math.min(compteEspece, reinvestDistribN);
      compteEspece -= deducted;
      capitalDistrib += reinvestDistribN;
      pendingReinvestDistrib = 0;
    }

    const reinvestissementN = isSCPI ? reinvestDistribN : reinvestCapiN;

    const capitalCapiDebut = capitalCapi;
    const capitalDistribDebut = capitalDistrib;
    const compteEspeceDebut = compteEspece;

    let versementBrut = annuel.montant ?? product.versementAnnuel ?? 0;
    const fraisAnnuel = annuel.fraisEntree ?? initialFrais;
    let versementNet = 0;
    let addedCapi = 0;
    let addedDistrib = 0;

    // Calculs liés à la garantie de bonne fin (PER)
    let capitalDecesTheorique = 0;
    let capitalDecesDegressif = 0;
    if (envelope === ENVELOPES.PER && annuel.garantieBonneFin?.active) {
      const versementAnnuelPlan = annuel.montant ?? product.versementAnnuel ?? 0;
      const remainingYears = Math.max(0, dureeEpargne - annee);
      if (versementAnnuelPlan > 0) {
        capitalDecesDegressif = versementAnnuelPlan * remainingYears;
      }
      if (versementBrut > 0) {
        const remainingYearsTheorique = dureeEpargne - annee + 1;
        capitalDecesTheorique = versementBrut * Math.max(0, remainingYearsTheorique);
      }
    }

    if (versementBrut > 0) {
      const net = versementBrut * (1 - fraisAnnuel);
      versementNet += net;
      const split = splitAmount(net, annualSplitRatio);
      capitalCapi += split.capi;
      capitalDistrib += split.distrib;
      addedCapi += split.capi;
      addedDistrib += split.distrib;
    }

    const ponctuelsList = ponctuelsByYear[annee] || [];
    for (const p of ponctuelsList) {
      const montant = p.montant ?? 0;
      const frais = p.fraisEntree ?? fraisAnnuel ?? 0;
      const net = montant * (1 - frais);
      versementBrut += montant;
      versementNet += net;
      const splitRatio = sanitizeSplit(pct(p.pctCapitalisation), pct(p.pctDistribution));
      const split = splitAmount(net, splitRatio);
      capitalCapi += split.capi;
      capitalDistrib += split.distrib;
      addedCapi += split.capi;
      addedDistrib += split.distrib;
    }

    cumulVersements += versementBrut;
    cumulVersementsNets += versementNet;

    let economieIRAnnee = 0;
    if (envelope === ENVELOPES.PER && versementBrut > 0) {
      economieIRAnnee = versementBrut * tmiEpargne;
      cumulEconomieIR += economieIRAnnee;
      cumulEffort += versementBrut - economieIRAnnee;
    } else {
      cumulEffort += versementBrut;
    }

    // Capitalisation : revalorisation annuelle (pas de délai de jouissance)
    const capiBase = capitalCapiDebut + addedCapi;
    const gainsCapi = capiBase * capitalisationRate;
    capitalCapi += gainsCapi;
    cumulInterets += gainsCapi;

    // ------------------------------
    // Distribution :
    // A) Revalorisation du capital investi (taux distributionRevalo)
    // B) Coupon annuel (distributionYield) sur base investie
    // ------------------------------
    const distribInvested = capitalDistribDebut + addedDistrib;
    const revaloDistrib = distribInvested * distributionRevalo;
    capitalDistrib += revaloDistrib;

    // Base coupon : délai de jouissance appliqué uniquement au coupon
    const couponBase = (annee === 1 ? capitalDistribDebut * coeffDelaiJouissance : capitalDistribDebut) + (addedDistrib * coeffDelaiJouissance);
    const couponBrut = couponBase * distributionYield;

    // Fiscalité du coupon (enveloppe dépendante)
    let fiscaliteCoupon = 0;
    if (couponBrut > 0) {
      if (envelope === ENVELOPES.SCPI) {
        const ir = couponBrut * tmiEpargne;
        const ps = couponBrut * fp.psPatrimoine;
        fiscaliteCoupon = ir + ps;
      } else if (envelope === ENVELOPES.CTO) {
        if (optionBaremeIR) {
          const base = couponBrut * (1 - fp.dividendesAbattementPercent);
          const ir = base * tmiEpargne;
          const ps = couponBrut * fp.psPatrimoine;
          fiscaliteCoupon = ir + ps;
        } else {
          fiscaliteCoupon = couponBrut * fp.pfuTotal;
        }
      } else {
        // PEA / AV / PER : pas de fiscalité sur le coupon en phase épargne dans l'enveloppe
        fiscaliteCoupon = 0;
      }
    }
    const couponNet = couponBrut - fiscaliteCoupon;

    // Tracking global (debug/synthèse)
    cumulRevenusDistribues += couponBrut;
    cumulFiscaliteRevenus += fiscaliteCoupon;

    let revenusNetsPercusAnnee = 0;
    let reinvestissementDistribNetAnnee = 0;

    // Stratégie sur coupon NET
    if (couponNet > 0) {
      if (distributionStrategy === 'apprehender') {
        revenusNetsPercusAnnee = couponNet;
        cumulRevenusNetsPercus += couponNet;
      } else if (distributionStrategy === 'reinvestir_capi') {
        reinvestissementDistribNetAnnee = couponNet;
        // Les revenus restent dans le patrimoine (cash) puis sont réinvestis en N+1
        compteEspece += couponNet;
        cumulCompteEspece += couponNet;
        // réinvesti en N+1
        if (isSCPI) {
          pendingReinvestDistrib += couponNet;
        } else {
          pendingReinvestCapi += couponNet;
        }
      } else {
        // stocker : compte espèces à 0%
        compteEspece += couponNet;
        cumulCompteEspece += couponNet;
      }
    }

    let psFondsEuro = 0;
    if (envelope === ENVELOPES.AV && options.fondsEuro) {
      psFondsEuro = gainsCapi * fp.psPatrimoine;
      capitalCapi -= psFondsEuro;
      cumulPSFondsEuro += psFondsEuro;
    }

    // PV latente CTO (uniquement sur la revalorisation du capital investi)
    if (envelope === ENVELOPES.CTO) {
      plusValueLatenteCTO += revaloDistrib;
    }

    // Gains année (règle simple):
    // - gainsCapi + revaloDistrib
    // - + revenus nets (couponNet) dès lors qu'ils ne sont pas appréhendés (ils restent dans le patrimoine)
    const couponResteDansPatrimoine = distributionStrategy !== 'apprehender';
    const gainsAnnee = gainsCapi + revaloDistrib + (couponResteDansPatrimoine ? couponNet : 0);
    cumulGains += gainsAnnee;

    if (isSCPI) {
      // Invariant : SCPI = 100% distribution
      capitalCapi = 0;
    }

    // Terme du produit en distribution (cycle)
    let cessionProduit = false;
    let fiscalitePV = 0;
    if (dureeProduit && distribInvested > 0) {
      anneeDepuisDernierCycleDistrib += 1;
      if (anneeDepuisDernierCycleDistrib >= dureeProduit) {
        cessionProduit = true;
        const reinvestirVersAuTerme = distribution.reinvestirVersAuTerme || 'capitalisation';
        if (reinvestirVersAuTerme === 'capitalisation') {
          // Basculer vers capitalisation : déduire la fiscalité sur PV si CTO
          if (envelope === ENVELOPES.CTO && plusValueLatenteCTO > 0) {
            if (optionBaremeIR) {
              fiscalitePV = plusValueLatenteCTO * tmiEpargne + plusValueLatenteCTO * fp.psPatrimoine;
            } else {
              fiscalitePV = plusValueLatenteCTO * fp.pfuTotal;
            }
            cumulFiscaliteRevenus += fiscalitePV;
          }

          const montantBrut = capitalDistrib + compteEspece;
          const montantNet = Math.max(0, montantBrut - fiscalitePV);
          capitalCapi += montantNet;
          capitalDistrib = 0;
          compteEspece = 0;
          plusValueLatenteCTO = 0;
        } else {
          // Renouveler en distribution : redémarrer un cycle (sans liquidation)
          // Option : réinjecter le stock dans la poche distribution à l'échéance
          if (compteEspece > 0) {
            capitalDistrib += compteEspece;
            compteEspece = 0;
          }
        }

        anneeDepuisDernierCycleDistrib = 0;
      }
    } else {
      anneeDepuisDernierCycleDistrib = 0;
    }

    rows.push({
      annee,
      age,
      capitalDebut: round2(capitalCapiDebut + capitalDistribDebut + compteEspeceDebut),
      versementBrut: round2(versementBrut),
      versementNet: round2(versementNet),
      cumulVersementsNets: round2(cumulVersementsNets),
      gains: round2(gainsCapi),
      gainsAnnee: round2(gainsAnnee),
      cumulInterets: round2(cumulInterets),
      cumulGains: round2(cumulGains),
      psFondsEuro: round2(psFondsEuro),
      revenuDistribue: round2(couponBrut),
      cumulRevenusDistribues: round2(cumulRevenusDistribues),
      fiscaliteRevenu: round2(fiscaliteCoupon),
      revenuNetPercu: round2(couponNet),
      cumulRevenusNetsPercus: round2(cumulRevenusNetsPercus),
      revalorisation: round2(revaloDistrib),
      economieIR: round2(economieIRAnnee),
      effortReel: round2(versementBrut - economieIRAnnee),
      compteEspece: round2(compteEspece),
      cumulCompteEspece: round2(cumulCompteEspece),
      capitalInvesti: round2(capitalCapi + capitalDistrib),
      capitalFin: round2(capitalCapi + capitalDistrib + compteEspece),
      cessionProduit,
      fiscalitePV: round2(fiscalitePV),
      reinvestissement: round2(reinvestissementN),
      capitalDecesTheorique: round2(capitalDecesTheorique),
      capitalDecesDegressif: round2(capitalDecesDegressif),

      revenusNetsPercusAnnee: round2(revenusNetsPercusAnnee),
      reinvestissementDistribNetAnnee: round2(reinvestissementDistribNetAnnee),

      // Debug distribution
      couponBrut: round2(couponBrut),
      fiscaliteCoupon: round2(fiscaliteCoupon),
      couponNet: round2(couponNet),
      revaloDistrib: round2(revaloDistrib),
      capitalCapi: round2(capitalCapi),
      capitalDistrib: round2(capitalDistrib),
      compteEspece0pct: round2(compteEspece),
    });
  }

  const capitalInvestiFinal = capitalCapi + capitalDistrib;
  const capitalFinal = capitalInvestiFinal + compteEspece;
  const plusValueLatente = Math.max(0, capitalInvestiFinal - cumulVersementsNets);

  return {
    envelope,
    dureeEpargne,
    perBancaire,
    rendement: isSCPI ? distributionYield : capitalisationRate,
    fraisGestion,
    tauxRevalorisation: distributionRevalo,
    optionBaremeIR,
    rows,
    capitalAcquis: round2(capitalFinal),
    cumulVersements: round2(cumulVersements),
    cumulEffort: round2(cumulEffort),
    cumulEconomieIR: round2(cumulEconomieIR),
    plusValueLatente: round2(plusValueLatente),
    cumulPSFondsEuro: round2(cumulPSFondsEuro),
    cumulRevenusDistribues: round2(cumulRevenusDistribues),
    cumulFiscaliteRevenus: round2(cumulFiscaliteRevenus),
  };
}

// ============================================================================
// PHASE 2 : LIQUIDATION
// ============================================================================

/**
 * Calcule la fiscalité sur un retrait selon l'enveloppe
 * @param {Object} params - Paramètres du retrait
 * @param {Object} fiscalParams - Paramètres fiscaux
 * @returns {Object} Détail de la fiscalité
 */
export function calculFiscaliteRetrait(params, fiscalParams) {
  const {
    envelope,
    montantRetrait,
    partGains,
    partCapital,
    anneeOuverture = 0,
    tmiRetraite = 0.11,
    situation = 'single',
    primesCumulees = 0,
    abattementUtilise = 0,
    optionBaremeIR = false,
  } = params;

  const fp = fiscalParams;
  let irSurGains = 0;
  let irSurCapital = 0;
  let ps = 0;
  let abattementApplique = 0;

  switch (envelope) {
    case ENVELOPES.AV: {
      if (anneeOuverture >= 8) {
        // Contrat >= 8 ans : abattement 4 600 € (célibataire) ou 9 200 € (couple)
        const abattementMax = situation === 'couple' 
          ? fp.avAbattement8ansCouple 
          : fp.avAbattement8ansSingle;
        const abattementDispo = Math.max(0, abattementMax - abattementUtilise);
        abattementApplique = Math.min(partGains, abattementDispo);
        const assiette = Math.max(0, partGains - abattementApplique);

        if (optionBaremeIR) {
          // Option barème IR progressif
          irSurGains = assiette * tmiRetraite;
        } else {
          // PFU : taux selon seuil 150k de primes
          const taux = primesCumulees <= fp.avSeuilPrimes150k 
            ? fp.avTauxSousSeuil8ans  // 7.5%
            : fp.avTauxSurSeuil8ans;  // 12.8%
          irSurGains = assiette * taux;
        }
      } else {
        // Contrat < 8 ans : 12.8% ou option barème
        if (optionBaremeIR) {
          irSurGains = partGains * tmiRetraite;
        } else {
          irSurGains = partGains * fp.pfuIR; // 12.8%
        }
      }
      ps = partGains * fp.psPatrimoine; // 17.2% toujours
      break;
    }

    case ENVELOPES.PER: {
      // PER toujours déductible : capital → barème IR (TMI retraite), gains → PFU
      irSurCapital = partCapital * tmiRetraite;
      irSurGains = partGains * fp.pfuIR;
      ps = partGains * fp.psPatrimoine;
      break;
    }

    case ENVELOPES.PEA: {
      if (anneeOuverture >= fp.peaAncienneteMin) {
        // >= 5 ans : PS uniquement
        irSurGains = 0;
      } else {
        // < 5 ans : PFU complet
        irSurGains = partGains * fp.pfuIR;
      }
      ps = partGains * fp.psPatrimoine;
      break;
    }

    case ENVELOPES.CTO:
    case ENVELOPES.SCPI:
    default: {
      // PFU par défaut
      irSurGains = partGains * fp.pfuIR;
      ps = partGains * fp.psPatrimoine;
      break;
    }
  }

  const fiscaliteTotal = irSurGains + irSurCapital + ps;

  return {
    irSurGains: round2(irSurGains),
    irSurCapital: round2(irSurCapital),
    ps: round2(ps),
    fiscaliteTotal: round2(fiscaliteTotal),
    abattementApplique: round2(abattementApplique),
    retraitNet: round2(montantRetrait - fiscaliteTotal),
  };
}

/**
 * Simule la phase de liquidation
 * @param {Object} epargneResult - Résultat de la phase épargne
 * @param {Object} liquidationParams - Paramètres de liquidation
 * @param {Object} client - Données client
 * @param {Object} fiscalParams - Paramètres fiscaux
 * @returns {Object} Résultats de la phase liquidation
 */
/**
 * Calcule le retrait annuel avec la formule VPM (épuisement progressif)
 * VPM = Capital * r / (1 - (1+r)^-n)
 * @param {number} capital - Capital à épuiser
 * @param {number} rendement - Taux de rendement annuel
 * @param {number} duree - Nombre d'années
 * @returns {number} Retrait annuel brut
 */
function calculVPM(capital, rendement, duree) {
  if (duree <= 0) return capital;
  if (rendement === 0) return capital / duree;
  const r = rendement;
  const n = duree;
  return capital * r / (1 - Math.pow(1 + r, -n));
}

export function simulateLiquidation(epargneResult, liquidationParams, client, fiscalParams, transmissionParams = {}) {
  const {
    mode = 'epuiser', // 'epuiser' | 'mensualite' | 'unique'
    duree = 25,
    mensualiteCible = 0,
    montantUnique = 0,
    optionBaremeIR: optionBaremeIRLiquidation = false,
  } = liquidationParams;

  const {
    tmiRetraite = 0.11,
    situation = 'single',
    ageActuel = 45,
  } = client;

  const { 
    envelope, capitalAcquis, plusValueLatente, cumulVersements, dureeEpargne, 
    tauxRevalorisation = 0.02, optionBaremeIR = false 
  } = epargneResult;
  const fp = fiscalParams;

  // Âge au décès pour calculer la durée de liquidation
  const ageAuDeces = transmissionParams.ageAuDeces || 85;
  const ageFinEpargne = ageActuel + dureeEpargne;
  const dureeJusquAuDeces = Math.max(1, ageAuDeces - ageFinEpargne);

  // Rendement annuel en phase liquidation
  // - si l'utilisateur override via l'UI, liquidationParams.rendement prime
  // - sinon, reprendre le rendement de la phase épargne (déjà normalisé)
  const rendement = liquidationParams.rendement ?? epargneResult.rendement ?? 0.03;

  // Ratio gains/capital (évolue avec les rendements)
  let totalGains = plusValueLatente;
  let totalCapital = capitalAcquis - plusValueLatente;

  const rows = [];
  let capitalRestant = capitalAcquis;
  let cumulRetraitsBruts = 0;
  let cumulRetraitsNets = 0;
  let cumulFiscalite = 0;
  let abattementCumulUtilise = 0;
  let anneeOuverture = dureeEpargne;

  // SCPI : pas de stratégie de retraits, juste revalorisation + loyers jusqu'au décès
  const isSCPI = envelope === ENVELOPES.SCPI;
  const isCTOorPEA = envelope === ENVELOPES.CTO || envelope === ENVELOPES.PEA;

  // Calcul du nombre d'années de liquidation selon le mode
  let anneesLiquidation;
  if (isSCPI) {
    // SCPI : pas de retraits, juste projection jusqu'au décès
    anneesLiquidation = dureeJusquAuDeces;
  } else if (mode === 'unique') {
    // Retrait unique puis fructification jusqu'au décès
    anneesLiquidation = dureeJusquAuDeces;
  } else if (mode === 'mensualite') {
    // Mensualité cible : durée jusqu'au décès
    anneesLiquidation = dureeJusquAuDeces;
  } else {
    // Épuiser sur N années (durée choisie par l'utilisateur)
    anneesLiquidation = duree;
  }

  // Calcul du retrait VPM pour le mode "épuiser" (constant sur toute la durée)
  // Simplification : en liquidation, tout est ramené en capitalisation (sauf SCPI)
  let retraitVPM = 0;
  if (mode === 'epuiser' && !isSCPI) {
    retraitVPM = calculVPM(capitalAcquis, rendement, duree);
  }

  for (let annee = 1; annee <= anneesLiquidation; annee++) {
    if (capitalRestant <= 0) break;

    anneeOuverture++;
    const age = ageFinEpargne + annee;
    const capitalDebut = capitalRestant;
    const pvLatenteDebut = totalGains;

    // 1. Appliquer le rendement annuel sur le capital restant
    let gainsAnnee = 0;
    let loyersOuDividendes = 0;
    let fiscaliteRevenus = 0;

    if (isSCPI) {
      // SCPI : loyers distribués + revalorisation
      loyersOuDividendes = capitalRestant * rendement;
      const revalorisation = capitalRestant * tauxRevalorisation;
      capitalRestant += revalorisation;
      gainsAnnee = revalorisation;
      // Fiscalité loyers : barème IR + PS
      const irLoyers = loyersOuDividendes * tmiRetraite;
      const psLoyers = loyersOuDividendes * fp.psPatrimoine;
      fiscaliteRevenus = irLoyers + psLoyers;
    } else {
      // AV / PER / CTO / PEA : rendement capitalisation (simplification liquidation)
      gainsAnnee = capitalRestant * rendement;
      capitalRestant += gainsAnnee;
      totalGains += gainsAnnee;
    }

    const pvLatenteAvantRetrait = totalGains;

    // 2. Recalculer la quotité gains/capital
    const quotiteGains = capitalRestant > 0 ? totalGains / capitalRestant : 0;

    // 3. Déterminer le retrait brut selon le mode
    let retraitBrut = 0;
    if (isSCPI) {
      // SCPI : pas de retrait, les loyers sont distribués directement
      retraitBrut = loyersOuDividendes;
    } else if (mode === 'unique') {
      // Retrait unique la première année seulement
      if (annee === 1) {
        retraitBrut = Math.min(montantUnique, capitalRestant);
      }
      // Les années suivantes : pas de retrait, le capital fructifie
    } else if (mode === 'mensualite') {
      // Mensualité cible annuelle
      retraitBrut = Math.min(mensualiteCible * 12, capitalRestant);
    } else {
      // Épuiser sur N années avec formule VPM (retrait constant)
      retraitBrut = Math.min(retraitVPM, capitalRestant);
    }

    if (!isSCPI) {
      retraitBrut = Math.min(retraitBrut, capitalRestant);
    }

    // 4. Quote-part gains dans le retrait
    const partGains = isSCPI ? 0 : retraitBrut * quotiteGains;
    const partCapital = isSCPI ? 0 : retraitBrut - partGains;

    // Fiscalité sur le retrait (pas pour SCPI, déjà fiscalisé sur les loyers)
    let fiscalite;
    if (isSCPI) {
      // SCPI : fiscalité déjà calculée sur les loyers
      fiscalite = {
        irSurGains: 0,
        irSurCapital: 0,
        ps: 0,
        fiscaliteTotal: fiscaliteRevenus,
        retraitNet: loyersOuDividendes - fiscaliteRevenus,
        abattementApplique: 0,
      };
    } else if (isCTOorPEA) {
      // CTO/PEA : fiscalité sur les plus-values de cession
      let irPV = 0;
      let psPV = 0;
      if (envelope === ENVELOPES.CTO) {
        // CTO : PV de cession = partGains, fiscalisée au PFU ou barème
        if (optionBaremeIR) {
          irPV = partGains * tmiRetraite;
        } else {
          irPV = partGains * fp.pfuIR;
        }
        psPV = partGains * fp.psPatrimoine;
      } else {
        // PEA : < 5 ans = PFU (IR + PS), >= 5 ans = PS uniquement (règle existante)
        irPV = anneeOuverture >= fp.peaAncienneteMin ? 0 : partGains * fp.pfuIR;
        psPV = partGains * fp.psPatrimoine;
      }
      fiscalite = {
        irSurGains: irPV,
        irSurCapital: 0,
        ps: psPV,
        fiscaliteTotal: irPV + psPV + fiscaliteRevenus,
        retraitNet: retraitBrut - irPV - psPV,
        abattementApplique: 0,
      };
    } else {
      // AV, PER : fiscalité classique
      fiscalite = calculFiscaliteRetrait({
        envelope,
        montantRetrait: retraitBrut,
        partGains,
        partCapital,
        anneeOuverture,
        tmiRetraite,
        situation,
        primesCumulees: cumulVersements,
        abattementUtilise: abattementCumulUtilise,
        optionBaremeIR: optionBaremeIRLiquidation,
      }, fp);
    }

    abattementCumulUtilise += fiscalite.abattementApplique || 0;
    
    // 5. Mettre à jour les totaux après retrait
    if (!isSCPI) {
      // Pour SCPI, le capital ne diminue pas (loyers distribués, pas de retrait)
      capitalRestant -= retraitBrut;
      totalGains -= partGains;
      totalCapital -= partCapital;
    }

    const pvLatenteFin = totalGains;
    
    cumulRetraitsBruts += retraitBrut;
    cumulRetraitsNets += fiscalite.retraitNet;
    cumulFiscalite += fiscalite.fiscaliteTotal;

    rows.push({
      annee,
      age,
      isAgeAuDeces: age === ageAuDeces,
      capitalDebut: round2(capitalDebut),
      gainsAnnee: round2(gainsAnnee),
      retraitBrut: round2(retraitBrut),
      partGains: round2(partGains),
      partCapital: round2(partCapital),
      totalCapitalRestant: round2(totalCapital),
      totalInteretsRestants: round2(totalGains),
      pvLatenteDebut: round2(pvLatenteDebut),
      pvLatenteAvantRetrait: round2(pvLatenteAvantRetrait),
      pvLatenteFin: round2(pvLatenteFin),
      irSurGains: fiscalite.irSurGains,
      irSurCapital: fiscalite.irSurCapital,
      ps: fiscalite.ps,
      fiscaliteTotal: fiscalite.fiscaliteTotal,
      retraitNet: fiscalite.retraitNet,
      capitalFin: round2(capitalRestant),
    });
  }

  // Calculer le revenu moyen net sur les années avec retrait effectif
  const anneesAvecRetrait = rows.filter(r => r.retraitBrut > 0).length;
  const revenuAnnuelMoyenNet = anneesAvecRetrait > 0 ? cumulRetraitsNets / anneesAvecRetrait : 0;

  // Calculer les cumuls jusqu'au décès (pour la synthèse)
  const rowsJusquAuDeces = rows.filter(r => r.age <= ageAuDeces);
  const ligneAuDeces = rows.find(r => r.age === ageAuDeces) || rows[rows.length - 1];
  const cumulRetraitsNetsAuDeces = rowsJusquAuDeces.reduce((sum, r) => sum + r.retraitNet, 0);
  const cumulFiscaliteAuDeces = rowsJusquAuDeces.reduce((sum, r) => sum + r.fiscaliteTotal, 0);
  const capitalRestantAuDeces = ligneAuDeces ? ligneAuDeces.capitalFin : capitalRestant;

  return {
    envelope,
    mode,
    duree: anneesLiquidation,
    ageFinEpargne,
    ageAuDeces,
    rows,
    capitalRestant: round2(capitalRestant),
    capitalRestantAuDeces: round2(capitalRestantAuDeces),
    cumulRetraitsBruts: round2(cumulRetraitsBruts),
    cumulRetraitsNets: round2(cumulRetraitsNets),
    cumulRetraitsNetsAuDeces: round2(cumulRetraitsNetsAuDeces),
    cumulFiscalite: round2(cumulFiscalite),
    cumulFiscaliteAuDeces: round2(cumulFiscaliteAuDeces),
    revenuAnnuelMoyenNet: round2(revenuAnnuelMoyenNet),
  };
}

// ============================================================================
// PHASE 3 : DÉCÈS / TRANSMISSION
// ============================================================================

/**
 * Calcule la fiscalité de transmission selon l'enveloppe
 * @param {Object} params - Paramètres de transmission
 * @param {Object} fiscalParams - Paramètres fiscaux
 * @returns {Object} Détail de la transmission
 */
export function calculTransmission(params, fiscalParams) {
  const {
    envelope,
    capitalTransmis,
    cumulVersements = 0,
    ageAuDeces = 85,
    agePremierVersement = 45,
    nbBeneficiaires = 1,
    beneficiaryType = 'enfants',
    perBancaire = false,
  } = params;

  const fp = fiscalParams;
  // Taux DMTG choisi par l'utilisateur sur la page Transmission
  const dmtgTauxChoisi = fp.dmtgTauxChoisi || 0.20;

  const effectiveNbBeneficiaires = beneficiaryType === 'conjoint' ? 1 : Math.max(1, nbBeneficiaires || 1);
  
  let taxeDmtg = 0; // droits de succession (barème DMTG choisi)
  let taxeForfaitaire = 0; // prélèvement forfaitaire (990 I)
  let abattement = 0;
  let regime = '';
  const psTaux = typeof fp.psPatrimoine === 'number' ? fp.psPatrimoine : 0.172;
  const resultatPs = {
    applicable: false,
    assiette: 0,
    taux: psTaux,
    montant: 0,
    note: '',
  };

  const computePsDeces = (assietteGains, noteIfZero = '') => {
    const assiette = Math.max(0, assietteGains || 0);
    if (assiette <= 0) {
      resultatPs.applicable = false;
      resultatPs.note = noteIfZero || 'Aucun gain latent soumis aux PS';
      return 0;
    }
    resultatPs.applicable = true;
    resultatPs.assiette = round2(assiette);
    resultatPs.montant = round2(assiette * psTaux);
    resultatPs.note = '';
    return resultatPs.montant;
  };

  // Hypothèse : AV/PER/PEA 100% UC → PS sur gains latents
  const isAssuranceVieLike = envelope === ENVELOPES.AV;
  const isPea = envelope === ENVELOPES.PEA;
  const gainsLatents = Math.max(0, capitalTransmis - (cumulVersements || 0));
  const psMontant = (() => {
    if (isAssuranceVieLike || isPea) {
      return computePsDeces(gainsLatents);
    }
    if (perBancaire || envelope === ENVELOPES.CTO || envelope === ENVELOPES.PER) {
      resultatPs.note = 'PS déjà acquittés pendant la vie du contrat';
    } else if (envelope === ENVELOPES.SCPI) {
      resultatPs.note = 'PS prélevés sur les loyers annuels';
    }
    return 0;
  })();

  const capitalApresPs = Math.max(0, capitalTransmis - psMontant);

  if (beneficiaryType === 'conjoint') {
    const assiette = 0;
    return {
      envelope,
      capitalTransmis: round2(capitalTransmis),
      regime: 'Exonération conjoint/PACS',
      abattement: round2(capitalApresPs),
      assiette,
      taxeForfaitaire: 0,
      taxeDmtg: 0,
      taxe: 0,
      capitalTransmisNet: round2(capitalTransmis - psMontant),
      psDeces: {
        applicable: resultatPs.applicable,
        assiette: resultatPs.assiette,
        taux: resultatPs.taux,
        montant: round2(resultatPs.montant),
        note: resultatPs.note,
      },
    };
  }

  switch (envelope) {
    case ENVELOPES.AV: {
      if (agePremierVersement < 70) {
        // Article 990 I (primes versées avant 70 ans)
        regime = '990 I';
        abattement = fp.av990IAbattement * effectiveNbBeneficiaires;
        const assiette = Math.max(0, capitalApresPs - abattement);
        // Tranche 1 : 20% jusqu'à 700k par bénéficiaire
        const plafondTranche1 = fp.av990ITranche1Plafond * effectiveNbBeneficiaires;
        if (assiette <= plafondTranche1) {
          taxeForfaitaire = assiette * fp.av990ITranche1Taux;
        } else {
          taxeForfaitaire = plafondTranche1 * fp.av990ITranche1Taux;
          taxeForfaitaire += (assiette - plafondTranche1) * fp.av990ITranche2Taux;
        }
      } else {
        // Article 757 B (primes versées après 70 ans)
        // Abattement global de 30 500 € puis taux DMTG choisi
        regime = '757 B';
        abattement = fp.av757BAbattement; // 30 500 € global
        const assiette = Math.max(0, capitalApresPs - abattement);
        // Appliquer le taux DMTG choisi par l'utilisateur
        taxeDmtg = assiette * dmtgTauxChoisi;
      }
      break;
    }

    case ENVELOPES.PER: {
      // PER assurance : fiscalité décès dépend de l'ÂGE AU DÉCÈS (pas de l'âge au versement)
      // Si décès < 70 ans → 990 I, si décès >= 70 ans → 757 B
      // PER bancaire : intégration à l'actif successoral (DMTG)
      if (params.perBancaire) {
        // PER bancaire → DMTG avec taux choisi
        // On part du principe que l'abattement de 100 000 € est déjà consommé
        regime = 'DMTG (PER bancaire)';
        abattement = 0; // Abattement déjà consommé
        const assiette = capitalApresPs;
        taxeDmtg = assiette * dmtgTauxChoisi;
      } else if (ageAuDeces < 70) {
        // PER assurance + décès avant 70 ans → 990 I
        regime = '990 I (PER assurance)';
        abattement = fp.av990IAbattement * effectiveNbBeneficiaires;
        const assiette = Math.max(0, capitalApresPs - abattement);
        const plafondTranche1 = fp.av990ITranche1Plafond * effectiveNbBeneficiaires;
        if (assiette <= plafondTranche1) {
          taxeForfaitaire = assiette * fp.av990ITranche1Taux;
        } else {
          taxeForfaitaire = plafondTranche1 * fp.av990ITranche1Taux;
          taxeForfaitaire += (assiette - plafondTranche1) * fp.av990ITranche2Taux;
        }
      } else {
        // PER assurance + décès >= 70 ans → 757 B
        // Abattement global de 30 500 € puis taux DMTG choisi
        regime = '757 B (PER assurance)';
        abattement = fp.av757BAbattement; // 30 500 € global
        const assiette = Math.max(0, capitalApresPs - abattement);
        taxeDmtg = assiette * dmtgTauxChoisi;
      }
      break;
    }

    case ENVELOPES.PEA:
    case ENVELOPES.CTO:
    case ENVELOPES.SCPI:
    default: {
      // Intégration à l'actif successoral (DMTG) avec taux choisi
      // On part du principe que l'abattement de 100 000 € est déjà consommé
      regime = 'DMTG';
      abattement = 0; // Abattement déjà consommé
      const assiette = capitalApresPs;
      taxeDmtg = assiette * dmtgTauxChoisi;
      break;
    }
  }

  const assiette = Math.max(0, capitalApresPs - abattement);
  const taxeTotal = taxeForfaitaire + taxeDmtg;

  return {
    envelope,
    capitalTransmis: round2(capitalTransmis),
    regime,
    abattement: round2(abattement),
    assiette: round2(assiette),
    taxeForfaitaire: round2(taxeForfaitaire),
    taxeDmtg: round2(taxeDmtg),
    taxe: round2(taxeTotal),
    capitalTransmisNet: round2(capitalTransmis - psMontant - taxeTotal),
    psDeces: {
      applicable: resultatPs.applicable,
      assiette: resultatPs.assiette,
      taux: resultatPs.taux,
      montant: round2(resultatPs.montant),
      note: resultatPs.note,
    },
  };
}

// ============================================================================
// SIMULATION COMPLÈTE
// ============================================================================

/**
 * Exécute une simulation complète (Épargne + Liquidation + Décès)
 * @param {Object} product - Configuration du produit
 * @param {Object} client - Données client
 * @param {Object} liquidationParams - Paramètres de liquidation
 * @param {Object} transmissionParams - Paramètres de transmission
 * @param {Object} fiscalParams - Paramètres fiscaux extraits des settings
 * @returns {Object} Résultats complets
 */
export function simulateComplete(product, client, liquidationParams, transmissionParams, fiscalParams) {
  // Phase 1 : Épargne
  const epargne = simulateEpargne(product, client, fiscalParams);

  // Déterminer si le décès intervient pendant la phase épargne ou liquidation
  const ageAuDeces = transmissionParams.ageAuDeces || 85;
  const ageActuel = client.ageActuel || 45;
  const ageFinEpargne = ageActuel + epargne.dureeEpargne;
  const decesEnPhaseEpargne = ageAuDeces < ageFinEpargne;

  // Calculer le capital au moment du décès (même si en phase épargne)
  let capitalAuDeces = epargne.capitalAcquis;
  let capitalDecesTheoriqueAuDeces = 0;
  let capitalDecesDegressifAuDeces = 0;
  
  if (decesEnPhaseEpargne) {
    // Décès pendant la phase épargne : trouver le capital à l'âge du décès
    const ligneAuDeces = epargne.rows.find(r => r.age === ageAuDeces);
    if (ligneAuDeces) {
      capitalAuDeces = ligneAuDeces.capitalFin;
      capitalDecesTheoriqueAuDeces = ligneAuDeces.capitalDecesTheorique || 0;
      capitalDecesDegressifAuDeces = ligneAuDeces.capitalDecesDegressif || 0;

      // Ajouter le capital décès théorique si garantie de bonne fin active
      if (product.envelope === ENVELOPES.PER && product.versementConfig?.annuel?.garantieBonneFin?.active) {
        capitalAuDeces += capitalDecesTheoriqueAuDeces + capitalDecesDegressifAuDeces;
      }
    } else {
      // Si l'âge du décès est avant le début de l'épargne
      capitalAuDeces = 0;
    }
  }

  // Phase 2 : Liquidation (seulement si décès après phase épargne)
  let liquidation;
  if (decesEnPhaseEpargne) {
    // Pas de phase liquidation si décès en phase épargne
    liquidation = {
      duree: 0,
      ageFinEpargne,
      ageAuDeces,
      rows: [],
      capitalRestant: capitalAuDeces,
      capitalRestantAuDeces: capitalAuDeces,
      cumulRetraitsBruts: 0,
      cumulRetraitsNets: 0,
      cumulRetraitsNetsAuDeces: 0,
      cumulFiscalite: 0,
      cumulFiscaliteAuDeces: 0,
      revenuAnnuelMoyenNet: 0,
    };
  } else {
    liquidation = simulateLiquidation(epargne, liquidationParams, client, fiscalParams, transmissionParams);
  }

  // Capital à transmettre = capital restant au décès
  const capitalTransmis = decesEnPhaseEpargne ? capitalAuDeces : liquidation.capitalRestantAuDeces;

  // Phase 3 : Transmission
  const transmission = calculTransmission({
    envelope: product.envelope,
    capitalTransmis: capitalTransmis,
    cumulVersements: epargne.cumulVersements,
    ageAuDeces: transmissionParams.ageAuDeces,
    agePremierVersement: transmissionParams.agePremierVersement || (client.ageActuel || 45),
    nbBeneficiaires: transmissionParams.nbBeneficiaires || 1,
    perBancaire: product.perBancaire || false,
  }, fiscalParams);

  // Synthèse
  return {
    envelope: product.envelope,
    envelopeLabel: ENVELOPE_LABELS[product.envelope] || product.envelope,

    // Épargne
    epargne: {
      duree: epargne.dureeEpargne,
      capitalAcquis: epargne.capitalAcquis,
      cumulVersements: epargne.cumulVersements,
      cumulEffort: epargne.cumulEffort,
      cumulEconomieIR: epargne.cumulEconomieIR,
      plusValueLatente: epargne.plusValueLatente,
      cumulPSFondsEuro: epargne.cumulPSFondsEuro,
      cumulRevenusDistribues: epargne.cumulRevenusDistribues,
      cumulFiscaliteRevenus: epargne.cumulFiscaliteRevenus,
      rows: epargne.rows,
    },

    // Liquidation
    liquidation: {
      duree: liquidation.duree,
      ageAuDeces: liquidation.ageAuDeces,
      cumulRetraitsBruts: liquidation.cumulRetraitsBruts,
      cumulRetraitsNets: liquidation.cumulRetraitsNets,
      cumulRetraitsNetsAuDeces: liquidation.cumulRetraitsNetsAuDeces,
      cumulFiscalite: liquidation.cumulFiscalite,
      cumulFiscaliteAuDeces: liquidation.cumulFiscaliteAuDeces,
      revenuAnnuelMoyenNet: liquidation.revenuAnnuelMoyenNet,
      capitalRestant: liquidation.capitalRestant,
      capitalRestantAuDeces: liquidation.capitalRestantAuDeces,
      rows: liquidation.rows,
    },

    // Transmission
    transmission: {
      regime: transmission.regime,
      capitalTransmis: transmission.capitalTransmis,
      abattement: transmission.abattement,
      assiette: transmission.assiette,
      taxeForfaitaire: transmission.taxeForfaitaire,
      taxeDmtg: transmission.taxeDmtg,
      taxe: transmission.taxe,
      capitalTransmisNet: transmission.capitalTransmisNet,
      psDeces: transmission.psDeces,
    },

    // Totaux
    totaux: {
      effortTotal: epargne.cumulEffort,
      // Revenus nets phase épargne (SCPI/CTO) = revenus distribués - fiscalité revenus
      revenusNetsEpargne: (epargne.cumulRevenusDistribues || 0) - (epargne.cumulFiscaliteRevenus || 0),
      // Effort réel pour SCPI/CTO = effort - revenus nets épargne
      effortReel: epargne.cumulEffort - ((epargne.cumulRevenusDistribues || 0) - (epargne.cumulFiscaliteRevenus || 0)),
      economieIRTotal: epargne.cumulEconomieIR,
      revenusNetsLiquidation: liquidation.cumulRetraitsNetsAuDeces,
      revenusNetsTotal: liquidation.cumulRetraitsNets,
      fiscaliteTotale: liquidation.cumulFiscalite + transmission.taxe,
      capitalTransmisNet: transmission.capitalTransmisNet,
    },
  };
}

/**
 * Compare deux produits
 * @param {Object} result1 - Résultat simulation produit 1
 * @param {Object} result2 - Résultat simulation produit 2
 * @returns {Object} Comparaison avec deltas
 */
export function compareProducts(result1, result2) {
  const delta = (a, b) => round2(a - b);

  return {
    produit1: result1,
    produit2: result2,
    
    deltas: {
      // Effort réel = effort brut - revenus nets épargne (SCPI/CTO)
      effortTotal: delta(result1.totaux.effortReel, result2.totaux.effortReel),
      economieIR: delta(result1.totaux.economieIRTotal, result2.totaux.economieIRTotal),
      capitalAcquis: delta(result1.epargne.capitalAcquis, result2.epargne.capitalAcquis),
      // Revenus nets = revenus nets phase liquidation uniquement
      revenusNetsLiquidation: delta(result1.totaux.revenusNetsLiquidation, result2.totaux.revenusNetsLiquidation),
      fiscaliteTotale: delta(result1.totaux.fiscaliteTotale, result2.totaux.fiscaliteTotale),
      capitalTransmisNet: delta(result1.totaux.capitalTransmisNet, result2.totaux.capitalTransmisNet),
    },

    // Meilleur effort = effort réel le plus bas (prend en compte revenus nets SCPI/CTO)
    meilleurEffort: result1.totaux.effortReel <= result2.totaux.effortReel ? result1.envelope : result2.envelope,
    // Meilleurs revenus = revenus nets liquidation les plus élevés
    meilleurRevenus: result1.totaux.revenusNetsLiquidation >= result2.totaux.revenusNetsLiquidation ? result1.envelope : result2.envelope,
    meilleurTransmission: result1.totaux.capitalTransmisNet >= result2.totaux.capitalTransmisNet ? result1.envelope : result2.envelope,
  };
}
