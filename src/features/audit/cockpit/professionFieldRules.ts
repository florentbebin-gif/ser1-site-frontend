import type {
  AncienneteCnbf,
  AtexaClasse,
  CaisseRetraite,
  ClassePrevoyance,
  ClasseRetraite,
  FichePaieAssimileSalarie,
  ModeExerciceTns,
  PersonInfo,
  ProfessionLiberaleCategorie,
  StatutConventionnel,
  StatutSocial,
} from '@/domain/audit/types';
import { shouldShowProfessionForStatut } from '../professionalSituation';

import {
  AFFILIATION_CAVEC_OPTIONS,
  ANCIENNETE_CNBF_OPTIONS,
  ATEXA_OPTIONS,
  CARPV_PREVOYANCE_OPTIONS,
  CARPV_RETRAITE_OPTIONS,
  CAVEC_PREVOYANCE_OPTIONS,
  CAVEC_RETRAITE_OPTIONS,
  CAVP_RETRAITE_OPTIONS,
  CNBF_RETRAITE_OPTIONS,
  CONVENTION_OUI_NON_OPTIONS,
  CONVENTION_SECTEUR_OPTIONS,
  CRN_RETRAITE_OPTIONS,
  EFFECTIF_SALARIE_OPTIONS,
  MODE_EXERCICE_OPTIONS,
  PROFESSION_LIBERALE_CATEGORIE_OPTIONS,
  REGIME_GENERAL_CAISSE_OPTIONS,
  STATUT_SOCIAL_OPTIONS,
  TNS_CAISSE_OPTIONS,
  type ProfessionOption,
} from './professionFieldOptions';

export {
  AFFILIATION_CAVEC_OPTIONS,
  ANCIENNETE_CNBF_OPTIONS,
  ATEXA_OPTIONS,
  CNBF_RETRAITE_OPTIONS,
  EFFECTIF_SALARIE_OPTIONS,
  MODE_EXERCICE_OPTIONS,
  STATUT_SOCIAL_OPTIONS,
  YES_NO_OPTIONS,
} from './professionFieldOptions';
export { isProfessionalSituationComplete } from '../professionalSituation';
export type { ProfessionOption } from './professionFieldOptions';

export interface ProfessionFieldRules {
  showStatutSocial: boolean;
  statutSocialOptions: Array<ProfessionOption<StatutSocial>>;
  showProfession: boolean;
  showModeExercice: boolean;
  modeExerciceOptions: Array<ProfessionOption<ModeExerciceTns>>;
  showRemunerationMandatPct: boolean;
  showCaisseRetraite: boolean;
  caisseRetraiteOptions: Array<ProfessionOption<CaisseRetraite>>;
  forcedCaisseRetraite?: CaisseRetraite;
  showStatutConventionnel: boolean;
  statutConventionnelOptions: Array<ProfessionOption<StatutConventionnel>>;
  showTauxPriseEnChargeCpam: boolean;
  showClassePrevoyance: boolean;
  classePrevoyanceOptions: Array<ProfessionOption<ClassePrevoyance>>;
  showClasseRetraite: boolean;
  classeRetraiteOptions: Array<ProfessionOption<ClasseRetraite>>;
  showBiologisteConventionne: boolean;
  showAncienneteCnbf: boolean;
  ancienneteCnbfOptions: Array<ProfessionOption<AncienneteCnbf>>;
  showCrnFields: boolean;
  showCommissionsBrutes: boolean;
  showAtexa: boolean;
  atexaOptions: Array<ProfessionOption<AtexaClasse>>;
  showProfessionLiberaleReglementeeControl: boolean;
  professionLiberaleReglementeeActivationMode?: 'auto' | 'manual';
  showProfessionLiberaleReglementeeBadge: boolean;
  professionLiberaleReglementeeBadgeLabels: string[];
  professionLiberaleCategorie?: ProfessionLiberaleCategorie;
  professionLiberaleCategorieOptions: Array<ProfessionOption<ProfessionLiberaleCategorie>>;
  showFichePaieButton: boolean;
}

