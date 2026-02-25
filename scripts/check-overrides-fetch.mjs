import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.join(path.resolve('.'), '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const getVar = (name) => {
  const match = env.match(new RegExp('^' + name + '=(.+)$', 'm'));
  return match ? match[1].trim() : null;
};

const SUPA_URL = getVar('SUPABASE_URL');
const SUPA_KEY = getVar('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const url = `${SUPA_URL}/rest/v1/base_contrat_overrides?select=product_id&limit=500`;

try {
  const res = await fetch(url, {
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Accept': 'application/json',
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`HTTP ${res.status}: ${text}`);
    process.exit(1);
  }

  const rows = await res.json();

  const pp = rows.filter(r => r.product_id.endsWith('_pp'));
  const pm = rows.filter(r => r.product_id.endsWith('_pm'));
  const legacy = rows.filter(r => !r.product_id.endsWith('_pp') && !r.product_id.endsWith('_pm'));

  console.log('Total overrides      : ' + rows.length);
  console.log('Rows _pp             : ' + pp.length);
  console.log('Rows _pm             : ' + pm.length);
  console.log('Legacy (sans suffix) : ' + legacy.length);
  if (legacy.length > 0) {
    console.log('Legacy IDs: ' + legacy.map(r => r.product_id).join(', '));
  }

  const ppIds = new Set(pp.map(r => r.product_id.replace(/_pp$/, '')));
  const pmIds = new Set(pm.map(r => r.product_id.replace(/_pm$/, '')));
  const missingPm = [...ppIds].filter(id => !pmIds.has(id));
  const missingPp = [...pmIds].filter(id => !ppIds.has(id));

  if (missingPm.length > 0) console.log('WARN - _pp sans _pm : ' + missingPm.join(', '));
  if (missingPp.length > 0) console.log('WARN - _pm sans _pp : ' + missingPp.join(', '));
  if (missingPm.length === 0 && missingPp.length === 0 && pp.length > 0) {
    console.log('OK - Symetrie _pp/_pm verifiee (' + pp.length + ' paires)');
  }
  if (pp.length === 0 && pm.length === 0) {
    console.log('INFO - Aucun override _pp/_pm : la table ne contenait pas d overrides legacy a dupliquer (normal si vide)');
  }
} catch (e) {
  console.error('Fetch error:', e.message);
}
