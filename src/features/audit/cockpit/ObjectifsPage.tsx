import { useEffect, useMemo, useState, type ReactElement } from 'react';

import {
  OBJECTIFS_CLIENT_LABELS,
  type DossierAudit,
  type ObjectifClient,
} from '@/domain/audit/types';
import type {
  DossierContrainte,
  DossierContraintePriority,
  DossierOperationPrevue,
  DossierOperationStatus,
} from '@/domain/dossier';
import {
  IconChevronRight,
  IconClipboardCheck,
  IconFileText,
  IconInfo,
  IconNetwork,
} from '@/icons/ui';

import { AuditCockpitShell } from '../components/AuditCockpitShell';
import { AuditDrawer } from '../components/AuditDrawer';
import type { AuditCockpitPageProps, SummaryCardData } from './auditCockpitShared';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  AuditRepeatableCard,
  CONTRAINTE_PRIORITY_OPTIONS,
  createContrainte,
  createOperation,
  DrawerFooter,
  EditableList,
  emptyToUndefined,
  labelForOption,
  OPERATION_STATUS_OPTIONS,
  SelectField,
  SummaryCardGrid,
  TextAreaField,
  TextField,
  updateAt,
} from './auditCockpitShared';

type ObjectifsDrawerId = 'objectifs' | 'contraintes' | 'operations';

export function ObjectifsPage({
  dossier,
  viewModel,
  updateDossier,
  onSelectSection,
}: AuditCockpitPageProps): ReactElement {
  const [drawer, setDrawer] = useState<ObjectifsDrawerId | null>(null);
  const contraintes = dossier.contraintes ?? [];
  const operationsPrevues = dossier.operationsPrevues ?? [];
  const cards = useMemo(
    () => buildObjectifsCards(dossier, (nextDrawer) => setDrawer(nextDrawer)),
    [dossier],
  );

  return (
    <AuditCockpitShell
      viewModel={viewModel}
      currentSectionId="objectifs"
      eyebrow="Fin de l’analyse"
      title="Objectifs"
      subtitle="Priorités, contraintes et opérations prévues qui débloquent la stratégie lorsque les fondations métier seront disponibles."
      actions={
        <button
          type="button"
          className="audit-cockpit__primary-action"
          onClick={() => onSelectSection('dossier')}
        >
          <span>Revenir au dossier</span>
          <IconChevronRight />
        </button>
      }
      onSelectSection={onSelectSection}
    >
      <SummaryCardGrid cards={cards} variant="decision" />
      <section
        className="audit-cockpit__summary-band audit-objectifs-prereq-band sim-band"
        aria-label="Prérequis stratégie"
      >
        <IconInfo className="audit-cockpit__summary-icon" />
        <div>
          <h2>Prérequis stratégie</h2>
          <ul className="audit-objectifs-prereqs">
            {viewModel.pilotage.prerequis.map((prerequis) => (
              <li key={prerequis.id} data-status={prerequis.status}>
                <span>{prerequis.label}</span>
                <strong>{prerequis.statusLabel}</strong>
              </li>
            ))}
          </ul>
          <p>Stratégie verrouillée, scénarios à venir après finalisation des contraintes.</p>
        </div>
      </section>
      <ObjectifsDrawerContent
        drawer={drawer}
        objectifs={dossier.objectifs}
        contraintes={contraintes}
        operationsPrevues={operationsPrevues}
        onClose={() => setDrawer(null)}
        onSave={(payload) => {
          updateDossier((previous) => ({
            ...previous,
            objectifs: payload.objectifs ?? previous.objectifs,
            contraintes: payload.contraintes ?? previous.contraintes,
            operationsPrevues: payload.operationsPrevues ?? previous.operationsPrevues,
          }));
          setDrawer(null);
        }}
      />
    </AuditCockpitShell>
  );
}