const TNS_STATUTS = new Set<StatutSocial>([
  'tns_article_62',
  'tns_individuel',
  'micro_entrepreneur',
]);
const SALARIE_STATUTS = new Set<StatutSocial>([
  'salarie_non_cadre_prive',
  'salarie_cadre_prive',
  'salarie_non_cadre_agricole',
  'salarie_cadre_agricole',
  'salarie_non_titulaire_etat',
  'clerc_notaire',
  'fonctionnaire',
  'expert_comptable_salarie',
  'avocat_salarie',
]);
const CAISSES_SANS_REMUNERATION_MANDAT = new Set<CaisseRetraite>([
  'ssi_commercant',
  'ssi_artisan',
  'msa',
]);
const CAISSES_PROFESSIONS_LIBERALES_REGLEMENTEES_AUTO = new Map<
  CaisseRetraite,
  ProfessionLiberaleCategorie
>([
  ['carcd', 'sante'],
  ['carsf', 'sante'],
  ['carmf', 'sante'],
  ['carpimko', 'sante'],
  ['carpv', 'sante'],
  ['cavp', 'sante'],
  ['cnbf', 'juridique_judiciaire'],
  ['crn', 'juridique_judiciaire'],
  ['cavamac', 'technique_cadre_vie'],
  ['cavec', 'technique_cadre_vie'],
]);
const CAISSES_PROFESSIONS_LIBERALES_REGLEMENTEES_MANUELLES = new Set<CaisseRetraite>(['cipav']);
const CAISSES_CONVENTION_SECTEUR = new Set<CaisseRetraite>(['carmf', 'carpimko']);
const CAISSES_CONVENTION_OUI_NON = new Set<CaisseRetraite>(['carcd', 'carsf']);

export function buildProfessionFieldRules(person: PersonInfo): ProfessionFieldRules {
  const normalizedPerson = normalizeProfessionProfile(person);
  const forcedCaisseRetraite = getForcedCaisseRetraite(normalizedPerson);
  const caisseRetraiteOptions = getCaisseRetraiteOptions(normalizedPerson, forcedCaisseRetraite);
  const statutConventionnelOptions = getStatutConventionnelOptions(normalizedPerson.caisseRetraite);
  const classePrevoyanceOptions = getClassePrevoyanceOptions(normalizedPerson.caisseRetraite);
  const classeRetraiteOptions = getClasseRetraiteOptions(normalizedPerson.caisseRetraite);
  const showStatutConventionnel = statutConventionnelOptions.length > 0;
  const professionLiberale = getProfessionLiberaleReglementeeConfig(normalizedPerson);

  return {
    showStatutSocial: true,
    statutSocialOptions: STATUT_SOCIAL_OPTIONS,
    showProfession: shouldShowProfessionForStatut(normalizedPerson.statutSocial),
    showModeExercice: normalizedPerson.statutSocial === 'tns_individuel',
    modeExerciceOptions: MODE_EXERCICE_OPTIONS,
    showRemunerationMandatPct: shouldShowRemunerationMandatPct(normalizedPerson),
    showCaisseRetraite: caisseRetraiteOptions.length > 0,
    caisseRetraiteOptions,
    forcedCaisseRetraite,
    showStatutConventionnel,
    statutConventionnelOptions,
    showTauxPriseEnChargeCpam:
      showStatutConventionnel &&
      Boolean(
        normalizedPerson.statutConventionnel &&
        normalizedPerson.statutConventionnel !== 'non_conventionne',
      ),
    showClassePrevoyance: classePrevoyanceOptions.length > 0,
    classePrevoyanceOptions,
    showClasseRetraite: classeRetraiteOptions.length > 0,
    classeRetraiteOptions,
    showBiologisteConventionne: normalizedPerson.caisseRetraite === 'cavp',
    showAncienneteCnbf: normalizedPerson.caisseRetraite === 'cnbf',
    ancienneteCnbfOptions: ANCIENNETE_CNBF_OPTIONS,
    showCrnFields: normalizedPerson.caisseRetraite === 'crn',
    showCommissionsBrutes: normalizedPerson.caisseRetraite === 'cavamac',
    showAtexa: normalizedPerson.caisseRetraite === 'msa',
    atexaOptions: ATEXA_OPTIONS,
    showProfessionLiberaleReglementeeControl: professionLiberale.activationMode === 'manual',
    professionLiberaleReglementeeActivationMode: professionLiberale.activationMode,
    showProfessionLiberaleReglementeeBadge: professionLiberale.active,
    professionLiberaleReglementeeBadgeLabels: getProfessionLiberaleReglementeeBadgeLabels(
      professionLiberale.active,
      professionLiberale.categorie,
    ),
    professionLiberaleCategorie: professionLiberale.categorie,
    professionLiberaleCategorieOptions: PROFESSION_LIBERALE_CATEGORIE_OPTIONS,
    showFichePaieButton: normalizedPerson.statutSocial === 'assimile_salarie',
  };
}

