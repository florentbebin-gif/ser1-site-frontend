import { useMemo, useState, type ReactElement } from 'react';

import type { SituationFiscale } from '@/domain/audit/types';
import { IconBarChart, IconClipboardCheck, IconFileText, IconInfo, IconPieChart } from '@/icons/ui';

import { AuditCockpitShell } from '../components/AuditCockpitShell';
import type { AuditCockpitPageProps, SummaryCardData } from './auditCockpitShared';
import {
  AuditPageContinuation,
  formatEuroOrMissing,
  formatNumber,
  formatPercent,
  positive,
  sumPositive,
  SummaryCardGrid,
} from './auditCockpitShared';
import { FiscalDrawerContent } from './FiscaliteDrawers';

type FiscalDrawer = 'avis' | 'revenus' | 'lecture' | 'impots';

export function FiscalitePage({
  dossier,
  viewModel,
  updateDossier,
  onSelectSection,
}: AuditCockpitPageProps): ReactElement {
  const [drawer, setDrawer] = useState<FiscalDrawer | null>(null);
  const cards = useMemo(
    () => buildFiscalCards(dossier.situationFiscale, (nextDrawer) => setDrawer(nextDrawer)),
    [dossier.situationFiscale],
  );

  return (
    <AuditCockpitShell
      viewModel={viewModel}
      currentSectionId="fiscalite"
      eyebrow="Fiscalité déclarative"
      title="Fiscalité"
      subtitle="Données fiscales renseignées ou à confirmer, sans calcul IR runtime depuis /audit."
      onSelectSection={onSelectSection}
    >
      <SummaryCardGrid cards={cards} variant="five" />
      <FiscalFactsBand situationFiscale={dossier.situationFiscale} />
      <section className="audit-cockpit__summary-band sim-band" aria-label="Périmètre fiscalité">
        <p>
          Informations déclaratives collectées pour préparer les calculs fiscaux à venir. L’IR n’est
          pas calculé depuis /audit et aucun taux marginal n’est affiché s’il n’est pas renseigné.
        </p>
      </section>
      <AuditPageContinuation
        label="Passer à Objectifs"
        detail="Qualifier les priorités et contraintes avant la stratégie verrouillée."
        onClick={() => onSelectSection('objectifs')}
      />
      <FiscalDrawerContent
        drawer={drawer}
        situationFiscale={dossier.situationFiscale}
        onClose={() => setDrawer(null)}
        onSave={(situationFiscale) => {
          updateDossier((previous) => ({ ...previous, situationFiscale }));
          setDrawer(null);
        }}
      />
    </AuditCockpitShell>
  );
}

