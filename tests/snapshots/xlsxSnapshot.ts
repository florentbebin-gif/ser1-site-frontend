import JSZip from 'jszip';

const countTag = (xml: string, tag: string) => (xml.match(new RegExp(`<${tag}\\b`, 'g')) || []).length;

const extractSheetNames = (workbookXml: string): string[] => {
  const names: string[] = [];
  const re = /<sheet\b[^>]*\bname="([^"]+)"/g;
  let m: RegExpExecArray | null;
   
  while ((m = re.exec(workbookXml))) names.push(m[1]);
  return names;
};

const extractCellRefs = (worksheetXml: string, limit = 25): string[] => {
  const refs: string[] = [];
  const re = /<c\b[^>]*\br="([^"]+)"/g;
  let m: RegExpExecArray | null;
   
  while ((m = re.exec(worksheetXml))) {
    refs.push(m[1]);
    if (refs.length >= limit) break;
  }
  return refs;
};

export async function snapshotXlsxBlob(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const files = Object.keys(zip.files).sort();

  const workbookXml = await zip.file('xl/workbook.xml')!.async('string');
  const stylesXml = await zip.file('xl/styles.xml')!.async('string');

  const sheetFiles = files.filter((p) => p.startsWith('xl/worksheets/sheet') && p.endsWith('.xml'));
  const worksheets = await Promise.all(
    sheetFiles.map(async (path) => {
      const xml = await zip.file(path)!.async('string');
      return {
        path,
        rowCount: countTag(xml, 'row'),
        cellCount: countTag(xml, 'c'),
        firstCellRefs: extractCellRefs(xml),
      };
    })
  );

  return {
    files,
    workbook: {
      sheetNames: extractSheetNames(workbookXml),
      sheetCount: countTag(workbookXml, 'sheet'),
    },
    styles: {
      numFmtCount: countTag(stylesXml, 'numFmt'),
      fontCount: countTag(stylesXml, 'font'),
      fillCount: countTag(stylesXml, 'fill'),
      cellXfCount: countTag(stylesXml, 'xf'),
    },
    worksheets,
  };
}
