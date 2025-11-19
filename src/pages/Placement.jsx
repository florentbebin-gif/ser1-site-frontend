// src/pages/Placement.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { onResetEvent, storageKeyFor } from '../utils/reset.js';
import { toNumber } from '../utils/number.js';
import './Placement.css';

export default function Placement() {
  console.log("Placement chargé");

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

// Simulation logic
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

// Graphique SVG
const COLORS = ['#2B5A52','#C0B5AA','#E4D0BB','#7A7A7A','#444555'];
function SmoothChart({ res }) {
  const wrapRef = useRef(null);
  const [wrapW, setWrapW] = useState(900);
  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width || 900;
      setWrapW(w);
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);
  if (!res?.series?.length) return null;
  const filtered = res.series.map(s => {
    const vals = (s.values || []).map(v => (v !== undefined && v > 0) ? v : undefined);
    const anyPos = vals.some(v => v !== undefined && v > 0);
    return anyPos ? { ...s, values: vals } : null;
  }).filter(Boolean);
  if (!filtered.length) return null;
  const LEG_W = 180;
  const PAD = 60;
  const W = Math.max(600, wrapW - 24);
  const SVG_W = Math.max(420, W - LEG_W);
  const SVG_H = 360;
  const years = res.years || [];
  const N = years.length;
  let maxY = 0;
  filtered.forEach(s => s.values.forEach(v => { if (v !== undefined && v > maxY) maxY = v; }));
  if (maxY <= 0) maxY = 1;
  let step;
  if (maxY <= 12000) {
    step = 1000;
  } else {
    const base = 10000;
    const desiredMaxTicks = 12;
    const factor = Math.ceil(maxY / (base * desiredMaxTicks));
    step = base * factor;
  }
  const topY = Math.ceil(maxY / step) * step;
  const x = (i) => PAD + (N > 1 ? i * ((SVG_W - 2 * PAD) / (N - 1)) : 0);
  const y = (v) => SVG_H - PAD - ((v / topY) * (SVG_H - 2 * PAD));
  const fmtShortEuro2 = (val) => {
    const n = Number(val) || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' M€';
    if (n >= 1_000) return (n / 1_000).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' k€';
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
  };
  const ticksY = [];
  for (let v = 0; v <= topY; v += step) ticksY.push({ val: v, y: y(v) });
  return (
    <div ref={wrapRef} style={{ display: 'flex', gap: 12, width: '100%' }}>
      <svg width={SVG_W} height={SVG_H} role="img" aria-label="Évolution des placements">
        <line x1={PAD} y1={SVG_H - PAD} x2={SVG_W - PAD} y2={SVG_H - PAD} stroke="#bbb" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={SVG_H - PAD} stroke="#bbb" />
        {ticksY.map((t, i) => (
          <g key={'gy' + i}>
            <line x1={PAD - 5} y1={t.y} x2={SVG_W - PAD} y2={t.y} stroke="#eee" />
            <text x={PAD - 10} y={t.y + 4} fontSize="12" fill="#555" textAnchor="end">
              {fmtShortEuro(t.val)}
            </text>
          </g>
        ))}
        {years.map((yr, i) => (
          <text key={'gx' + i} x={x(i)} y={SVG_H - PAD + 16} fontSize="12" fill="#666" textAnchor="middle">
            {yr}
          </text>
        ))}
        {filtered.map((s, si) => {
          const color = COLORS[si % COLORS.length];
          let d = '';
          s.values.forEach((v, i) => {
            if (v === undefined) return;
            d += (d === '' ? 'M' : 'L') + ' ' + x(i) + ' ' + y(v) + ' ';
          });
          if (!d) return null;
          return (
            <g key={'s' + si}>
              <path d={d} fill="none" stroke={color} strokeWidth="2.5" />
              {s.values.map((v, i) => v !== undefined ? <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={color} /> : null)}
            </g>
          );
        })}
      </svg>
      <div style={{ width: LEG_W, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((s, si) => (
          <div key={'lg' + si} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[si % COLORS.length] }}></span>
            <span style={{ fontSize: 13 }}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Placement() {
  const [startMonth, setStartMonth] = useState(1);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [durations, setDurations] = useState(defaultDurations);
  const [contribs, setContribs] = useState(defaultContribs);
  const STORE_KEY = storageKeyFor('placement');
  const [hydrated, setHydrated] = useState(false);

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

  return (
    <div className="panel">
      <div className="plac-title">Comparer différents placements</div>
      <div style={{ display:'flex', gap:12, marginBottom:10 }}>
        <div>Mois de souscription</div>
        <select value={startMonth} onChange={e => setStartMonth(Number(e.target.value))}>
          {MONTHS.map((m, idx) => <option key={idx} value={idx+1}>{m}</option>)}
        </select>
      </div>
      <div className="plac-table-wrap">
        <table className="plac-table">
          <thead>
            <tr>
              <th></th>
              {products.map((p,i)=><th key={i}>{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {result.years.map((y, yi) => (
              <tr key={yi}>
                <td>{`Année ${y}`}</td>
                {result.series.map((s, si) => (
                  <td key={si}>{s.values[yi] !== undefined ? euroFull0(s.values[yi]) : '0 €'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="chart-card">
        <SmoothChart res={result} />
      </div>
    </div>
  );
}
console.log("Result:", result);
}
