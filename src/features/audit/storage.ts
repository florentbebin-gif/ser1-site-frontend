/**
 * Storage - Export/Import JSON pour sauvegarde locale RGPD
 * 
 * RGPD : pas de stockage serveur des noms clients.
 * Les dossiers sont sauvegardés localement (fichier JSON).
 */

import type { DossierAudit } from './types';

const SESSION_STORAGE_KEY = 'ser1_audit_draft';

/**
 * Exporte un dossier audit en fichier JSON
 */
export function exportDossierToFile(dossier: DossierAudit, filename?: string): void {
  const data = JSON.stringify(dossier, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `audit_${dossier.id.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Importe un dossier audit depuis un fichier JSON
 */
export function importDossierFromFile(file: File): Promise<DossierAudit> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Validation basique
        if (!data.id || !data.version || !data.situationFamiliale) {
          throw new Error('Format de fichier invalide');
        }
        
        // Mise à jour de la date de modification
        data.dateModification = new Date().toISOString();
        
        resolve(data as DossierAudit);
      } catch {
        reject(new Error('Impossible de lire le fichier. Vérifiez qu\'il s\'agit d\'un export audit valide.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur de lecture du fichier'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Sauvegarde le brouillon en session storage (mémoire temporaire)
 */
export function saveDraftToSession(dossier: DossierAudit): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dossier));
  } catch (error) {
    console.warn('Impossible de sauvegarder le brouillon:', error);
  }
}

/**
 * Charge le brouillon depuis la session storage
 */
export function loadDraftFromSession(): DossierAudit | null {
  try {
    const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as DossierAudit;
    }
  } catch (error) {
    console.warn('Impossible de charger le brouillon:', error);
  }
  return null;
}

/**
 * Efface le brouillon de la session storage
 */
export function clearDraftFromSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Impossible de supprimer le brouillon:', error);
  }
}

/**
 * Vérifie si des données non sauvegardées existent
 */
export function hasUnsavedData(): boolean {
  return sessionStorage.getItem(SESSION_STORAGE_KEY) !== null;
}

/**
 * Hook pour l'alerte avant de quitter
 */
export function setupBeforeUnloadWarning(hasChanges: () => boolean): () => void {
  const handler = (event: BeforeUnloadEvent) => {
    if (hasChanges()) {
      event.preventDefault();
      event.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
      return event.returnValue;
    }
  };

  window.addEventListener('beforeunload', handler);
  
  return () => {
    window.removeEventListener('beforeunload', handler);
  };
}
