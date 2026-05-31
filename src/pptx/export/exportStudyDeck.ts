/**
 * Study Deck Export Orchestrator
 *
 * Main entry point for exporting PPTX presentations using the Serenity design system.
 * Frontend-only (browser), no Node backend required.
 */

import PptxGenJS from 'pptxgenjs';
import type { StudyDeckSpec, ExportContext } from '../theme/types';
import { SLIDE_SIZE } from '../designSystem/serenity';
import { getPptxThemeFromUiSettings } from '../theme/getPptxThemeFromUiSettings';
import { loadLogoDataUriSafe } from '../logo/loadLogoDataUri';
import { fetchChapterImageDataUri } from '../assets/resolvePublicAsset';
import { injectThemeColors } from '../theme/themeBuilder';
import { defineSlideMasters } from '../template/loadBaseTemplate';
import { createTrackedObjectURL } from '../../utils/export/createTrackedObjectURL';
import {
  fingerprintPptxExport,
  hashStringForFingerprint,
  normalizeFilenameForFingerprint,
} from '../../utils/export/exportFingerprint';
import { renderStudyDeckSlides } from './renderStudyDeckSlides';

/**
 * Default footer disclaimer (verbatim as specified)
 */
const DEFAULT_DISCLAIMER =
  'Document non contractuel établi en fonction des dispositions fiscales ou sociales en vigueur à la date des présentes';

const PPTX_KEY_FIELD_PATTERN =
  /title|subtitle|label|name|total|net|tmi|rate|capital|montant|tax|duree|mensualite|cout|actif|droits|versement|rente|parts|status|location|year|periode|index|count|value/i;

function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function pickSlideKeyFields(slide: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = { type: slide.type ?? 'unknown' };
  let remaining = 24;

  for (const key of Object.keys(slide).sort((left, right) => left.localeCompare(right))) {
    if (key === 'type' || remaining <= 0) continue;
    if (!PPTX_KEY_FIELD_PATTERN.test(key)) continue;
    const value = slide[key];
    if (isPrimitive(value)) {
      picked[key] = value;
      remaining -= 1;
      continue;
    }
    if (Array.isArray(value)) {
      const compact = value.filter((item) => isPrimitive(item)).slice(0, 3);
      if (compact.length > 0) {
        picked[key] = compact;
        remaining -= 1;
      }
    }
  }

  return picked;
}

function buildPptxFingerprintManifest(
  spec: StudyDeckSpec,
  uiSettings: UiSettingsInput,
  filename: string,
  options: ExportOptions,
) {
  const normalizedPalette = Object.keys(uiSettings)
    .sort((left, right) => left.localeCompare(right))
    .reduce<Record<string, string>>((accumulator, key) => {
      const value = uiSettings[key as keyof UiSettingsInput];
      accumulator[key] = String(value).replace('#', '').toUpperCase();
      return accumulator;
    }, {});

  return {
    filename: normalizeFilenameForFingerprint(filename),
    cover: {
      title: spec.cover?.title,
      subtitle: spec.cover?.subtitle,
    },
    options: {
      locale: options.locale || 'fr-FR',
      showSlideNumbers: options.showSlideNumbers !== false,
    },
    slidesCount: spec.slides.length,
    slideTypes: spec.slides.map((slide) => slide.type),
    slides: spec.slides.map((slide) => pickSlideKeyFields(slide as Record<string, unknown>)),
    palette: normalizedPalette,
    logoHash: hashStringForFingerprint(spec.cover?.logoUrl),
  };
}

/**
 * UI Settings shape (matches ThemeProvider format)
 */
