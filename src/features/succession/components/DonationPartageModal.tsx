import { useMemo } from 'react';
import {
  SimActionButton,
  SimAmountInputEuro,
  SimModalShell,
  SimTemporalField,
} from '@/components/ui/sim';
import type {
  SituationMatrimoniale,
  SuccessionDonationPartageAct,
  SuccessionDonationPartageLot,
  SuccessionDonationPartageSoulte,
  SuccessionEnfant,
  SuccessionPrimarySide,
} from '../successionDraft';
import { createDonationPartageSoulteId, fmt } from '../successionSimulator.helpers';
import { validateDonationPartageAct } from '../successionDonationPartage';
import { ScSelect } from './ScSelect';

interface DonationPartageModalProps {
  draft: SuccessionDonationPartageAct;
  enfantsContext: SuccessionEnfant[];
  situationMatrimoniale: SituationMatrimoniale;
  onChange: (_draft: SuccessionDonationPartageAct) => void;
  onClose: () => void;
  onValidate: () => void;
  onDelete?: () => void;
}

function personLabel(side: SuccessionPrimarySide, situation: SituationMatrimoniale): string {
  if (situation === 'pacse') return side === 'epoux1' ? 'Partenaire 1' : 'Partenaire 2';
  if (situation === 'concubinage') return side === 'epoux1' ? 'Personne 1' : 'Personne 2';
  return side === 'epoux1' ? 'Époux 1' : 'Époux 2';
}

function otherSide(side: SuccessionPrimarySide): SuccessionPrimarySide {
  return side === 'epoux1' ? 'epoux2' : 'epoux1';
}

function livingChildren(enfants: SuccessionEnfant[]): SuccessionEnfant[] {
  return enfants.filter((enfant) => !enfant.deceased);
}

function childLabel(enfant: SuccessionEnfant, index: number): string {
  return enfant.prenom?.trim() || `Enfant ${index + 1}`;
}

