import { useId, type ReactElement, type ReactNode } from 'react';

import {
  type Actif,
  type DossierAudit,
  type DonationInfo,
  type Passif,
  type PassifEmprunt,
  type PersonInfo,
  type ProprietaireType,
  type RevenuCategorie,
} from '@/domain/audit/types';
import type { DossierContrainte, DossierOperationPrevue } from '@/domain/dossier';
import {
  SimFieldShell,
  SimSelect,
  SimTemporalField,
  type SimSelectOption,
} from '@/components/ui/sim';
import { IconPlus, IconTrash } from '@/icons/ui';

import type { AuditLandingViewModel } from '../auditLandingViewModel';
export {
  AuditPageContinuation,
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  StatusBadge,
  SummaryCardGrid,
} from './auditCockpitUi';

export type AuditCockpitPageId =
  | 'landing'
  | 'foyer-famille'
  | 'actifs-passifs'
  | 'fiscalite'
  | 'objectifs';

export interface AuditCockpitPageProps {
  dossier: DossierAudit;
  viewModel: AuditLandingViewModel;
  updateDossier: (updater: (previous: DossierAudit) => DossierAudit) => void;
  onSelectSection: (sectionId: string) => void;
}

export type CardStatus = 'vide' | 'partiel' | 'complet' | 'a-verifier' | 'a-venir' | 'verrouille';

export interface SummaryCardData {
  id: string;
  title: string;
  status: CardStatus;
  badgeLabel?: string;
  ctaTone?: 'required';
  summaryLine?: string;
  known: string[];
  missing: string[];
  alert?: string;
  icon: ReactNode;
  ctaLabel: 'Compléter' | 'Modifier' | 'Ouvrir';
  onAction: () => void;
}

export const SITUATION_OPTIONS: SimSelectOption[] = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'pacse', label: 'Pacsé(e)' },
  { value: 'concubinage', label: 'Concubinage' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf / veuve' },
];

export const REGIME_OPTIONS: SimSelectOption[] = [
  { value: '', label: 'Non renseigné' },
  { value: 'communaute_legale', label: 'Communauté légale' },
  { value: 'communaute_universelle', label: 'Communauté universelle' },
  { value: 'separation_biens', label: 'Séparation de biens' },
  { value: 'participation_acquets', label: 'Participation aux acquêts' },
  { value: 'communaute_meubles_acquets', label: 'Communauté de meubles et acquêts' },
  {
    value: 'separation_biens_societe_acquets',
    label: 'Séparation avec société d’acquêts',
  },
];

export const DONATION_TYPE_OPTIONS: SimSelectOption[] = [
  { value: 'donation_simple', label: 'Donation simple' },
  { value: 'donation_partage', label: 'Donation-partage' },
  { value: 'donation_temporaire_usufruit', label: 'Donation temporaire d’usufruit' },
];

export const ACTIF_TYPE_OPTIONS: SimSelectOption[] = [
  { value: 'residence_principale', label: 'Résidence principale' },
  { value: 'residence_secondaire', label: 'Résidence secondaire' },
  { value: 'locatif', label: 'Immobilier locatif' },
  { value: 'scpi', label: 'SCPI' },
  { value: 'compte_courant', label: 'Compte courant' },
  { value: 'livret', label: 'Livret' },
  { value: 'pea', label: 'PEA' },
  { value: 'cto', label: 'Compte-titres' },
  { value: 'assurance_vie', label: 'Assurance-vie' },
  { value: 'per', label: 'PER' },
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'parts_sociales', label: 'Parts sociales' },
  { value: 'vehicule', label: 'Véhicule' },
  { value: 'autre_financier', label: 'Autre actif financier' },
  { value: 'autre', label: 'Autre actif' },
];

export const PROPRIETAIRE_OPTIONS: SimSelectOption[] = [
  { value: 'mr', label: 'Client principal' },
  { value: 'mme', label: 'Conjoint' },
  { value: 'commun', label: 'Commun' },
  { value: 'indivision', label: 'Indivision' },
];

export const EMPRUNT_TYPE_OPTIONS: SimSelectOption[] = [
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'consommation', label: 'Consommation' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'autre', label: 'Autre' },
];

export const REVENU_CATEGORIE_OPTIONS: SimSelectOption[] = [
  { value: 'salaires', label: 'Salaires' },
  { value: 'tns', label: 'TNS' },
  { value: 'fonciers', label: 'Revenus fonciers' },
  { value: 'capitaux_mobiliers', label: 'Capitaux mobiliers' },
  { value: 'plus_values', label: 'Plus-values' },
  { value: 'pensions', label: 'Pensions' },
  { value: 'autres', label: 'Autres revenus' },
];

export const BENEFICIAIRE_OPTIONS: SimSelectOption[] = [
  { value: 'mr', label: 'Client principal' },
  { value: 'mme', label: 'Conjoint' },
  { value: 'foyer', label: 'Foyer' },
];

