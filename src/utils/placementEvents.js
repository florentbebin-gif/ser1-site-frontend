export const PLACEMENT_SAVE_EVENT = 'ser1:placement:save';
export const PLACEMENT_LOAD_EVENT = 'ser1:placement:load';

export function triggerPlacementSaveEvent() {
  try {
    window.dispatchEvent(new CustomEvent(PLACEMENT_SAVE_EVENT));
  } catch (error) {
    console.error('[SER1] Impossible de déclencher la sauvegarde placement :', error);
  }
}

export function triggerPlacementLoadEvent() {
  try {
    window.dispatchEvent(new CustomEvent(PLACEMENT_LOAD_EVENT));
  } catch (error) {
    console.error('[SER1] Impossible de déclencher le chargement placement :', error);
  }
}
