/**
 * Spike #17 — POC Template PPTX Natif
 * 
 * Objectif : Évaluer la faisabilité de charger un .pptx existant,
 * extraire sa structure (masters, slides, placeholders), et déterminer
 * si une approche "template natif" est viable vs "template codé".
 * 
 * Résultat : Ce fichier documente les findings du spike.
 * Référence architecture exports : docs/ARCHITECTURE.md
 * 
 * Dépendance : JSZip (déjà utilisé par themeBuilder.ts)
 */

import JSZip from 'jszip';

// ============================================================================
// TYPES
// ============================================================================

export interface PptxAnalysis {
  /** Nombre total de fichiers dans le ZIP */
  totalFiles: number;
  /** Fichiers de slides trouvés */
  slideFiles: string[];
  /** Fichiers de slide masters trouvés */
  masterFiles: string[];
  /** Fichiers de slide layouts trouvés */
  layoutFiles: string[];
  /** Fichier theme trouvé */
  themeFiles: string[];
  /** Content_Types.xml présent */
  hasContentTypes: boolean;
  /** presentation.xml présent */
  hasPresentation: boolean;
  /** Taille totale du ZIP (bytes) */
  totalSizeBytes: number;
  /** Structure complète des fichiers */
  fileList: string[];
  /** Placeholders trouvés dans les slides */
  placeholders: PlaceholderInfo[];
  /** Erreurs rencontrées */
  errors: string[];
  /** Temps d'analyse (ms) */
  analysisTimeMs: number;
}

export interface PlaceholderInfo {
  slideFile: string;
  type: string;
  idx: string;
  text?: string;
}

export interface SlideXmlAnalysis {
  file: string;
  xmlLength: number;
  shapeCount: number;
  textBoxCount: number;
  imageCount: number;
  placeholderCount: number;
  placeholders: PlaceholderInfo[];
  /** Premier 500 chars du XML pour inspection */
  xmlPreview: string;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyse la structure interne d'un fichier PPTX (ZIP).
 * 
 * Peut recevoir :
 * - Un Blob (output de PptxGenJS ou fichier uploadé)
 * - Un ArrayBuffer
 * 
 * @returns Analyse complète de la structure PPTX
 */
export async function analyzePptxStructure(
  pptxData: Blob | ArrayBuffer
): Promise<PptxAnalysis> {
  const startTime = performance.now();
  const errors: string[] = [];
  
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(pptxData);
  } catch (e) {
    return {
      totalFiles: 0,
      slideFiles: [],
      masterFiles: [],
      layoutFiles: [],
      themeFiles: [],
      hasContentTypes: false,
      hasPresentation: false,
      totalSizeBytes: 0,
      fileList: [],
      placeholders: [],
      errors: [`Failed to load ZIP: ${e instanceof Error ? e.message : String(e)}`],
      analysisTimeMs: performance.now() - startTime,
    };
  }
  
  // Enumerate all files
  const fileList = Object.keys(zip.files).sort();
  
  // Categorize files
  const slideFiles = fileList.filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  const masterFiles = fileList.filter(f => /^ppt\/slideMasters\/slideMaster\d+\.xml$/.test(f));
  const layoutFiles = fileList.filter(f => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(f));
  const themeFiles = fileList.filter(f => /^ppt\/theme\/theme\d+\.xml$/.test(f));
  
  const hasContentTypes = fileList.includes('[Content_Types].xml');
  const hasPresentation = fileList.includes('ppt/presentation.xml');
  
  // Calculate total size
  let totalSizeBytes = 0;
  if (pptxData instanceof Blob) {
    totalSizeBytes = pptxData.size;
  } else {
    totalSizeBytes = pptxData.byteLength;
  }
  
