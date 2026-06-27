import type { ReactElement, ReactNode } from 'react';

import type {
  Actif,
  AuditAvatarAppearance,
  AuditAvatarKind,
  Passif,
  PassifEmprunt,
  SituationFamiliale,
} from '@/domain/audit/types';
import {
  IconBarChart,
  IconBriefcase,
  IconBuilding,
  IconFileText,
  IconHome,
  IconLayers,
  IconShield,
} from '@/icons/ui';

import {
  ACTIF_TYPE_OPTIONS,
  EMPRUNT_TYPE_OPTIONS,
  labelForOption,
  sumPositive,
} from './auditCockpitShared';

export type InventoryKind = 'actif' | 'emprunt' | 'dette';
export type FamilleActif = 'immobilier' | 'financier' | 'professionnel' | 'divers';
export type FamillePassif = 'emprunts' | 'autres';
export type OwnerKey = 'client' | 'conjoint' | 'commun';

export interface AvatarRef {
  kind: AuditAvatarKind;
  appearance?: AuditAvatarAppearance;
  label: string;
}

export interface OwnerColumn {
  key: OwnerKey;
  label: string;
  avatars: AvatarRef[];
}

export interface FamilyTotal {
  label: string;
  montant: number;
}

export interface ActifItem {
  id: string;
  icon: ReactNode;
  title: string;
  typeLabel: string;
  montant: number;
  owner: OwnerKey;
  anomaly: boolean;
  onEdit: () => void;
}

export interface ActifGroup {
  key: string;
  label: string;
  total: number;
  items: ActifItem[];
}

export interface PassifItem {
  id: string;
  icon: ReactNode;
  title: string;
  typeLabel: string;
  montant: number;
  anomaly: boolean;
  onEdit: () => void;
}

export interface PassifGroup {
  key: string;
  label: string;
  total: number;
  items: PassifItem[];
}

export const FAMILLE_ACTIF_LABEL: Record<FamilleActif, string> = {
  immobilier: 'Immobilier',
  financier: 'Financier',
  professionnel: 'Professionnel',
  divers: 'Divers',
};

export const FAMILLE_ACTIF_ORDER: FamilleActif[] = [
  'immobilier',
  'financier',
  'professionnel',
  'divers',
];

export const FAMILLE_PASSIF_LABEL: Record<FamillePassif, string> = {
  emprunts: 'Emprunts',
  autres: 'Autres dettes',
};

// Exhaustif sur Actif['type'] : le typecheck échoue si un type du domaine n'est pas classé.
const FAMILLE_PAR_TYPE_ACTIF: Record<Actif['type'], FamilleActif> = {
  residence_principale: 'immobilier',
  residence_secondaire: 'immobilier',
  locatif: 'immobilier',
  scpi: 'immobilier',
  autre_immo: 'immobilier',
  compte_courant: 'financier',
  livret: 'financier',
  pea: 'financier',
  cto: 'financier',
  assurance_vie: 'financier',
  per: 'financier',
  autre_financier: 'financier',
  entreprise: 'professionnel',
  parts_sociales: 'professionnel',
  fonds_commerce: 'professionnel',
  vehicule: 'divers',
  mobilier: 'divers',
  oeuvre_art: 'divers',
  bijoux: 'divers',
  autre: 'divers',
};

export function natureFamilleActif(type: Actif['type']): FamilleActif {
  return FAMILLE_PAR_TYPE_ACTIF[type];
}

export function actifTypeIcon(type: Actif['type']): ReactElement {
  if (type === 'residence_principale' || type === 'residence_secondaire') return <IconHome />;
  if (type === 'assurance_vie' || type === 'per') return <IconShield />;
  const family = natureFamilleActif(type);
  if (family === 'immobilier') return <IconBuilding />;
  if (family === 'financier') return <IconBarChart />;
  if (family === 'professionnel') return <IconBriefcase />;
  return <IconLayers />;
}

export function empruntTypeIcon(type: PassifEmprunt['type']): ReactElement {
  return type === 'immobilier' ? <IconBuilding /> : <IconFileText />;
}

function actifTypeLabel(type: Actif['type']): string {
  return (
    ACTIF_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    FAMILLE_ACTIF_LABEL[natureFamilleActif(type)]
  );
}

function ownerOfActif(proprietaire: Actif['proprietaire'], isCouple: boolean): OwnerKey {
  if (!isCouple) return 'client';
  if (proprietaire === 'mr') return 'client';
  if (proprietaire === 'mme') return 'conjoint';
  return 'commun';
}

function avatarOf(
  person: {
    prenom: string;
    avatarKind?: AuditAvatarKind;
    avatarAppearance?: AuditAvatarAppearance;
  },
  fallbackKind: AuditAvatarKind,
  fallbackLabel: string,
): AvatarRef {
  return {
    kind: person.avatarKind ?? fallbackKind,
    appearance: person.avatarAppearance,
    label: person.prenom.trim() || fallbackLabel,
  };
}

