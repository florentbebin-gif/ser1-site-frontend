import { useEffect, useState, type ReactElement } from 'react';

import type { DossierAudit, EnfantInfo, ProcheInfo } from '@/domain/audit/types';
import { IconPlus } from '@/icons/ui';

import { AuditDrawer } from '../components/AuditDrawer';
import { AuditInlineEmptyState, DrawerFooter, updateAt } from './auditCockpitShared';
import { EnfantCard, ProcheCard } from './filiationCards';
import { createEnfant, createProche, ensureEnfantId } from './filiationConfig';

export function FiliationDrawer({
  open,
  dossier,
  onClose,
  onSave,
}: {
  open: boolean;
  dossier: DossierAudit;
  onClose: () => void;
  onSave: (enfants: EnfantInfo[], proches: ProcheInfo[]) => void;
}): ReactElement {
  const [enfants, setEnfants] = useState<EnfantInfo[]>([]);
  const [proches, setProches] = useState<ProcheInfo[]>([]);

  useEffect(() => {
    if (!open) return;
    setEnfants(dossier.situationFamiliale.enfants.map(ensureEnfantId));
    setProches(dossier.situationFamiliale.proches ?? []);
  }, [dossier.situationFamiliale.enfants, dossier.situationFamiliale.proches, open]);

  const isEmpty = enfants.length === 0 && proches.length === 0;
  const showGroupLabels = enfants.length > 0 && proches.length > 0;

  return (
    <AuditDrawer
      open={open}
      size="lg"
      title="Filiation & proches"
      subtitle="Enfants et autres proches rattachés au foyer."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(enfants, proches)} />}
    >
      <div className="audit-drawer-form audit-drawer-form--filiation">
        <div className="audit-drawer-add-row">
          <button
            type="button"
            className="audit-drawer-add"
            onClick={() => setEnfants((previous) => [...previous, createEnfant()])}
          >
            <IconPlus />
            <span>Ajouter un enfant</span>
          </button>
          <button
            type="button"
            className="audit-drawer-add"
            onClick={() => setProches((previous) => [...previous, createProche()])}
          >
            <IconPlus />
            <span>Ajouter un proche</span>
          </button>
        </div>

        {isEmpty ? (
          <AuditInlineEmptyState
            title="Aucun enfant ni proche renseigné."
            description="Ajoutez un enfant ou un proche pour qualifier la filiation."
          />
        ) : null}

        {enfants.length > 0 ? (
          <section className="audit-related-group" aria-label="Enfants">
            {showGroupLabels ? <p className="audit-related-group__label">Enfants</p> : null}
            <div className="audit-related-card-stack">
              {enfants.map((enfant, index) => (
                <EnfantCard
                  key={enfant.id ?? `enfant-${index}`}
                  enfant={enfant}
                  index={index}
                  onChange={(next) => setEnfants((previous) => updateAt(previous, index, next))}
                  onRemove={() =>
                    setEnfants((previous) => previous.filter((_, item) => item !== index))
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        {proches.length > 0 ? (
          <section className="audit-related-group" aria-label="Proches">
            {showGroupLabels ? <p className="audit-related-group__label">Proches</p> : null}
            <div className="audit-related-card-stack">
              {proches.map((proche, index) => (
                <ProcheCard
                  key={proche.id}
                  proche={proche}
                  index={index}
                  enfants={enfants}
                  onChange={(next) => setProches((previous) => updateAt(previous, index, next))}
                  onRemove={() =>
                    setProches((previous) => previous.filter((_, item) => item !== index))
                  }
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AuditDrawer>
  );
}
