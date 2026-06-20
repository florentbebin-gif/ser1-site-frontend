import { useEffect, useRef, useState, type ReactElement } from 'react';

import { IconChevronDown, IconDownload } from '@/icons/ui';

import type { AuditStatusBarViewModel } from '../auditLandingViewModel';

interface AuditStatusBarProps {
  statusBar: AuditStatusBarViewModel;
}

export function AuditStatusBar({ statusBar }: AuditStatusBarProps): ReactElement {
  return (
    <section className="audit-status-bar sim-band" aria-label="État du dossier">
      <ul className="audit-status-bar__items">
        {statusBar.items.map((item) => (
          <li key={item.id} className="audit-status-bar__item sim-kpi-line" data-tone={item.tone}>
            <span className="audit-status-bar__label">{item.label}</span>
            <strong className="audit-status-bar__value">{item.value}</strong>
          </li>
        ))}
      </ul>
      <AuditStatusExportMenu />
    </section>
  );
}

function AuditStatusExportMenu(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="audit-status-export">
      <button
        type="button"
        className="audit-status-export__button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-testid="audit-export-menu-button"
        onClick={() => setIsOpen((open) => !open)}
      >
        <IconDownload className="audit-status-export__button-icon" />
        <span>Exporter</span>
        <IconChevronDown className="audit-status-export__chevron" />
      </button>

      {isOpen && (
        <div className="audit-status-export__menu" role="menu" data-testid="audit-export-menu">
          <button
            type="button"
            className="audit-status-export__item"
            role="menuitem"
            disabled
            title="Export Word à venir"
          >
            Word (.docx)
          </button>
          <button
            type="button"
            className="audit-status-export__item"
            role="menuitem"
            disabled
            title="Export PowerPoint à venir"
          >
            PowerPoint (.pptx)
          </button>
        </div>
      )}
    </div>
  );
}
