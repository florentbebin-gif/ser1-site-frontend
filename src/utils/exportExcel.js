// Utilitaires d'export Excel réutilisables (inspirés de Credit.jsx)
import { createTrackedObjectURL } from './createTrackedObjectURL';
import {
  fingerprintXlsxExport,
  normalizeFilenameForFingerprint,
} from './exportFingerprint.ts';

function buildLegacyExcelFingerprintManifest(xml, filename) {
  const worksheets = Array.from(xml.matchAll(/<Worksheet ss:Name="([^"]+)">([\s\S]*?)<\/Worksheet>/g));

  const sheets = worksheets.map(([, name, content]) => {
    const rowCount = (content.match(/<Row>/g) || []).length;
    const firstCellValues = Array.from(content.matchAll(/<Data[^>]*>([\s\S]*?)<\/Data>/g))
      .slice(0, 8)
      .map(([, value]) => value.trim());
    return {
      name,
      rowCount,
      firstCellValues,
    };
  });

  return {
    kind: 'xls-xml',
    filename: normalizeFilenameForFingerprint(filename),
    sheetCount: sheets.length,
    sheets,
  };
}

// Transpose un array-of-arrays (pour les échéanciers : périodes en colonnes)
export function transpose(aoa) {
  if (!aoa.length) return aoa;
  const rows = aoa.length;
  const cols = Math.max(...aoa.map(r => r.length));
  const out = Array.from({ length: cols }, () => Array(rows).fill(''));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[c][r] = aoa[r][c] ?? '';
    }
  }
  return out;
}

// Feuilles "classiques" : périodes en colonnes (on transpose)
export function buildWorksheetXml(title, header, rows) {
  const aoa = [header, ...rows];
  const t = transpose(aoa);
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const rowXml = (cells) =>
    `<Row>${
      cells
        .map(
          (v) =>
            `<Cell><Data ss:Type="${
              typeof v === 'number' ? 'Number' : 'String'
            }">${esc(v)}</Data></Cell>`
        )
        .join('')
    }</Row>`;

  return `
    <Worksheet ss:Name="${esc(title)}">
      <Table>
        ${t.map((r) => rowXml(r)).join('')}
      </Table>
    </Worksheet>`;
}

// Feuille "Paramètres" : on garde l'orientation verticale (Pas de transpose)
export function buildWorksheetXmlVertical(title, header, rows) {
  const aoa = [header, ...rows];
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const rowXml = (cells) =>
    `<Row>${
      cells
        .map(
          (v) =>
            `<Cell><Data ss:Type="${
              typeof v === 'number' ? 'Number' : 'String'
            }">${esc(v)}</Data></Cell>`
        )
        .join('')
    }</Row>`;

  return `
    <Worksheet ss:Name="${esc(title)}">
      <Table>
        ${aoa.map((r) => rowXml(r)).join('')}
      </Table>
    </Worksheet>`;
}

// Génère et télécharge un fichier Excel
export async function downloadExcel(xml, filename) {
  try {
    const manifest = buildLegacyExcelFingerprintManifest(xml, filename);
    const fingerprint = fingerprintXlsxExport(manifest);

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ExportFingerprint][XLS-XML]', {
        fingerprint,
        filename: manifest.filename,
        sheetCount: manifest.sheetCount,
      });
      // eslint-disable-next-line no-console
      console.debug('[ExcelExport] downloadExcel started', { filename, xmlLength: xml.length });
    }
    
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    
    const url = createTrackedObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    
    a.click();
    
    a.remove();
    URL.revokeObjectURL(url);
    
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[ExcelExport] downloadExcel completed', { filename });
    }
    
  } catch (error) {
    console.error('[ExcelExport] downloadExcel error', { 
      error, 
      message: error.message, 
      stack: error.stack,
      filename,
      xmlLength: xml?.length
    });
    throw new Error(`Erreur lors du téléchargement: ${error.message}`);
  }
}
