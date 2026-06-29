import { useMemo, useState, type ReactElement } from 'react';

import { IconChevronRight } from '@/icons/ui';

import { AuditCockpitShell } from '../components/AuditCockpitShell';
import { ActifDrawer, PassifDrawer } from './ActifsPassifsDrawers';
import { ActifsPassifsInventory, type AddKind } from './ActifsPassifsInventory';
import { ActifsPassifsOverview } from './ActifsPassifsOverview';
import {
  AuditPivot,
  type AuditCockpitPageProps,
  buildProprietaireOptions,
  upsertById,
} from './auditCockpitShared';
import type { InventoryKind } from './auditInventoryModel';

interface InventoryDrawer {
  kind: 'actif' | 'passif';
  passifKind?: 'emprunt' | 'dette';
  id?: string;
}

export function ActifsPassifsPage({
  dossier,
  viewModel,
  updateDossier,
  onSelectSection,
}: AuditCockpitPageProps): ReactElement {
  const [drawer, setDrawer] = useState<InventoryDrawer | null>(null);
  const proprietaireOptions = useMemo(
    () => buildProprietaireOptions(dossier.situationFamiliale),
    [dossier.situationFamiliale],
  );

  const handleAdd = (kind: AddKind) => {
    setDrawer(kind === 'actif' ? { kind: 'actif' } : { kind: 'passif' });
  };
  const handleEdit = (kind: InventoryKind, id: string) => {
    if (kind === 'actif') {
      setDrawer({ kind: 'actif', id });
      return;
    }
    setDrawer({ kind: 'passif', passifKind: kind, id });
  };

  return (
    <AuditCockpitShell
      viewModel={viewModel}
      currentSectionId="actifs-passifs"
      title="Actifs / passifs"
      subtitle="Déclarez les actifs et les passifs du foyer."
      actions={
        <>
          <button
            type="button"
            className="audit-cockpit__back-action"
            aria-label="Retour au foyer"
            title="Retour au foyer"
            onClick={() => onSelectSection('foyer-famille')}
          >
            <IconChevronRight className="audit-cockpit__back-action-icon" />
          </button>
          <button
            type="button"
            className="audit-cockpit__primary-action"
            onClick={() => onSelectSection('fiscalite')}
          >
            <span>Continuer l’audit</span>
            <IconChevronRight />
          </button>
        </>
      }
      onSelectSection={onSelectSection}
    >
      <AuditPivot className="audit-pivot--inventory" ariaLabel="Synthèse des actifs et passifs">
        <ActifsPassifsOverview dossier={dossier} />
      </AuditPivot>

      <ActifsPassifsInventory dossier={dossier} onAdd={handleAdd} onEdit={handleEdit} />

      <section
        className="audit-cockpit__summary-band sim-band"
        aria-label="Périmètre actifs et passifs"
      >
        <p>
          Données déclaratives, non consolidées. Les droits de détention, les sources et les
          valorisations consolidées seront traités dans une étape ultérieure.
        </p>
      </section>

      <ActifDrawer
        open={drawer?.kind === 'actif'}
        actif={
          drawer?.kind === 'actif'
            ? dossier.actifs.find((item) => item.id === drawer.id)
            : undefined
        }
        proprietaireOptions={proprietaireOptions}
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

      <PassifDrawer
        open={drawer?.kind === 'passif'}
        emprunt={
          drawer?.kind === 'passif' && drawer.passifKind === 'emprunt'
            ? dossier.passif.emprunts.find((item) => item.id === drawer.id)
            : undefined
        }
        dette={
          drawer?.kind === 'passif' && drawer.passifKind === 'dette'
            ? dossier.passif.autresDettes.find((item) => item.id === drawer.id)
            : undefined
        }
        onClose={() => setDrawer(null)}
        onSave={(result) => {
          updateDossier((previous) =>
            result.kind === 'emprunt'
              ? {
                  ...previous,
                  passif: {
                    ...previous.passif,
                    emprunts: upsertById(previous.passif.emprunts, result.emprunt),
                  },
                }
              : {
                  ...previous,
                  passif: {
                    ...previous.passif,
                    autresDettes: upsertById(previous.passif.autresDettes, result.dette),
                  },
                },
          );
          setDrawer(null);
        }}
        onDelete={
          drawer?.kind === 'passif' && drawer.id
            ? () => {
                const target = drawer.id;
                const passifKind = drawer.passifKind;
                updateDossier((previous) => ({
                  ...previous,
                  passif: {
                    ...previous.passif,
                    emprunts:
                      passifKind === 'emprunt'
                        ? previous.passif.emprunts.filter((item) => item.id !== target)
                        : previous.passif.emprunts,
                    autresDettes:
                      passifKind === 'dette'
                        ? previous.passif.autresDettes.filter((item) => item.id !== target)
                        : previous.passif.autresDettes,
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