interface UiSettingsInput {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

/**
 * Export options
 */
interface ExportOptions {
  locale?: 'fr-FR' | string;
  footerDisclaimer?: string;
  showSlideNumbers?: boolean;
  coverLeftMeta?: string;
  coverRightMeta?: string;
}

/**
 * Pre-load all required assets for the deck
 */
async function preloadAssets(spec: StudyDeckSpec): Promise<{
  logoDataUri?: string;
  chapterImages: Map<number, string>;
}> {
  const chapterImages = new Map<number, string>();

  // Load logo if specified
  const logoDataUri = spec.cover.logoUrl
    ? await loadLogoDataUriSafe(spec.cover.logoUrl)
    : undefined;

  // Collect unique chapter image indices
  const chapterIndices = new Set<number>();
  for (const slide of spec.slides) {
    if (slide.type === 'chapter') {
      chapterIndices.add(slide.chapterImageIndex);
    }
  }

  // Load chapter images in parallel
  const loadPromises = Array.from(chapterIndices).map(async (index) => {
    try {
      const dataUri = await fetchChapterImageDataUri(index);
      chapterImages.set(index, dataUri);
    } catch (error) {
      console.error(`[PPTX Export] Failed to load chapter image ${index}:`, error);
    }
  });

  await Promise.all(loadPromises);

  return { logoDataUri, chapterImages };
}

/**
 * Export a study deck to PPTX
 *
 * @param spec - Study deck specification
 * @param uiSettings - UI theme settings (ThemeProvider format: c1..c10)
 * @param options - Export options
 * @returns Promise resolving to Blob (for browser download)
 */
export async function exportStudyDeck(
  spec: StudyDeckSpec,
  uiSettings: UiSettingsInput,
  options: ExportOptions = {},
): Promise<Blob> {
  // 1. Build theme from UI settings
  const theme = getPptxThemeFromUiSettings(uiSettings);

  // 2. Build export context
  const ctx: ExportContext = {
    theme,
    locale: options.locale || 'fr-FR',
    generatedAt: new Date(),
    footerDisclaimer: options.footerDisclaimer || DEFAULT_DISCLAIMER,
    showSlideNumbers: options.showSlideNumbers !== false,
    coverLeftMeta: options.coverLeftMeta,
    coverRightMeta: options.coverRightMeta,
  };

  // 3. Pre-load assets
  const { logoDataUri, chapterImages } = await preloadAssets(spec);

  // 4. Create presentation
  const pptx = new PptxGenJS();
  pptx.layout = SLIDE_SIZE.layout;
  pptx.title = spec.cover.title;
  pptx.author = 'SER1 - Serenity';
  pptx.company = 'Cabinet CGP';

  // 4b. Define theme colors so user can use them in PowerPoint
  // This adds all 10 colors to the PPTX theme palette
  pptx.defineLayout({
    name: 'SER1_WIDE',
    width: 13.3333,
    height: 7.5,
  });

  // Define slide masters (COVER, CHAPTER, CONTENT, END)
  // Masters provide backgrounds; builders add dynamic content
  defineSlideMasters(pptx, theme);

  // Set theme fonts
  try {
    pptx.theme = {
      headFontFace: 'Arial',
      bodyFontFace: 'Arial',
    };
  } catch (e) {
    // Theme definition is optional, continue if not supported
    console.warn('[PPTX Export] Theme colors not fully supported:', e);
  }

  renderStudyDeckSlides({ pptx, spec, ctx, logoDataUri, chapterImages });

  // 6. Write to blob (browser-compatible)
  const rawBlob = (await pptx.write({ outputType: 'blob' })) as Blob;

  // 7. Inject custom theme colors into the PPTX
  // This patches the ppt/theme/theme1.xml to include our 10 colors
  // so they appear in PowerPoint's theme color palette
  const blob = await injectThemeColors(rawBlob, uiSettings, 'Serenity');

  return blob;
}

/**
 * Download a PPTX blob as a file
 *
 * @param blob - PPTX blob
 * @param filename - Output filename (should end with .pptx)
 */
export function downloadPptx(blob: Blob, filename: string): void {
  const url = createTrackedObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and immediately download a study deck
 *
 * @param spec - Study deck specification
 * @param uiSettings - UI theme settings
 * @param filename - Output filename
 * @param options - Export options
 */
export async function exportAndDownloadStudyDeck(
  spec: StudyDeckSpec,
  uiSettings: UiSettingsInput,
  filename: string,
  options: ExportOptions = {},
): Promise<void> {
  const manifest = buildPptxFingerprintManifest(spec, uiSettings, filename, options);
  const fingerprint = fingerprintPptxExport(manifest);
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info('[ExportFingerprint][PPTX]', {
      fingerprint,
      filename: manifest.filename,
      slidesCount: manifest.slidesCount,
    });
  }

  const blob = await exportStudyDeck(spec, uiSettings, options);
  downloadPptx(blob, filename);
}

export default {
  exportStudyDeck,
  downloadPptx,
  exportAndDownloadStudyDeck,
};
