import type { Dispatch, SetStateAction } from 'react';
import { SimModalShell } from '@/components/ui/sim';
import type { FamilyBranch, FamilyMemberType, SuccessionEnfant } from '../successionDraft';
import { getEnfantParentLabel } from '../successionEnfants';
import {
  MEMBER_TYPE_NEEDS_BRANCH,
  MEMBER_TYPE_OPTIONS,
} from '../successionSimulator.constants';
import type { AddFamilyMemberFormState } from '../successionSimulator.helpers';
import { ScSelect } from './ScSelect';

interface AddFamilyMemberModalProps {
  form: AddFamilyMemberFormState;
  setForm: Dispatch<SetStateAction<AddFamilyMemberFormState>>;
  branchOptions: { value: FamilyBranch; label: string }[];
  enfantsContext: SuccessionEnfant[];
  onClose: () => void;
  onValidate: () => void;
}

export default function AddFamilyMemberModal({
  form,
  setForm,
  branchOptions,
  enfantsContext,
  onClose,
  onValidate,
}: AddFamilyMemberModalProps) {
  return (
    <SimModalShell
      title="Ajouter un membre"
      onClose={onClose}
      closeLabel="Fermer"
      overlayClassName="sc-member-modal-overlay"
      modalClassName="sc-member-modal sc-member-modal--family"
      headerClassName="sc-member-modal__header"
      titleClassName="sc-member-modal__title"
      bodyClassName="sc-member-modal__body"
      footerClassName="sc-member-modal__footer"
      closeClassName="sc-member-modal__close"
      footer={(
        <>
          <button
            type="button"
            className="sc-member-modal__btn sc-member-modal__btn--secondary"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="button"
            className="sc-member-modal__btn sc-member-modal__btn--primary"
            onClick={onValidate}
            disabled={
              !form.type
              || (MEMBER_TYPE_NEEDS_BRANCH.includes(form.type as FamilyMemberType) && !form.branch)
              || (form.type === 'petit_enfant' && !form.parentEnfantId)
            }
          >
            Ajouter
          </button>
        </>
      )}
    >
      <div className="sc-field">
        <label>Type de membre</label>
        <ScSelect
          value={form.type}
          onChange={(value) => setForm((prev) => ({
            ...prev,
            type: value as FamilyMemberType,
            branch: '',
            parentEnfantId: '',
          }))}
          options={[{ value: '', label: 'Choisir…', disabled: true }, ...MEMBER_TYPE_OPTIONS]}
        />
      </div>
      {MEMBER_TYPE_NEEDS_BRANCH.includes(form.type as FamilyMemberType) && (
        <div className="sc-field">
          <label>Branche familiale</label>
          <ScSelect
            value={form.branch}
            onChange={(value) => setForm((prev) => ({ ...prev, branch: value as FamilyBranch }))}
            options={[{ value: '', label: 'Choisir…', disabled: true }, ...branchOptions]}
          />
        </div>
      )}
      {form.type === 'petit_enfant' && (
        <div className="sc-field">
          <label>Enfant parent</label>
          <ScSelect
            value={form.parentEnfantId}
            onChange={(value) => setForm((prev) => ({ ...prev, parentEnfantId: value }))}
            options={[
              { value: '', label: 'Choisir…', disabled: true },
              ...enfantsContext.map((enfant, index) => ({
                value: enfant.id,
                label: getEnfantParentLabel(enfant, index),
              })),
            ]}
          />
        </div>
      )}
    </SimModalShell>
  );
}