export function normalizeProfessionProfile(person: PersonInfo): PersonInfo {
  const next: PersonInfo = { ...person };
  const allowedStatuts = optionValues(STATUT_SOCIAL_OPTIONS);

  if (!isAllowed(next.statutSocial, allowedStatuts)) {
    next.statutSocial = undefined;
  }

  next.natureActivite = getNatureActiviteForStatut(next.statutSocial);

  if (!shouldShowProfessionForStatut(next.statutSocial)) {
    next.profession = undefined;
  }

  normalizeModeExercice(next);

  const forcedCaisseRetraite = getForcedCaisseRetraite(next);
  const caisseRetraiteOptions = getCaisseRetraiteOptions(next, forcedCaisseRetraite);
  const allowedCaisses = optionValues(caisseRetraiteOptions);

  if (forcedCaisseRetraite) {
    next.caisseRetraite = forcedCaisseRetraite;
  } else if (
    caisseRetraiteOptions.length === 0 ||
    !isAllowed(next.caisseRetraite, allowedCaisses)
  ) {
    next.caisseRetraite = undefined;
  }

  normalizeCaisseFields(next);
  normalizeFichePaie(next);
  normalizeRemunerationMandat(next);
  normalizeProfessionLiberaleReglementee(next);

  return next;
}

export function createDefaultFichePaieAssimileSalarie(
  current?: FichePaieAssimileSalarie,
): FichePaieAssimileSalarie {
  return normalizeFichePaieAssimileSalarie({
    tauxActivitePct: 100,
    accidentTravailPct: 1.1,
    versementTransportPct: 0,
    contributionFormation: false,
    taxeApprentissage: false,
    assuranceChomage: false,
    reductionGenerale: false,
    taxeSalaires: false,
    regimeAlsaceMoselle: false,
    effectifSalarie: 'moins_11',
    affiliationCavec: 'non',
    affiliationCnbf: false,
    avantagesNatureFichePaie: 0,
    ...current,
  });
}

export function normalizeFichePaieAssimileSalarie(
  fichePaie: FichePaieAssimileSalarie,
): FichePaieAssimileSalarie {
  const next = { ...fichePaie };

  if (!isAllowed(next.effectifSalarie, optionValues(EFFECTIF_SALARIE_OPTIONS))) {
    next.effectifSalarie = undefined;
  }
  if (!isAllowed(next.affiliationCavec, optionValues(AFFILIATION_CAVEC_OPTIONS))) {
    next.affiliationCavec = undefined;
  }
  if (!next.affiliationCnbf) {
    next.ancienneteCnbf = undefined;
    next.classeRetraiteCnbf = undefined;
  } else {
    if (!isAllowed(next.ancienneteCnbf, optionValues(ANCIENNETE_CNBF_OPTIONS))) {
      next.ancienneteCnbf = undefined;
    }
    if (!isAllowed(next.classeRetraiteCnbf, optionValues(CNBF_RETRAITE_OPTIONS))) {
      next.classeRetraiteCnbf = undefined;
    }
  }

  return next;
}

export function getProfessionalSituationLabel(person: PersonInfo): string {
  const normalizedPerson = normalizeProfessionProfile(person);
  const profession = normalizedPerson.profession?.trim();
  if (profession) return profession;
  return getStatutSocialLabel(normalizedPerson.statutSocial);
}

function getStatutSocialLabel(statutSocial: StatutSocial | undefined): string {
  if (!statutSocial) return '';
  return STATUT_SOCIAL_OPTIONS.find((option) => option.value === statutSocial)?.label ?? '';
}

