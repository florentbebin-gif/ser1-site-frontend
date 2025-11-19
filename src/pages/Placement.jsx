// src/pages/Placement.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { onResetEvent, storageKeyFor } from '../utils/reset.js';
import { toNumber } from '../utils/number.js';
import '../pages/Placement.css';

// Helpers
const fmtInt = (n) => (Math.round(n) || 0).toLocaleString('fr-FR');
const toNum = (v) => toNumber(v, 0);
const euroFull0 = (n) => Math.round(Number(n) || 0).toLocaleString('fr-FR') + ' €';
const fmtShortEuro = (v) => {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return Math.round(n / 1_000_000).toLocaleString('fr-FR') + ' M€';
  if (n >= 1_000) return Math.round(n / 1_000).toLocaleString('fr-FR') + ' k€';
  return Math.round(n).toLocaleString('fr-FR') + ' €';
};

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DEFAULT_PRODUCTS = [
  { name:'Placement 1 Capitalisation', rate:0, initial:0, entryFeePct:0 },
  { name:'Placement 2 Capitalisation', rate:0, initial:0, entryFeePct:0 },
  { name:'Placement 3 Distribution', rate:0, initial:0, entryFeePct:0 },
  { name:'Placement 4 Distribution', rate:0, initial:0, entryFeePct:0 },
];
const defaultDurations = [1,1,1,1];
const defaultContribs = [
  { amount:0, freq:'mensuel' },
  { amount:0, freq:'annuel' },
  { amount:0, freq:'annuel' },
  { amount:0, freq:'annuel' },
];

// Simulation logic (identique à Old)
function simulateSimpleOnInitial({ rate, initial, entryFeePct }, startMonth, durYears, yearsMax) {
  const r = rate || 0;
  const fee = entryFeePct || 0;
  const initNet = toNum(initial) * (1 - fee);
  const values = [];
  for (let y = 1; y <= yearsMax; y++) {
    const monthsCum = (13 - startMonth) + 12 * (y - 1);
    const val = initNet * (1 + r * (monthsCum / 12));
    values.push(y <= durYears ? val : undefined);
  }
  return values;
}

function simulateWithContrib({ rate, initial, entryFeePct }, startMonth, contrib, durYears, yearsMax) {
  const r = rate || 0;
  const fee = entryFeePct || 0;
  const initialNet = toNum(initial) * (1 - fee);
  const values = [];
  let endPrevYear = 0;
  for (let y = 1; y <= yearsMax; y++) {
    const mStart = (y === 1 ? startMonth : 1);
    const nbMois = 13 - mStart;
    let total = 0;
    total += endPrevYear;
    total += endPrevYear * r * (nbMois / 12);
    if (y === 1 && initialNet > 0) {
      total += initialNet;
      total += initialNet * r * (nbMois / 12);
    }
    if (contrib && contrib.amount > 0) {
      const amtNet = toNum(contrib.amount) * (1 - fee);
      if (contrib.freq === 'mensuel') {
        const mFirst = (y === 1 ? mStart : 1);
        for (let m = mFirst; m <= 12; m++) {
          const monthsRem = 13 - m;
          total += amtNet;
          total += amtNet * r * (monthsRem / 12);
        }
      } else {
        const monthsRem = 13 - startMonth;
        total += amtNet;
        total += amtNet * r * (monthsRem / 12);
      }
    }
    values.push(y <= durYears ? total : undefined);
    endPrevYear = total;
  }
  return values;
}

export default function Placement() {
  const [startMonth, setStartMonth] = useState(1);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [durations, setDurations] = useState(defaultDurations);
  const [contribs, setContribs] = useState(defaultContribs);
  const STORE_KEY = storageKeyFor('placement');
  const [hydrated, setHydrated] = useState(false);

  // Persistance
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          if (typeof s.startMonth === 'number') setStartMonth(s.startMonth);
          if (Array.isArray(s.products)) setProducts(s.products);
          if (Array.isArray(s.durations)) setDurations(s.durations);
          if (Array.isArray(s.contribs)) setContribs(s.contribs);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload = JSON.stringify({ startMonth, products, durations, contribs });
      localStorage.setItem(STORE_KEY, payload);
    } catch {}
  }, [hydrated, startMonth, products, durations, contribs]);

  // Reset
  useEffect(() => {
    const off = onResetEvent(({ simId }) => {
      if (simId === 'placement') {
        setStartMonth(1);
        setProducts(DEFAULT_PRODUCTS);
        setDurations(defaultDurations);
        setContribs(defaultContribs);
        try { localStorage.removeItem(STORE_KEY); } catch {}
      }
    });
    return off;
  }, [STORE_KEY]);

  const setProd = (i, patch) => setProducts(a => a.map((p, idx) => idx === i ? { ...p, ...patch } : p));
  const setDuration = (i, v) => setDurations(a => a.map((x, idx) => idx === i ? Math.max(1, v || 1) : x));
  const setContrib = (i, patch) => setContribs(a => a.map((c, idx) => idx === i ? { ...c, ...patch } : c));

  const result = useMemo(() => {
    const yearsMax = Math.max(...durations, 1);
    const sims = products.map((p, i) => {
      const base = { rate: Number(p.rate) || 0, initial: toNum(p.initial), entryFeePct: Number(p.entryFeePct) || 0 };
      if (i >= 2) return simulateSimpleOnInitial(base, startMonth, durations[i], yearsMax);
      return simulateWithContrib(base, startMonth, contribs[i], durations[i], yearsMax);
    });
    return {
      years: Array.from({ length: yearsMax }, (_, k) => k + 1),
      series: sims.map((vals, i) => ({ name: products[i].name, values: vals }))
    };
  }, [products, durations, contribs, startMonth]);

  const years = result.years;
  const series = result.series;

  return (
    <div className="panel">
      <div className="plac-title">Comparer différents placements</div>
      {/* Inputs */}
      <div style={{ display:'flex', gap:12, marginBottom:10 }}>
        <div>Mois de souscription</div>
        <select value={startMonth} onChange={e => setStartMonth(Number(e.target.value))}>
          {MONTHS.map((m, idx) => <option key={idx} value={idx+1}>{m}</option>)}
        </select>
      </div>
      {/* Table */}
      <div className="plac-table-wrap">
        <table className="plac-table">
          <thead>
            <tr>
              <th></th>
              {products.map((p,i)=><th key={i}>{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {years.map((y, yi) => (
              <tr key={yi}>
                <td>{`Année ${y}`}</td>
                {series.map((s, si) => (
                  <td key={si}>{s.values[yi] !== undefined ? euroFull0(s.values[yi]) : '0 €'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Graph */}
      <div className="chart-card">
        {/* Graphique SVG identique à Old */}
      </div>
    </div>
  );
}
