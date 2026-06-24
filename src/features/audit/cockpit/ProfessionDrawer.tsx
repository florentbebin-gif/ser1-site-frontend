import { useEffect, useState, type ReactElement } from 'react';

import {
  type CaisseRetraite,
  type DossierAudit,
  type NatureActivite,
  type PersonInfo,
  type ProfessionCsp,
  type StatutConventionnel,
  type StatutSocial,
} from '@/domain/audit/types';
import { IconBriefcase, IconClock, IconShield } from '@/icons/ui';

import { AuditDrawerXL } from '../components/AuditDrawerXL';
import { LockedRow, PercentField } from './auditDrawerControls';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  DrawerFooter,
  emptyToUndefined,
  SelectField,
  TextField,
} from './auditCockpitShared';

const CSP_OPTIONS = [
  { value: '', label: 'Non renseignée' },
  { value: 'dirigeant', label: 'Dirigeant' },
  { value: 'salarie_cadre', label: 'Salarié cadre' },
  { value: 'salarie_non_cadre', label: 'Salarié non cadre' },
  { value: 'profession_liberale', label: 'Profession libérale' },
  { value: 'independant', label: 'Indépendant' },
  { value: 'retraite', label: 'Retraité' },
  { value: 'sans_activite', label: 'Sans activité' },
] satisfies Array<{ value: ProfessionCsp | ''; label: string }>;

const NATURE_ACTIVITE_OPTIONS = [
  { value: '', label: 'Non renseignée' },
  { value: 'salarie', label: 'Salarié' },
  { value: 'periode_assimilee', label: 'Période assimilée' },
  { value: 'tns_independant', label: 'TNS / Indépendant' },
  { value: 'micro_entreprise', label: 'Micro-entreprise' },
  { value: 'sans_activite', label: 'Sans activité' },
] satisfies Array<{ value: NatureActivite | ''; label: string }>;

const STATUT_SOCIAL_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'tns_article_62', label: 'TNS Article 62' },
  { value: 'gerant_minoritaire', label: 'Gérant minoritaire' },
  { value: 'assimile_salarie', label: 'Assimilé salarié' },
  { value: 'non_renseigne', label: 'Non renseigné' },
] satisfies Array<{ value: StatutSocial | ''; label: string }>;

const CAISSE_RETRAITE_OPTIONS = [
  { value: '', label: 'Non renseignée' },
  { value: 'carmf', label: 'CARMF' },
  { value: 'carpimko', label: 'CARPIMKO' },
  { value: 'cipav', label: 'CIPAV' },
  { value: 'cnav', label: 'CNAV' },
  { value: 'msa', label: 'MSA' },
  { value: 'ircantec', label: 'IRCANTEC' },
  { value: 'non_renseignee', label: 'Non renseignée' },
] satisfies Array<{ value: CaisseRetraite | ''; label: string }>;

const STATUT_CONVENTIONNEL_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'secteur_1', label: 'Secteur 1' },
  { value: 'secteur_2', label: 'Secteur 2' },
  { value: 'non_conventionne', label: 'Non conventionné' },
  { value: 'non_applicable', label: 'Non applicable' },
] satisfies Array<{ value: StatutConventionnel | ''; label: string }>;