function buildObjectifsCards(
  dossier: DossierAudit,
  openDrawer: (drawer: ObjectifsDrawerId) => void,
): SummaryCardData[] {
  const contraintes = dossier.contraintes ?? [];
  const operationsPrevues = dossier.operationsPrevues ?? [];

  return [
    {
      id: 'objectifs-prioritaires',
      title: 'Objectifs prioritaires',
      status: dossier.objectifs.length > 0 ? 'complet' : 'vide',
      known: dossier.objectifs.map(
        (objectif, index) => `${index + 1}. ${OBJECTIFS_CLIENT_LABELS[objectif]}`,
      ),
      missing: dossier.objectifs.length === 0 ? ['Priorités client'] : [],
      icon: <IconClipboardCheck />,
      ctaLabel: dossier.objectifs.length > 0 ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('objectifs'),
    },
    {
      id: 'contraintes',
      title: 'Contraintes',
      status: contraintes.length > 0 ? 'partiel' : 'vide',
      known: contraintes.map(
        (contrainte) =>
          `${contrainte.label} · ${labelForOption(CONTRAINTE_PRIORITY_OPTIONS, contrainte.priority)}`,
      ),
      missing: contraintes.length === 0 ? ['Contraintes à qualifier'] : [],
      icon: <IconInfo />,
      ctaLabel: contraintes.length > 0 ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('contraintes'),
    },
    {
      id: 'operations',
      title: 'Opérations prévues',
      status: operationsPrevues.length > 0 ? 'partiel' : 'vide',
      known: operationsPrevues.map((operation) =>
        [
          operation.label,
          operation.horizon,
          labelForOption(OPERATION_STATUS_OPTIONS, operation.status),
        ]
          .filter(Boolean)
          .join(' · '),
      ),
      missing: operationsPrevues.length === 0 ? ['Opérations prévues si connues'] : [],
      icon: <IconFileText />,
      ctaLabel: operationsPrevues.length > 0 ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('operations'),
    },
    {
      id: 'deblocage',
      title: 'Prérequis stratégie',
      status: 'verrouille',
      badgeLabel: 'Verrouillé',
      known: dossier.objectifs.length > 0 ? ['Objectifs utilisables comme contexte futur'] : [],
      missing: ['F3, fiscalité calculée et stratégie restent hors périmètre'],
      icon: <IconNetwork />,
      ctaLabel: 'Ouvrir',
      onAction: () => openDrawer('objectifs'),
    },
  ];
}

function ObjectifsDrawerContent({
  drawer,
  objectifs,
  contraintes,
  operationsPrevues,
  onClose,
  onSave,
}: {
  drawer: ObjectifsDrawerId | null;
  objectifs: ObjectifClient[];
  contraintes: DossierContrainte[];
  operationsPrevues: DossierOperationPrevue[];
  onClose: () => void;
  onSave: (payload: {
    objectifs?: ObjectifClient[];
    contraintes?: DossierContrainte[];
    operationsPrevues?: DossierOperationPrevue[];
  }) => void;
}): ReactElement | null {
  if (drawer === 'objectifs') {
    return (
      <ObjectifsSelectionDrawer
        open
        objectifs={objectifs}
        onClose={onClose}
        onSave={(next) => onSave({ objectifs: next })}
      />
    );
  }
  if (drawer === 'contraintes') {
    return (
      <ContraintesDrawer
        open
        contraintes={contraintes}
        onClose={onClose}
        onSave={(next) => onSave({ contraintes: next })}
      />
    );
  }
  if (drawer === 'operations') {
    return (
      <OperationsDrawer
        open
        operationsPrevues={operationsPrevues}
        onClose={onClose}
        onSave={(next) => onSave({ operationsPrevues: next })}
      />
    );
  }
  return null;
}

function ObjectifsSelectionDrawer({
  open,
  objectifs,
  onClose,
  onSave,
}: {
  open: boolean;
  objectifs: ObjectifClient[];
  onClose: () => void;
  onSave: (objectifs: ObjectifClient[]) => void;
}): ReactElement {
  const [selected, setSelected] = useState(objectifs);
  useEffect(() => {
    if (open) setSelected(objectifs);
  }, [objectifs, open]);

  return (
    <AuditDrawer
      open={open}
      size="md"
      title="Objectifs prioritaires"
      subtitle="Sélectionnez les priorités exprimées par le client."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(selected)} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Priorités client" first>
          <div className="audit-objective-list">
            {(Object.keys(OBJECTIFS_CLIENT_LABELS) as ObjectifClient[]).map((objectif) => {
              const checked = selected.includes(objectif);
              return (
                <label key={objectif} className="audit-checkbox-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      setSelected((previous) =>
                        event.target.checked
                          ? [...previous, objectif]
                          : previous.filter((item) => item !== objectif),
                      )
                    }
                  />
                  <span>{OBJECTIFS_CLIENT_LABELS[objectif]}</span>
                </label>
              );
            })}
          </div>
        </AuditDrawerSection>
      </div>
    </AuditDrawer>
  );
}

