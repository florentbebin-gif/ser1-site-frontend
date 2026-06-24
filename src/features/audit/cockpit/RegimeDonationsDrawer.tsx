import { useEffect, useState, type ReactElement } from 'react';

import {
  type AvantageMatrimonial,
  type DdvOption,
  type DossierAudit,
  type SituationCivile,
  type SituationFamiliale,
} from '@/domain/audit/types';
import { IconPlus } from '@/icons/ui';

import { AuditDrawerXL } from '../components/AuditDrawerXL';
import { ChipMultiSelect, TagRow, TagToggle } from './auditDrawerControls';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  createDonation,
  DateField,
  DrawerFooter,
  emptyToUndefined,
  REGIME_OPTIONS,
  SelectField,
  TextField,
  updateAt,
} from './auditCockpitShared';
import { FoyerDonationFields } from './FoyerDonationFields';

const REGIME_STATUSES: Array<SituationFamiliale['situationMatrimoniale']> = ['marie', 'pacse'];

const DDV_OPTIONS = [
  { value: 'usufruit_total', label: 'Totalité en usufruit' },
  { value: 'quotite_disponible_pp', label: 'Quotité disponible en pleine propriété' },
  { value: 'mixte_quart_pp_trois_quarts_us', label: 'Mixte 1/4 PP + 3/4 US' },
  { value: 'pleine_propriete_totale', label: 'Totalité en pleine propriété' },
] satisfies Array<{ value: DdvOption; label: string }>;

const AVANTAGE_OPTIONS = [
  { value: 'partage_inegal', label: 'Clause de partage inégal' },
  { value: 'attribution_integrale', label: 'Attribution intégrale des biens communs' },
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
  const showRegime = REGIME_STATUSES.includes(dossier.situationFamiliale.situationMatrimoniale);

  return (
    <AuditDrawerXL
      open={open}
      title={showRegime ? 'Régime & libéralités' : 'Libéralités & transmission'}
      subtitle={
        showRegime
          ? 'Régime et libéralités disponibles dans le socle F1.'
          : 'Libéralités consignées hors régime matrimonial.'
      }
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        {showRegime ? <RegimeMatrimonialSection form={form} onChange={setForm} /> : null}
        <OptimisationCivilePanel form={form} onChange={setForm} />
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
    <AuditDrawerSection title="Régime matrimonial">
      <AuditDrawerFieldGrid columns={3}>
        <SelectField
          label="Régime matrimonial"
          value={form.regimeMatrimonial ?? ''}
          options={REGIME_OPTIONS}
          onChange={(value) =>
            onChange((previous) => ({
              ...previous,
              regimeMatrimonial: emptyToUndefined(value) as SituationCivile['regimeMatrimonial'],
            }))
          }
        />
        <DateField
          label="Date d’effet"
          value={form.dateContrat ?? ''}
          onChange={(dateContrat) =>
            onChange((previous) => ({
              ...previous,
              dateContrat: emptyToUndefined(dateContrat),
            }))
          }
        />
        <TextField
          label="Notaire"
          value={form.notaire ?? ''}
          onChange={(notaire) =>
            onChange((previous) => ({ ...previous, notaire: emptyToUndefined(notaire) }))
          }
        />
      </AuditDrawerFieldGrid>
      <TagRow>
        <TagToggle
          label="Contrat de mariage"
          checked={form.contratMariage}
          onChange={(contratMariage) => onChange((previous) => ({ ...previous, contratMariage }))}
        />
      </TagRow>
    </AuditDrawerSection>
  );
}

function OptimisationCivilePanel({
  form,
  onChange,
}: {
  form: SituationCivile;
  onChange: (updater: (previous: SituationCivile) => SituationCivile) => void;
}): ReactElement {
  return (
    <AuditDrawerSection
      title="Optimisation civile"
      description="Configuration déclarative des protections civiles, sans calcul successoral runtime."
    >
      <div className="audit-optimisation-grid">
        <DdvConfigurator
          title="DDV client principal"
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
          title="DDV conjoint"
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
      <ChipMultiSelect
        label="Avantages matrimoniaux"
        options={AVANTAGE_OPTIONS}
        values={form.avantagesMatrimoniaux ?? []}
        onChange={(avantagesMatrimoniaux) =>
          onChange((previous) => ({ ...previous, avantagesMatrimoniaux }))
        }
      />
    </AuditDrawerSection>
  );
}

function DdvConfigurator({
  title,
  checked,
  value,
  onToggle,
  onSelect,
}: {
  title: string;
  checked: boolean;
  value: DdvOption | undefined;
  onToggle: (checked: boolean) => void;
  onSelect: (value: DdvOption) => void;
}): ReactElement {
  return (
    <section className="audit-ddv-card" aria-label={title}>
      <div className="audit-ddv-card__head">
        <span className="audit-ddv-card__title">{title}</span>
        <TagToggle label="Présence d’une DDV" checked={checked} onChange={onToggle} />
      </div>
      {checked ? (
        <div className="audit-ddv-card__options">
          {DDV_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (
              <button
                type="button"
                key={option.value}
                className="audit-ddv-card__option"
                data-selected={selected ? 'true' : undefined}
                aria-pressed={selected}
                onClick={() => onSelect(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
