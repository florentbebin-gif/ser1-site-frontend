const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const rows = JSON.parse(chunks.join(''));
    if (!Array.isArray(rows)) {
      console.log('ERROR:', JSON.stringify(rows));
      process.exit(1);
    }
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
    // Check symmetry: every _pp should have a matching _pm
    const ppIds = new Set(pp.map(r => r.product_id.replace('_pp', '')));
    const pmIds = new Set(pm.map(r => r.product_id.replace('_pm', '')));
    const missingPm = [...ppIds].filter(id => !pmIds.has(id));
    const missingPp = [...pmIds].filter(id => !ppIds.has(id));
    if (missingPm.length > 0) console.log('WARN - _pp sans _pm : ' + missingPm.join(', '));
    if (missingPp.length > 0) console.log('WARN - _pm sans _pp : ' + missingPp.join(', '));
    if (missingPm.length === 0 && missingPp.length === 0 && pp.length > 0) {
      console.log('OK - Symetrie _pp/_pm verifiee');
    }
  } catch (e) {
    console.log('Parse error:', e.message, chunks.join('').substring(0, 200));
  }
});
