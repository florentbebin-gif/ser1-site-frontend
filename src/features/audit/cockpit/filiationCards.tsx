import type { ReactElement, ReactNode } from 'react';

import type {
  EnfantInfo,
  ProcheInfo,
  ProcheLien,
  ProcheLienNonEnfant,
  RenonciationPortee,
} from '@/domain/audit/types';

import { AuditAvatarAppearancePicker } from '../components/AuditAvatarAppearancePicker';
import { SelectField } from './auditCockpitShared';
import {
  CardHeader,
  CivilFiscalZone,
  IdentityRow,
  QualifierTag,
  RelatedCardShell,
  SegmentedReveal,
} from './filiationCardParts';
import {
  applyProcheLien,
  avatarKindForChild,
  BRANCHE_OPTIONS,
  declaredChildOptions,
  defaultProcheAvatarKind,
  ENFANT_LIEN_OPTIONS,
  enfantLienValue,
  enfantRelationPatch,
  fullName,
  PROCHE_LIEN_OPTIONS,
  procheLayout,
  RATTACHEMENT_OPTIONS,
  relationLabel,
  renonciationOptionsFor,
} from './filiationConfig';

// --- Carte enfant --------------------------------------------------------

export function EnfantCard({
  enfant,
  index,
  onChange,
  onRemove,
}: {
  enfant: EnfantInfo;
  index: number;
  onChange: (enfant: EnfantInfo) => void;
  onRemove: () => void;
}): ReactElement {
  const lien = enfantLienValue(enfant);
  const deceased = Boolean(enfant.decede);
  const renoncant = Boolean(enfant.renoncantSuccession);

  return (
    <RelatedCardShell
      deceased={deceased}
      header={
        <CardHeader
          avatar={
            <AuditAvatarAppearancePicker
              label={`Apparence enfant ${index + 1}`}
              kind={enfant.avatarKind ?? avatarKindForChild(index)}
              subject="enfant"
              appearance={enfant.avatarAppearance}
              onChange={({ kind, appearance }) =>
                onChange({ ...enfant, avatarKind: kind, avatarAppearance: appearance })
              }
            />
          }
          label={relationLabel(lien)}
          deceased={deceased}
          removeLabel={`Retirer ${fullName(enfant) || `enfant ${index + 1}`}`}
          onRemove={onRemove}
        />
      }
    >
      <IdentityRow
        lienControl={
          <SelectField
            label="Lien de parenté"
            value={lien}
            options={ENFANT_LIEN_OPTIONS}
            onChange={(value) =>
              onChange({
                ...enfant,
                ...enfantRelationPatch(value as ProcheLien),
                lienParente: value as ProcheLien,
                // la portée de renonciation dépend du parent : on la réinitialise au changement de lien
                renonciationPortee: undefined,
              })
            }
          />
        }
        prenom={enfant.prenom}
        nom={enfant.nom ?? ''}
        dateNaissance={enfant.dateNaissance}
        deceased={deceased}
        onPrenom={(prenom) => onChange({ ...enfant, prenom })}
        onNom={(nom) => onChange({ ...enfant, nom })}
        onDate={(dateNaissance) => onChange({ ...enfant, dateNaissance })}
        onDeceased={(next) => onChange({ ...enfant, decede: next })}
      />
      <CivilFiscalZone value={enfant} onChange={(civil) => onChange({ ...enfant, ...civil })} />
      <div className="audit-related-card__succession">
        <p className="audit-related-card__group-label">Succession / transmission</p>
        <div className="audit-related-card__tag-row">
          <QualifierTag
            label="Renonçant à la succession"
            tone="impact"
            active={renoncant}
            onToggle={(next) =>
              onChange({
                ...enfant,
                renoncantSuccession: next,
                renonciationPortee: next ? enfant.renonciationPortee : undefined,
              })
            }
          />
        </div>
        {renoncant ? (
          <SegmentedReveal
            label="Portée de la renonciation"
            options={renonciationOptionsFor(enfant)}
            value={enfant.renonciationPortee}
            onSelect={(portee) =>
              onChange({ ...enfant, renonciationPortee: portee as RenonciationPortee })
            }
          />
        ) : null}
      </div>
    </RelatedCardShell>
  );
}

// --- Carte proche --------------------------------------------------------

