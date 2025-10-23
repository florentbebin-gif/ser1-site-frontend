// src/pages/Placement.jsx
import React, { useMemo, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
const fmt = n => n?.toLocaleString?.('fr-FR', { maximumFractionDigits: 0 }) ?? n

const DEFAULT_INPUT = {
  duration: 16,
  custom1Years: 20,
  products: [
    { name: 'Placement 1',             rate: 0.05,  initial: 563750, entryFeePct: 0.00 },
    { name: 'Placement 2',             rate: 0.04,  initial: 570000, entryFeePct: 0.00 },
    { name: 'Placement 3',             rate: 0.035, initial: 100000, entryFeePct: 0.00 },
    { name: 'Assurance vie (SCPI)',    rate: 0.04,  initial:  97000, entryFeePct: 0.085 },
    { name: 'Compte titre',            rate: 0.05,  initial: 100000, entryFeePct: 0.00 },
  ]
}

export default function Placement(){
  const [inp, setInp] = useState(() => {
    const saved = localStorage.getItem('ser1:sim:placement:inp')
    return saved ? JSON.parse(saved) : DEFAULT_INPUT
  })
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem('ser1:sim:placement:inp', JSON.stringify(inp))
  }, [inp])

  async function run(){
    setErr(''); setLoading(true)
    try {
      const r = await fetch(`${API_BASE}/api/placement`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inp)
      })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      setRes(await r.json())
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  const rows = useMemo(() => {
    if (!res) return null
    const R = []
    R.push(['Rendement Net de FG', ...res.series.map(s => (s.rate * 100).toFixed(2) + ' %')])
    R.push(['Placement initial',   ...res.series.map(s => fmt(s.initial) + ' €')])
    R.push(["Frais d'entrée",      ...res.series.map((s, i) => ((inp.products[i]?.entryFeePct || 0) * 100).toFixed(2) + ' %')])
    res.years.forEach((y, i) => R.push([`Année ${y}`, ...res.series.map(s => fmt(s.values[i]) + ' €')]))
    if (res.custom1) {
      R.push([`Durée "sur mesure" du placement 1`, res.custom1.years, '', '', '', ''])
      R.push(['', fmt(res.custom1.final) + ' €', '', '', '', ''])
    }
    return R
  }, [res, inp])

  return (
    <div className="panel" style={{ padding: '12px 12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '10px 8px 16px' }}>
        <h2 style={{ margin: 0, fontSize: 26 }}>Comparer différents placements</h2>
        <div style={{ height: 3, width: 200, background: 'var(--beige)', borderRadius: 2, opacity: .7 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 18 }}>
        {/* Tableau à gauche */}
        <div style={{ border: '2px solid #2d2d2d', padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(5, 1fr)', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <div></div>
            {inp.products.map((_, i) => (
              <div key={'head' + i} style={{ textAlign: 'center', fontWeight: 600 }}>
                {['Placement 1', 'Placement 2', 'Placement 3', 'Assurance vie', 'Compte titre'][i]}
              </div>
            ))}

            <div style={{ textAlign: 'right' }}>Rendement Net de FG</div>
            {inp.products.map((p, i) => (
              <input key={'rate' + i} type="number" step="0.01" value={p.rate * 100}
                     onChange={e => { const v = { ...inp }; v.products[i].rate = (+e.target.value || 0) / 100; setInp(v) }}
                     style={{ padding: '6px 8px' }} />
            ))}

            <div style={{ textAlign: 'right' }}>Placement initial</div>
            {inp.products.map((p, i) => (
              <input key={'init' + i} type="number" step="100" value={p.initial}
                     onChange={e => { const v = { ...inp }; v.products[i].initial = +e.target.value || 0; setInp(v) }}
                     style={{ padding: '6px 8px' }} />
            ))}

            <div style={{ textAlign: 'right' }}>Frais d'entrée</div>
            {inp.products.map((p, i) => (
              <input key={'fee' + i} type="number" step="0.01" value={(p.entryFeePct || 0) * 100}
                     onChange={e => { const v = { ...inp }; v.products[i].entryFeePct = (+e.target.value || 0) / 100; setInp(v) }}
                     style={{ padding: '6px 8px' }} />
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {!rows && <div style={{ color: '#666', padding: 8 }}>Clique sur <b>Calculer</b> pour remplir le tableau.</div>}
            {rows && (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      {r.map((c, j) => (
                        <td key={j} style={{ padding: '6px', fontWeight: (i <= 2 || /Durée/.test(r[0])) ? 600 : 700 }}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Graphique à droite (SVG) */}
        <div style={{ border: '2px solid #2d2d2d', padding: 12 }}>
          <ChartPanel res={res} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="chip" onClick={run} disabled={loading}>{loading ? 'Calcul...' : 'Calculer'}</button>
        <button className="chip" onClick={() => { setInp(DEFAULT_INPUT); setRes(null) }}>Réinitialiser</button>
      </div>

      {err && <div style={{ marginTop: 10, color: '#b00020' }}>Erreur : {err}</div>}
    </div>
  )
}

function ChartPanel({ res }) {
  if (!res?.series?.length) return <div style={{ color: '#666' }}>Le graphique s’affichera après calcul.</div>

  const W = 560, H = 320, P = 40
  let max = 0; res.series.forEach(s => s.values.forEach(v => { if (v > max) max = v }))
  const x = (i) => P + i * ((W - 2 * P) / (res.years.length - 1 || 1))
  const y = (v) => H - P - ((v / max) * (H - 2 * P))
  const colors = ['#2C3D38', '#CEC1B6', '#E4D0BB', '#888888', '#444555']

  return (
    <svg width={W} height={H}>
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#bbb" />
      <line x1={P} y1={P} x2={P} y2={H - P} stroke="#bbb" />
      {res.series.map((s, si) => {
        const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
        return <path key={si} d={d} fill="none" stroke={colors[si % colors.length]} strokeWidth="2.5" />
      })}
      {res.series.map((s, si) => {
        const i = s.values.length - 1
        const vx = x(i), vy = y(s.values[i])
        return (
          <g key={'lab' + si}>
            <circle cx={vx} cy={vy} r="3" fill="#333" />
            <text x={vx + 6} y={vy - 6} fontSize="12" fill="#333">{fmt(s.values[i])} €</text>
          </g>
        )
      })}
    </svg>
  )
}
