import type { ReactElement } from 'react';

import type { DonationInfo } from '@/domain/audit/types';
import { SimAmountInputEuro } from '@/components/ui/sim';
import { IconTrash } from '@/icons/ui';

import {
  AuditDrawerFieldGrid,
  DateField,
  DONATION_TYPE_OPTIONS,
  emptyToUndefined,
  SelectField,
  TextField,
} from './auditCockpitShared';

export function FoyerDonationFields({
  donation,
  index,
  onChange,
  onRemove,
}: {
  donation: DonationInfo;
  index: number;
  onChange: (donation: DonationInfo) => void;
  onRemove: () => void;
}): ReactElement {
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
          label="Montant"
          value={donation.montant ?? 0}
          onChange={(montant) => onChange({ ...donation, montant })}
          onEmpty={() => onChange({ ...donation, montant: undefined })}
        />
        <TextField
          label="Bénéficiaire"
          value={donation.beneficiaire}
          onChange={(beneficiaire) => onChange({ ...donation, beneficiaire })}
        />
      </AuditDrawerFieldGrid>
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
