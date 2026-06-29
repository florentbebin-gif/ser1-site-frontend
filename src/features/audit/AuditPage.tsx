/**
 * AuditPage — route /audit.
 *
 * Une seule expérience cockpit : landing, rail gauche, barre d'état et pages
 * internes sans wizard horizontal.
 */

import { useCallback, useState, type ReactElement } from 'react';

import AuditLanding, { type AuditLandingDestination } from './AuditLanding';
import type { AuditProgressSectionId } from './auditLandingViewModel';
import { useAuditDossierController } from './hooks/useAuditDossierController';
import { ActifsPassifsPage } from './cockpit/ActifsPassifsPage';
import { FiscalitePage } from './cockpit/FiscalitePage';
import { FoyerFamillePage } from './cockpit/FoyerFamillePage';
import { ObjectifsPage } from './cockpit/ObjectifsPage';
import type { AuditCockpitPageId } from './cockpit/auditCockpitShared';
import '@/styles/sim/index.css';
import './styles/index.css';

function pageFromDestination(destination: AuditLandingDestination): AuditCockpitPageId {
  if (destination === 'objectifs') return 'objectifs';
  if (destination === 'actifs-passifs') return 'actifs-passifs';
  if (destination === 'fiscalite') return 'fiscalite';
  return 'foyer-famille';
}

function pageFromSection(sectionId: AuditProgressSectionId): AuditCockpitPageId | null {
  if (sectionId === 'dossier') return 'landing';
  if (sectionId === 'foyer-famille') return 'foyer-famille';
  if (sectionId === 'actifs-passifs') return 'actifs-passifs';
  if (sectionId === 'fiscalite') return 'fiscalite';
  if (sectionId === 'objectifs') return 'objectifs';
  return null;
}

export default function AuditPage(): ReactElement {
  const [page, setPage] = useState<AuditCockpitPageId>('landing');
  const { dossier, viewModel, updateDossier, fileInputRef, handleImport } =
    useAuditDossierController();

  const handleOpenAudit = useCallback((destination: AuditLandingDestination) => {
    setPage(pageFromDestination(destination));
  }, []);

  const handleSelectSection = useCallback((sectionId: AuditProgressSectionId) => {
    const nextPage = pageFromSection(sectionId);
    if (nextPage) setPage(nextPage);
  }, []);

  const cockpitProps = {
    dossier,
    viewModel,
    updateDossier,
    onSelectSection: handleSelectSection,
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={handleImport}
      />
      {page === 'landing' ? (
        <AuditLanding
          viewModel={viewModel}
          onOpenAudit={handleOpenAudit}
          currentSectionId="dossier"
          onSelectSection={handleSelectSection}
        />
      ) : null}
      {page === 'foyer-famille' ? <FoyerFamillePage {...cockpitProps} /> : null}
      {page === 'actifs-passifs' ? <ActifsPassifsPage {...cockpitProps} /> : null}
      {page === 'fiscalite' ? <FiscalitePage {...cockpitProps} /> : null}
      {page === 'objectifs' ? <ObjectifsPage {...cockpitProps} /> : null}
    </>
  );
}