/** Contrôle de rattachement contextuel (enfant rattaché / Client-Conjoint / branche), sur sa propre ligne. */
function ProcheAttachmentControl({
  proche,
  enfants,
  onChange,
}: {
  proche: ProcheInfo;
  enfants: EnfantInfo[];
  onChange: (proche: ProcheInfo) => void;
}): ReactNode {
  const { lienControl } = procheLayout(proche.lienParente);
  if (lienControl === 'none') return null;
  if (lienControl === 'enfants') {
    const options = declaredChildOptions(enfants);
    if (options.length === 0) {
      return (
        <div className="audit-related-card__lien-hint">
          <span className="audit-related-card__lien-hint-label">Enfant rattaché</span>
          <p>Ajoutez d’abord un enfant</p>
        </div>
      );
    }
    return (
      <SelectField
        label="Enfant rattaché"
        value={proche.parentEnfantId ?? ''}
        options={[{ value: '', label: 'À rattacher' }, ...options]}
        onChange={(parentEnfantId) =>
          onChange({ ...proche, parentEnfantId: parentEnfantId || undefined })
        }
      />
    );
  }
  if (lienControl === 'branche') {
    return (
      <SelectField
        label="Rattachement"
        value={proche.rattachementBranche ?? ''}
        options={[{ value: '', label: 'Non renseigné' }, ...BRANCHE_OPTIONS]}
        onChange={(value) =>
          onChange({
            ...proche,
            rattachementBranche: (value || undefined) as ProcheInfo['rattachementBranche'],
          })
        }
      />
    );
  }
  return (
    <SelectField
      label="Rattachement"
      value={proche.rattachement ?? ''}
      options={[{ value: '', label: 'Non renseigné' }, ...RATTACHEMENT_OPTIONS]}
      onChange={(value) =>
        onChange({ ...proche, rattachement: (value || undefined) as ProcheInfo['rattachement'] })
      }
    />
  );
}

export function ProcheCard({
  proche,
  index,
  enfants,
  onChange,
  onRemove,
}: {
  proche: ProcheInfo;
  index: number;
  enfants: EnfantInfo[];
  onChange: (proche: ProcheInfo) => void;
  onRemove: () => void;
}): ReactElement {
  const layout = procheLayout(proche.lienParente);
  const deceased = Boolean(proche.decede);
  const attachment = (
    <ProcheAttachmentControl proche={proche} enfants={enfants} onChange={onChange} />
  );

  return (
    <RelatedCardShell
      deceased={deceased}
      header={
        <CardHeader
          avatar={
            <AuditAvatarAppearancePicker
              label={`Apparence proche ${index + 1}`}
              kind={proche.avatarKind ?? defaultProcheAvatarKind(proche.lienParente, index)}
              subject={layout.avatarSubject}
              appearance={proche.avatarAppearance}
              onChange={({ kind, appearance }) =>
                onChange({ ...proche, avatarKind: kind, avatarAppearance: appearance })
              }
            />
          }
          label={relationLabel(proche.lienParente)}
          deceased={deceased}
          removeLabel={`Retirer ${fullName(proche) || `proche ${index + 1}`}`}
          onRemove={onRemove}
        />
      }
    >
      <IdentityRow
        lienControl={
          <SelectField
            label="Lien de parenté"
            value={proche.lienParente}
            options={PROCHE_LIEN_OPTIONS}
            onChange={(value) => onChange(applyProcheLien(proche, value as ProcheLienNonEnfant))}
          />
        }
        prenom={proche.prenom}
        nom={proche.nom ?? ''}
        dateNaissance={proche.dateNaissance}
        deceased={deceased}
        onPrenom={(prenom) => onChange({ ...proche, prenom })}
        onNom={(nom) => onChange({ ...proche, nom })}
        onDate={(dateNaissance) => onChange({ ...proche, dateNaissance })}
        onDeceased={(next) => onChange({ ...proche, decede: next })}
      />
      {attachment ? <div className="audit-related-card__attachment">{attachment}</div> : null}
      {layout.showFiscal ? (
        <CivilFiscalZone value={proche} onChange={(civil) => onChange({ ...proche, ...civil })} />
      ) : (
        <div className="audit-related-card__light-tags">
          <QualifierTag
            label="En situation de handicap"
            tone="impact"
            active={Boolean(proche.handicap)}
            onToggle={(next) => onChange({ ...proche, handicap: next })}
          />
          {layout.showVivantSousMemeToit ? (
            <QualifierTag
              label="Vivant sous le même toit"
              tone="fiscal"
              active={Boolean(proche.vivantSousMemeToit)}
              onToggle={(next) => onChange({ ...proche, vivantSousMemeToit: next })}
            />
          ) : null}
        </div>
      )}
    </RelatedCardShell>
  );
}
