import type {
  AffiliationCavecAssimile,
  AncienneteCnbf,
  AtexaClasse,
  CaisseRetraite,
  ClassePrevoyance,
  ClasseRetraite,
  EffectifSalarie,
  ModeExerciceTns,
  ProfessionLiberaleCategorie,
  StatutConventionnel,
  StatutSocial,
} from '@/domain/audit/types';

export interface ProfessionOption<T extends string> {
  value: T | '';
  label: string;
  group?: string;
}

export const EMPTY_STATUT_SOCIAL_OPTION = { value: '', label: 'Non renseigné' } as const;
export const EMPTY_CAISSE_OPTION = { value: '', label: 'Non renseignée' } as const;
const EMPTY_OPTION = { value: '', label: 'Non renseigné' } as const;
const GROUPE_ACTIVITES_SALARIEES = 'Activités salariées';
const GROUPE_CHEF_ENTREPRISE = 'Activités chef d’entreprise';
const GROUPE_AUTRES = 'Autres';

export const STATUT_SOCIAL_OPTIONS = [
  EMPTY_STATUT_SOCIAL_OPTION,
  {
    value: 'salarie_non_cadre_prive',
    label: 'Salarié non cadre du secteur privé',
    group: GROUPE_ACTIVITES_SALARIEES,
  },
  {
    value: 'salarie_cadre_prive',
    label: 'Salarié cadre du secteur privé',
    group: GROUPE_ACTIVITES_SALARIEES,
  },
  {
    value: 'salarie_non_cadre_agricole',
    label: 'Salarié non cadre du secteur agricole',
    group: GROUPE_ACTIVITES_SALARIEES,
  },
  {
    value: 'salarie_cadre_agricole',
    label: 'Salarié cadre du secteur agricole',
    group: GROUPE_ACTIVITES_SALARIEES,
  },
  {
    value: 'salarie_non_titulaire_etat',
    label: 'Salarié non titulaire de l’État',
    group: GROUPE_ACTIVITES_SALARIEES,
  },
  { value: 'clerc_notaire', label: 'Clerc de notaire', group: GROUPE_ACTIVITES_SALARIEES },
  { value: 'fonctionnaire', label: 'Fonctionnaire', group: GROUPE_ACTIVITES_SALARIEES },
  {
    value: 'expert_comptable_salarie',
    label: 'Expert comptable salarié',
    group: GROUPE_ACTIVITES_SALARIEES,
  },
  { value: 'avocat_salarie', label: 'Avocat salarié', group: GROUPE_ACTIVITES_SALARIEES },
  { value: 'tns_article_62', label: 'TNS Article 62', group: GROUPE_CHEF_ENTREPRISE },
  { value: 'tns_individuel', label: 'TNS Individuel', group: GROUPE_CHEF_ENTREPRISE },
  { value: 'assimile_salarie', label: 'Assimilé salarié', group: GROUPE_CHEF_ENTREPRISE },
  { value: 'micro_entrepreneur', label: 'Micro entrepreneur', group: GROUPE_CHEF_ENTREPRISE },
  { value: 'chomage', label: 'Chômage', group: GROUPE_AUTRES },
  { value: 'maladie_invalidite', label: 'Maladie / invalidité', group: GROUPE_AUTRES },
  { value: 'retraite', label: 'Retraité', group: GROUPE_AUTRES },
  { value: 'militaire', label: 'Militaire', group: GROUPE_AUTRES },
  { value: 'sans_activite', label: 'Sans activité', group: GROUPE_AUTRES },
] satisfies Array<ProfessionOption<StatutSocial>>;

export const MODE_EXERCICE_OPTIONS = [
  EMPTY_OPTION,
  { value: 'entreprise_individuelle_ir', label: 'Entreprise individuelle' },
  { value: 'societe_is', label: 'En société à l’IS' },
] satisfies Array<ProfessionOption<ModeExerciceTns>>;

export const TNS_CAISSE_OPTIONS = [
  EMPTY_CAISSE_OPTION,
  { value: 'ssi_commercant', label: 'SSI Commerçant' },
  { value: 'ssi_artisan', label: 'SSI Artisan' },
  { value: 'msa', label: 'MSA' },
  { value: 'carcd', label: 'CARCD' },
  { value: 'carmf', label: 'CARMF' },
  { value: 'carpimko', label: 'CARPIMKO' },
  { value: 'carpv', label: 'CARPV' },
  { value: 'carsf', label: 'CARSF' },
  { value: 'cavamac', label: 'CAVAMAC' },
  { value: 'cavec', label: 'CAVEC' },
  { value: 'cavp', label: 'CAVP' },
  { value: 'cipav', label: 'CIPAV' },
  { value: 'cnbf', label: 'CNBF' },
  { value: 'crn', label: 'CRN' },
] satisfies Array<ProfessionOption<CaisseRetraite>>;

export const REGIME_GENERAL_CAISSE_OPTIONS = [
  EMPTY_CAISSE_OPTION,
  { value: 'regime_general', label: 'Régime général' },
] satisfies Array<ProfessionOption<CaisseRetraite>>;

export const PROFESSION_LIBERALE_CATEGORIE_OPTIONS = [
  EMPTY_OPTION,
  { value: 'sante', label: 'Santé' },
  { value: 'juridique_judiciaire', label: 'Juridique / judiciaire' },
  { value: 'technique_cadre_vie', label: 'Technique et cadre de vie' },
] satisfies Array<ProfessionOption<ProfessionLiberaleCategorie>>;

