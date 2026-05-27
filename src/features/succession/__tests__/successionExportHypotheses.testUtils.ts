import type JSZip from 'jszip';
import { expect } from 'vitest';
import { DEFAULT_COLORS } from '@/settings/theme';

export const THEME_COLORS = DEFAULT_COLORS;

function decodeXmlText(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

export async function readSheetSharedText(zip: JSZip, sheetPath: string): Promise<string> {
  const sheetXml = await zip.file(sheetPath)?.async('string');
  const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string');
  expect(sheetXml).toBeTruthy();

  const sharedStrings = [
    ...(sharedStringsXml ?? '').matchAll(/<si><t(?: xml:space="preserve")?>(.*?)<\/t><\/si>/g),
  ].map((match) => decodeXmlText(match[1] ?? ''));
  const sharedStringIds = [
    ...(sheetXml ?? '').matchAll(/<c[^>]*t="s"[^>]*>\s*<v>(\d+)<\/v>\s*<\/c>/g),
  ].map((match) => Number(match[1]));
  const inlineStrings = [
    ...(sheetXml ?? '').matchAll(/<c[^>]*t="inlineStr"[^>]*>\s*<is><t>(.*?)<\/t><\/is>\s*<\/c>/g),
  ].map((match) => decodeXmlText(match[1] ?? ''));

  return [...sharedStringIds.map((index) => sharedStrings[index] ?? ''), ...inlineStrings].join(
    '\n',
  );
}

export async function getSheetXmlByName(zip: JSZip, sheetName: string): Promise<string | null> {
  const workbook = (await zip.file('xl/workbook.xml')?.async('string')) ?? '';
  const idMatch = workbook.match(new RegExp(`<sheet[^>]+name="${sheetName}"[^>]+r:id="(rId\\d+)"`));
  if (!idMatch) return null;
  const rels = (await zip.file('xl/_rels/workbook.xml.rels')?.async('string')) ?? '';
  const targetMatch = rels.match(new RegExp(`Id="${idMatch[1]}"[^>]+Target="([^"]+)"`));
  if (!targetMatch) return null;
  const target = targetMatch[1].replace(/^\/xl\//, '');
  return (await zip.file(`xl/${target}`)?.async('string')) ?? null;
}