function buildFiscalCards(
  situationFiscale: SituationFiscale,
  openDrawer: (drawer: FiscalDrawer) => void,
): SummaryCardData[] {
  const hasAvisData =
    positive(situationFiscale.revenuFiscalReference) ||
    positive(situationFiscale.impotRevenu) ||
    positive(situationFiscale.nombreParts);
  const hasRevenus = situationFiscale.revenus.length > 0;
  const hasTmi = positive(situationFiscale.tmi);
  const hasAutres =
    positive(situationFiscale.ifi) ||
    positive(situationFiscale.cehr) ||
    positive(situationFiscale.taxeFonciere);

  return [
    {
      id: 'avis',
      title: 'Avis d’imposition / données fiscales connues',
      status: hasAvisData ? 'partiel' : 'vide',
      badgeLabel: 'Déclaratif',
      known: [
        `Année : ${situationFiscale.anneeReference}`,
        positive(situationFiscale.revenuFiscalReference)
          ? `RFR renseigné : ${formatEuroOrMissing(situationFiscale.revenuFiscalReference)}`
          : '',
        positive(situationFiscale.impotRevenu)
          ? `IR indiqué : ${formatEuroOrMissing(situationFiscale.impotRevenu)}`
          : '',
      ].filter(Boolean),
      missing: [
        !positive(situationFiscale.revenuFiscalReference) ? 'Revenu fiscal de référence' : '',
        !positive(situationFiscale.impotRevenu) ? 'IR indiqué sur avis' : '',
      ].filter(Boolean),
      icon: <IconFileText />,
      ctaLabel: hasAvisData ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('avis'),
    },
    {
      id: 'lecture',
      title: 'Lecture fiscale du foyer',
      status: hasRevenus || hasTmi ? 'partiel' : 'vide',
      badgeLabel: 'Déclaratif',
      known: [
        hasRevenus ? `${situationFiscale.revenus.length} catégorie(s) de revenus` : '',
        positive(situationFiscale.nombreParts)
          ? `${formatNumber(situationFiscale.nombreParts)} part(s) renseignée(s)`
          : '',
        hasTmi ? `TMI renseignée : ${formatPercent(situationFiscale.tmi)}` : '',
      ].filter(Boolean),
      missing: [!hasRevenus ? 'Revenus déclarés' : '', !hasTmi ? 'TMI renseignée' : ''].filter(
        Boolean,
      ),
      icon: <IconPieChart />,
      ctaLabel: hasRevenus || hasTmi ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer(hasRevenus ? 'lecture' : 'revenus'),
    },
    {
      id: 'ifi',
      title: 'IFI / autres impôts à qualifier',
      status: hasAutres ? 'partiel' : 'vide',
      badgeLabel: 'Déclaratif',
      known: [
        positive(situationFiscale.ifi)
          ? `IFI indiqué : ${formatEuroOrMissing(situationFiscale.ifi)}`
          : '',
        positive(situationFiscale.cehr)
          ? `CEHR indiquée : ${formatEuroOrMissing(situationFiscale.cehr)}`
          : '',
        positive(situationFiscale.taxeFonciere)
          ? `Taxe foncière indiquée : ${formatEuroOrMissing(situationFiscale.taxeFonciere)}`
          : '',
      ].filter(Boolean),
      missing: hasAutres ? [] : ['IFI et autres impôts à qualifier'],
      icon: <IconClipboardCheck />,
      ctaLabel: hasAutres ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('impots'),
    },
    {
      id: 'points',
      title: 'Points fiscaux à confirmer',
      status: hasAvisData && hasRevenus ? 'partiel' : 'a-verifier',
      badgeLabel: hasAvisData && hasRevenus ? 'Déclaratif' : 'À compléter',
      known: hasAvisData || hasRevenus ? ['Données déclaratives amorcées'] : [],
      missing: [
        !hasAvisData ? 'Avis fiscal' : '',
        !hasRevenus ? 'Nature des revenus' : '',
        !hasTmi ? 'TMI renseignée si connue' : '',
      ].filter(Boolean),
      alert: 'Ces points restent déclaratifs et ne produisent pas de recommandation.',
      icon: <IconInfo />,
      ctaLabel: hasAvisData || hasRevenus ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('avis'),
    },
    {
      id: 'calculs',
      title: 'Calculs à venir',
      status: 'a-venir',
      badgeLabel: 'À venir',
      known: ['Aucun calcul IR runtime dans /audit'],
      missing: ['Moteur et adapter dédiés hors périmètre /audit'],
      icon: <IconBarChart />,
      ctaLabel: 'Ouvrir',
      onAction: () => openDrawer('avis'),
    },
  ];
}

function FiscalFactsBand({
  situationFiscale,
}: {
  situationFiscale: SituationFiscale;
}): ReactElement {
  const totalRevenus = sumPositive(situationFiscale.revenus.map((revenu) => revenu.montantNet));
  const rfr = positive(situationFiscale.revenuFiscalReference)
    ? situationFiscale.revenuFiscalReference
    : 0;

  return (
    <section className="audit-fiscal-facts sim-band" aria-label="Synthèse fiscale déclarative">
      <div>
        <h2>Synthèse fiscale déclarative</h2>
        <p>Données factuelles renseignées, sans ratio revenus/RFR ni calcul runtime.</p>
        <dl>
          <div>
            <dt>Revenus nets renseignés</dt>
            <dd>{formatEuroOrMissing(totalRevenus)}</dd>
          </div>
          <div>
            <dt>RFR renseigné</dt>
            <dd>{formatEuroOrMissing(rfr)}</dd>
          </div>
          <div>
            <dt>TMI renseignée</dt>
            <dd>
              {positive(situationFiscale.tmi)
                ? formatPercent(situationFiscale.tmi)
                : 'Non renseignée'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
