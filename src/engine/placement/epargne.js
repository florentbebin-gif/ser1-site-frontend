import { DEFAULT_VERSEMENT_CONFIG, normalizeVersementConfig } from '../../utils/versementConfig.js';
import { ENVELOPES, round2 } from './shared.js';

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
  let pendingReinvestCapi = 0;
  let pendingReinvestDistrib = 0;
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

    let reinvestCapiN = pendingReinvestCapi;
    let reinvestDistribN = pendingReinvestDistrib;
    if (isSCPI) {
      reinvestCapiN = 0;
      pendingReinvestCapi = 0;
    }
    if (reinvestCapiN > 0) {
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

    const capiBase = capitalCapiDebut + addedCapi;
    const gainsCapi = capiBase * capitalisationRate;
    capitalCapi += gainsCapi;
    cumulInterets += gainsCapi;

    const distribInvested = capitalDistribDebut + addedDistrib;
    const revaloDistrib = distribInvested * distributionRevalo;
    capitalDistrib += revaloDistrib;

    const couponBase = (annee === 1 ? capitalDistribDebut * coeffDelaiJouissance : capitalDistribDebut) + (addedDistrib * coeffDelaiJouissance);
    const couponBrut = couponBase * distributionYield;

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
        fiscaliteCoupon = 0;
      }
    }
    const couponNet = couponBrut - fiscaliteCoupon;

    cumulRevenusDistribues += couponBrut;
    cumulFiscaliteRevenus += fiscaliteCoupon;

    let revenusNetsPercusAnnee = 0;
    let reinvestissementDistribNetAnnee = 0;

    if (couponNet > 0) {
      if (distributionStrategy === 'apprehender') {
        revenusNetsPercusAnnee = couponNet;
        cumulRevenusNetsPercus += couponNet;
      } else if (distributionStrategy === 'reinvestir_capi') {
        reinvestissementDistribNetAnnee = couponNet;
        compteEspece += couponNet;
        cumulCompteEspece += couponNet;
        if (isSCPI) {
          pendingReinvestDistrib += couponNet;
        } else {
          pendingReinvestCapi += couponNet;
        }
      } else {
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

    if (envelope === ENVELOPES.CTO) {
      plusValueLatenteCTO += revaloDistrib;
    }

    const couponResteDansPatrimoine = distributionStrategy !== 'apprehender';
    const gainsAnnee = gainsCapi + revaloDistrib + (couponResteDansPatrimoine ? couponNet : 0);
    cumulGains += gainsAnnee;

    if (isSCPI) {
      capitalCapi = 0;
    }

    let cessionProduit = false;
    let fiscalitePV = 0;
    if (dureeProduit && distribInvested > 0) {
      anneeDepuisDernierCycleDistrib += 1;
      if (anneeDepuisDernierCycleDistrib >= dureeProduit) {
        cessionProduit = true;
        const reinvestirVersAuTerme = distribution.reinvestirVersAuTerme || 'capitalisation';
        if (reinvestirVersAuTerme === 'capitalisation') {
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
