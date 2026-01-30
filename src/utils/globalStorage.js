const SNAPSHOT_VERSION = 1;
const SNAPSHOT_KIND = 'snapshot';
const SNAPSHOT_APP = 'SER1';
export const SNAPSHOT_LOADED_EVENT = 'ser1:snapshot:loaded';
export const SNAPSHOT_LAST_LOADED_KEY = 'ser1:snapshot:lastLoadedName';

const SIM_STORAGE_MAP = {
  placement: 'ser1:sim:placement',
  credit: 'ser1:sim:credit',
  ir: 'ser1:sim:ir',
  strategy: 'ser1:sim:strategy',
  audit: 'ser1_audit_draft',
};

function collectSimulatorStates() {
  const sims = {};
  Object.entries(SIM_STORAGE_MAP).forEach(([simId, storageKey]) => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      sims[simId] = raw ? JSON.parse(raw) : null;
    } catch {
      sims[simId] = null;
    }
  });
  return sims;
}

function buildSnapshotPayload() {
  return {
    app: SNAPSHOT_APP,
    kind: SNAPSHOT_KIND,
    version: SNAPSHOT_VERSION,
    meta: {
      savedAt: new Date().toISOString(),
    },
    payload: {
      sims: collectSimulatorStates(),
    },
  };
}

function generateFilename() {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  return `SER1_Snapshot_${date}_${time}.ser1`;
}

function hasFileSystemAccess() {
  return typeof window !== 'undefined'
    && typeof window.showSaveFilePicker === 'function'
    && typeof window.showOpenFilePicker === 'function';
}

/**
 * Sauvegarde l'intégralité de l'application dans un fichier .ser1
 * Ouvre la boîte de dialogue "Enregistrer sous..." du système (si supportée)
 */
export async function saveGlobalState() {
  try {
    const snapshot = buildSnapshotPayload();
    const jsonContent = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    // Utiliser l'API File System Access si disponible (Chrome, Edge, Opera)
    if (hasFileSystemAccess()) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: generateFilename(),
          types: [
            {
              description: 'Dossier SER1',
              accept: { 'application/json': ['.ser1'] },
            },
          ],
        });
        
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        // Stocker le nom du fichier sauvegardé (sessionStorage)
        const filename = handle.name;
        sessionStorage.setItem('ser1:lastSavedFilename', filename);
        sessionStorage.setItem('ser1:snapshot:lastSavedName', filename);
        
        return { success: true, message: 'Dossier sauvegardé avec succès.', filename };
      } catch (err) {
        // L'utilisateur a annulé la fenêtre
        if (err.name === 'AbortError') {
          return { success: false, message: '', cancelled: true };
        }
        throw err;
      }
    } else {
      // Fallback pour Firefox, Safari : téléchargement direct
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFilename();
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      // Stocker le nom du fichier suggéré (sessionStorage)
      sessionStorage.setItem('ser1:lastSavedFilename', link.download);
      sessionStorage.setItem('ser1:snapshot:lastSavedName', link.download);
      
      return { success: true, message: 'Dossier sauvegardé avec succès.', filename: link.download };
    }
  } catch (error) {
    console.error('[SER1] Erreur de sauvegarde:', error);
    return { 
      success: false, 
      message: 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.' 
    };
  }
}

/**
 * Valide la structure d'un snapshot SER1
 */
function validateFileStructure(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Le fichier ne contient pas de données valides.');
    return { valid: false, errors };
  }

  if (data.app !== SNAPSHOT_APP) {
    errors.push("Ce fichier n'a pas été créé par SER1.");
  }

  if (data.kind !== SNAPSHOT_KIND) {
    errors.push('Ce fichier ne correspond pas à un snapshot SER1.');
  }

  if (typeof data.version === 'undefined') {
    errors.push('Version du fichier manquante.');
  } else if (Number(data.version) > SNAPSHOT_VERSION) {
    errors.push('Version de snapshot non prise en charge.');
  }

  if (!data.payload || typeof data.payload !== 'object') {
    errors.push('Le fichier ne contient aucune donnée.');
  }

  if (!data.payload?.sims || typeof data.payload.sims !== 'object') {
    errors.push('Le snapshot ne contient pas de section "sims".');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Restaure les données depuis un fichier SER1
 */
function restoreData(data) {
  const sims = data?.payload?.sims || {};
  let restoredCount = 0;

  Object.entries(SIM_STORAGE_MAP).forEach(([simId, storageKey]) => {
    const value = Object.prototype.hasOwnProperty.call(sims, simId) ? sims[simId] : null;
    try {
      if (value !== null && value !== undefined) {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
      } else {
        sessionStorage.removeItem(storageKey);
      }
      restoredCount++;
    } catch (e) {
      console.warn(`[SER1] Impossible de restaurer ${simId}:`, e);
    }
  });

  return restoredCount;
}

/**
 * Charge un fichier .ser1 et restaure l'état de l'application
 * @param {File} file - Fichier à charger
 * @returns {Promise<{success: boolean, message: string}>}
 */
export function loadGlobalState(file) {
  return new Promise((resolve) => {
    // Vérifier l'extension du fichier
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.ser1') && !filename.endsWith('.json')) {
      resolve({
        success: false,
        message: 'Format de fichier non reconnu. Veuillez sélectionner un fichier .ser1 ou .json.',
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          throw new Error('Contenu du fichier invalide');
        }

        // Parser le JSON
        let data;
        try {
          data = JSON.parse(content);
        } catch {
          resolve({
            success: false,
            message: 'Le fichier est corrompu ou ne contient pas de JSON valide.',
          });
          return;
        }

        // Valider la structure
        const validation = validateFileStructure(data);
        if (!validation.valid) {
          resolve({
            success: false,
            message: validation.errors.join('\n'),
          });
          return;
        }

        // Restaurer les données
        const restoredCount = restoreData(data);

        if (restoredCount === 0) {
          resolve({
            success: false,
            message: 'Aucune donnée n\'a pu être restaurée depuis ce fichier.',
          });
          return;
        }

        try {
          sessionStorage.setItem('ser1:loadedFilename', file.name);
          sessionStorage.setItem(SNAPSHOT_LAST_LOADED_KEY, file.name);
        } catch {}

        try {
          const evt = new CustomEvent(SNAPSHOT_LOADED_EVENT, { detail: { filename: file.name } });
          window.dispatchEvent(evt);
        } catch {}

        resolve({
          success: true,
          message: `Dossier "${file.name}" chargé avec succès.`,
          requiresReload: false,
          filename: file.name,
        });

      } catch (error) {
        console.error('[SER1] Erreur de chargement:', error);
        resolve({
          success: false,
          message: 'Une erreur inattendue est survenue lors du chargement du fichier.',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        message: 'Impossible de lire le fichier. Vérifiez qu\'il n\'est pas endommagé.',
      });
    };

    reader.readAsText(file);
  });
}

/**
 * Ouvre la boîte de dialogue de sélection de fichier
 * @returns {Promise<File|null>}
 */
export function openFileDialog() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ser1,.json';
    
    input.onchange = (event) => {
      const file = event.target?.files?.[0];
      resolve(file || null);
    };
    
    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

/**
 * Flux complet de chargement avec dialogue
 * @returns {Promise<{success: boolean, message: string, requiresReload?: boolean}>}
 */
export async function loadGlobalStateWithDialog() {
  const file = await openFileDialog();
  
  if (!file) {
    return { success: false, message: '', cancelled: true };
  }

  return loadGlobalState(file);
}
