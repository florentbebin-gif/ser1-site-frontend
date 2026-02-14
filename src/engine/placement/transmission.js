import { ENVELOPES, round2 } from './shared.js';

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
  const dmtgTauxChoisi = fp.dmtgTauxChoisi || 0.20;

  const effectiveNbBeneficiaires = beneficiaryType === 'conjoint' ? 1 : Math.max(1, nbBeneficiaires || 1);

  let taxeDmtg = 0;
  let taxeForfaitaire = 0;
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
        regime = '990 I';
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
        regime = '757 B';
        abattement = fp.av757BAbattement;
        const assiette = Math.max(0, capitalApresPs - abattement);
        taxeDmtg = assiette * dmtgTauxChoisi;
      }
      break;
    }

    case ENVELOPES.PER: {
      if (params.perBancaire) {
        regime = 'DMTG (PER bancaire)';
        abattement = 0;
        const assiette = capitalApresPs;
        taxeDmtg = assiette * dmtgTauxChoisi;
      } else if (ageAuDeces < 70) {
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
        regime = '757 B (PER assurance)';
        abattement = fp.av757BAbattement;
        const assiette = Math.max(0, capitalApresPs - abattement);
        taxeDmtg = assiette * dmtgTauxChoisi;
      }
      break;
    }

    case ENVELOPES.PEA:
    case ENVELOPES.CTO:
    case ENVELOPES.SCPI:
    default: {
      regime = 'DMTG';
      abattement = 0;
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