export function ProfessionDrawer({
  open,
  dossier,
  onClose,
  onSave,
}: {
  open: boolean;
  dossier: DossierAudit;
  onClose: () => void;
  onSave: (mr: PersonInfo, mme: PersonInfo | undefined) => void;
}): ReactElement {
  const [mr, setMr] = useState(dossier.situationFamiliale.mr);
  const [mme, setMme] = useState(dossier.situationFamiliale.mme);

  useEffect(() => {
    if (!open) return;
    setMr(dossier.situationFamiliale.mr);
    setMme(dossier.situationFamiliale.mme);
  }, [dossier.situationFamiliale.mme, dossier.situationFamiliale.mr, open]);

  return (
    <AuditDrawerXL
      open={open}
      title="Situation professionnelle"
      subtitle="Professions connues du foyer F1."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(mr, mme)} />}
    >
      <div className="audit-drawer-form">
        <div
          className="audit-profession-columns"
          data-columns={dossier.situationFamiliale.mme ? 2 : 1}
        >
          <ProfessionalProfileFields title="Client principal" person={mr} onChange={setMr} />
          {mme ? (
            <ProfessionalProfileFields title="Conjoint" person={mme} onChange={setMme} />
          ) : null}
        </div>
        <AuditDrawerSection
          title="Modules avancés"
          description="Synthèses calculées activées à une prochaine étape."
        >
          <div className="audit-locked-rows">
            <LockedRow
              icon={<IconBriefcase />}
              title="Revenus salariaux"
              detail="Calcul automatique à venir"
            />
            <LockedRow
              icon={<IconShield />}
              title="Revenus non-salariés"
              detail="Module TNS à venir"
            />
            <LockedRow
              icon={<IconClock />}
              title="Âge cible de départ"
              detail="Module retraite à venir"
            />
          </div>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}

function ProfessionalProfileFields({
  title,
  person,
  onChange,
}: {
  title: string;
  person: PersonInfo;
  onChange: (person: PersonInfo) => void;
}): ReactElement {
  const showTnsFields =
    person.natureActivite === 'tns_independant' || person.natureActivite === 'micro_entreprise';

  return (
    <AuditDrawerSection title={title}>
      <AuditDrawerFieldGrid columns={2}>
        <SelectField
          label="Catégorie socio-professionnelle"
          value={person.csp ?? ''}
          options={CSP_OPTIONS}
          onChange={(csp) =>
            onChange({ ...person, csp: emptyToUndefined(csp) as PersonInfo['csp'] })
          }
        />
        <SelectField
          label="Nature de l’activité"
          value={person.natureActivite ?? ''}
          options={NATURE_ACTIVITE_OPTIONS}
          onChange={(natureActivite) =>
            onChange({
              ...person,
              natureActivite: emptyToUndefined(natureActivite) as PersonInfo['natureActivite'],
              statutSocial: isTnsActivity(natureActivite) ? person.statutSocial : undefined,
            })
          }
        />
      </AuditDrawerFieldGrid>
      <AuditDrawerFieldGrid columns={2}>
        <TextField
          label="Profession (libellé)"
          value={person.profession ?? ''}
          onChange={(profession) =>
            onChange({ ...person, profession: emptyToUndefined(profession) })
          }
        />
        <SelectField
          label="Caisse d’affiliation retraite"
          value={person.caisseRetraite ?? ''}
          options={CAISSE_RETRAITE_OPTIONS}
          onChange={(caisseRetraite) =>
            onChange({
              ...person,
              caisseRetraite: emptyToUndefined(caisseRetraite) as PersonInfo['caisseRetraite'],
            })
          }
        />
      </AuditDrawerFieldGrid>
      <AuditDrawerFieldGrid columns={showTnsFields ? 3 : 2}>
        {showTnsFields ? (
          <SelectField
            label="Statut social"
            value={person.statutSocial ?? ''}
            options={STATUT_SOCIAL_OPTIONS}
            onChange={(statutSocial) =>
              onChange({
                ...person,
                statutSocial: emptyToUndefined(statutSocial) as PersonInfo['statutSocial'],
              })
            }
          />
        ) : null}
        <SelectField
          label="Statut conventionnel"
          value={person.statutConventionnel ?? ''}
          options={STATUT_CONVENTIONNEL_OPTIONS}
          onChange={(statutConventionnel) =>
            onChange({
              ...person,
              statutConventionnel: emptyToUndefined(
                statutConventionnel,
              ) as PersonInfo['statutConventionnel'],
            })
          }
        />
        <PercentField
          label="Taux de prise en charge CPAM"
          value={person.tauxPriseEnChargeCpam}
          onChange={(tauxPriseEnChargeCpam) => onChange({ ...person, tauxPriseEnChargeCpam })}
        />
      </AuditDrawerFieldGrid>
    </AuditDrawerSection>
  );
}

function isTnsActivity(value: string): boolean {
  return value === 'tns_independant' || value === 'micro_entreprise';
}
