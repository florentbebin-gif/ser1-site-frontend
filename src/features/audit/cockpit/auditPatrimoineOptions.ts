import type { SimSelectOption } from '@/components/ui/sim';

export const ACTIF_TYPE_OPTIONS: SimSelectOption[] = [
  { value: 'residence_principale', label: 'Résidence principale' },
  { value: 'residence_secondaire', label: 'Résidence secondaire' },
  { value: 'locatif', label: 'Immobilier locatif' },
  { value: 'scpi', label: 'SCPI' },
  { value: 'autre_immo', label: 'Autre actif immobilier' },
  { value: 'compte_courant', label: 'Compte courant' },
  { value: 'livret', label: 'Livret' },
  { value: 'pea', label: 'PEA' },
  { value: 'cto', label: 'Compte-titres' },
  { value: 'assurance_vie', label: 'Assurance-vie' },
  { value: 'per', label: 'PER' },
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'parts_sociales', label: 'Parts sociales' },
  { value: 'fonds_commerce', label: 'Fonds de commerce' },
  { value: 'vehicule', label: 'Véhicule' },
  { value: 'mobilier', label: 'Mobilier' },
  { value: 'oeuvre_art', label: 'Œuvre d’art' },
  { value: 'bijoux', label: 'Bijoux' },
  { value: 'autre_financier', label: 'Autre actif financier' },
  { value: 'autre', label: 'Autre actif' },
];

export const MODE_DETENTION_OPTIONS: SimSelectOption[] = [
  { value: '', label: 'À qualifier' },
  { value: 'pp', label: 'Pleine propriété' },
  { value: 'np', label: 'Nue-propriété' },
  { value: 'usf', label: 'Usufruit' },
];

export const HORIZON_PLACEMENT_OPTIONS: SimSelectOption[] = [
  { value: '', label: 'À qualifier' },
  { value: 'ct', label: 'Court terme' },
  { value: 'mt', label: 'Moyen terme' },
  { value: 'lt', label: 'Long terme' },
];

export const PROFIL_RISQUE_OPTIONS: SimSelectOption[] = [
  { value: '', label: 'À qualifier' },
  { value: 'sans_risque', label: 'Sans risque' },
  { value: 'defensif', label: 'Défensif' },
  { value: 'equilibre', label: 'Équilibré' },
  { value: 'dynamique', label: 'Dynamique' },
];

export const DELAI_REALISATION_OPTIONS: SimSelectOption[] = [
  { value: '', label: 'À qualifier' },
  { value: 'immediat', label: 'Immédiat' },
  { value: 'differe', label: 'Différé' },
];

export const EMPRUNT_TYPE_OPTIONS: SimSelectOption[] = [
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'consommation', label: 'Consommation' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'autre', label: 'Autre' },
];
