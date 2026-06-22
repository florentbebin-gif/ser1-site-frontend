import { useEffect, useState, type ReactElement } from 'react';

import type { Actif, Passif, PassifEmprunt, ProprietaireType } from '@/domain/audit/types';
import { SimAmountInputEuro, SimAmountInputPercent } from '@/components/ui/sim';
import { IconBarChart, IconPencil, IconPlus } from '@/icons/ui';

import { AuditCockpitShell } from '../components/AuditCockpitShell';
import { AuditDrawerXL } from '../components/AuditDrawerXL';
import type { AuditCockpitPageProps } from './auditCockpitShared';
import {
  ACTIF_TYPE_OPTIONS,
  createActif,
  createDette,
  createEmprunt,
  DateField,
  DrawerFooter,
  EMPRUNT_TYPE_OPTIONS,
  emptyToUndefined,
  formatEuroOrMissing,
  labelForOption,
  ownerLabel,
  PROPRIETAIRE_OPTIONS,
  SelectField,
  sumPositive,
  TextAreaField,
  TextField,
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
    <section className="audit-inventory-panel sim-tile-flat">
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
  const max = Math.max(totalActifs, totalPassifs, 1);
  return (
    <section
      className="audit-inventory-synthesis sim-band"
      aria-label="Synthèse graphique déclarative"
    >
      <header>
        <IconBarChart />
        <div>
          <h2>Synthèse graphique honnête</h2>
          <p>Inventaire saisi · données partielles · à structurer F3</p>
        </div>
      </header>
      <div className="audit-inventory-bars">
        <Bar label="Actifs saisis" value={totalActifs} max={max} />
        <Bar label="Passifs saisis" value={totalPassifs} max={max} />
      </div>
    </section>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }): ReactElement {
  return (
    <div className="audit-inventory-bar">
      <span>{label}</span>
      <div className="audit-inventory-bar__track">
        <span style={{ inlineSize: `${Math.round((value / max) * 100)}%` }} />
      </div>
      <strong>{formatEuroOrMissing(value)}</strong>
    </div>
  );
}

function ActifDrawer({
  open,
  actif,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  actif?: Actif;
  onClose: () => void;
  onSave: (actif: Actif) => void;
  onDelete?: () => void;
}): ReactElement {
  const [form, setForm] = useState<Actif>(actif ?? createActif());
  useEffect(() => {
    if (open) setForm(actif ?? createActif());
  }, [actif, open]);

  return (
    <AuditDrawerXL
      open={open}
      title={actif ? 'Modifier un actif' : 'Ajouter un actif'}
      subtitle="Inventaire déclaratif, sans structuration F3."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} onDelete={onDelete} />}
    >
      <div className="audit-drawer-form">
        <TextField
          label="Libellé"
          value={form.libelle}
          onChange={(libelle) => setForm({ ...form, libelle })}
        />
        <SelectField
          label="Type"
          value={form.type}
          options={ACTIF_TYPE_OPTIONS}
          onChange={(type) => setForm({ ...form, type: type as Actif['type'] } as Actif)}
        />
        <SimAmountInputEuro
          label="Valeur saisie"
          value={form.valeur}
          onChange={(valeur) => setForm({ ...form, valeur })}
        />
        <SelectField
          label="Propriétaire"
          value={form.proprietaire}
          options={PROPRIETAIRE_OPTIONS}
          onChange={(proprietaire) =>
            setForm({ ...form, proprietaire: proprietaire as ProprietaireType })
          }
        />
      </div>
    </AuditDrawerXL>
  );
}

function EmpruntDrawer({
  open,
  emprunt,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  emprunt?: PassifEmprunt;
  onClose: () => void;
  onSave: (emprunt: PassifEmprunt) => void;
  onDelete?: () => void;
}): ReactElement {
  const [form, setForm] = useState<PassifEmprunt>(emprunt ?? createEmprunt());
  useEffect(() => {
    if (open) setForm(emprunt ?? createEmprunt());
  }, [emprunt, open]);

  return (
    <AuditDrawerXL
      open={open}
      title={emprunt ? 'Modifier un emprunt' : 'Ajouter un emprunt'}
      subtitle="Capital et mensualité saisis, sans calcul de capacité."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} onDelete={onDelete} />}
    >
      <div className="audit-drawer-form">
        <TextField
          label="Libellé"
          value={form.libelle}
          onChange={(libelle) => setForm({ ...form, libelle })}
        />
        <SelectField
          label="Type"
          value={form.type}
          options={EMPRUNT_TYPE_OPTIONS}
          onChange={(type) => setForm({ ...form, type: type as PassifEmprunt['type'] })}
        />
        <SimAmountInputEuro
          label="Capital initial"
          value={form.capitalInitial}
          onChange={(capitalInitial) => setForm({ ...form, capitalInitial })}
        />
        <SimAmountInputEuro
          label="Capital restant dû"
          value={form.capitalRestantDu}
          onChange={(capitalRestantDu) => setForm({ ...form, capitalRestantDu })}
        />
        <SimAmountInputEuro
          label="Mensualité"
          value={form.mensualite}
          onChange={(mensualite) => setForm({ ...form, mensualite })}
        />
        <SimAmountInputPercent
          label="Taux renseigné"
          value={form.tauxInteret}
          onChange={(tauxInteret) => setForm({ ...form, tauxInteret })}
        />
        <DateField
          label="Date de début"
          value={form.dateDebut}
          onChange={(dateDebut) => setForm({ ...form, dateDebut })}
        />
        <DateField
          label="Date de fin"
          value={form.dateFin}
          onChange={(dateFin) => setForm({ ...form, dateFin })}
        />
      </div>
    </AuditDrawerXL>
  );
}

function DetteDrawer({
  open,
  dette,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  dette?: Passif['autresDettes'][number];
  onClose: () => void;
  onSave: (dette: Passif['autresDettes'][number]) => void;
  onDelete?: () => void;
}): ReactElement {
  const [form, setForm] = useState<Passif['autresDettes'][number]>(dette ?? createDette());
  useEffect(() => {
    if (open) setForm(dette ?? createDette());
  }, [dette, open]);

  return (
    <AuditDrawerXL
      open={open}
      title={dette ? 'Modifier une dette' : 'Ajouter une dette'}
      subtitle="Dette synthétique rattachée au passif déclaré."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} onDelete={onDelete} />}
    >
      <div className="audit-drawer-form">
        <TextField
          label="Libellé"
          value={form.libelle}
          onChange={(libelle) => setForm({ ...form, libelle })}
        />
        <SimAmountInputEuro
          label="Montant saisi"
          value={form.montant}
          onChange={(montant) => setForm({ ...form, montant })}
        />
        <TextAreaField
          label="Description"
          value={form.description ?? ''}
          onChange={(description) =>
            setForm({ ...form, description: emptyToUndefined(description) })
          }
        />
      </div>
    </AuditDrawerXL>
  );
}
