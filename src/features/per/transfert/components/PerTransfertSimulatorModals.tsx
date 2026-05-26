import type { Dispatch, SetStateAction } from 'react';
import type { PerTransfertFormState } from '../hooks/usePerTransfertSimulator';
import { PerTransfertCurrentRentModal } from './PerTransfertCurrentRentModal';
import { PerTransfertFraisInfoModal } from './PerTransfertFraisInfoModal';
import { RentRevaluationInfoModal } from './RentRevaluationInfoModal';
import { PerTransfertInfoModal, type PerTransfertInfoKind } from './PerTransfertInfoModal';
import { TransferRulesInfoModal } from './TransferRulesInfoModal';
import { PerTransfertAnnuitySettingsModal } from './PerTransfertAnnuitySettingsModal';
import { PerTransfertPrefonPocketSettingsModal } from './PerTransfertPrefonPocketSettingsModal';

type PerTransfertUpdate = <K extends keyof PerTransfertFormState>(
  _key: K,
  _value: PerTransfertFormState[K],
) => void;

interface PerTransfertSimulatorModalsProps {
  state: PerTransfertFormState;
  update: PerTransfertUpdate;
  rentModalOpen: boolean;
  setRentModalOpen: Dispatch<SetStateAction<boolean>>;
  feesModalOpen: boolean;
  setFeesModalOpen: Dispatch<SetStateAction<boolean>>;
  revaluationModalOpen: boolean;
  setRevaluationModalOpen: Dispatch<SetStateAction<boolean>>;
  annuitySettingsOpen: boolean;
  setAnnuitySettingsOpen: Dispatch<SetStateAction<boolean>>;
  transferRulesOpen: boolean;
  setTransferRulesOpen: Dispatch<SetStateAction<boolean>>;
  infoModal: PerTransfertInfoKind | null;
  setInfoModal: Dispatch<SetStateAction<PerTransfertInfoKind | null>>;
  prefonPocketSettingsIndex: number | null;
  setPrefonPocketSettingsIndex: Dispatch<SetStateAction<number | null>>;
}

export function PerTransfertSimulatorModals({
  state,
  update,
  rentModalOpen,
  setRentModalOpen,
  feesModalOpen,
  setFeesModalOpen,
  revaluationModalOpen,
  setRevaluationModalOpen,
  annuitySettingsOpen,
  setAnnuitySettingsOpen,
  transferRulesOpen,
  setTransferRulesOpen,
  infoModal,
  setInfoModal,
  prefonPocketSettingsIndex,
  setPrefonPocketSettingsIndex,
}: PerTransfertSimulatorModalsProps) {
  return (
    <>
      {rentModalOpen ? (
        <PerTransfertCurrentRentModal
          state={state}
          update={update}
          onClose={() => setRentModalOpen(false)}
        />
      ) : null}
      {feesModalOpen ? (
        <PerTransfertFraisInfoModal onClose={() => setFeesModalOpen(false)} />
      ) : null}
      {revaluationModalOpen ? (
        <RentRevaluationInfoModal onClose={() => setRevaluationModalOpen(false)} />
      ) : null}
      {annuitySettingsOpen ? (
        <PerTransfertAnnuitySettingsModal
          state={state}
          update={update}
          onClose={() => setAnnuitySettingsOpen(false)}
        />
      ) : null}
      {prefonPocketSettingsIndex !== null && state.prefonPockets[prefonPocketSettingsIndex] ? (
        <PerTransfertPrefonPocketSettingsModal
          index={prefonPocketSettingsIndex}
          pocket={state.prefonPockets[prefonPocketSettingsIndex]}
          onChange={(index, updates) => {
            update(
              'prefonPockets',
              state.prefonPockets.map((pocket, pocketIndex) =>
                pocketIndex === index ? { ...pocket, ...updates } : pocket,
              ),
            );
          }}
          onClose={() => setPrefonPocketSettingsIndex(null)}
        />
      ) : null}
      {transferRulesOpen ? (
        <TransferRulesInfoModal onClose={() => setTransferRulesOpen(false)} />
      ) : null}
      {infoModal ? (
        <PerTransfertInfoModal kind={infoModal} onClose={() => setInfoModal(null)} />
      ) : null}
    </>
  );
}
