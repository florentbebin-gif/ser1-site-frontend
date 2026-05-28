import type { buildSuccessionStudyDeck } from '@/pptx/presets/successionDeckBuilder';
import { DEFAULT_COLORS } from '@/settings/theme';

export const THEME_COLORS = DEFAULT_COLORS;

export type SuccessionStudyData = Parameters<typeof buildSuccessionStudyDeck>[0];
