// Utilitaires d'export Excel réutilisables (inspirés de Credit.jsx)

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

/**
 * @typedef {Object} ExcelSheet
 * @property {string} title - The title of the sheet.
 * @property {string[]} header - The header row.
 * @property {Array<Array<string|number>>} rows - The data rows.
 * @property {'vertical'|'horizontal'} [orientation='vertical'] - The table orientation.
 */

/**
 * Generates a full Excel XML workbook from multiple sheets.
 * @param {ExcelSheet[]} sheets - An array of sheet configurations.
 * @returns {string} The full XML content for the .xls file.
 */
export function generateExcelWorkbook(sheets) {
  if (!Array.isArray(sheets) || sheets.length === 0) {
    throw new Error('Sheet data is required.');
  }

  const worksheetsXml = sheets.map(sheet => {
    const { title, header, rows, orientation = 'vertical' } = sheet;
    if (orientation === 'horizontal') {
      return buildWorksheetXml(title, header, rows);
    }
    return buildWorksheetXmlVertical(title, header, rows);
  }).join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${worksheetsXml}
</Workbook>`;
}

// Génère et télécharge un fichier Excel
export async function downloadExcel(xml, filename) {
  try {
    console.info("[ExcelExport] downloadExcel started", { filename, xmlLength: xml.length });
    
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    console.info("[ExcelExport] Blob created", { size: blob.size, type: blob.type });
    
    const url = URL.createObjectURL(blob);
    console.info("[ExcelExport] ObjectURL created", { url: url.substring(0, 50) + '...' });
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    console.info("[ExcelExport] Anchor element created and appended");
    
    a.click();
    console.info("[ExcelExport] Click triggered");
    
    a.remove();
    URL.revokeObjectURL(url);
    console.info("[ExcelExport] Cleanup completed");
    
  } catch (error) {
    console.error("[ExcelExport] downloadExcel error", { 
      error, 
      message: error.message, 
      stack: error.stack,
      filename,
      xmlLength: xml?.length
    });
    throw new Error(`Erreur lors du téléchargement: ${error.message}`);
  }
}