export default function DonationPartageModal({
  draft,
  enfantsContext,
  situationMatrimoniale,
  onChange,
  onClose,
  onValidate,
  onDelete,
}: DonationPartageModalProps) {
  const enfantsVivants = useMemo(() => livingChildren(enfantsContext), [enfantsContext]);
  const childOptions = useMemo(
    () =>
      enfantsVivants.map((enfant, index) => ({
        value: enfant.id,
        label: childLabel(enfant, index),
      })),
    [enfantsVivants],
  );
  const errors = useMemo(
    () => validateDonationPartageAct(draft, enfantsContext),
    [draft, enfantsContext],
  );
  const totalLots = draft.lots
    .filter((lot) => lot.accepted)
    .reduce((sum, lot) => sum + Math.max(0, lot.valeur), 0);
  const totalSoultes = draft.soultes.reduce((sum, soulte) => sum + Math.max(0, soulte.montant), 0);
  const canUseUsufruitSuccessif =
    draft.avecReserveUsufruit &&
    Boolean(draft.donateur) &&
    (situationMatrimoniale === 'marie' || situationMatrimoniale === 'pacse');
  const beneficiaryOptions = draft.donateur
    ? [
        {
          value: otherSide(draft.donateur),
          label: personLabel(otherSide(draft.donateur), situationMatrimoniale),
        },
      ]
    : [];

  const updateAct = <K extends keyof SuccessionDonationPartageAct>(
    field: K,
    value: SuccessionDonationPartageAct[K],
  ) => {
    if (field === 'avecReserveUsufruit' && !value) {
      onChange({
        ...draft,
        avecReserveUsufruit: false,
        usufruitSuccessif: false,
        usufruitSuccessifBeneficiaire: undefined,
      });
      return;
    }
    if (field === 'usufruitSuccessif') {
      const enabled = Boolean(value) && canUseUsufruitSuccessif;
      onChange({
        ...draft,
        usufruitSuccessif: enabled,
        usufruitSuccessifBeneficiaire:
          enabled && draft.donateur ? otherSide(draft.donateur) : undefined,
      });
      return;
    }
    onChange({ ...draft, [field]: value });
  };

  const updateLot = (lotId: string, patch: Partial<SuccessionDonationPartageLot>) => {
    onChange({
      ...draft,
      lots: draft.lots.map((lot) => (lot.id === lotId ? { ...lot, ...patch } : lot)),
    });
  };

  const updateSoulte = (soulteId: string, patch: Partial<SuccessionDonationPartageSoulte>) => {
    onChange({
      ...draft,
      soultes: draft.soultes.map((soulte) =>
        soulte.id === soulteId ? { ...soulte, ...patch } : soulte,
      ),
    });
  };

  const addSoulte = () => {
    if (childOptions.length < 2) return;
    const payeur = childOptions[0];
    const receveur = childOptions[1];
    if (!payeur || !receveur) return;
    onChange({
      ...draft,
      soultes: [
        ...draft.soultes,
        {
          id: createDonationPartageSoulteId(),
          payeurEnfantId: payeur.value,
          receveurEnfantId: receveur.value,
          montant: 0,
        },
      ],
    });
  };

  const removeSoulte = (soulteId: string) => {
    onChange({
      ...draft,
      soultes: draft.soultes.filter((soulte) => soulte.id !== soulteId),
    });
  };

  return (
    <SimModalShell
      title="Donation-partage"
      subtitle="Lots par enfant et soultes entre copartagés"
      modalClassName="sc-donation-partage-modal sim-modal--xl"
      bodyClassName="sc-donation-partage-modal__body"
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onDelete}>
              Supprimer
            </button>
          )}
          <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="sim-modal-btn sim-modal-btn--primary"
            onClick={onValidate}
            disabled={errors.length > 0}
          >
            Enregistrer l’acte
          </button>
        </>
      }
    >
      <div className="sc-donation-partage-grid">
        <div className="sc-field">
          <label htmlFor="sc-donation-partage-date">Date de l’acte</label>
          <SimTemporalField
            id="sc-donation-partage-date"
            granularity="month"
            value={draft.date ?? ''}
            onChange={(next) => updateAct('date', next || undefined)}
          />
        </div>
        <div className="sc-field">
          <label htmlFor="sc-donation-partage-donateur">Donateur</label>
          <ScSelect
            id="sc-donation-partage-donateur"
            value={draft.donateur ?? ''}
            onChange={(value) => {
              const donateur = value as SuccessionPrimarySide;
              onChange({
                ...draft,
                donateur,
                usufruitSuccessifBeneficiaire: draft.usufruitSuccessif
                  ? otherSide(donateur)
                  : undefined,
              });
            }}
            options={[
              { value: 'epoux1', label: personLabel('epoux1', situationMatrimoniale) },
              { value: 'epoux2', label: personLabel('epoux2', situationMatrimoniale) },
            ]}
          />
        </div>
        <div className="sc-field sc-field--full sc-donation-partage-options">
          <label className="sc-checkbox-label">
            <input
              type="checkbox"
              checked={draft.avecReserveUsufruit}
              onChange={(e) => updateAct('avecReserveUsufruit', e.target.checked)}
            />
            Réserve d’usufruit
          </label>
          <label className="sc-checkbox-label">
            <input
              type="checkbox"
              checked={draft.usufruitSuccessif}
              disabled={!canUseUsufruitSuccessif}
              onChange={(e) => updateAct('usufruitSuccessif', e.target.checked)}
            />
            Usufruit successif au conjoint/partenaire
          </label>
          {draft.usufruitSuccessif && (
            <ScSelect
              ariaLabel="Bénéficiaire de l'usufruit successif"
              className="sc-donation-select"
              value={draft.usufruitSuccessifBeneficiaire ?? ''}
              onChange={(value) =>
                updateAct('usufruitSuccessifBeneficiaire', value as SuccessionPrimarySide)
              }
              options={beneficiaryOptions}
            />
          )}
        </div>
      </div>

      <section className="sc-donation-partage-section">
        <div className="sc-donation-partage-section__header">
          <strong>Lots</strong>
          <span>{fmt(totalLots)}</span>
        </div>
        <div className="sc-donation-partage-lots">
          {draft.lots.map((lot, index) => {
            const label =
              childOptions.find((option) => option.value === lot.enfantId)?.label ??
              `Enfant ${index + 1}`;
            return (
              <div key={lot.id} className="sc-donation-partage-lot-row">
                <label className="sc-checkbox-label">
                  <input
                    type="checkbox"
                    checked={lot.accepted}
                    onChange={(e) => updateLot(lot.id, { accepted: e.target.checked })}
                  />
                  {label}
                </label>
                <div className="sc-field">
                  <label htmlFor={`sc-donation-partage-lot-valeur-${lot.id}`}>Valeur acte</label>
                  <SimAmountInputEuro
                    id={`sc-donation-partage-lot-valeur-${lot.id}`}
                    value={lot.valeur}
                    min={0}
                    onChange={(value) => updateLot(lot.id, { valeur: value })}
                  />
                </div>
                <div className="sc-field">
                  <label htmlFor={`sc-donation-partage-lot-valeur-actuelle-${lot.id}`}>
                    Valeur actuelle
                  </label>
                  <SimAmountInputEuro
                    id={`sc-donation-partage-lot-valeur-actuelle-${lot.id}`}
                    value={lot.valeurActuelle ?? 0}
                    min={0}
                    onChange={(value) => updateLot(lot.id, { valeurActuelle: value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sc-donation-partage-section">
        <div className="sc-donation-partage-section__header">
          <strong>Soultes</strong>
          <span>{fmt(totalSoultes)}</span>
        </div>
        <div className="sc-donation-partage-soultes">
          {draft.soultes.map((soulte) => (
            <div key={soulte.id} className="sc-donation-partage-soulte-row">
              <div className="sc-field">
                <label htmlFor={`sc-donation-partage-soulte-payeur-${soulte.id}`}>
                  Enfant payeur
                </label>
                <ScSelect
                  id={`sc-donation-partage-soulte-payeur-${soulte.id}`}
                  className="sc-donation-select"
                  value={soulte.payeurEnfantId}
                  onChange={(value) => updateSoulte(soulte.id, { payeurEnfantId: value })}
                  options={childOptions}
                />
              </div>
              <div className="sc-field">
                <label htmlFor={`sc-donation-partage-soulte-receveur-${soulte.id}`}>
                  Enfant receveur
                </label>
                <ScSelect
                  id={`sc-donation-partage-soulte-receveur-${soulte.id}`}
                  className="sc-donation-select"
                  value={soulte.receveurEnfantId}
                  onChange={(value) => updateSoulte(soulte.id, { receveurEnfantId: value })}
                  options={childOptions}
                />
              </div>
              <div className="sc-field">
                <label htmlFor={`sc-donation-partage-soulte-montant-${soulte.id}`}>Montant</label>
                <SimAmountInputEuro
                  id={`sc-donation-partage-soulte-montant-${soulte.id}`}
                  value={soulte.montant}
                  min={0}
                  onChange={(value) => updateSoulte(soulte.id, { montant: value })}
                />
              </div>
              <SimActionButton
                variant="delete"
                mode="icon"
                label="Supprimer"
                className="sc-remove-btn sc-remove-btn--quiet"
                onClick={() => removeSoulte(soulte.id)}
                ariaLabel="Supprimer cette soulte"
              />
            </div>
          ))}
        </div>
        <SimActionButton
          variant="add"
          mode="text"
          label="Ajouter une soulte"
          className="sc-child-add-btn"
          onClick={addSoulte}
          disabled={childOptions.length < 2}
        />
      </section>

      {errors.length > 0 && (
        <div className="sc-donation-partage-errors">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
    </SimModalShell>
  );
}
