import { useState, type ReactElement } from 'react';

import { IconPencil, IconPlus } from '@/icons/ui';

import { AuditCockpitShell } from '../components/AuditCockpitShell';
import { ActifDrawer, DetteDrawer, EmpruntDrawer } from './ActifsPassifsDrawers';
import type { AuditCockpitPageProps } from './auditCockpitShared';
import {
  ACTIF_TYPE_OPTIONS,
  AuditPageContinuation,
  EMPRUNT_TYPE_OPTIONS,
  formatEuroOrMissing,
  labelForOption,
  ownerLabel,
  sumPositive,
  upsertById,
} from './auditCockpitShared';

type InventoryDrawer =
  | { kind: 'actif'; id?: string }
  | { kind: 'emprunt'; id?: string }
  | { kind: 'dette'; id?: string };

export function ActifsPassifsPage({
  dossier,
  viewModel,
  updateDossier,
  onSelectSection,
}: AuditCockpitPageProps): ReactElement {
  const [drawer, setDrawer] = useState<InventoryDrawer | null>(null);
  const totalActifs = sumPositive(dossier.actifs.map((actif) => actif.valeur));
  const totalPassifs = sumPositive([
    ...dossier.passif.emprunts.map((emprunt) => emprunt.capitalRestantDu),
    ...dossier.passif.autresDettes.map((dette) => dette.montant),
  ]);

  return (
    <AuditCockpitShell
      viewModel={viewModel}
      currentSectionId="actifs"
      eyebrow="Inventaire déclaratif"
      title="Actifs / passifs"
      subtitle="Inventaire saisi dans le brouillon audit, en attente de structuration F3."
      onSelectSection={onSelectSection}
    >
      <section className="audit-cockpit__inventory" aria-label="Inventaire actifs et passifs">
        <InventoryPanel
          title="Actifs"
          actionLabel="Ajouter un actif"
          onAdd={() => setDrawer({ kind: 'actif' })}
          rows={dossier.actifs.map((actif) => ({
            id: actif.id,
            title: actif.libelle || 'Actif à qualifier',
            meta: [labelForOption(ACTIF_TYPE_OPTIONS, actif.type), ownerLabel(actif.proprietaire)],
            value: formatEuroOrMissing(actif.valeur),
            onEdit: () => setDrawer({ kind: 'actif', id: actif.id }),
          }))}
          empty="Aucun actif saisi."
        />
        <InventoryPanel
          title="Passifs"
          actionLabel="Ajouter un emprunt"
          secondaryActionLabel="Ajouter une dette"
          onAdd={() => setDrawer({ kind: 'emprunt' })}
          onSecondaryAdd={() => setDrawer({ kind: 'dette' })}
          rows={[
            ...dossier.passif.emprunts.map((emprunt) => ({
              id: emprunt.id,
              title: emprunt.libelle || 'Emprunt à qualifier',
              meta: [labelForOption(EMPRUNT_TYPE_OPTIONS, emprunt.type)],
              value: formatEuroOrMissing(emprunt.capitalRestantDu),
              onEdit: () => setDrawer({ kind: 'emprunt', id: emprunt.id }),
            })),
            ...dossier.passif.autresDettes.map((dette) => ({
              id: dette.id,
              title: dette.libelle || 'Dette à qualifier',
              meta: ['Autre dette'],
              value: formatEuroOrMissing(dette.montant),
              onEdit: () => setDrawer({ kind: 'dette', id: dette.id }),
            })),
          ]}
          empty="Aucun passif saisi."
        />
        <InventorySynthesis totalActifs={totalActifs} totalPassifs={totalPassifs} />
      </section>
      <section
        className="audit-cockpit__summary-band sim-band"
        aria-label="Périmètre actifs et passifs"
      >
        <p>
          Inventaire déclaratif des actifs et passifs privés, non consolidé à ce stade. Les
          valorisations restent à vérifier et la structuration patrimoniale relève de F3.
        </p>
      </section>
      <AuditPageContinuation
        label="Passer à Fiscalité"
        detail="Poursuivre avec les données fiscales déclaratives du foyer."
        onClick={() => onSelectSection('fiscalite')}
      />

      <ActifDrawer
        open={drawer?.kind === 'actif'}
        actif={
          drawer?.kind === 'actif'
            ? dossier.actifs.find((item) => item.id === drawer.id)
            : undefined
        }
        onClose={() => setDrawer(null)}
        onSave={(actif) => {
          updateDossier((previous) => ({
            ...previous,
            actifs: upsertById(previous.actifs, actif),
          }));
          setDrawer(null);
        }}
        onDelete={
          drawer?.kind === 'actif' && drawer.id
            ? () => {
                updateDossier((previous) => ({
                  ...previous,
                  actifs: previous.actifs.filter((actif) => actif.id !== drawer.id),
                }));
                setDrawer(null);
              }
            : undefined
        }
      />
      <EmpruntDrawer
        open={drawer?.kind === 'emprunt'}
        emprunt={
          drawer?.kind === 'emprunt'
            ? dossier.passif.emprunts.find((item) => item.id === drawer.id)
            : undefined
        }
        onClose={() => setDrawer(null)}
        onSave={(emprunt) => {
          updateDossier((previous) => ({
            ...previous,
            passif: {
              ...previous.passif,
              emprunts: upsertById(previous.passif.emprunts, emprunt),
            },
          }));
          setDrawer(null);
        }}
        onDelete={
          drawer?.kind === 'emprunt' && drawer.id
            ? () => {
                updateDossier((previous) => ({
                  ...previous,
                  passif: {
                    ...previous.passif,
                    emprunts: previous.passif.emprunts.filter(
                      (emprunt) => emprunt.id !== drawer.id,
                    ),
                  },
                }));
                setDrawer(null);
              }
            : undefined
        }
      />
      <DetteDrawer
        open={drawer?.kind === 'dette'}
        dette={
          drawer?.kind === 'dette'
            ? dossier.passif.autresDettes.find((item) => item.id === drawer.id)
            : undefined
        }
        onClose={() => setDrawer(null)}
        onSave={(dette) => {
          updateDossier((previous) => ({
            ...previous,
            passif: {
              ...previous.passif,
              autresDettes: upsertById(previous.passif.autresDettes, dette),
            },
          }));
          setDrawer(null);
        }}
        onDelete={
          drawer?.kind === 'dette' && drawer.id
            ? () => {
                updateDossier((previous) => ({
                  ...previous,
                  passif: {
                    ...previous.passif,
                    autresDettes: previous.passif.autresDettes.filter(
                      (dette) => dette.id !== drawer.id,
                    ),
                  },
                }));
                setDrawer(null);
              }
            : undefined
        }
      />
    </AuditCockpitShell>
  );
}