function ContraintesDrawer({
  open,
  contraintes,
  onClose,
  onSave,
}: {
  open: boolean;
  contraintes: DossierContrainte[];
  onClose: () => void;
  onSave: (contraintes: DossierContrainte[]) => void;
}): ReactElement {
  const [items, setItems] = useState(contraintes);
  useEffect(() => {
    if (open) setItems(contraintes);
  }, [contraintes, open]);

  return (
    <AuditDrawer
      open={open}
      size="lg"
      title="Contraintes"
      subtitle="Contraintes déclarées pour contextualiser les objectifs."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(items)} />}
    >
      <EditableList
        addLabel="Ajouter une contrainte"
        empty="Aucune contrainte renseignée."
        onAdd={() => setItems((previous) => [...previous, createContrainte()])}
      >
        {items.map((contrainte, index) => (
          <AuditRepeatableCard
            key={contrainte.id}
            title={`Contrainte ${index + 1}`}
            removeLabel={`Retirer la contrainte ${index + 1}`}
            onRemove={() =>
              setItems((previous) => previous.filter((item) => item.id !== contrainte.id))
            }
          >
            <AuditDrawerFieldGrid>
              <TextField
                label="Libellé"
                value={contrainte.label}
                onChange={(label) =>
                  setItems((previous) => updateAt(previous, index, { ...contrainte, label }))
                }
              />
              <TextAreaField
                label="Description"
                value={contrainte.description ?? ''}
                onChange={(description) =>
                  setItems((previous) =>
                    updateAt(previous, index, {
                      ...contrainte,
                      description: emptyToUndefined(description),
                    }),
                  )
                }
              />
              <SelectField
                label="Priorité"
                value={contrainte.priority}
                options={CONTRAINTE_PRIORITY_OPTIONS}
                onChange={(priority) =>
                  setItems((previous) =>
                    updateAt(previous, index, {
                      ...contrainte,
                      priority: priority as DossierContraintePriority,
                    }),
                  )
                }
              />
            </AuditDrawerFieldGrid>
          </AuditRepeatableCard>
        ))}
      </EditableList>
    </AuditDrawer>
  );
}

function OperationsDrawer({
  open,
  operationsPrevues,
  onClose,
  onSave,
}: {
  open: boolean;
  operationsPrevues: DossierOperationPrevue[];
  onClose: () => void;
  onSave: (operationsPrevues: DossierOperationPrevue[]) => void;
}): ReactElement {
  const [items, setItems] = useState(operationsPrevues);
  useEffect(() => {
    if (open) setItems(operationsPrevues);
  }, [operationsPrevues, open]);

  return (
    <AuditDrawer
      open={open}
      size="lg"
      title="Opérations prévues"
      subtitle="Opérations connues, sans activation stratégique."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(items)} />}
    >
      <EditableList
        addLabel="Ajouter une opération"
        empty="Aucune opération prévue renseignée."
        onAdd={() => setItems((previous) => [...previous, createOperation()])}
      >
        {items.map((operation, index) => (
          <AuditRepeatableCard
            key={operation.id}
            title={`Opération ${index + 1}`}
            removeLabel={`Retirer l’opération ${index + 1}`}
            onRemove={() =>
              setItems((previous) => previous.filter((item) => item.id !== operation.id))
            }
          >
            <AuditDrawerFieldGrid>
              <TextField
                label="Libellé"
                value={operation.label}
                onChange={(label) =>
                  setItems((previous) => updateAt(previous, index, { ...operation, label }))
                }
              />
              <TextField
                label="Horizon"
                value={operation.horizon ?? ''}
                onChange={(horizon) =>
                  setItems((previous) =>
                    updateAt(previous, index, { ...operation, horizon: emptyToUndefined(horizon) }),
                  )
                }
              />
              <SelectField
                label="Statut"
                value={operation.status}
                options={OPERATION_STATUS_OPTIONS}
                onChange={(status) =>
                  setItems((previous) =>
                    updateAt(previous, index, {
                      ...operation,
                      status: status as DossierOperationStatus,
                    }),
                  )
                }
              />
              <TextAreaField
                label="Description"
                value={operation.description ?? ''}
                onChange={(description) =>
                  setItems((previous) =>
                    updateAt(previous, index, {
                      ...operation,
                      description: emptyToUndefined(description),
                    }),
                  )
                }
              />
            </AuditDrawerFieldGrid>
          </AuditRepeatableCard>
        ))}
      </EditableList>
    </AuditDrawer>
  );
}
