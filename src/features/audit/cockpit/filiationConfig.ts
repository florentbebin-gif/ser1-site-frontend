import type { SimSelectOption } from '@/components/ui/sim';
import type {
  AuditAvatarKind,
  EnfantInfo,
  NiveauScolaire,
  ProcheInfo,
  ProcheLien,
  ProcheLienNonEnfant,
  TypeAdoption,
} from '@/domain/audit/types';

import type { AuditAvatarSubject } from '../avatarAppearance';

/** Liens proposés pour une ligne « enfant ». */
export const ENFANT_LIEN_OPTIONS: SimSelectOption[] = [
  { value: 'enfant_commun', label: 'Enfant commun' },
  { value: 'enfant_union_precedente_mr', label: 'Enfant union précédente client' },
  { value: 'enfant_union_precedente_mme', label: 'Enfant union précédente conjoint' },
];

/** Liens proposés pour une ligne « proche » (non-enfant). */
export const PROCHE_LIEN_OPTIONS: SimSelectOption[] = [
  { value: 'petit_enfant', label: 'Petit-enfant' },
  { value: 'parent', label: 'Parent' },
  { value: 'frere_soeur', label: 'Frère/Sœur' },
  { value: 'oncle_tante', label: 'Oncle/Tante' },
  { value: 'tierce_personne', label: 'Tierce personne' },
];

export const NIVEAU_SCOLAIRE_OPTIONS: SimSelectOption[] = [
  { value: '', label: 'Non renseigné' },
  { value: 'aucun', label: 'Aucun' },
  { value: 'college', label: 'Collège' },
  { value: 'lycee', label: 'Lycée' },
  { value: 'enseignement_superieur', label: 'Enseignement supérieur' },
];

/** Rattachement Client / Conjoint (parent, frère/sœur). */
export const RATTACHEMENT_OPTIONS: SimSelectOption[] = [
  { value: 'client', label: 'Client' },
  { value: 'conjoint', label: 'Conjoint' },
];

/** Branche de rattachement (oncle/tante). */
export const BRANCHE_OPTIONS: SimSelectOption[] = [
  { value: 'client_paternelle', label: 'Client — branche paternelle' },
  { value: 'client_maternelle', label: 'Client — branche maternelle' },
  { value: 'conjoint_paternelle', label: 'Conjoint — branche paternelle' },
  { value: 'conjoint_maternelle', label: 'Conjoint — branche maternelle' },
];

export const ADOPTION_OPTIONS: SimSelectOption[] = [
  { value: 'pleniere', label: 'Adoption plénière' },
  { value: 'simple', label: 'Adoption simple' },
];

/**
 * Portée de renonciation à la succession.
 * Enfant commun → trois choix ; enfant d'une union précédente → limité au parent concerné.
 */
export function renonciationOptionsFor(enfant: EnfantInfo): SimSelectOption[] {
  const lien =
    enfant.lienParente ?? (enfant.estCommun ? 'enfant_commun' : 'enfant_union_precedente_mr');
  if (lien === 'enfant_union_precedente_mme') {
    return [{ value: 'conjoint', label: 'Du conjoint' }];
  }
  if (lien === 'enfant_union_precedente_mr') {
    return [{ value: 'client', label: 'Du client' }];
  }
  return [
    { value: 'deux_parents', label: 'Des deux parents' },
    { value: 'client', label: 'Du client' },
    { value: 'conjoint', label: 'Du conjoint' },
  ];
}

/** Options du select « Lien de parenté » d'un petit-enfant : les enfants déclarés et nommés. */
export function declaredChildOptions(enfants: EnfantInfo[]): SimSelectOption[] {
  return enfants
    .filter((enfant) => enfant.id)
    .map((enfant, index) => ({
      value: enfant.id as string,
      label: enfant.prenom.trim() || `Enfant ${index + 1}`,
    }));
}

interface ProcheLayout {
  /** Contrôle affiché en première colonne de la grille identité. */
  lienControl: 'enfants' | 'rattachement' | 'branche' | 'none';
  avatarSubject: AuditAvatarSubject;
  /** Bloc Situation civile & fiscale (à charge / adopté / scolarité). */
  showFiscal: boolean;
  /** Pastille « Vivant sous le même toit ». */
  showVivantSousMemeToit: boolean;
}

const PROCHE_LAYOUTS: Record<ProcheLienNonEnfant, ProcheLayout> = {
  petit_enfant: {
    lienControl: 'enfants',
    avatarSubject: 'enfant',
    showFiscal: true,
    showVivantSousMemeToit: false,
  },
  parent: {
    lienControl: 'rattachement',
    avatarSubject: 'adulte',
    showFiscal: false,
    showVivantSousMemeToit: false,
  },
  frere_soeur: {
    lienControl: 'rattachement',
    avatarSubject: 'adulte',
    showFiscal: false,
    showVivantSousMemeToit: true,
  },
  oncle_tante: {
    lienControl: 'branche',
    avatarSubject: 'adulte',
    showFiscal: false,
    showVivantSousMemeToit: false,
  },
  tierce_personne: {
    lienControl: 'none',
    avatarSubject: 'adulte',
    showFiscal: false,
    showVivantSousMemeToit: false,
  },
};