function normalizeCaisseFields(next: PersonInfo): void {
  const statutConventionnelOptions = getStatutConventionnelOptions(next.caisseRetraite);
  if (statutConventionnelOptions.length === 0) {
    next.statutConventionnel = undefined;
    next.tauxPriseEnChargeCpam = undefined;
  } else if (!isAllowed(next.statutConventionnel, optionValues(statutConventionnelOptions))) {
    next.statutConventionnel = undefined;
    next.tauxPriseEnChargeCpam = undefined;
  } else if (!next.statutConventionnel || next.statutConventionnel === 'non_conventionne') {
    next.tauxPriseEnChargeCpam = undefined;
  }

  const classePrevoyanceOptions = getClassePrevoyanceOptions(next.caisseRetraite);
  if (!isAllowed(next.classePrevoyance, optionValues(classePrevoyanceOptions))) {
    next.classePrevoyance = undefined;
  }

  const classeRetraiteOptions = getClasseRetraiteOptions(next.caisseRetraite);
  if (!isAllowed(next.classeRetraite, optionValues(classeRetraiteOptions))) {
    next.classeRetraite = undefined;
  }

  if (next.caisseRetraite !== 'cavp') {
    next.biologisteConventionne = undefined;
  }
  if (next.caisseRetraite !== 'cnbf') {
    next.ancienneteCnbf = undefined;
  } else if (!isAllowed(next.ancienneteCnbf, optionValues(ANCIENNETE_CNBF_OPTIONS))) {
    next.ancienneteCnbf = undefined;
  }
  if (next.caisseRetraite !== 'crn') {
    next.prestationSermentAvant2014 = undefined;
    next.regimeColmarMetz = undefined;
    next.moyenneProduitsEtude = undefined;
  }
  if (next.caisseRetraite !== 'cavamac') {
    next.commissionsBrutes = undefined;
  }
  if (next.caisseRetraite !== 'msa') {
    next.atexa = undefined;
  } else if (!isAllowed(next.atexa, optionValues(ATEXA_OPTIONS))) {
    next.atexa = undefined;
  }
}

function normalizeProfessionLiberaleReglementee(next: PersonInfo): void {
  const config = getProfessionLiberaleReglementeeConfig(next);
  if (config.activationMode === 'auto') {
    next.professionLiberaleReglementee = true;
    next.professionLiberaleCategorie = config.categorie;
    return;
  }
  if (config.activationMode === 'manual' && next.professionLiberaleReglementee === true) {
    next.professionLiberaleReglementee = true;
    if (
      !isAllowed(
        next.professionLiberaleCategorie,
        optionValues(PROFESSION_LIBERALE_CATEGORIE_OPTIONS),
      )
    ) {
      next.professionLiberaleCategorie = undefined;
    }
    return;
  }
  next.professionLiberaleReglementee = undefined;
  next.professionLiberaleCategorie = undefined;
}

function normalizeFichePaie(next: PersonInfo): void {
  if (next.statutSocial !== 'assimile_salarie') {
    next.fichePaieAssimileSalarie = undefined;
    return;
  }
  if (next.fichePaieAssimileSalarie) {
    next.fichePaieAssimileSalarie = normalizeFichePaieAssimileSalarie(
      next.fichePaieAssimileSalarie,
    );
  }
}

function normalizeModeExercice(next: PersonInfo): void {
  if (next.statutSocial !== 'tns_individuel') {
    next.modeExercice = undefined;
    next.remunerationMandatPct = undefined;
    return;
  }
  if (!isAllowed(next.modeExercice, optionValues(MODE_EXERCICE_OPTIONS))) {
    next.modeExercice = undefined;
    next.remunerationMandatPct = undefined;
  }
}

function normalizeRemunerationMandat(next: PersonInfo): void {
  if (!shouldShowRemunerationMandatPct(next)) {
    next.remunerationMandatPct = undefined;
    return;
  }
  if (next.remunerationMandatPct === undefined) {
    next.remunerationMandatPct = 5;
  }
}

function getCaisseRetraiteOptions(
  person: PersonInfo,
  forcedCaisseRetraite?: CaisseRetraite,
): Array<ProfessionOption<CaisseRetraite>> {
  if (forcedCaisseRetraite) return REGIME_GENERAL_CAISSE_OPTIONS;
  if (person.statutSocial && TNS_STATUTS.has(person.statutSocial)) return TNS_CAISSE_OPTIONS;
  return [];
}

function getForcedCaisseRetraite(person: PersonInfo): CaisseRetraite | undefined {
  return person.statutSocial === 'assimile_salarie' ? 'regime_general' : undefined;
}

function getStatutConventionnelOptions(
  caisseRetraite: CaisseRetraite | undefined,
): Array<ProfessionOption<StatutConventionnel>> {
  if (!caisseRetraite) return [];
  if (CAISSES_CONVENTION_SECTEUR.has(caisseRetraite)) return CONVENTION_SECTEUR_OPTIONS;
  if (CAISSES_CONVENTION_OUI_NON.has(caisseRetraite)) return CONVENTION_OUI_NON_OPTIONS;
  return [];
}

