import { useState, type ReactElement, type ReactNode } from 'react';

import type { DossierAudit } from '@/domain/audit/types';
import { IconChevronRight, IconPlus, IconTable } from '@/icons/ui';

import { AuditCardHead, AuditSurfaceCard, isPatrimoineCouple } from './auditCockpitShared';
import { buildOwnerColumnTotals } from './ActifsPassifsInventoryMatrix';
import {
  ActifsAnalyseView,
  ActifsDetentionView,
  PassifsDetailsView,
  PassifsDetentionView,
} from './ActifsPassifsInventoryViews';
import {
  buildActifGroups,
  buildOwnerColumns,
  buildPassifGroups,
  type InventoryKind,
} from './auditInventoryModel';

export type AddKind = 'actif' | 'passif';

interface InventorySlide {
  id: string;
  title: string;
  description: string;
  content: ReactNode;
}

function GhostAdd({ label, onClick }: { label: string; onClick: () => void }): ReactElement {
  return (
    <button type="button" className="audit-ghost-action" onClick={onClick}>
      <IconPlus />
      <span>{label}</span>
    </button>
  );
}

export function ActifsPassifsInventory({
  dossier,
  onAdd,
  onEdit,
}: {
  dossier: DossierAudit;
  onAdd: (kind: AddKind) => void;
  onEdit: (kind: InventoryKind, id: string) => void;
}): ReactElement {
  const isCouple = isPatrimoineCouple(dossier.situationFamiliale.situationMatrimoniale);
  const actifGroups = buildActifGroups(dossier.actifs, isCouple, onEdit);
  const passifGroups = buildPassifGroups(
    dossier.passif.emprunts,
    dossier.passif.autresDettes,
    isCouple,
    onEdit,
  );
  const ownerColumns = buildOwnerColumns(dossier.situationFamiliale, isCouple);
  const ownerTotals = buildOwnerColumnTotals(actifGroups);
  const passifOwnerTotals = buildOwnerColumnTotals(passifGroups);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const slides: InventorySlide[] = [
    {
      id: 'actifs-detention',
      title: 'Actifs · Détention',
      description: 'Masses déclarées par détenteur.',
      content: (
        <ActifsDetentionView
          actifGroups={actifGroups}
          ownerColumns={ownerColumns}
          ownerTotals={ownerTotals}
          onAdd={() => onAdd('actif')}
        />
      ),
    },
    {
      id: 'actifs-analyse',
      title: 'Actifs · Analyse',
      description: 'Répartition, horizon, risque et liquidité.',
      content: <ActifsAnalyseView actifGroups={actifGroups} onAdd={() => onAdd('actif')} />,
    },
    {
      id: 'passifs-detention',
      title: 'Passifs · Détention & couverture',
      description: 'CRD par détenteur et couverture décès.',
      content: (
        <PassifsDetentionView
          passifGroups={passifGroups}
          ownerColumns={ownerColumns}
          ownerTotals={passifOwnerTotals}
          onAdd={() => onAdd('passif')}
        />
      ),
    },
    {
      id: 'passifs-details',
      title: 'Passifs · Détails crédits',
      description: 'Taux, assurance, échéances et coûts.',
      content: <PassifsDetailsView passifGroups={passifGroups} onAdd={() => onAdd('passif')} />,
    },
  ];
  const activeSlide = slides[activeSlideIndex] ?? slides[0]!;

  const goToSlide = (index: number) => {
    const count = slides.length;
    setActiveSlideIndex((index + count) % count);
  };

  return (
    <AuditSurfaceCard className="audit-inventory-card" ariaLabelledby="audit-inventory-title">
      <AuditCardHead
        icon={<IconTable />}
        title="Inventaire déclaré"
        titleId="audit-inventory-title"
        action={
          <div className="audit-card-actions">
            <GhostAdd label="Ajouter un actif" onClick={() => onAdd('actif')} />
            <GhostAdd label="Ajouter un passif" onClick={() => onAdd('passif')} />
          </div>
        }
      />

      <div className="audit-inventory-pager">
        <header className="audit-inventory-pager__head">
          <div className="audit-inventory-pager__title-block">
            <span className="audit-inventory-pager__eyebrow">
              {activeSlideIndex + 1}/{slides.length}
            </span>
            <h3 className="audit-inventory-pager__title">{activeSlide.title}</h3>
            <p>{activeSlide.description}</p>
          </div>
          <div className="audit-inventory-pager__controls" aria-label="Navigation inventaire">
            <button
              type="button"
              className="audit-inventory-pager__arrow audit-inventory-pager__arrow--previous"
              onClick={() => goToSlide(activeSlideIndex - 1)}
              aria-label="Vue précédente"
            >
              <IconChevronRight />
            </button>
            <div className="audit-inventory-pager__dots">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className="audit-inventory-pager__dot"
                  data-active={index === activeSlideIndex ? 'true' : undefined}
                  onClick={() => goToSlide(index)}
                  aria-label={`Afficher ${slide.title}`}
                  aria-current={index === activeSlideIndex ? 'step' : undefined}
                />
              ))}
            </div>
            <button
              type="button"
              className="audit-inventory-pager__arrow"
              onClick={() => goToSlide(activeSlideIndex + 1)}
              aria-label="Vue suivante"
            >
              <IconChevronRight />
            </button>
          </div>
        </header>
        <div className="audit-inventory-pager__viewport" aria-live="polite">
          {activeSlide.content}
        </div>
      </div>
    </AuditSurfaceCard>
  );
}
