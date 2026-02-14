import { normalizeVersementConfig } from '../../../utils/versementConfig.js';

export function computeRendementPondere({
  pctCapitalisation,
  pctDistribution,
  rendementCapitalisation,
  tauxDistribution,
}) {
  const pctCapi = (pctCapitalisation || 0) / 100;
  const pctDistrib = (pctDistribution || 0) / 100;
  return pctCapi * (rendementCapitalisation || 0) + pctDistrib * (tauxDistribution || 0);
}

export function toEngineProduct(product) {
  const { versementConfig, envelope, dureeEpargne, perBancaire, optionBaremeIR, fraisGestion } = product;
  const normalizedConfig = normalizeVersementConfig(versementConfig);
  const { initial, annuel, ponctuels, capitalisation, distribution } = normalizedConfig;

  const rendementMoyen = computeRendementPondere({
    pctCapitalisation: initial.pctCapitalisation,
    pctDistribution: initial.pctDistribution,
    rendementCapitalisation: capitalisation.rendementAnnuel || 0,
    tauxDistribution: distribution.tauxDistribution || 0,
  });

  const pctDistrib = (initial.pctDistribution || 0) / 100;
  const tauxRevalo = pctDistrib > 0 ? distribution.rendementAnnuel || 0 : 0;

  return {
    envelope,
    dureeEpargne,
    perBancaire,
    optionBaremeIR,
    fraisGestion,
    versementInitial: initial.montant,
    versementAnnuel: annuel.montant,
    fraisEntree: initial.fraisEntree,
    rendement: rendementMoyen,
    tauxRevalorisation: tauxRevalo,
    delaiJouissance: pctDistrib > 0 ? distribution.delaiJouissance || 0 : 0,
    dureeProduit: pctDistrib > 0 ? distribution.dureeProduit : null,
    strategieCompteEspece: pctDistrib > 0 ? distribution.strategie : 'reinvestir_capi',
    reinvestirVersAuTerme: distribution.reinvestirVersAuTerme || 'capitalisation',
    pctCapitalisation: initial.pctCapitalisation,
    pctDistribution: initial.pctDistribution,
    versementConfig,
    versementsPonctuels: ponctuels,
    garantieBonneFin: annuel.garantieBonneFin,
    exonerationCotisations: annuel.exonerationCotisations,
  };
}