export const CONTRAINTE_PRIORITY_OPTIONS: SimSelectOption[] = [
  { value: 'haute', label: 'Haute' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'basse', label: 'Basse' },
];

export const OPERATION_STATUS_OPTIONS: SimSelectOption[] = [
  { value: 'planned', label: 'Prévue' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Réalisée' },
  { value: 'cancelled', label: 'Annulée' },
];

export function EditableList({
  addLabel,
  empty,
  onAdd,
  children,
}: {
  addLabel: string;
  empty: string;
  onAdd: () => void;
  children: ReactNode;
}): ReactElement {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="audit-drawer-form">
      <button type="button" className="audit-drawer-add" onClick={onAdd}>
        <IconPlus />
        <span>{addLabel}</span>
      </button>
      {hasChildren ? children : <p className="audit-drawer-empty">{empty}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <SimFieldShell label={label} controlId={id}>
      <input
        id={id}
        type="text"
        className="sim-field__control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </SimFieldShell>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <SimFieldShell label={label} controlId={id}>
      <textarea
        id={id}
        className="sim-field__control audit-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </SimFieldShell>
  );
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <SimFieldShell label={label} controlId={id}>
      <SimTemporalField id={id} value={value} onChange={onChange} />
    </SimFieldShell>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SimSelectOption[];
  onChange: (value: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <SimFieldShell label={label} controlId={id}>
      <SimSelect id={id} value={value} options={options} onChange={onChange} align="left" />
    </SimFieldShell>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}): ReactElement {
  return (
    <label className="audit-checkbox-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function DrawerFooter({
  onCancel,
  onSave,
  onDelete,
}: {
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
}): ReactElement {
  return (
    <>
      {onDelete ? (
        <button type="button" className="audit-drawer-footer__delete" onClick={onDelete}>
          <IconTrash />
          <span>Supprimer</span>
        </button>
      ) : null}
      <span className="audit-drawer-footer__spacer" />
      <button type="button" className="audit-drawer-footer__secondary" onClick={onCancel}>
        Annuler
      </button>
      <button type="button" className="audit-drawer-footer__primary" onClick={onSave}>
        Enregistrer
      </button>
    </>
  );
}

export function hasCompletePerson(person: PersonInfo): boolean {
  return Boolean(person.prenom.trim() && person.nom.trim() && person.dateNaissance.trim());
}

export function fullName(person: PersonInfo): string {
  return [person.prenom, person.nom].filter((part) => part.trim()).join(' ');
}

export function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function positive(value: number | undefined): boolean {
  return typeof value === 'number' && value > 0;
}

export function formatDate(value: string): string {
  if (!value) return 'Non renseignée';
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
}

export function formatEuroOrMissing(value: number | undefined): string {
  if (!positive(value)) return 'Non renseigné';
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value ?? 0)} €`;
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} %`;
}

export function sumPositive(values: Array<number | undefined>): number {
  return values.reduce<number>((total, value) => total + (positive(value) ? (value ?? 0) : 0), 0);
}

export function labelForOption(options: SimSelectOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function ownerLabel(value: ProprietaireType): string {
  return labelForOption(PROPRIETAIRE_OPTIONS, value);
}

export function updateAt<T>(items: T[], index: number, item: T): T[] {
  return items.map((current, currentIndex) => (currentIndex === index ? item : current));
}

export function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [...items, item];
}

function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`;
}

export function createDonation(): DonationInfo {
  return {
    id: createId('donation'),
    type: 'donation_simple',
    date: '',
    beneficiaire: '',
  };
}

export function createActif(): Actif {
  return {
    id: createId('actif'),
    type: 'autre_financier',
    libelle: '',
    valeur: 0,
    proprietaire: 'commun',
  };
}

export function createEmprunt(): PassifEmprunt {
  return {
    id: createId('emprunt'),
    libelle: '',
    type: 'immobilier',
    capitalInitial: 0,
    capitalRestantDu: 0,
    mensualite: 0,
    tauxInteret: 0,
    dateDebut: '',
    dateFin: '',
  };
}

export function createDette(): Passif['autresDettes'][number] {
  return {
    id: createId('dette'),
    libelle: '',
    montant: 0,
  };
}

export function createRevenu(): RevenuCategorie {
  return {
    id: createId('revenu'),
    categorie: 'salaires',
    montantBrut: 0,
    montantNet: 0,
    beneficiaire: 'foyer',
  };
}

export function createContrainte(): DossierContrainte {
  return {
    id: createId('contrainte'),
    label: '',
    priority: 'moyenne',
    sourceRefIds: [],
  };
}

export function createOperation(): DossierOperationPrevue {
  return {
    id: createId('operation'),
    label: '',
    status: 'planned',
    sourceRefIds: [],
  };
}