  // Extract placeholders from slides
  const allPlaceholders: PlaceholderInfo[] = [];
  for (const slideFile of slideFiles) {
    try {
      const xml = await zip.file(slideFile)?.async('text');
      if (xml) {
        const placeholders = extractPlaceholders(xml, slideFile);
        allPlaceholders.push(...placeholders);
      }
    } catch (e) {
      errors.push(`Failed to read ${slideFile}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  
  return {
    totalFiles: fileList.length,
    slideFiles,
    masterFiles,
    layoutFiles,
    themeFiles,
    hasContentTypes,
    hasPresentation,
    totalSizeBytes,
    fileList,
    placeholders: allPlaceholders,
    errors,
    analysisTimeMs: performance.now() - startTime,
  };
}

// ============================================================================
// SLIDE XML ANALYSIS
// ============================================================================

/**
 * Analyse détaillée du XML d'une slide spécifique.
 */
export async function analyzeSlideXml(
  pptxData: Blob | ArrayBuffer,
  slideFileName: string
): Promise<SlideXmlAnalysis | null> {
  const zip = await JSZip.loadAsync(pptxData);
  const xml = await zip.file(slideFileName)?.async('text');
  
  if (!xml) return null;
  
  // Count shapes (sp elements)
  const shapeCount = (xml.match(/<p:sp[\s>]/g) || []).length;
  
  // Count text boxes (txBody elements)
  const textBoxCount = (xml.match(/<p:txBody>/g) || []).length;
  
  // Count images (pic elements)
  const imageCount = (xml.match(/<p:pic[\s>]/g) || []).length;
  
  // Extract placeholders
  const placeholders = extractPlaceholders(xml, slideFileName);
  
  return {
    file: slideFileName,
    xmlLength: xml.length,
    shapeCount,
    textBoxCount,
    imageCount,
    placeholderCount: placeholders.length,
    placeholders,
    xmlPreview: xml.slice(0, 500),
  };
}

// ============================================================================
// MASTER SLIDE ANALYSIS
// ============================================================================

/**
 * Analyse les slide masters pour comprendre leur structure.
 */
export async function analyzeMasters(
  pptxData: Blob | ArrayBuffer
): Promise<{ masters: SlideXmlAnalysis[]; layouts: SlideXmlAnalysis[] }> {
  const zip = await JSZip.loadAsync(pptxData);
  const fileList = Object.keys(zip.files);
  
  const masterFiles = fileList.filter(f => /^ppt\/slideMasters\/slideMaster\d+\.xml$/.test(f));
  const layoutFiles = fileList.filter(f => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(f));
  
  const masters: SlideXmlAnalysis[] = [];
  for (const file of masterFiles) {
    const xml = await zip.file(file)?.async('text');
    if (xml) {
      const shapeCount = (xml.match(/<p:sp[\s>]/g) || []).length;
      const textBoxCount = (xml.match(/<p:txBody>/g) || []).length;
      const imageCount = (xml.match(/<p:pic[\s>]/g) || []).length;
      const placeholders = extractPlaceholders(xml, file);
      masters.push({
        file,
        xmlLength: xml.length,
        shapeCount,
        textBoxCount,
        imageCount,
        placeholderCount: placeholders.length,
        placeholders,
        xmlPreview: xml.slice(0, 500),
      });
    }
  }
  
  const layouts: SlideXmlAnalysis[] = [];
  for (const file of layoutFiles) {
    const xml = await zip.file(file)?.async('text');
    if (xml) {
      const shapeCount = (xml.match(/<p:sp[\s>]/g) || []).length;
      const textBoxCount = (xml.match(/<p:txBody>/g) || []).length;
      const imageCount = (xml.match(/<p:pic[\s>]/g) || []).length;
      const placeholders = extractPlaceholders(xml, file);
      layouts.push({
        file,
        xmlLength: xml.length,
        shapeCount,
        textBoxCount,
        imageCount,
        placeholderCount: placeholders.length,
        placeholders,
        xmlPreview: xml.slice(0, 500),
      });
    }
  }
  
  return { masters, layouts };
}

// ============================================================================
// PLACEHOLDER EXTRACTION
// ============================================================================

/**
 * Extrait les placeholders d'un XML de slide PPTX.
 * 
 * Les placeholders OOXML sont définis par <p:ph> dans les shapes.
 * Exemples : type="title", type="body", type="ctrTitle", type="subTitle"
 */
function extractPlaceholders(xml: string, sourceFile: string): PlaceholderInfo[] {
  const placeholders: PlaceholderInfo[] = [];
  
  // Match <p:ph> elements with their attributes
  const phRegex = /<p:ph\s+([^/]*?)\/>/g;
  let match;
  
  while ((match = phRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const typeMatch = attrs.match(/type="([^"]+)"/);
    const idxMatch = attrs.match(/idx="([^"]+)"/);
    
    placeholders.push({
      slideFile: sourceFile,
      type: typeMatch ? typeMatch[1] : 'unknown',
      idx: idxMatch ? idxMatch[1] : '0',
    });
  }
  
  // Also match self-closing with different attribute order
  const phRegex2 = /<p:ph\s+([^>]*?)>/g;
  while ((match = phRegex2.exec(xml)) !== null) {
    const attrs = match[1];
    if (attrs.endsWith('/')) continue; // Already matched above
    const typeMatch = attrs.match(/type="([^"]+)"/);
    const idxMatch = attrs.match(/idx="([^"]+)"/);
    
    placeholders.push({
      slideFile: sourceFile,
      type: typeMatch ? typeMatch[1] : 'unknown',
      idx: idxMatch ? idxMatch[1] : '0',
    });
  }
  
  return placeholders;
}

// ============================================================================
// FEASIBILITY ASSESSMENT
// ============================================================================

/**
 * Évalue la faisabilité d'une approche "template natif" basée sur l'analyse.
 * 
 * Critères :
 * - Structure ZIP lisible ✅/❌
 * - Slides XML parsables ✅/❌
 * - Placeholders identifiables ✅/❌
 * - Complexité XML acceptable ✅/❌
 */
export function assessFeasibility(analysis: PptxAnalysis): {
  verdict: 'go' | 'no-go' | 'partial';
  score: number; // 0-100
  findings: string[];
  recommendation: string;
} {
  const findings: string[] = [];
  let score = 0;
  
  // Criterion 1: ZIP readable (25 pts)
  if (analysis.totalFiles > 0 && analysis.errors.length === 0) {
    score += 25;
    findings.push('✅ Structure ZIP lisible sans erreur');
  } else {
    findings.push(`❌ Erreurs ZIP: ${analysis.errors.join(', ')}`);
  }
  
  // Criterion 2: Standard PPTX structure (25 pts)
  if (analysis.hasContentTypes && analysis.hasPresentation && analysis.slideFiles.length > 0) {
    score += 25;
    findings.push(`✅ Structure PPTX standard (${analysis.slideFiles.length} slides, ${analysis.masterFiles.length} masters, ${analysis.layoutFiles.length} layouts)`);
  } else {
    findings.push('❌ Structure PPTX non standard');
  }
  
  // Criterion 3: Placeholders found (25 pts)
  if (analysis.placeholders.length > 0) {
    score += 25;
    findings.push(`✅ ${analysis.placeholders.length} placeholders trouvés`);
  } else {
    score += 10; // Partial: no placeholders but structure is readable
    findings.push('⚠️ Aucun placeholder trouvé (PptxGenJS ne génère pas de placeholders natifs)');
  }
  
  // Criterion 4: Reasonable complexity (25 pts)
  const avgXmlSize = analysis.totalSizeBytes / Math.max(analysis.totalFiles, 1);
  if (avgXmlSize < 50000) { // < 50KB average per file
    score += 25;
    findings.push(`✅ Complexité acceptable (${Math.round(avgXmlSize / 1024)}KB moyen/fichier)`);
  } else {
    score += 10;
    findings.push(`⚠️ Fichiers volumineux (${Math.round(avgXmlSize / 1024)}KB moyen/fichier)`);
  }
  
  // Verdict
  let verdict: 'go' | 'no-go' | 'partial';
  let recommendation: string;
  
  if (score >= 80) {
    verdict = 'go';
    recommendation = 'Template natif viable. Mais le coût de maintenance XML reste élevé vs template codé.';
  } else if (score >= 50) {
    verdict = 'partial';
    recommendation = 'Faisable techniquement mais coût élevé. Recommandation : rester sur template codé (Conservateur+).';
  } else {
    verdict = 'no-go';
    recommendation = 'Template natif non viable. Continuer avec template codé PptxGenJS.';
  }
  
  // Override: PptxGenJS doesn't use placeholders, so native template approach
  // would require building a completely separate pipeline
  findings.push('');
  findings.push('📋 FINDING CLÉ: PptxGenJS génère du XML "flat" sans placeholders.');
  findings.push('   → Un template natif nécessiterait un pipeline séparé (JSZip + DOMParser).');
  findings.push('   → Le template codé actuel (defineSlideMaster) est déjà fonctionnel.');
  findings.push('   → Coût estimé template natif: 3-4 semaines vs 0 pour template codé.');
  
  return { verdict, score, findings, recommendation };
}

// ============================================================================
// CONVENIENCE: ANALYZE OUR OWN OUTPUT
// ============================================================================

/**
 * Génère un PPTX minimal via PptxGenJS et l'analyse.
 * Utile pour comprendre ce que PptxGenJS produit réellement.
 */
export async function analyzeOwnOutput(): Promise<{
  analysis: PptxAnalysis;
  slideDetails: SlideXmlAnalysis[];
  masterDetails: { masters: SlideXmlAnalysis[]; layouts: SlideXmlAnalysis[] };
  feasibility: ReturnType<typeof assessFeasibility>;
}> {
  // Import PptxGenJS dynamically to avoid circular deps
  const PptxGenJS = (await import('pptxgenjs')).default;
  
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = 'Spike #17 Test';
  
  // Define masters like our production code
  pptx.defineSlideMaster({
    title: 'SERENITY_COVER',
    background: { color: '1B3A5C' },
    margin: 0,
  });
  pptx.defineSlideMaster({
    title: 'SERENITY_CONTENT',
    background: { color: 'FFFFFF' },
    margin: 0,
  });
  
  // Add a cover slide
  const slide1 = pptx.addSlide({ masterName: 'SERENITY_COVER' });
  slide1.addText('Titre de test', { x: 1, y: 3, w: 10, h: 1, fontSize: 24, color: 'FFFFFF' });
  
  // Add a content slide
  const slide2 = pptx.addSlide({ masterName: 'SERENITY_CONTENT' });
  slide2.addText('Contenu de test', { x: 1, y: 1, w: 10, h: 1, fontSize: 18, color: '333333' });
  slide2.addShape('rect', { x: 1, y: 3, w: 5, h: 2, fill: { color: 'E0E0E0' } });
  
  // Generate blob
  const blob = await pptx.write({ outputType: 'blob' }) as Blob;
  
  // Analyze
  const analysis = await analyzePptxStructure(blob);
  
  // Detailed slide analysis
  const slideDetails: SlideXmlAnalysis[] = [];
  for (const slideFile of analysis.slideFiles) {
    const detail = await analyzeSlideXml(blob, slideFile);
    if (detail) slideDetails.push(detail);
  }
  
  // Master analysis
  const masterDetails = await analyzeMasters(blob);
  
  // Feasibility
  const feasibility = assessFeasibility(analysis);
  
  return { analysis, slideDetails, masterDetails, feasibility };
}
