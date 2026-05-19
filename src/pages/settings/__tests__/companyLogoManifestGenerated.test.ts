import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const logosDir = path.join(process.cwd(), 'public', 'logos', 'compagnies');
const manifestPath = path.join(logosDir, 'manifest.json');
const generatedPath = path.join(
  process.cwd(),
  'src',
  'pages',
  'settings',
  'components',
  'companyLogoManifest.generated.ts',
);

interface LogoManifestItem {
  slug: string;
  file: string | null;
  displayOverrides?: {
    scale?: number;
    background?: string;
  };
}

interface LogoManifest {
  items: LogoManifestItem[];
}

function readManifest(): LogoManifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as LogoManifest;
}

describe('manifeste logos compagnies', () => {
  it('reste synchronisé avec les assets physiques et le fichier généré', () => {
    const manifest = readManifest();
    const generated = readFileSync(generatedPath, 'utf8');
    const manifestFiles = new Set(manifest.items.flatMap((item) => (item.file ? [item.file] : [])));
    const physicalFiles = readdirSync(logosDir).filter((file) => file !== 'manifest.json');

    expect(generated).toContain('@generated');

    for (const file of manifestFiles) {
      expect(existsSync(path.join(logosDir, file)), file).toBe(true);
      expect(generated).toContain(file);
    }

    for (const file of physicalFiles) {
      expect(manifestFiles.has(file), file).toBe(true);
    }
  });

  it('porte les réglages visuels particuliers dans le manifeste', () => {
    const manifest = readManifest();
    const bySlug = new Map(manifest.items.map((item) => [item.slug, item]));

    expect(bySlug.get('axa')?.displayOverrides).toEqual({ scale: 62 });
    expect(bySlug.get('garance')?.displayOverrides).toEqual({
      scale: 72,
      background: 'c1',
    });
    expect(bySlug.get('lpa-prevoyance')?.displayOverrides).toEqual({ background: 'c1' });
  });
});
