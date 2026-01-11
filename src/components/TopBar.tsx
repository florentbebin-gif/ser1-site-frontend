/**
 * TopBar harmonisée - Inspirée de la page IR
 * Boutons : Retour accueil, Sauvegarder, Charger, Réinitialiser, Exporter, Paramètres, Déconnexion
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth';

interface TopBarProps {
  title?: string;
  onSave?: () => void;
  onLoad?: () => void;
  onReset?: () => void;
  onExport?: () => void;
  exportOptions?: Array<{
    label: string;
    onClick: () => void | Promise<void>;
  }>;
  showSave?: boolean;
  showLoad?: boolean;
  showReset?: boolean;
  showExport?: boolean;
  showSettings?: boolean;
  showLogout?: boolean;
}

export default function TopBar({ 
  title, 
  onSave, 
  onLoad, 
  onReset, 
  onExport, 
  exportOptions = [],
  showSave = true,
  showLoad = true,
  showReset = true,
  showExport = true,
  showSettings = true,
  showLogout = true
}: TopBarProps) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Fermeture menu export au clic extérieur
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!exportRef.current) return;
      if (!exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleLogout = async () => {
    try {
      // Déconnexion Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Forcer la redirection dans tous les cas
      navigate('/login');
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button 
          className="chip" 
          onClick={() => navigate('/')}
          title="Retour à l'accueil"
        >
          🏠 Accueil
        </button>
        
        <div className="topbar-title">{title}</div>
      </div>

      <div className="topbar-right">
        {showSave && onSave && (
          <button 
            className="chip" 
            onClick={onSave}
            title="Sauvegarder le dossier"
          >
            💾 Sauvegarder
          </button>
        )}

        {showLoad && onLoad && (
          <button 
            className="chip" 
            onClick={onLoad}
            title="Charger un dossier"
          >
            📂 Charger
          </button>
        )}

        {showReset && onReset && (
          <button 
            className="chip" 
            onClick={onReset}
            title="Réinitialiser la simulation"
          >
            🔄 Réinitialiser
          </button>
        )}

        {showExport && exportOptions.length > 0 && (
          <div ref={exportRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="chip"
              aria-haspopup="menu"
              aria-expanded={exportOpen ? 'true' : 'false'}
              onClick={() => setExportOpen((v) => !v)}
              title="Exporter"
            >
              📊 Exporter ▾
            </button>

            {exportOpen && (
              <div role="menu" className="topbar-export-menu">
                {exportOptions.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="menuitem"
                    className="chip"
                    onClick={() => {
                      setExportOpen(false);
                      option.onClick();
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showSettings && isAdmin && (
          <button 
            className="chip" 
            onClick={() => navigate('/settings')}
            title="Paramètres"
          >
            ⚙️ Paramètres
          </button>
        )}

        {showLogout && user && (
          <button 
            className="chip" 
            onClick={handleLogout}
            title="Se déconnecter"
          >
            🚪 Déconnexion
          </button>
        )}
      </div>
    </div>
  );
}
