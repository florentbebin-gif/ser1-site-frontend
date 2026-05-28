import React from 'react';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';
import type { CabinetSummary } from './SettingsComptesSections.types';
import { CabinetsIcon, DeleteIcon, EditIcon } from './SettingsComptesIcons';

interface SettingsCabinetsSectionProps {
  cabinets: CabinetSummary[];
  cabinetsLoading: boolean;
  onCreateCabinet: () => void;
  onEditCabinet: (cabinet: CabinetSummary) => void;
  onDeleteCabinet: (cabinet: CabinetSummary) => void;
}

export function SettingsCabinetsSection({
  cabinets,
  cabinetsLoading,
  onCreateCabinet,
  onEditCabinet,
  onDeleteCabinet,
}: SettingsCabinetsSectionProps): React.ReactElement {
  return (
    <SettingsSectionCard
      title={`Cabinets (${cabinets.length})`}
      subtitle="Gestion des cabinets et de leur thème associé."
      icon={<CabinetsIcon />}
      collapsible
      defaultOpen={false}
      actions={
        <button
          className="chip admin-section-chip"
          onClick={onCreateCabinet}
          disabled={cabinetsLoading}
          type="button"
        >
          + Nouveau cabinet
        </button>
      }
    >
      {cabinetsLoading ? (
        <p>Chargement des cabinets...</p>
      ) : cabinets.length === 0 ? (
        <p className="admin-section-empty">Aucun cabinet créé.</p>
      ) : (
        <div className="admin-cards-grid">
          {cabinets.map((cabinet) => (
            <div key={cabinet.id} className="admin-card-compact">
              <div className="admin-card-compact__info">
                <div className="admin-card-compact__name">{cabinet.name}</div>
                <div className="admin-card-compact__meta">
                  {cabinet.themes?.name || 'Aucun thème'}
                </div>
              </div>
              <div className="admin-card-compact__actions">
                <button
                  className="icon-btn admin-card-compact__action-btn--sm"
                  onClick={() => onEditCabinet(cabinet)}
                  title="Modifier"
                  aria-label="Modifier le cabinet"
                  type="button"
                >
                  <EditIcon />
                </button>
                <button
                  className="icon-btn danger admin-card-compact__action-btn--sm"
                  onClick={() => onDeleteCabinet(cabinet)}
                  title="Supprimer"
                  aria-label="Supprimer le cabinet"
                  type="button"
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SettingsSectionCard>
  );
}
