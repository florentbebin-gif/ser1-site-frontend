import type { SuccessionDispositionTestamentaire } from './successionDraft.types';

export const TESTAMENT_TYPE_DESCRIPTIONS: Record<SuccessionDispositionTestamentaire, string> = {
  legs_universel: 'Toute la succession est leguee a une personne, sous reserve des droits reserves des enfants.',
  legs_titre_universel: 'Une quote-part de la succession ou une categorie de biens est leguee.',
  legs_particulier: 'Un bien ou un montant precis est legue.',
};
