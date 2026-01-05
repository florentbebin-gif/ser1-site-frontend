const FILE_VERSION = 1;
const FILE_APP = 'SER1';
const FILE_KIND = 'placement';
const MIME_TYPE = 'application/json';

function buildFilename() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `SER1_Placement_${date}_${time}.json`;
}

function hasFileSystemAccess() {
  return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function' && typeof window.showOpenFilePicker === 'function';
}

async function fallbackDownload(json, filename) {
  const blob = new Blob([json], { type: MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function fallbackOpenFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.ser1';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = (event) => {
      const file = event.target?.files?.[0] || null;
      document.body.removeChild(input);
      resolve(file);
    };
    input.click();
  });
}

function validatePayload(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    errors.push('Fichier vide ou illisible.');
    return errors;
  }
  if (data.app !== FILE_APP) {
    errors.push("Ce fichier n'a pas été créé par SER1.");
  }
  if (data.kind && data.kind !== FILE_KIND) {
    errors.push('Ce fichier ne correspond pas au simulateur Placement.');
  }
  if (typeof data.version === 'undefined') {
    errors.push('Version de fichier manquante.');
  } else if (Number(data.version) > FILE_VERSION) {
    errors.push('Version de fichier non prise en charge.');
  }
  if (!data.payload || typeof data.payload !== 'object') {
    errors.push('Données de simulation absentes.');
  }
  return errors;
}

export async function savePlacementState(state) {
  try {
    const payload = {
      version: FILE_VERSION,
      app: FILE_APP,
      kind: FILE_KIND,
      savedAt: new Date().toISOString(),
      payload: state,
    };
    const json = JSON.stringify(payload, null, 2);
    const filename = buildFilename();

    if (hasFileSystemAccess()) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Simulation Placement SER1',
              accept: { [MIME_TYPE]: ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        sessionStorage.setItem('ser1:placement:lastSaved', handle.name || filename);
        return { success: true, filename: handle.name || filename };
      } catch (err) {
        if (err?.name === 'AbortError') {
          return { cancelled: true };
        }
        console.warn('[SER1] showSaveFilePicker échec, fallback téléchargement.', err);
        await fallbackDownload(json, filename);
        sessionStorage.setItem('ser1:placement:lastSaved', filename);
        return { success: true, filename };
      }
    }

    await fallbackDownload(json, filename);
    sessionStorage.setItem('ser1:placement:lastSaved', filename);
    return { success: true, filename };
  } catch (error) {
    console.error('[SER1] Sauvegarde placement échouée:', error);
    return { success: false, message: "Échec de la sauvegarde. Veuillez réessayer." };
  }
}

async function pickFileForLoad() {
  if (hasFileSystemAccess()) {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'Simulation Placement SER1',
            accept: { [MIME_TYPE]: ['.json', '.ser1'] },
          },
        ],
      });
      const file = await handle.getFile();
      return file;
    } catch (err) {
      if (err?.name === 'AbortError') return null;
      console.warn('[SER1] showOpenFilePicker échec, fallback input.', err);
    }
  }
  return await fallbackOpenFile();
}

export async function loadPlacementStateFromFile() {
  try {
    const file = await pickFileForLoad();
    if (!file) return { cancelled: true };

    if (!file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().endsWith('.ser1')) {
      return { success: false, message: 'Format de fichier non reconnu. Sélectionnez un fichier .json.' };
    }

    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      return { success: false, message: 'Le fichier est corrompu ou invalide.' };
    }

    const errors = validatePayload(data);
    if (errors.length > 0) {
      return { success: false, message: errors.join(' ') };
    }

    sessionStorage.setItem('ser1:placement:lastLoaded', file.name);
    return { success: true, data: data.payload, filename: file.name };
  } catch (error) {
    console.error('[SER1] Chargement placement échoué:', error);
    return { success: false, message: "Impossible de charger ce fichier." };
  }
}
