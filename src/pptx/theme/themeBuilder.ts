/**
 * PowerPoint Theme Builder
 * 
 * Injects a proper clrScheme (color scheme) into the PPTX file
 * so that user's 10 colors appear in PowerPoint's theme color palette.
 * 
 * PptxGenJS doesn't natively support full theme color injection,
 * so we patch the generated PPTX (which is a ZIP file) after generation.
 */

import JSZip from 'jszip';

/**
 * UI Settings colors (c1-c10 format from ThemeProvider)
 */
interface ThemeColors {
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
 * Convert hex color to OOXML format (RRGGBB without #)
 */
function hexToOoxml(hex: string): string {
  return hex.replace('#', '').toUpperCase();
}

/**
 * Generate the theme1.xml content with custom color scheme
 * 
 * PowerPoint theme slots:
 * - dk1: Dark 1 (usually black/dark text)
 * - lt1: Light 1 (usually white/light background)
 * - dk2: Dark 2 (secondary dark)
 * - lt2: Light 2 (secondary light)
 * - accent1-6: Accent colors
 * - hlink: Hyperlink color
 * - folHlink: Followed hyperlink color
 * 
 * We map our 10 colors as:
 * - c1 → dk2 (primary brand color, often dark)
 * - c2 → accent1
 * - c3 → accent2
 * - c4 → accent3
 * - c5 → accent4
 * - c6 → accent5 (accent color)
 * - c7 → lt2 (light background)
 * - c8 → accent6
 * - c9 → hlink (muted gray)
 * - c10 → dk1 (text color, usually black)
 * - lt1 → white (always #FFFFFF)
 * - folHlink → derived from c9
 */
function generateThemeXml(colors: ThemeColors, themeName: string = 'Serenity'): string {
  const c1 = hexToOoxml(colors.c1);
  const c2 = hexToOoxml(colors.c2);
  const c3 = hexToOoxml(colors.c3);
  const c4 = hexToOoxml(colors.c4);
  const c5 = hexToOoxml(colors.c5);
  const c6 = hexToOoxml(colors.c6);
  const c7 = hexToOoxml(colors.c7);
  const c8 = hexToOoxml(colors.c8);
  const c9 = hexToOoxml(colors.c9);
  const c10 = hexToOoxml(colors.c10);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${themeName}">
  <a:themeElements>
    <a:clrScheme name="${themeName}">
      <a:dk1><a:srgbClr val="${c10}"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="${c1}"/></a:dk2>
      <a:lt2><a:srgbClr val="${c7}"/></a:lt2>
      <a:accent1><a:srgbClr val="${c2}"/></a:accent1>
      <a:accent2><a:srgbClr val="${c3}"/></a:accent2>
      <a:accent3><a:srgbClr val="${c4}"/></a:accent3>
      <a:accent4><a:srgbClr val="${c5}"/></a:accent4>
      <a:accent5><a:srgbClr val="${c6}"/></a:accent5>
      <a:accent6><a:srgbClr val="${c8}"/></a:accent6>
      <a:hlink><a:srgbClr val="${c9}"/></a:hlink>
      <a:folHlink><a:srgbClr val="${c9}"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="${themeName}">
      <a:majorFont>
        <a:latin typeface="Arial"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Arial"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="${themeName}">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="50000"/><a:satMod val="300000"/></a:schemeClr></a:gs>
            <a:gs pos="35000"><a:schemeClr val="phClr"><a:tint val="37000"/><a:satMod val="300000"/></a:schemeClr></a:gs>
            <a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="15000"/><a:satMod val="350000"/></a:schemeClr></a:gs>
          </a:gsLst>
          <a:lin ang="16200000" scaled="1"/>
        </a:gradFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0"><a:schemeClr val="phClr"><a:shade val="51000"/><a:satMod val="130000"/></a:schemeClr></a:gs>
            <a:gs pos="80000"><a:schemeClr val="phClr"><a:shade val="93000"/><a:satMod val="130000"/></a:schemeClr></a:gs>
            <a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="94000"/><a:satMod val="135000"/></a:schemeClr></a:gs>
          </a:gsLst>
          <a:lin ang="16200000" scaled="0"/>
        </a:gradFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"><a:shade val="95000"/><a:satMod val="105000"/></a:schemeClr></a:solidFill><a:prstDash val="solid"/></a:ln>
        <a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
        <a:ln w="38100" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst><a:outerShdw blurRad="40000" dist="23000" dir="5400000" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="35000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="40000"/><a:satMod val="350000"/></a:schemeClr></a:gs>
            <a:gs pos="40000"><a:schemeClr val="phClr"><a:tint val="45000"/><a:shade val="99000"/><a:satMod val="350000"/></a:schemeClr></a:gs>
            <a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="20000"/><a:satMod val="255000"/></a:schemeClr></a:gs>
          </a:gsLst>
          <a:path path="circle"><a:fillToRect l="50000" t="-80000" r="50000" b="180000"/></a:path>
        </a:gradFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="80000"/><a:satMod val="300000"/></a:schemeClr></a:gs>
            <a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="30000"/><a:satMod val="200000"/></a:schemeClr></a:gs>
          </a:gsLst>
          <a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path>
        </a:gradFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/>
  <a:extraClrSchemeLst/>
</a:theme>`;
}

/**
 * Inject custom theme colors into a PPTX blob
 * 
 * @param pptxBlob - Original PPTX blob from PptxGenJS
 * @param colors - Theme colors (c1-c10)
 * @param themeName - Name for the theme
 * @returns Modified PPTX blob with custom theme
 */
export async function injectThemeColors(
  pptxBlob: Blob,
  colors: ThemeColors,
  themeName: string = 'Serenity'
): Promise<Blob> {
  try {
    // Load the PPTX as a ZIP
    const zip = await JSZip.loadAsync(pptxBlob);
    
    // Generate new theme XML with our colors
    const themeXml = generateThemeXml(colors, themeName);
    
    // Replace the theme file
    zip.file('ppt/theme/theme1.xml', themeXml);
    
    // Generate the modified PPTX
    const modifiedBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });
    
    return modifiedBlob;
  } catch (error) {
    console.error('[ThemeBuilder] Failed to inject theme colors:', error);
    // Return original blob if injection fails
    return pptxBlob;
  }
}

export default {
  injectThemeColors,
  generateThemeXml,
};