export const CONVENTION_SECTEUR_OPTIONS = [
  EMPTY_OPTION,
  { value: 'non_conventionne', label: 'Non' },
  { value: 'secteur_1', label: 'Secteur 1' },
  { value: 'secteur_2', label: 'Secteur 2' },
] satisfies Array<ProfessionOption<StatutConventionnel>>;

export const CONVENTION_OUI_NON_OPTIONS = [
  EMPTY_OPTION,
  { value: 'non_conventionne', label: 'Non' },
  { value: 'oui', label: 'Oui' },
] satisfies Array<ProfessionOption<StatutConventionnel>>;

export const CARPV_PREVOYANCE_OPTIONS = [
  EMPTY_OPTION,
  { value: 'carpv_minimum', label: 'Minimum' },
  { value: 'carpv_medium', label: 'Médium' },
  { value: 'carpv_maximum', label: 'Maximum' },
] satisfies Array<ProfessionOption<ClassePrevoyance>>;

export const CAVEC_PREVOYANCE_OPTIONS = [
  EMPTY_OPTION,
  { value: 'cavec_nc', label: 'Défaut (NC)' },
  { value: 'cavec_1', label: '1' },
  { value: 'cavec_2', label: '2' },
  { value: 'cavec_3', label: '3' },
  { value: 'cavec_4', label: '4' },
] satisfies Array<ProfessionOption<ClassePrevoyance>>;

export const CARPV_RETRAITE_OPTIONS = [
  EMPTY_OPTION,
  { value: 'carpv_nc', label: 'NC' },
  { value: 'carpv_ss1', label: 'SS1' },
  { value: 'carpv_ss2', label: 'SS2' },
  { value: 'carpv_s1', label: 'S1' },
  { value: 'carpv_s2', label: 'S2' },
  { value: 'carpv_a', label: 'A' },
  { value: 'carpv_b', label: 'B' },
  { value: 'carpv_c', label: 'C' },
  { value: 'carpv_d', label: 'D' },
  { value: 'carpv_e', label: 'E' },
] satisfies Array<ProfessionOption<ClasseRetraite>>;

export const CAVEC_RETRAITE_OPTIONS = [
  EMPTY_OPTION,
  { value: 'cavec_nc', label: 'Défaut (NC)' },
  { value: 'cavec_a', label: 'A' },
  { value: 'cavec_b', label: 'B' },
  { value: 'cavec_c', label: 'C' },
  { value: 'cavec_d', label: 'D' },
  { value: 'cavec_e', label: 'E' },
  { value: 'cavec_f', label: 'F' },
  { value: 'cavec_g', label: 'G' },
  { value: 'cavec_h', label: 'H' },
  { value: 'cavec_i', label: 'I' },
] satisfies Array<ProfessionOption<ClasseRetraite>>;

export const CAVP_RETRAITE_OPTIONS = [
  EMPTY_OPTION,
  { value: 'cavp_3', label: '3' },
  { value: 'cavp_4', label: '4' },
  { value: 'cavp_5', label: '5' },
  { value: 'cavp_6', label: '6' },
  { value: 'cavp_7', label: '7' },
  { value: 'cavp_8', label: '8' },
  { value: 'cavp_9', label: '9' },
  { value: 'cavp_10', label: '10' },
  { value: 'cavp_11', label: '11' },
  { value: 'cavp_12', label: '12' },
  { value: 'cavp_13', label: '13' },
] satisfies Array<ProfessionOption<ClasseRetraite>>;

export const CNBF_RETRAITE_OPTIONS = [
  EMPTY_OPTION,
  { value: 'cnbf_c1', label: 'C1' },
  { value: 'cnbf_c2', label: 'C2' },
  { value: 'cnbf_c2_plus', label: 'C2+' },
] satisfies Array<ProfessionOption<ClasseRetraite>>;

export const CRN_RETRAITE_OPTIONS = [
  EMPTY_OPTION,
  { value: 'crn_nc', label: 'Défaut (NC)' },
  { value: 'crn_1', label: '1' },
  { value: 'crn_2', label: '2' },
  { value: 'crn_3', label: '3' },
  { value: 'crn_4', label: '4' },
  { value: 'crn_5', label: '5' },
  { value: 'crn_6', label: '6' },
  { value: 'crn_7', label: '7' },
  { value: 'crn_8', label: '8' },
] satisfies Array<ProfessionOption<ClasseRetraite>>;

export const ANCIENNETE_CNBF_OPTIONS = [
  EMPTY_OPTION,
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6_plus', label: '6 et +' },
] satisfies Array<ProfessionOption<AncienneteCnbf>>;

export const ATEXA_OPTIONS = [
  EMPTY_OPTION,
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
  { value: 'd', label: 'D' },
  { value: 'e', label: 'E' },
] satisfies Array<ProfessionOption<AtexaClasse>>;

export const YES_NO_OPTIONS = [
  { value: 'non', label: 'Non' },
  { value: 'oui', label: 'Oui' },
] satisfies Array<{ value: 'non' | 'oui'; label: string }>;

export const EFFECTIF_SALARIE_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'moins_11', label: 'Moins de 11' },
  { value: 'entre_11_49', label: 'Entre 11 et 49' },
  { value: 'a_partir_50', label: 'À compter de 50' },
] satisfies Array<ProfessionOption<EffectifSalarie>>;

export const AFFILIATION_CAVEC_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'non', label: 'Non' },
  { value: 'classe_c', label: 'Classe C' },
  { value: 'classe_d', label: 'Classe D' },
] satisfies Array<ProfessionOption<AffiliationCavecAssimile>>;