export function buildOwnerColumns(
  famille: SituationFamiliale,
  actifs: Actif[],
  isCouple: boolean,
): OwnerColumn[] {
  const client = avatarOf(famille.mr, 'homme', 'Client');
  const columns: OwnerColumn[] = [{ key: 'client', label: client.label, avatars: [client] }];
  // Hors couple (célibataire / divorcé / veuf) : pas de colonne Conjoint ni Commun.
  if (!isCouple) return columns;

  const hasConjoint = Boolean(famille.mme) || actifs.some((actif) => actif.proprietaire === 'mme');
  const conjoint = famille.mme
    ? avatarOf(famille.mme, 'femme', 'Conjoint')
    : { kind: 'femme' as AuditAvatarKind, label: 'Conjoint' };
  if (hasConjoint) {
    columns.push({ key: 'conjoint', label: conjoint.label, avatars: [conjoint] });
  }
  columns.push({
    key: 'commun',
    label: 'Commun',
    avatars: hasConjoint ? [client, conjoint] : [client],
  });
  return columns;
}

export function buildActifGroups(
  actifs: Actif[],
  isCouple: boolean,
  onEdit: (kind: InventoryKind, id: string) => void,
): ActifGroup[] {
  return FAMILLE_ACTIF_ORDER.map((family) => {
    const items = actifs.filter((actif) => natureFamilleActif(actif.type) === family);
    return {
      key: family,
      label: FAMILLE_ACTIF_LABEL[family],
      total: sumPositive(items.map((actif) => actif.valeur)),
      items: items.map((actif) => ({
        id: actif.id,
        icon: actifTypeIcon(actif.type),
        title: actif.libelle.trim() || 'Actif à qualifier',
        typeLabel: actifTypeLabel(actif.type),
        montant: actif.valeur,
        owner: ownerOfActif(actif.proprietaire, isCouple),
        anomaly: actifAnomaly(actif),
        onEdit: () => onEdit('actif', actif.id),
      })),
    };
  }).filter((group) => group.items.length > 0);
}

export function buildPassifGroups(
  emprunts: PassifEmprunt[],
  dettes: Passif['autresDettes'],
  onEdit: (kind: InventoryKind, id: string) => void,
): PassifGroup[] {
  const groups: PassifGroup[] = [];
  if (emprunts.length > 0) {
    groups.push({
      key: 'emprunts',
      label: FAMILLE_PASSIF_LABEL.emprunts,
      total: sumPositive(emprunts.map((emprunt) => emprunt.capitalRestantDu)),
      items: emprunts.map((emprunt) => ({
        id: emprunt.id,
        icon: empruntTypeIcon(emprunt.type),
        title: emprunt.libelle.trim() || 'Emprunt à qualifier',
        typeLabel: labelForOption(EMPRUNT_TYPE_OPTIONS, emprunt.type),
        montant: emprunt.capitalRestantDu,
        anomaly: empruntAnomaly(emprunt),
        onEdit: () => onEdit('emprunt', emprunt.id),
      })),
    });
  }
  if (dettes.length > 0) {
    groups.push({
      key: 'autres',
      label: FAMILLE_PASSIF_LABEL.autres,
      total: sumPositive(dettes.map((dette) => dette.montant)),
      items: dettes.map((dette) => ({
        id: dette.id,
        icon: <IconFileText />,
        title: dette.libelle.trim() || 'Dette à qualifier',
        typeLabel: 'Autre dette',
        montant: dette.montant,
        anomaly: detteAnomaly(dette),
        onEdit: () => onEdit('dette', dette.id),
      })),
    });
  }
  return groups;
}

// Répartition par famille des montants saisis (familles présentes uniquement).
export function actifFamilyTotals(actifs: Actif[]): FamilyTotal[] {
  return FAMILLE_ACTIF_ORDER.map((family) => ({
    label: FAMILLE_ACTIF_LABEL[family],
    montant: sumPositive(
      actifs
        .filter((actif) => natureFamilleActif(actif.type) === family)
        .map((actif) => actif.valeur),
    ),
  })).filter((total) => total.montant > 0);
}

export function passifTypeTotals(
  emprunts: PassifEmprunt[],
  dettes: Passif['autresDettes'],
): FamilyTotal[] {
  const totals: FamilyTotal[] = [];
  const empruntsTotal = sumPositive(emprunts.map((emprunt) => emprunt.capitalRestantDu));
  const dettesTotal = sumPositive(dettes.map((dette) => dette.montant));
  if (empruntsTotal > 0)
    totals.push({ label: FAMILLE_PASSIF_LABEL.emprunts, montant: empruntsTotal });
  if (dettesTotal > 0) totals.push({ label: FAMILLE_PASSIF_LABEL.autres, montant: dettesTotal });
  return totals;
}

// Contrôle de cohérence par item : la pastille « À vérifier » n'apparaît qu'en cas d'incohérence.
export function actifAnomaly(actif: Actif): boolean {
  return actif.valeur < 0;
}

export function empruntAnomaly(emprunt: PassifEmprunt): boolean {
  if (emprunt.capitalInitial > 0 && emprunt.capitalRestantDu > emprunt.capitalInitial) return true;
  if (emprunt.capitalRestantDu < 0 || emprunt.capitalInitial < 0) return true;
  if (emprunt.dateDebut && emprunt.dateFin && emprunt.dateFin < emprunt.dateDebut) return true;
  return false;
}

export function detteAnomaly(dette: Passif['autresDettes'][number]): boolean {
  return dette.montant < 0;
}
