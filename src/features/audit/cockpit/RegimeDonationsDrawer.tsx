import { useEffect, useMemo, useState, type ReactElement } from 'react';

import {
  type AvantageMatrimonial,
  type DdvOption,
  type DossierAudit,
  type SituationCivile,
  type SituationFamiliale,
} from '@/domain/audit/types';
import { REGIMES_MATRIMONIAUX } from '@/engine/succession/civil';
import { IconPlus } from '@/icons/ui';

import { FoyerAvatarBadge } from '../components/FoyerAvatarBadge';
import { AuditDrawerXL } from '../components/AuditDrawerXL';
import { ChipMultiSelect, TagToggle } from './auditDrawerControls';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  createDonation,
  DrawerFooter,
  emptyToUndefined,
  fullName,
  REGIME_OPTIONS,
  SelectField,
  updateAt,
} from './auditCockpitShared';
import { FoyerDonationFields } from './FoyerDonationFields';
import { TestamentSection } from './TestamentSection';
import { buildAuditPersonOptions } from './transmissionPersonOptions';

const MARRIAGE_STATUS: SituationFamiliale['situationMatrimoniale'] = 'marie';
const COUPLE_STATUSES = new Set<SituationFamiliale['situationMatrimoniale']>([
  'marie',
  'pacse',
  'concubinage',
]);

const DDV_OPTIONS = [
  { value: 'usufruit_total', label: 'Totalité en usufruit' },
  { value: 'pleine_propriete_quotite', label: 'Quotité disponible en pleine propriété' },
  { value: 'mixte', label: 'Mixte 1/4 PP + 3/4 US' },
  { value: 'pleine_propriete_totale', label: 'Totalité en pleine propriété' },
] satisfies Array<{ value: DdvOption; label: string }>;

const AVANTAGE_OPTIONS = [
  { value: 'partage_inegal', label: 'Clause de partage inégal' },
  { value: 'attribution_integrale', label: 'Attribution intégrale des biens communs' },
  { value: 'preciput', label: 'Clause de préciput' },
] satisfies Array<{ value: AvantageMatrimonial; label: string }>;

