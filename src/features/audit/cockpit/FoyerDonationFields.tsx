import type { ReactElement } from 'react';

import type { DonationInfo } from '@/domain/audit/types';
import { SimAmountInputEuro } from '@/components/ui/sim';
import { IconTrash } from '@/icons/ui';

import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  DateField,
  DONATION_TYPE_OPTIONS,
  emptyToUndefined,
  SelectField,
  TextAreaField,
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
    <AuditDrawerSection title={`Donation ${index + 1}`}>
      <AuditDrawerFieldGrid>
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
          label="Montant renseigné"
          value={donation.montant ?? 0}
          onChange={(montant) => onChange({ ...donation, montant })}
          onEmpty={() => onChange({ ...donation, montant: undefined })}
        />
        <TextField
          label="Bénéficiaire"
          value={donation.beneficiaire}
          onChange={(beneficiaire) => onChange({ ...donation, beneficiaire })}
        />
        <TextAreaField
          label="Description"
          value={donation.description ?? ''}
          onChange={(description) =>
            onChange({ ...donation, description: emptyToUndefined(description) })
          }
        />
      </AuditDrawerFieldGrid>
      <button type="button" className="audit-drawer-remove" onClick={onRemove}>
        <IconTrash />
        <span>Retirer</span>
      </button>
    </AuditDrawerSection>
  );
}