function getClassePrevoyanceOptions(
  caisseRetraite: CaisseRetraite | undefined,
): Array<ProfessionOption<ClassePrevoyance>> {
  if (caisseRetraite === 'carpv') return CARPV_PREVOYANCE_OPTIONS;
  if (caisseRetraite === 'cavec') return CAVEC_PREVOYANCE_OPTIONS;
  return [];
}

function getClasseRetraiteOptions(
  caisseRetraite: CaisseRetraite | undefined,
): Array<ProfessionOption<ClasseRetraite>> {
  if (caisseRetraite === 'carpv') return CARPV_RETRAITE_OPTIONS;
  if (caisseRetraite === 'cavec') return CAVEC_RETRAITE_OPTIONS;
  if (caisseRetraite === 'cavp') return CAVP_RETRAITE_OPTIONS;
  if (caisseRetraite === 'cnbf') return CNBF_RETRAITE_OPTIONS;
  if (caisseRetraite === 'crn') return CRN_RETRAITE_OPTIONS;
  return [];
}

function getNatureActiviteForStatut(
  statutSocial: StatutSocial | undefined,
): PersonInfo['natureActivite'] {
  if (!statutSocial) return undefined;
  if (statutSocial === 'micro_entrepreneur') return 'micro_entreprise';
  if (TNS_STATUTS.has(statutSocial)) return 'tns_independant';
  if (SALARIE_STATUTS.has(statutSocial)) return 'salarie';
  if (statutSocial === 'assimile_salarie') return 'salarie';
  if (
    statutSocial === 'chomage' ||
    statutSocial === 'maladie_invalidite' ||
    statutSocial === 'militaire'
  ) {
    return 'periode_assimilee';
  }
  if (statutSocial === 'retraite' || statutSocial === 'sans_activite') return 'sans_activite';
  return undefined;
}

function shouldShowRemunerationMandatPct(person: PersonInfo): boolean {
  return Boolean(
    person.statutSocial === 'tns_individuel' &&
    person.modeExercice === 'societe_is' &&
    !(person.caisseRetraite && CAISSES_SANS_REMUNERATION_MANDAT.has(person.caisseRetraite)),
  );
}

interface ProfessionLiberaleReglementeeConfig {
  active: boolean;
  activationMode?: 'auto' | 'manual';
  categorie?: ProfessionLiberaleCategorie;
}

function getProfessionLiberaleReglementeeConfig(
  person: PersonInfo,
): ProfessionLiberaleReglementeeConfig {
  if (!person.caisseRetraite) return { active: false };
  const autoCategorie = CAISSES_PROFESSIONS_LIBERALES_REGLEMENTEES_AUTO.get(person.caisseRetraite);
  if (autoCategorie) {
    return { active: true, activationMode: 'auto', categorie: autoCategorie };
  }
  if (CAISSES_PROFESSIONS_LIBERALES_REGLEMENTEES_MANUELLES.has(person.caisseRetraite)) {
    return {
      active: person.professionLiberaleReglementee === true,
      activationMode: 'manual',
      categorie:
        person.professionLiberaleReglementee === true
          ? person.professionLiberaleCategorie
          : undefined,
    };
  }
  return { active: false };
}

function getProfessionLiberaleReglementeeBadgeLabels(
  active: boolean,
  categorie: ProfessionLiberaleCategorie | undefined,
): string[] {
  if (!active) return [];
  return ['PLR', getProfessionLiberaleCategorieLabel(categorie)].filter((label): label is string =>
    Boolean(label),
  );
}

function getProfessionLiberaleCategorieLabel(
  categorie: ProfessionLiberaleCategorie | undefined,
): string | undefined {
  if (!categorie) return undefined;
  return PROFESSION_LIBERALE_CATEGORIE_OPTIONS.find((option) => option.value === categorie)?.label;
}

function optionValues<T extends string>(options: Array<ProfessionOption<T>>): T[] {
  return options.map((option) => option.value).filter((value): value is T => Boolean(value));
}

function isAllowed<T extends string>(value: T | undefined, allowedValues: T[]): boolean {
  return Boolean(value && allowedValues.includes(value));
}
