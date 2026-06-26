import type { ReactElement } from 'react';

import type { AuditPersonRef, DonationInfo } from '@/domain/audit/types';
import { SimAmountInputEuro } from '@/components/ui/sim';
import { IconTrash } from '@/icons/ui';

import { TagRow, TagToggle } from './auditDrawerControls';
import {
  AuditDrawerFieldGrid,
  DateField,
  DONATION_TYPE_OPTIONS,
  emptyToUndefined,
  SelectField,
  TextField,
} from './auditCockpitShared';
import {
  labelForAuditPersonRef,
  type AuditTransmissionPersonOptions,
} from './transmissionPersonOptions';

const DONATION_QUALIFICATION_OPTIONS = [
  { value: 'rapportable', label: 'Avance de part successorale' },
  { value: 'hors_part', label: 'Hors part successorale' },
];

export function FoyerDonationFields({
  donation,
  index,
  personOptions,
  onChange,
  onRemove,
}: {
  donation: DonationInfo;
  index: number;
  personOptions: AuditTransmissionPersonOptions;
  onChange: (donation: DonationInfo) => void;
  onRemove: () => void;
}): ReactElement {
  const donorOptions = withEmptyOption(personOptions.donateurs, 'Donateur à préciser');
  const doneeOptions = withEmptyOption(personOptions.donataires, 'Donataire à préciser');
  const usufruitSuccessifOptions = withEmptyOption(
    personOptions.donateurs.filter((option) => option.value !== donation.donateur),
    'Bénéficiaire à préciser',
  );
  const legacyBeneficiaire =
    !donation.donataire && donation.beneficiaire.trim() ? donation.beneficiaire.trim() : '';

  return (
    <article className="audit-donation-card">
      <header className="audit-donation-card__head">
        <span className="audit-donation-card__title">Donation {index + 1}</span>
        <button type="button" className="audit-drawer-remove" onClick={onRemove}>
          <IconTrash />
          <span>Retirer</span>
        </button>
      </header>
      <AuditDrawerFieldGrid columns={4}>
        <SelectField
          label="Type"
          value={donation.type}
          options={DONATION_TYPE_OPTIONS}
          onChange={(type) => onChange({ ...donation, type: type as DonationInfo['type'] })}
        />
        <DateField
          label="Date"
          value={donation.date}
          onChange={(date) => onChange({ ...donation, date })}
        />
        <SimAmountInputEuro
          label="Valeur à la donation"
          value={donation.montant ?? 0}
          onChange={(montant) => onChange({ ...donation, montant })}
          onEmpty={() => onChange({ ...donation, montant: undefined })}
        />
        <SelectField
          label="Donataire"
          value={donation.donataire ?? ''}
          options={doneeOptions}
          onChange={(donataire) => {
            const value = emptyToUndefined(donataire) as AuditPersonRef | undefined;
            onChange({
              ...donation,
              donataire: value,
              beneficiaire: labelForAuditPersonRef(personOptions.donataires, value),
            });
          }}
        />
      </AuditDrawerFieldGrid>
      {legacyBeneficiaire ? (
        <p className="audit-donation-card__legacy">
          Bénéficiaire historique à relier : {legacyBeneficiaire}
        </p>
      ) : null}
      <details className="audit-disclosure">
        <summary>Détails</summary>
        <div className="audit-disclosure__body">
          <AuditDrawerFieldGrid columns={3}>
            <SelectField
              label="Donateur"
              value={donation.donateur ?? ''}
              options={donorOptions}
              onChange={(donateur) =>
                onChange({
                  ...donation,
                  donateur: emptyToUndefined(donateur) as AuditPersonRef | undefined,
                })
              }
            />
            <SelectField
              label="Qualification"
              value={donation.qualificationRapport ?? 'rapportable'}
              options={DONATION_QUALIFICATION_OPTIONS}
              onChange={(qualificationRapport) =>
                onChange({
                  ...donation,
                  qualificationRapport:
                    qualificationRapport as DonationInfo['qualificationRapport'],
                })
              }
            />
            <SimAmountInputEuro
              label="Valeur actuelle"
              value={donation.valeurActuelle ?? 0}
              onChange={(valeurActuelle) => onChange({ ...donation, valeurActuelle })}
              onEmpty={() => onChange({ ...donation, valeurActuelle: undefined })}
            />
          </AuditDrawerFieldGrid>
          <TagRow>
            <TagToggle
              label="Réserve d’usufruit"
              checked={Boolean(donation.avecReserveUsufruit)}
              onChange={(avecReserveUsufruit) =>
                onChange({
                  ...donation,
                  avecReserveUsufruit,
                  usufruitSuccessif: avecReserveUsufruit ? donation.usufruitSuccessif : undefined,
                  usufruitSuccessifBeneficiaire: avecReserveUsufruit
                    ? donation.usufruitSuccessifBeneficiaire
                    : undefined,
                })
              }
            />
            {donation.avecReserveUsufruit ? (
              <TagToggle
                label="Usufruit successif"
                checked={Boolean(donation.usufruitSuccessif)}
                onChange={(usufruitSuccessif) =>
                  onChange({
                    ...donation,
                    usufruitSuccessif,
                    usufruitSuccessifBeneficiaire: usufruitSuccessif
                      ? donation.usufruitSuccessifBeneficiaire
                      : undefined,
                  })
                }
              />
            ) : null}
            <TagToggle
              label="Don 790 G"
              checked={Boolean(donation.donSommeArgentExonere)}
              onChange={(donSommeArgentExonere) => onChange({ ...donation, donSommeArgentExonere })}
            />
          </TagRow>
          {donation.avecReserveUsufruit && donation.usufruitSuccessif ? (
            <AuditDrawerFieldGrid columns={2}>
              <SelectField
                label="Bénéficiaire usufruit successif"
                value={donation.usufruitSuccessifBeneficiaire ?? ''}
                options={usufruitSuccessifOptions}
                onChange={(usufruitSuccessifBeneficiaire) =>
                  onChange({
                    ...donation,
                    usufruitSuccessifBeneficiaire: emptyToUndefined(
                      usufruitSuccessifBeneficiaire,
                    ) as AuditPersonRef | undefined,
                  })
                }
              />
            </AuditDrawerFieldGrid>
          ) : null}
        </div>
      </details>
      <div className="audit-donation-card__description">
        <TextField
          label="Description"
          value={donation.description ?? ''}
          onChange={(description) =>
            onChange({ ...donation, description: emptyToUndefined(description) })
          }
        />
      </div>
    </article>
  );
}

function withEmptyOption(
  options: Array<{ value: AuditPersonRef; label: string }>,
  label: string,
): Array<{ value: string; label: string }> {
  return [{ value: '', label }, ...options.map((option) => ({ ...option, value: option.value }))];
}
