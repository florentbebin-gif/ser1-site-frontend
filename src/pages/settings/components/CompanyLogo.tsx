import { useState, type CSSProperties, type ReactElement } from 'react';
import { COMPANY_LOGO_ASSETS, type CompanyLogoAssetConfig } from './companyLogoManifest.generated';

interface CompanyLogoProps {
  company: string;
  size?: number;
  className?: string;
}

const TONE_CLASSES = [
  'company-logo--c1',
  'company-logo--c2',
  'company-logo--c3',
  'company-logo--c4',
  'company-logo--c5',
  'company-logo--c6',
] as const;

export function slugifyCompanyForLogo(company: string): string {
  return company
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCompanyLogoToneClass(company: string): string {
  const hash = Array.from(company).reduce((total, char) => total + char.charCodeAt(0), 0);
  return TONE_CLASSES[hash % TONE_CLASSES.length] ?? TONE_CLASSES[0];
}

function getFallbackLetter(company: string): string {
  return company.trim().charAt(0).toUpperCase() || '?';
}

function getLogoAsset(slug: string): CompanyLogoAssetConfig | undefined {
  return (COMPANY_LOGO_ASSETS as Record<string, CompanyLogoAssetConfig | undefined>)[slug];
}

export default function CompanyLogo({
  company,
  size = 36,
  className,
}: CompanyLogoProps): ReactElement {
  const [logoUnavailable, setLogoUnavailable] = useState(false);
  const slug = slugifyCompanyForLogo(company);
  const logoAsset = getLogoAsset(slug);
  const imageScale = logoAsset?.displayOverrides?.scale;
  const background = logoAsset?.displayOverrides?.background;
  const style = {
    '--company-logo-size': `${size}px`,
    ...(imageScale ? { '--company-logo-image-scale': `${imageScale}%` } : {}),
  } as CSSProperties;
  const classNames = [
    'company-logo',
    background ? `company-logo--bg-${background}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!slug || !logoAsset || logoUnavailable) {
    return (
      <span
        className={`${classNames} company-logo--fallback ${getCompanyLogoToneClass(company)}`}
        style={style}
        role="img"
        aria-label={`Logo ${company}`}
        data-testid={`company-logo-${slug || 'inconnu'}`}
      >
        {getFallbackLetter(company)}
      </span>
    );
  }

  return (
    <span className={classNames} style={style} data-testid={`company-logo-${slug}`}>
      <img
        src={`/logos/compagnies/${logoAsset.file}`}
        alt={`Logo ${company}`}
        onError={() => setLogoUnavailable(true)}
      />
    </span>
  );
}