interface InventoryRow {
  id: string;
  title: string;
  meta: string[];
  value: string;
  onEdit: () => void;
}

function InventoryPanel({
  title,
  rows,
  empty,
  actionLabel,
  secondaryActionLabel,
  onAdd,
  onSecondaryAdd,
}: {
  title: string;
  rows: InventoryRow[];
  empty: string;
  actionLabel: string;
  secondaryActionLabel?: string;
  onAdd: () => void;
  onSecondaryAdd?: () => void;
}): ReactElement {
  return (
    <section className="audit-inventory-panel">
      <header className="audit-inventory-panel__header">
        <h2>{title}</h2>
        <div className="audit-inventory-panel__actions">
          <button type="button" className="audit-mini-button" onClick={onAdd}>
            <IconPlus />
            <span>{actionLabel}</span>
          </button>
          {secondaryActionLabel && onSecondaryAdd ? (
            <button type="button" className="audit-mini-button" onClick={onSecondaryAdd}>
              <IconPlus />
              <span>{secondaryActionLabel}</span>
            </button>
          ) : null}
        </div>
      </header>
      {rows.length === 0 ? (
        <p className="audit-inventory-panel__empty">{empty}</p>
      ) : (
        <ul className="audit-inventory-panel__list">
          {rows.map((row) => (
            <li key={row.id} className="audit-inventory-row">
              <div>
                <p className="audit-inventory-row__title">{row.title}</p>
                <p className="audit-inventory-row__meta">{row.meta.filter(Boolean).join(' · ')}</p>
              </div>
              <strong>{row.value}</strong>
              <button
                type="button"
                className="audit-icon-button"
                aria-label={`Modifier ${row.title}`}
                onClick={row.onEdit}
              >
                <IconPencil />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function InventorySynthesis({
  totalActifs,
  totalPassifs,
}: {
  totalActifs: number;
  totalPassifs: number;
}): ReactElement {
  return (
    <section className="audit-inventory-synthesis sim-band" aria-label="Synthèse déclarative">
      <header>
        <div>
          <h2>Synthèse déclarative</h2>
          <p>Inventaire saisi · données partielles · à structurer F3</p>
        </div>
      </header>
      <dl className="audit-inventory-metrics">
        <div>
          <dt>Actifs saisis</dt>
          <dd>{formatEuroOrMissing(totalActifs)}</dd>
        </div>
        <div>
          <dt>Passifs saisis</dt>
          <dd>{formatEuroOrMissing(totalPassifs)}</dd>
        </div>
        <div>
          <dt>Consolidation</dt>
          <dd>À venir avec F3</dd>
        </div>
      </dl>
    </section>
  );
}
