import { useMemo, useState, type ReactElement } from 'react';

import { useFiscalContext } from '@/hooks/useFiscalContext';
import { IconChevronRight } from '@/icons/ui';

import { AuditCockpitShell } from '../components/AuditCockpitShell';
import { AuditPivot, SummaryCardGrid, type AuditCockpitPageProps } from './auditCockpitShared';
import { buildFiscaliteTiles, type FiscalDrawerId } from './auditFiscaliteModel';
import {
  buildAuditIrEstimate,
  buildBudgetSynthese,
  buildFiscalCoherence,
  buildIfiIndicator,
} from './auditIrAdapter';
import { FiscaliteCoherenceCard } from './FiscaliteCoherenceCard';
import { FiscalitePressionCard } from './FiscalitePressionCard';
import { FiscaliteBudgetCard } from './FiscaliteBudgetCard';
import { FiscaliteDetail } from './FiscaliteDetail';
import { FiscalDrawerContent } from './FiscaliteDrawers';

export function FiscalitePage({
  dossier,
  viewModel,
  updateDossier,
  onSelectSection,
}: AuditCockpitPageProps): ReactElement {
  const [drawer, setDrawer] = useState<FiscalDrawerId | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { fiscalContext } = useFiscalContext({ strict: true });

  const estimate = useMemo(
    () => buildAuditIrEstimate(dossier, fiscalContext),
    [dossier, fiscalContext],
  );
  const ifi = useMemo(() => buildIfiIndicator(dossier, fiscalContext), [dossier, fiscalContext]);
  const coherence = useMemo(
    () => buildFiscalCoherence(estimate, viewModel.synthese.partsFiscales),
    [estimate, viewModel.synthese.partsFiscales],
  );
  const budget = useMemo(
    () => buildBudgetSynthese(dossier, estimate.result?.totalTax ?? 0),
    [dossier, estimate.result],
  );
  const tiles = useMemo(
    () => buildFiscaliteTiles(dossier.situationFiscale, budget, (id) => setDrawer(id)),
    [budget, dossier.situationFiscale],
  );

  return (
    <AuditCockpitShell
      viewModel={viewModel}
      currentSectionId="fiscalite"
      title="Fiscalité & budget"
      subtitle="Lisez la pression fiscale et la capacité budgétaire du foyer."
      actions={
        <>
          <button
            type="button"
            className="audit-cockpit__back-action"
            aria-label="Retour aux actifs et passifs"
            title="Retour aux actifs et passifs"
            onClick={() => onSelectSection('actifs-passifs')}
          >
            <IconChevronRight className="audit-cockpit__back-action-icon" />
          </button>
          <button
            type="button"
            className="audit-cockpit__primary-action"
            onClick={() => onSelectSection('objectifs')}
          >
            <span>Continuer l’audit</span>
            <IconChevronRight />
          </button>
        </>
      }
      onSelectSection={onSelectSection}
    >
      <AuditPivot
        className="audit-pivot--fiscalite"
        ariaLabel="Pression fiscale et budget du foyer"
      >
        <FiscalitePressionCard estimate={estimate} ifi={ifi} />
        <FiscaliteBudgetCard budget={budget} coherence={coherence} />
        <FiscaliteCoherenceCard coherence={coherence} />
      </AuditPivot>

      <section className="audit-foyer-sections" aria-labelledby="audit-fiscal-saisie-title">
        <header className="audit-foyer-section-head">
          <h2 id="audit-fiscal-saisie-title">Saisie fiscale et budget</h2>
        </header>
        <SummaryCardGrid cards={tiles} variant="tiles" />
      </section>

      {estimate.result ? (
        <FiscaliteDetail
          result={estimate.result}
          open={showDetail}
          onToggle={() => setShowDetail((value) => !value)}
        />
      ) : null}

      <FiscalDrawerContent
        drawer={drawer}
        situationFiscale={dossier.situationFiscale}
        budget={dossier.budget}
        onClose={() => setDrawer(null)}
        onSaveFiscale={(situationFiscale) => {
          updateDossier((previous) => ({ ...previous, situationFiscale }));
          setDrawer(null);
        }}
        onSaveBudget={(budget) => {
          updateDossier((previous) => ({ ...previous, budget }));
          setDrawer(null);
        }}
      />
    </AuditCockpitShell>
  );
}