export function procheLayout(lien: ProcheLienNonEnfant): ProcheLayout {
  return PROCHE_LAYOUTS[lien];
}

export function relationLabel(lien: ProcheLien): string {
  return (
    [...ENFANT_LIEN_OPTIONS, ...PROCHE_LIEN_OPTIONS].find((option) => option.value === lien)
      ?.label ?? 'Proche'
  );
}

export function enfantLienValue(enfant: EnfantInfo): ProcheLien {
  if (enfant.lienParente) return enfant.lienParente;
  if (enfant.estCommun) return 'enfant_commun';
  return enfant.parentPrincipal === 'mme'
    ? 'enfant_union_precedente_mme'
    : 'enfant_union_precedente_mr';
}

/** Mise à jour des champs « legacy » estCommun/parentPrincipal selon le lien enfant. */
export function enfantRelationPatch(
  lien: ProcheLien,
): Pick<EnfantInfo, 'estCommun' | 'parentPrincipal'> {
  if (lien === 'enfant_commun') return { estCommun: true, parentPrincipal: undefined };
  if (lien === 'enfant_union_precedente_mme') return { estCommun: false, parentPrincipal: 'mme' };
  return { estCommun: false, parentPrincipal: 'mr' };
}

export function fullName(person: { prenom: string; nom?: string }): string {
  return [person.prenom, person.nom].filter((part) => part?.trim()).join(' ');
}

export function avatarKindForChild(index: number): AuditAvatarKind {
  return index % 2 === 0 ? 'fille' : 'garcon';
}

export function defaultProcheAvatarKind(lien: ProcheLienNonEnfant, index: number): AuditAvatarKind {
  if (lien === 'petit_enfant') return avatarKindForChild(index);
  return index % 2 === 0 ? 'femme' : 'homme';
}

let idCounter = 0;
function createId(prefix: string): string {
  idCounter += 1;
  const unique = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${idCounter}`;
  return `${prefix}-${unique}`;
}

export function createEnfant(): EnfantInfo {
  return {
    id: createId('enfant'),
    prenom: '',
    dateNaissance: '',
    estCommun: true,
    lienParente: 'enfant_commun',
    // Cas le plus fréquent : un enfant ajouté est fiscalement à charge par défaut.
    fiscalementACharge: true,
  };
}

export function createProche(): ProcheInfo {
  return {
    id: createId('proche'),
    lienParente: 'parent',
    prenom: '',
    dateNaissance: '',
  };
}

/** Rétro-comble un id stable sur les lignes existantes (drafts antérieurs). */
export function ensureEnfantId(enfant: EnfantInfo): EnfantInfo {
  return enfant.id ? enfant : { ...enfant, id: createId('enfant') };
}

/** Sous-ensemble « Situation civile & fiscale » partagé entre enfant et petit-enfant. */
export interface CivilFiscalFields {
  fiscalementACharge?: boolean;
  niveauScolaire?: NiveauScolaire;
  gardeAlternee?: boolean;
  handicap?: boolean;
  adopte?: boolean;
  typeAdoption?: TypeAdoption;
}

/**
 * Bascule une pastille civile/fiscale en nettoyant les valeurs masquées (anti-données fantômes) :
 * couper « à charge » vide scolarité + garde alternée ; couper « adopté » vide le type d'adoption.
 */
export function toggleCivilFiscal<T extends CivilFiscalFields>(
  value: T,
  key: 'fiscalementACharge' | 'handicap' | 'adopte',
  next: boolean,
): T {
  const updated: T = { ...value, [key]: next };
  if (key === 'fiscalementACharge' && !next) {
    updated.niveauScolaire = undefined;
    updated.gardeAlternee = undefined;
  }
  if (key === 'adopte' && !next) updated.typeAdoption = undefined;
  return updated;
}

const PROCHE_SUPPORTED_FIELDS: Record<ProcheLienNonEnfant, ReadonlyArray<keyof ProcheInfo>> = {
  petit_enfant: [
    'parentEnfantId',
    'fiscalementACharge',
    'niveauScolaire',
    'gardeAlternee',
    'adopte',
    'typeAdoption',
  ],
  parent: ['rattachement'],
  frere_soeur: ['rattachement', 'vivantSousMemeToit'],
  oncle_tante: ['rattachementBranche'],
  tierce_personne: [],
};

const PROCHE_OPTIONAL_FIELDS: ReadonlyArray<keyof ProcheInfo> = [
  'parentEnfantId',
  'rattachement',
  'rattachementBranche',
  'vivantSousMemeToit',
  'fiscalementACharge',
  'niveauScolaire',
  'gardeAlternee',
  'adopte',
  'typeAdoption',
];

/** Au changement de type de proche, purge les champs non supportés par le nouveau type. */
export function applyProcheLien(proche: ProcheInfo, lien: ProcheLienNonEnfant): ProcheInfo {
  const supported = new Set(PROCHE_SUPPORTED_FIELDS[lien]);
  const updated: ProcheInfo = { ...proche, lienParente: lien };
  for (const field of PROCHE_OPTIONAL_FIELDS) {
    if (!supported.has(field)) {
      delete updated[field];
    }
  }
  return updated;
}
