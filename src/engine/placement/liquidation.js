import { ENVELOPES, round2 } from './shared.js';

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
        const abattementMax = situation === 'couple'
          ? fp.avAbattement8ansCouple
          : fp.avAbattement8ansSingle;
        const abattementDispo = Math.max(0, abattementMax - abattementUtilise);
        abattementApplique = Math.min(partGains, abattementDispo);
        const assiette = Math.max(0, partGains - abattementApplique);

        if (optionBaremeIR) {
          irSurGains = assiette * tmiRetraite;
        } else {
          const taux = primesCumulees <= fp.avSeuilPrimes150k
            ? fp.avTauxSousSeuil8ans
            : fp.avTauxSurSeuil8ans;
          irSurGains = assiette * taux;
        }
      } else if (optionBaremeIR) {
        irSurGains = partGains * tmiRetraite;
      } else {
        irSurGains = partGains * fp.pfuIR;
      }
      ps = partGains * fp.psPatrimoine;
      break;
    }

    case ENVELOPES.PER: {
      irSurCapital = partCapital * tmiRetraite;
      irSurGains = partGains * fp.pfuIR;
      ps = partGains * fp.psPatrimoine;
      break;
    }

    case ENVELOPES.PEA: {
      if (anneeOuverture >= fp.peaAncienneteMin) {
        irSurGains = 0;
      } else {
        irSurGains = partGains * fp.pfuIR;
      }
      ps = partGains * fp.psPatrimoine;
      break;
    }

    case ENVELOPES.CTO:
    case ENVELOPES.SCPI:
    default: {
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

function calculVPM(capital, rendement, duree) {
  if (duree <= 0) return capital;
  if (rendement === 0) return capital / duree;
  const r = rendement;
  const n = duree;
  return capital * r / (1 - Math.pow(1 + r, -n));
}

export function simulateLiquidation(epargneResult, liquidationParams, client, fiscalParams, transmissionParams = {}) {
  const {
    mode = 'epuiser',
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
    envelope,
    capitalAcquis,
    plusValueLatente,
    cumulVersements,
    dureeEpargne,
    tauxRevalorisation = 0.02,
    optionBaremeIR = false,
  } = epargneResult;
  const fp = fiscalParams;

  const ageAuDeces = transmissionParams.ageAuDeces || 85;
  const ageFinEpargne = ageActuel + dureeEpargne;
  const dureeJusquAuDeces = Math.max(1, ageAuDeces - ageFinEpargne);

  const rendement = liquidationParams.rendement ?? epargneResult.rendement ?? 0.03;

  let totalGains = plusValueLatente;
  let totalCapital = capitalAcquis - plusValueLatente;

  const rows = [];
  let capitalRestant = capitalAcquis;
  let cumulRetraitsBruts = 0;
  let cumulRetraitsNets = 0;
  let cumulFiscalite = 0;
  let abattementCumulUtilise = 0;
  let anneeOuverture = dureeEpargne;

  const isSCPI = envelope === ENVELOPES.SCPI;
  const isCTOorPEA = envelope === ENVELOPES.CTO || envelope === ENVELOPES.PEA;

  let anneesLiquidation;
  if (isSCPI) {
    anneesLiquidation = dureeJusquAuDeces;
  } else if (mode === 'unique' || mode === 'mensualite') {
    anneesLiquidation = dureeJusquAuDeces;
  } else {
    anneesLiquidation = duree;
  }

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

    let gainsAnnee = 0;
    let loyersOuDividendes = 0;
    let fiscaliteRevenus = 0;

    if (isSCPI) {
      loyersOuDividendes = capitalRestant * rendement;
      const revalorisation = capitalRestant * tauxRevalorisation;
      capitalRestant += revalorisation;
      gainsAnnee = revalorisation;
      const irLoyers = loyersOuDividendes * tmiRetraite;
      const psLoyers = loyersOuDividendes * fp.psPatrimoine;
      fiscaliteRevenus = irLoyers + psLoyers;
    } else {
      gainsAnnee = capitalRestant * rendement;
      capitalRestant += gainsAnnee;
      totalGains += gainsAnnee;
    }

    const pvLatenteAvantRetrait = totalGains;
    const quotiteGains = capitalRestant > 0 ? totalGains / capitalRestant : 0;

    let retraitBrut = 0;
    if (isSCPI) {
      retraitBrut = loyersOuDividendes;
    } else if (mode === 'unique') {
      if (annee === 1) {
        retraitBrut = Math.min(montantUnique, capitalRestant);
      }
    } else if (mode === 'mensualite') {
      retraitBrut = Math.min(mensualiteCible * 12, capitalRestant);
    } else {
      retraitBrut = Math.min(retraitVPM, capitalRestant);
    }

    if (!isSCPI) {
      retraitBrut = Math.min(retraitBrut, capitalRestant);
    }

    const partGains = isSCPI ? 0 : retraitBrut * quotiteGains;
    const partCapital = isSCPI ? 0 : retraitBrut - partGains;

    let fiscalite;
    if (isSCPI) {
      fiscalite = {
        irSurGains: 0,
        irSurCapital: 0,
        ps: 0,
        fiscaliteTotal: fiscaliteRevenus,
        retraitNet: loyersOuDividendes - fiscaliteRevenus,
        abattementApplique: 0,
      };
    } else if (isCTOorPEA) {
      let irPV = 0;
      let psPV = 0;
      if (envelope === ENVELOPES.CTO) {
        if (optionBaremeIR) {
          irPV = partGains * tmiRetraite;
        } else {
          irPV = partGains * fp.pfuIR;
        }
        psPV = partGains * fp.psPatrimoine;
      } else {
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

    if (!isSCPI) {
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

  const anneesAvecRetrait = rows.filter((r) => r.retraitBrut > 0).length;
  const revenuAnnuelMoyenNet = anneesAvecRetrait > 0 ? cumulRetraitsNets / anneesAvecRetrait : 0;

  const rowsJusquAuDeces = rows.filter((r) => r.age <= ageAuDeces);
  const ligneAuDeces = rows.find((r) => r.age === ageAuDeces) || rows[rows.length - 1];
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
