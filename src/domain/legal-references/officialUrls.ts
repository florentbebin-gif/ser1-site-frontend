import officialDomains from './officialDomains.json';

export const OFFICIAL_LEGAL_REFERENCE_DOMAINS = officialDomains as readonly string[];

export function isOfficialUrl(value: string, additionalDomains: readonly string[] = []): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') return false;

  const hostname = parsed.hostname.toLowerCase();
  return [...OFFICIAL_LEGAL_REFERENCE_DOMAINS, ...additionalDomains].some(
    (domain) => hostname === domain.toLowerCase() || hostname.endsWith(`.${domain.toLowerCase()}`),
  );
}
