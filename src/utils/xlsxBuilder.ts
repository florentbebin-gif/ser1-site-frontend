import JSZip from 'jszip';
import { createTrackedObjectURL } from './createTrackedObjectURL';

export type XlsxCellValue = string | number | boolean | null | undefined;
export type XlsxCell = { v: XlsxCellValue; style?: string };
export type XlsxSheet = {
  name: string;
  rows: Array<Array<XlsxCell | XlsxCellValue>>;
  columnWidths?: number[];
};

export type XlsxBuildOptions = {
  sheets: XlsxSheet[];
  headerFill?: string;
  sectionFill?: string;
};

const STYLE_MAP: Record<string, number> = {
  sHeader: 1,
  sSection: 2,
  sText: 3,
  sCenter: 4,
  sMoney: 5,
  sPercent: 6,
};

const NUMFMT_MONEY = 165;
const NUMFMT_PERCENT = 166;

const XMLNS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const XMLNS_RELS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const pickTextColorForBackground = (bgColor: string): string => {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '000000' : 'FFFFFF';
};

const normalizeColor = (color?: string, fallback?: string) =>
  (color || fallback || 'FFFFFF').replace('#', '').toUpperCase();

const normalizeCell = (cell: XlsxCell | XlsxCellValue): XlsxCell => {
  if (cell && typeof cell === 'object' && Object.prototype.hasOwnProperty.call(cell, 'v')) {
    return cell as XlsxCell;
  }
  return { v: cell as XlsxCellValue };
};

const columnLetter = (index: number) => {
  let s = '';
  let n = index;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m - 1) / 26);
  }
  return s;
};

const buildStylesXml = (headerFill: string, headerText: string, sectionFill: string) => `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="${XMLNS_MAIN}">
  <numFmts count="2">
    <numFmt numFmtId="${NUMFMT_MONEY}" formatCode="#\\,##0 &quot;€&quot;"/>
    <numFmt numFmtId="${NUMFMT_PERCENT}" formatCode="0.00%"/>
  </numFmts>
  <fonts count="3">
    <font><sz val="10"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF${headerText}"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><name val="Arial"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF${headerFill}"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF${sectionFill}"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="${NUMFMT_MONEY}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="${NUMFMT_PERCENT}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

const buildWorksheetXml = (sheet: XlsxSheet, _sheetIndex: number) => {
  const rowsXml = sheet.rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cellsXml = row
        .map((rawCell, cellIndex) => {
          const cell = normalizeCell(rawCell);
          const col = columnLetter(cellIndex + 1);
          const ref = `${col}${rowNumber}`;
          const styleId = cell.style ? STYLE_MAP[cell.style] ?? 0 : 0;
          const value = cell.v ?? '';

          if (typeof value === 'number' && Number.isFinite(value)) {
            return `<c r="${ref}" s="${styleId}"><v>${value}</v></c>`;
          }
          if (typeof value === 'boolean') {
            return `<c r="${ref}" s="${styleId}" t="b"><v>${value ? 1 : 0}</v></c>`;
          }
          const safeText = escapeXml(String(value));
          return `<c r="${ref}" s="${styleId}" t="inlineStr"><is><t>${safeText}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowNumber}">${cellsXml}</row>`;
    })
    .join('');

  const colsXml = sheet.columnWidths?.length
    ? `<cols>${sheet.columnWidths
        .map((w, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="${XMLNS_MAIN}">
  ${colsXml}
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
};

const buildWorkbookXml = (sheets: XlsxSheet[]) => `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="${XMLNS_MAIN}" xmlns:r="${XMLNS_RELS}">
  <sheets>
    ${sheets
      .map((sheet, idx) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`)
      .join('')}
  </sheets>
</workbook>`;

const buildWorkbookRelsXml = (sheetCount: number) => `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${Array.from({ length: sheetCount })
    .map((_, idx) =>
      `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`
    )
    .join('')}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const buildRootRelsXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const buildContentTypesXml = (sheetCount: number) => `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${Array.from({ length: sheetCount })
    .map((_, idx) =>
      `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('')}
</Types>`;

export async function buildXlsxBlob(options: XlsxBuildOptions): Promise<Blob> {
  const headerFill = normalizeColor(options.headerFill);
  const headerText = pickTextColorForBackground(headerFill);
  const sectionFill = normalizeColor(options.sectionFill);
  const zip = new JSZip();

  zip.file('[Content_Types].xml', buildContentTypesXml(options.sheets.length));
  zip.folder('_rels')?.file('.rels', buildRootRelsXml());

  const xl = zip.folder('xl');
  xl?.file('workbook.xml', buildWorkbookXml(options.sheets));
  xl?.file('styles.xml', buildStylesXml(headerFill, headerText, sectionFill));

  const rels = xl?.folder('_rels');
  rels?.file('workbook.xml.rels', buildWorkbookRelsXml(options.sheets.length));

  const sheetsFolder = xl?.folder('worksheets');
  options.sheets.forEach((sheet, idx) => {
    sheetsFolder?.file(`sheet${idx + 1}.xml`, buildWorksheetXml(sheet, idx + 1));
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

export async function validateXlsxBlob(blob: Blob): Promise<boolean> {
  if (!blob || blob.size <= 0) return false;
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 2));
  return bytes[0] === 0x50 && bytes[1] === 0x4b; // PK
}

export function downloadXlsx(blob: Blob, filename: string): void {
  const safeName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const url = createTrackedObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
