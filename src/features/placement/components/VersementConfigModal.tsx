/**
 * VersementConfigModal - Modal de parametrage des versements
 */

import { useEffect, useState } from 'react';
import { ENVELOPE_LABELS } from '@/engine/placement';
import { DEFAULT_ANNUEL, normalizeVersementConfig } from '@/engine/placement/versementConfig';
import type {
  CapitalisationConfig,
  DeductionInitiale,
  DistributionConfig,
  VersementAnnuel,
  VersementConfig,
  VersementConfigInput,
  VersementEntry,
  VersementOption,
  VersementPonctuel,
} from '@/engine/placement/versementConfig';
import {
  VersementAnnualSection,
  VersementInitialSection,
  VersementPonctuelsSection,
} from './VersementConfigModalSections';

interface VersementConfigModalProps {
  envelope: string;
  config?: VersementConfig | VersementConfigInput | null;
  dureeEpargne: number;
  isExpert: boolean;
  onSave: (_config: VersementConfig) => void;
  onClose: () => void;
}

type AnnualOptionName = 'garantieBonneFin' | 'exonerationCotisations';
type AllocationConfig = Pick<VersementEntry, 'pctCapitalisation' | 'pctDistribution'>;

const envelopeLabels = ENVELOPE_LABELS as Record<string, string>;

function hasDistribution(allocation: AllocationConfig) {
  return (allocation.pctDistribution || 0) > 0;
}

function hasCapitalisation(allocation: AllocationConfig) {
  return (allocation.pctCapitalisation || 0) > 0;
}

export function buildNeutralAnnualState(isSCPI: boolean): VersementAnnuel {
  return {
    ...DEFAULT_ANNUEL,
    montant: 0,
    fraisEntree: isSCPI ? 0 : DEFAULT_ANNUEL.fraisEntree,
    pctCapitalisation: isSCPI ? 0 : 100,
    pctDistribution: isSCPI ? 100 : 0,
    garantieBonneFin: {
      ...DEFAULT_ANNUEL.garantieBonneFin,
      active: false,
    },
    exonerationCotisations: {
      ...DEFAULT_ANNUEL.exonerationCotisations,
      active: false,
    },
  };
}

export function seedAnnualSection(annuel: VersementAnnuel, isPER: boolean): boolean {
  return annuel.montant > 0 || (
    isPER
    && (
      Boolean(annuel.garantieBonneFin.active)
      || Boolean(annuel.exonerationCotisations.active)
    )
  );
}

interface VersementSectionVisibilityInput {
  isExpert: boolean;
  isSCPI: boolean;
  initial: AllocationConfig;
  annuel: AllocationConfig;
  hasAnnualSection: boolean;
  distributionStrategy: string;
}

export function computeVersementSectionVisibility({
  isExpert,
  isSCPI,
  initial,
  annuel,
  hasAnnualSection,
  distributionStrategy,
}: VersementSectionVisibilityInput) {
  const annualHasDistribution = hasAnnualSection && hasDistribution(annuel);
  const annualHasCapitalisation = hasAnnualSection && hasCapitalisation(annuel);

  const showCapiBlock = !isSCPI && (
    isExpert
      ? (
        hasCapitalisation(initial)
        || annualHasCapitalisation
        || distributionStrategy === 'reinvestir_capi'
      )
      : true
  );

  const showDistribBlock = isExpert
    ? (hasDistribution(initial) || annualHasDistribution)
    : (isSCPI && (hasDistribution(initial) || annualHasDistribution));

  return {
    showCapiBlock,
    showDistribBlock,
  };
}

function LayersIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function VersementConfigModal({
  envelope,
  config,
  dureeEpargne,
  isExpert,
  onSave,
  onClose,
}: VersementConfigModalProps) {
  const [draft, setDraft] = useState<VersementConfig>(() => normalizeVersementConfig(config ?? undefined));
  const [hasAnnualSection, setHasAnnualSection] = useState<boolean>(() => (
    seedAnnualSection(normalizeVersementConfig(config ?? undefined).annuel, envelope === 'PER')
  ));

  const isSCPI = envelope === 'SCPI';
  const isPER = envelope === 'PER';
  const isCTO = envelope === 'CTO';
  const isAV = envelope === 'AV';

  useEffect(() => {
    const normalized = normalizeVersementConfig(config ?? undefined);
    setDraft(normalized);
    setHasAnnualSection(seedAnnualSection(normalized.annuel, envelope === 'PER'));
  }, [config, envelope]);

  useEffect(() => {
    if (!isSCPI) return;
    setDraft((currentDraft) => ({
      ...currentDraft,
      initial: { ...currentDraft.initial, pctCapitalisation: 0, pctDistribution: 100 },
      annuel: { ...currentDraft.annuel, pctCapitalisation: 0, pctDistribution: 100 },
      ponctuels: (currentDraft.ponctuels || []).map((ponctuel) => ({
        ...ponctuel,
        pctCapitalisation: 0,
        pctDistribution: 100,
      })),
    }));
  }, [isSCPI]);

  const updateInitial = <K extends keyof VersementEntry>(field: K, value: VersementEntry[K]) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      initial: { ...currentDraft.initial, [field]: value },
    }));
  };

  const updateInitialAlloc = (capi: number, distrib: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      initial: {
        ...currentDraft.initial,
        pctCapitalisation: capi,
        pctDistribution: distrib,
      },
    }));
  };

  const updateAnnuel = <K extends keyof VersementAnnuel>(field: K, value: VersementAnnuel[K]) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      annuel: { ...currentDraft.annuel, [field]: value },
    }));
  };

  const updateAnnuelAlloc = (capi: number, distrib: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      annuel: {
        ...currentDraft.annuel,
        pctCapitalisation: capi,
        pctDistribution: distrib,
      },
    }));
  };

  const updateAnnuelOption = <K extends keyof VersementOption>(
    optionName: AnnualOptionName,
    field: K,
    value: VersementOption[K],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      annuel: {
        ...currentDraft.annuel,
        [optionName]: { ...currentDraft.annuel[optionName], [field]: value },
      },
    }));
  };

  const updateCapitalisation = <K extends keyof CapitalisationConfig>(
    field: K,
    value: CapitalisationConfig[K],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      capitalisation: { ...currentDraft.capitalisation, [field]: value },
    }));
  };

  const updateDistribution = <K extends keyof DistributionConfig>(
    field: K,
    value: DistributionConfig[K],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      distribution: { ...currentDraft.distribution, [field]: value },
    }));
  };

  const updateDeductionInitiale = (val: DeductionInitiale) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      deductionInitiale: val,
    }));
  };

  const addPonctuel = () => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ponctuels: [
        ...currentDraft.ponctuels,
        {
          annee: Math.min(5, dureeEpargne),
          montant: 0,
          fraisEntree: currentDraft.initial.fraisEntree,
          pctCapitalisation: isSCPI ? 0 : currentDraft.initial.pctCapitalisation,
          pctDistribution: isSCPI ? 100 : currentDraft.initial.pctDistribution,
        },
      ],
    }));
  };

  const updatePonctuel = <K extends keyof VersementPonctuel>(
    index: number,
    field: K,
    value: VersementPonctuel[K],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ponctuels: currentDraft.ponctuels.map((ponctuel, ponctuelIndex) => (
        ponctuelIndex === index ? { ...ponctuel, [field]: value } : ponctuel
      )),
    }));
  };

  const updatePonctuelAlloc = (index: number, capi: number, distrib: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ponctuels: currentDraft.ponctuels.map((ponctuel, ponctuelIndex) => (
        ponctuelIndex === index
          ? { ...ponctuel, pctCapitalisation: capi, pctDistribution: distrib }
          : ponctuel
      )),
    }));
  };

  const removePonctuel = (index: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ponctuels: currentDraft.ponctuels.filter((_, ponctuelIndex) => ponctuelIndex !== index),
    }));
  };

  const resetAnnualState = () => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      annuel: buildNeutralAnnualState(isSCPI),
    }));
  };

  const addAnnual = () => {
    setHasAnnualSection(true);
  };

  const removeAnnual = () => {
    setHasAnnualSection(false);
    resetAnnualState();
  };

  const { showCapiBlock, showDistribBlock } = computeVersementSectionVisibility({
    isExpert,
    isSCPI,
    initial: draft.initial,
    annuel: draft.annuel,
    hasAnnualSection,
    distributionStrategy: draft.distribution.strategie,
  });

  const configToSave: VersementConfig = {
    ...draft,
    annuel: hasAnnualSection ? draft.annuel : buildNeutralAnnualState(isSCPI),
  };

  return (
    <div className="vcm-overlay sim-modal-overlay">
      <div
        className="vcm sim-modal"
        data-testid="placement-versements-modal"
      >
        <div className="vcm__header sim-modal__header">
          <div className="vcm__header-content sim-modal__header-content">
            <div className="vcm__icon sim-modal__icon" aria-hidden="true">
              <LayersIcon />
            </div>
            <div>
              <h2 className="vcm__title sim-modal__title">Parametrage des versements</h2>
              <p className="vcm__subtitle sim-modal__subtitle">{envelopeLabels[envelope]}</p>
            </div>
          </div>

          <button
            type="button"
            className="vcm__close sim-modal__close"
            onClick={onClose}
            aria-label="Fermer la modale"
            data-testid="placement-versements-close"
          >
            <XIcon />
          </button>
        </div>

        <div className="vcm__body sim-modal__body">
          {isAV ? (
            <div className="vcm__hint vcm__hint--spaced">
              Hypothese : investissement 100 % unites de compte - prelevements sociaux dus au rachat.
            </div>
          ) : null}

          <VersementInitialSection
            initial={draft.initial}
            capitalisation={draft.capitalisation}
            distribution={draft.distribution}
            isSCPI={isSCPI}
            isCTO={isCTO}
            isPER={isPER}
            isExpert={isExpert}
            showCapiBlock={showCapiBlock}
            showDistribBlock={showDistribBlock}
            onUpdateInitial={updateInitial}
            onUpdateInitialAlloc={updateInitialAlloc}
            onUpdateCapitalisation={updateCapitalisation}
            onUpdateDistribution={updateDistribution}
            deductionInitiale={draft.deductionInitiale}
            onUpdateDeductionInitiale={updateDeductionInitiale}
          />

          <VersementAnnualSection
            active={hasAnnualSection}
            annuel={draft.annuel}
            isPER={isPER}
            isSCPI={isSCPI}
            isExpert={isExpert}
            onAddAnnual={addAnnual}
            onRemoveAnnual={removeAnnual}
            onUpdateAnnuel={updateAnnuel}
            onUpdateAnnuelAlloc={updateAnnuelAlloc}
            onUpdateAnnuelOption={updateAnnuelOption}
          />

          {isExpert && (
            <VersementPonctuelsSection
              ponctuels={draft.ponctuels}
              dureeEpargne={dureeEpargne}
              isSCPI={isSCPI}
              onAddPonctuel={addPonctuel}
              onUpdatePonctuel={updatePonctuel}
              onUpdatePonctuelAlloc={updatePonctuelAlloc}
              onRemovePonctuel={removePonctuel}
              RemoveIcon={XIcon}
            />
          )}
        </div>

        <div className="vcm__footer sim-modal__footer">
          <button type="button" className="vcm__btn vcm__btn--secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="vcm__btn vcm__btn--primary"
            onClick={() => onSave(isExpert ? configToSave : { ...configToSave, ponctuels: [] })}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
