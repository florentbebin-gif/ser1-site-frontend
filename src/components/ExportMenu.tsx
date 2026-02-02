/**
 * ExportMenu - Composant partagé pour les menus d'export
 * 
 * Utilisé par: IR, Credit, Placement
 * Gère: dropdown state, click outside, Escape key, aria-expanded, role="menu"
 */

import React, { useState, useRef, useEffect } from 'react';
import './ExportMenu.css';

export interface ExportOption {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

interface ExportMenuProps {
  options: ExportOption[];
  loading?: boolean;
  loadingLabel?: string;
  buttonLabel?: string;
}

export function ExportMenu({
  options,
  loading = false,
  loadingLabel = 'Génération...',
  buttonLabel = 'Exporter',
}: ExportMenuProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleOptionClick = (option: ExportOption) => {
    setIsOpen(false);
    option.onClick();
  };

  return (
    <div ref={containerRef} className="export-menu-container">
      <button
        className="chip premium-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {loading ? loadingLabel : buttonLabel}
      </button>
      
      {isOpen && !loading && (
        <div role="menu" className="export-menu">
          {options.map((option, index) => (
            <button
              key={index}
              role="menuitem"
              className="chip premium-btn export-menu-item"
              onClick={() => handleOptionClick(option)}
              disabled={option.disabled}
              title={option.tooltip}
              data-tooltip={option.tooltip}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
