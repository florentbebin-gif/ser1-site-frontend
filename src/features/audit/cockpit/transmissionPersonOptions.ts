import type {
  AuditAvatarAppearance,
  AuditAvatarKind,
  AuditPersonRef,
  PersonInfo,
  SituationFamiliale,
} from '@/domain/audit/types';
import type { SimSelectOption } from '@/components/ui/sim';

import { fullName } from './auditCockpitShared';
import { relationLabel } from './filiationConfig';

export interface AuditPersonOption extends SimSelectOption {
  value: AuditPersonRef;
  kind: AuditAvatarKind;
  appearance?: AuditAvatarAppearance;
  detail: string;
}

export interface AuditTransmissionPersonOptions {
  all: AuditPersonOption[];
  donateurs: AuditPersonOption[];
  donataires: AuditPersonOption[];
  hasUnreferencableRelatives: boolean;
}

export function buildAuditPersonOptions(
  situationFamiliale: SituationFamiliale,
): AuditTransmissionPersonOptions {
  const principal = buildAdultOption(
    'client',
    situationFamiliale.mr,
    'Client principal',
    'Client principal',
    'homme',
  );
  const conjoint = situationFamiliale.mme
    ? buildAdultOption('conjoint', situationFamiliale.mme, 'Conjoint', 'Conjoint', 'femme')
    : null;
  let hasUnreferencableRelatives = false;

  const enfants = situationFamiliale.enfants.flatMap<AuditPersonOption>((enfant, index) => {
    if (!enfant.id) {
      hasUnreferencableRelatives = true;
      return [];
    }
    return [
      {
        value: `enfant:${enfant.id}`,
        label: [enfant.prenom, enfant.nom].filter(Boolean).join(' ') || `Enfant ${index + 1}`,
        kind: enfant.avatarKind ?? guessChildAvatarKind(enfant.civilite),
        appearance: enfant.avatarAppearance,
        detail: enfant.estCommun ? 'Enfant commun' : 'Enfant d’une union précédente',
      },
    ];
  });

  const proches = (situationFamiliale.proches ?? []).map<AuditPersonOption>((proche, index) => ({
    value: `proche:${proche.id}`,
    label: [proche.prenom, proche.nom].filter(Boolean).join(' ') || `Proche ${index + 1}`,
    kind: proche.avatarKind ?? 'homme',
    appearance: proche.avatarAppearance,
    detail: relationLabel(proche.lienParente),
  }));

  const all = [principal, conjoint, ...enfants, ...proches].filter(
    (option): option is AuditPersonOption => option !== null,
  );

  return {
    all,
    donateurs: [principal, conjoint].filter(
      (option): option is AuditPersonOption => option !== null,
    ),
    donataires: all,
    hasUnreferencableRelatives,
  };
}

export function labelForAuditPersonRef(
  options: AuditPersonOption[],
  value: AuditPersonRef | undefined,
  fallback?: string,
): string {
  if (!value) return fallback?.trim() || '';
  return options.find((option) => option.value === value)?.label ?? fallback?.trim() ?? value;
}

function buildAdultOption(
  value: 'client' | 'conjoint',
  person: PersonInfo,
  fallbackLabel: string,
  detail: string,
  fallbackKind: AuditAvatarKind,
): AuditPersonOption {
  return {
    value,
    label: fullName(person) || fallbackLabel,
    kind: person.avatarKind ?? fallbackKind,
    appearance: person.avatarAppearance,
    detail,
  };
}

function guessChildAvatarKind(civilite: PersonInfo['civilite'] | undefined): AuditAvatarKind {
  return civilite === 'madame' ? 'fille' : 'garcon';
}