export function RegimeDonationsDrawer({
  open,
  dossier,
  onClose,
  onSave,
}: {
  open: boolean;
  dossier: DossierAudit;
  onClose: () => void;
  onSave: (situationCivile: SituationCivile) => void;
}): ReactElement {
  const [form, setForm] = useState(dossier.situationCivile);
  useEffect(() => {
    if (open) setForm(dossier.situationCivile);
  }, [dossier.situationCivile, open]);
  const isMarried = dossier.situationFamiliale.situationMatrimoniale === MARRIAGE_STATUS;
  const hasCouplePerson =
    COUPLE_STATUSES.has(dossier.situationFamiliale.situationMatrimoniale) &&
    Boolean(dossier.situationFamiliale.mme);
  const personOptions = useMemo(
    () => buildAuditPersonOptions(dossier.situationFamiliale),
    [dossier.situationFamiliale],
  );

  return (
    <AuditDrawerXL
      open={open}
      title="Libéralités & transmission"
      subtitle="Régime, donations et testaments."
      onClose={onClose}
      footer={
        <DrawerFooter
          onCancel={onClose}
          onSave={() => onSave(sanitizeHiddenCivilFields(form, dossier.situationFamiliale))}
        />
      }
    >
      <div className="audit-drawer-form">
        {isMarried ? <RegimeMatrimonialSection form={form} onChange={setForm} /> : null}
        {isMarried ? (
          <ProtectionConjointPanel
            form={form}
            situationFamiliale={dossier.situationFamiliale}
            onChange={setForm}
          />
        ) : null}
        <TestamentSection
          form={form}
          situationFamiliale={dossier.situationFamiliale}
          personOptions={personOptions}
          includeConjoint={hasCouplePerson}
          onChange={setForm}
          first={!isMarried}
        />
        {personOptions.hasUnreferencableRelatives ? (
          <p className="audit-drawer-hint">
            Certaines personnes doivent être complétées dans Filiation &amp; proches avant d’être
            reliées à une libéralité.
          </p>
        ) : null}
        <button
          type="button"
          className="audit-drawer-add"
          onClick={() =>
            setForm((previous) => ({
              ...previous,
              donations: [...previous.donations, createDonation()],
            }))
          }
        >
          <IconPlus />
          <span>Ajouter une donation</span>
        </button>
        {form.donations.length > 0 ? (
          <div className="audit-donation-timeline" aria-label="Chronologie des libéralités">
            {form.donations.map((donation, index) => (
              <div className="audit-donation-timeline__item" key={donation.id}>
                <span className="audit-donation-timeline__marker" aria-hidden="true" />
                <FoyerDonationFields
                  donation={donation}
                  index={index}
                  onChange={(nextDonation) =>
                    setForm((previous) => ({
                      ...previous,
                      donations: updateAt(previous.donations, index, nextDonation),
                    }))
                  }
                  personOptions={personOptions}
                  onRemove={() =>
                    setForm((previous) => ({
                      ...previous,
                      donations: previous.donations.filter((item) => item.id !== donation.id),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AuditDrawerXL>
  );
}

function RegimeMatrimonialSection({
  form,
  onChange,
}: {
  form: SituationCivile;
  onChange: (updater: (previous: SituationCivile) => SituationCivile) => void;
}): ReactElement {
  return (
    <AuditDrawerSection
      title="Régime matrimonial"
      description="Sélectionnez le régime applicable au mariage."
      first
    >
      <div className="audit-regime-panel">
        <AuditDrawerFieldGrid>
          <SelectField
            label="Régime applicable"
            value={form.regimeMatrimonial ?? ''}
            options={REGIME_OPTIONS}
            onChange={(value) =>
              onChange((previous) => ({
                ...previous,
                regimeMatrimonial: emptyToUndefined(value) as SituationCivile['regimeMatrimonial'],
              }))
            }
          />
        </AuditDrawerFieldGrid>
        <RegimeIllustration />
      </div>
    </AuditDrawerSection>
  );
}

function RegimeIllustration(): ReactElement {
  return (
    <svg
      className="audit-regime-panel__illustration"
      viewBox="0 0 150 94"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M33 33 H117 V75 H33 Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M45 33 V24 H105 V33"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54 48 H96 M54 60 H86"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="47" cy="20" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="103" cy="20" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M66 78 C72 84 82 84 88 78"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M25 80 C35 87 50 88 61 82 M91 82 C103 89 119 88 128 80"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProtectionConjointPanel({
  form,
  situationFamiliale,
  onChange,
}: {
  form: SituationCivile;
  situationFamiliale: SituationFamiliale;
  onChange: (updater: (previous: SituationCivile) => SituationCivile) => void;
}): ReactElement {
  const eligibleAvantages = getEligibleAvantages(form.regimeMatrimonial);
  const principalName = fullName(situationFamiliale.mr) || 'Client principal';
  const conjointName = situationFamiliale.mme
    ? fullName(situationFamiliale.mme) || 'Conjoint'
    : 'Conjoint';

  return (
    <AuditDrawerSection
      title="Protection du conjoint survivant"
      description="Protections civiles déclaratives, sans liquidation successorale dans l’audit."
    >
      <div className="audit-optimisation-grid">
        <DdvConfigurator
          title={principalName}
          fallbackTitle="Client principal"
          kind={situationFamiliale.mr.avatarKind ?? 'homme'}
          appearance={situationFamiliale.mr.avatarAppearance}
          checked={Boolean(form.donationDernierVivantMr)}
          value={form.ddvOptionMr}
          onToggle={(donationDernierVivantMr) =>
            onChange((previous) => ({
              ...previous,
              donationDernierVivantMr,
              ddvOptionMr: donationDernierVivantMr
                ? (previous.ddvOptionMr ?? 'usufruit_total')
                : undefined,
            }))
          }
          onSelect={(ddvOptionMr) => onChange((previous) => ({ ...previous, ddvOptionMr }))}
        />
        <DdvConfigurator
          title={conjointName}
          fallbackTitle="Conjoint"
          kind={situationFamiliale.mme?.avatarKind ?? 'femme'}
          appearance={situationFamiliale.mme?.avatarAppearance}
          checked={Boolean(form.donationDernierVivantMme)}
          value={form.ddvOptionMme}
          onToggle={(donationDernierVivantMme) =>
            onChange((previous) => ({
              ...previous,
              donationDernierVivantMme,
              ddvOptionMme: donationDernierVivantMme
                ? (previous.ddvOptionMme ?? 'usufruit_total')
                : undefined,
            }))
          }
          onSelect={(ddvOptionMme) => onChange((previous) => ({ ...previous, ddvOptionMme }))}
        />
      </div>
      {eligibleAvantages.length > 0 ? (
        <ChipMultiSelect
          label="Avantages matrimoniaux"
          options={eligibleAvantages}
          values={(form.avantagesMatrimoniaux ?? []).filter((value) =>
            eligibleAvantages.some((option) => option.value === value),
          )}
          onChange={(avantagesMatrimoniaux) =>
            onChange((previous) => ({ ...previous, avantagesMatrimoniaux }))
          }
        />
      ) : null}
    </AuditDrawerSection>
  );
}

function DdvConfigurator({
  title,
  fallbackTitle,
  kind,
  appearance,
  checked,
  value,
  onToggle,
  onSelect,
}: {
  title: string;
  fallbackTitle: string;
  kind: Parameters<typeof FoyerAvatarBadge>[0]['kind'];
  appearance: Parameters<typeof FoyerAvatarBadge>[0]['appearance'];
  checked: boolean;
  value: DdvOption | undefined;
  onToggle: (checked: boolean) => void;
  onSelect: (value: DdvOption) => void;
}): ReactElement {
  return (
    <section className="audit-ddv-card" aria-label={title}>
      <div className="audit-ddv-card__head">
        <span className="audit-ddv-card__identity">
          <FoyerAvatarBadge label={title} kind={kind} appearance={appearance} />
          <span>
            <span className="audit-ddv-card__title">{title}</span>
            <span className="audit-ddv-card__subtitle">{fallbackTitle}</span>
          </span>
        </span>
        <TagToggle label="Présence d’une DDV" checked={checked} onChange={onToggle} />
      </div>
      {checked ? (
        <div className="audit-ddv-radio-list" role="radiogroup" aria-label={`Option DDV ${title}`}>
          {DDV_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (
              <button
                type="button"
                key={option.value}
                className="audit-ddv-radio"
                role="radio"
                aria-checked={selected}
                data-selected={selected ? 'true' : undefined}
                onClick={() => onSelect(option.value)}
              >
                <span aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="audit-ddv-card__empty">Aucune donation entre époux renseignée.</p>
      )}
    </section>
  );
}

function getEligibleAvantages(
  regimeMatrimonial: SituationCivile['regimeMatrimonial'],
): typeof AVANTAGE_OPTIONS {
  if (!regimeMatrimonial) return [];
  const regime = REGIMES_MATRIMONIAUX[regimeMatrimonial];
  if (regime.category === 'communautaire') return AVANTAGE_OPTIONS;
  if (regimeMatrimonial === 'separation_biens_societe_acquets') {
    return AVANTAGE_OPTIONS.filter((option) => option.value === 'preciput');
  }
  return [];
}

function sanitizeHiddenCivilFields(
  form: SituationCivile,
  situationFamiliale: SituationFamiliale,
): SituationCivile {
  if (situationFamiliale.situationMatrimoniale !== MARRIAGE_STATUS) {
    return {
      ...form,
      regimeMatrimonial: undefined,
      donationDernierVivantMr: undefined,
      donationDernierVivantMme: undefined,
      ddvOptionMr: undefined,
      ddvOptionMme: undefined,
      avantagesMatrimoniaux: undefined,
    };
  }

  const eligibleAvantages = getEligibleAvantages(form.regimeMatrimonial);
  return {
    ...form,
    avantagesMatrimoniaux: form.avantagesMatrimoniaux?.filter((value) =>
      eligibleAvantages.some((option) => option.value === value),
    ),
  };
}
