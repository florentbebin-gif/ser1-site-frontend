import React from 'react'

// formatage € français
const fmt = (n, d = 2) =>
  Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })

export default function Credit() {
  // État (champs saisissables)
  const [C, setC] = React.useState(447072)     // capital emprunté
  const [taux, setTaux] = React.useState(3.4)  // taux annuel %
  const [duree, setDuree] = React.useState(120) // durée en mois

  // Variables dérivées
  const tauxMens = taux / 100 / 12
  const nbMois = Math.max(1, Math.floor(duree))

  const mensualite = React.useMemo(() => {
    if (tauxMens === 0) return C / nbMois
    return (C * tauxMens) / (1 - Math.pow(1 + tauxMens, -nbMois))
  }, [C, tauxMens, nbMois])

  // Tableau d’amortissement complet
  const table = React.useMemo(() => {
    const m = mensualite
    const lines = []
    let crd = C
    for (let i = 1; i <= nbMois; i++) {
      const interet = crd * tauxMens
      const amort = m - interet
      crd = Math.max(0, crd - amort)
      lines.push({ mois: i, interet, amort, crd })
    }
    return lines
  }, [C, mensualite, tauxMens, nbMois])

  const coutTotal = React.useMemo(
    () => table.reduce((s, l) => s + l.interet, 0),
    [table]
  )

  return (
    <div className="panel">
      <h2>Crédit amortissable</h2>

      <div className="grid-2" style={{ gap: 32 }}>
        {/* Gauche : saisies + tableau (24 lignes) */}
        <div>
          <div className="tiles" style={{ marginBottom: 24 }}>
            <div className="tile">
              <div className="label"><div className="bar"></div><div>Montant emprunté (€)</div></div>
              <input type="number" value={C} onChange={e => setC(Number(e.target.value) || 0)} />
            </div>

            <div className="tile">
              <div className="label"><div className="bar"></div><div>Taux annuel (%)</div></div>
              <input type="number" step="0.01" value={taux} onChange={e => setTaux(Number(e.target.value) || 0)} />
            </div>

            <div className="tile">
              <div className="label"><div className="bar"></div><div>Durée (mois)</div></div>
              <input type="number" value={duree} onChange={e => setDuree(Number(e.target.value) || 0)} />
            </div>

            <div className="tile">
              <div className="label"><div className="bar"></div><div>Mensualité calculée (€)</div></div>
              <input type="text" readOnly value={fmt(mensualite)} />
            </div>

            <div className="tile">
              <div className="label"><div className="bar"></div><div>Coût total du crédit (€)</div></div>
              <input type="text" readOnly value={fmt(coutTotal)} />
            </div>
          </div>

          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f4f4f3' }}>
                <th style={{ padding: 6, textAlign: 'left' }}>Mois</th>
                <th style={{ padding: 6, textAlign: 'right' }}>Intérêts (€)</th>
                <th style={{ padding: 6, textAlign: 'right' }}>Amortissement (€)</th>
                <th style={{ padding: 6, textAlign: 'right' }}>CRD (€)</th>
              </tr>
            </thead>
            <tbody>
              {table.slice(0, 24).map(l => (
                <tr key={l.mois}>
                  <td style={{ padding: 6 }}>{l.mois}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{fmt(l.interet)}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{fmt(l.amort)}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{fmt(l.crd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="footer-note">
            * Les 24 premières lignes sont affichées. Le tableau complet alimente le graphique.
          </div>
        </div>

        {/* Droite : graphique SVG (pas de lib externe) */}
        <div>
          <div className="section-title"><h3>Capital restant dû par mois</h3></div>
          <LineSVG data={table.map(r => r.crd)} labels={table.map(r => r.mois)} />
        </div>
      </div>
    </div>
  )
}

/** Petit composant de courbe en SVG pur */
function LineSVG({ data, labels }) {
  if (!data?.length) return null
  const W = 560, H = 320, P = 40
  const max = Math.max(...data)
  const x = i => P + (i * (W - 2 * P)) / (data.length - 1 || 1)
  const y = v => H - P - ((v / max) * (H - 2 * P))

  const path = data.map((v, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(v)}`).join(' ')

  return (
    <svg width={W} height={H}>
      {/* axes */}
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#bbb" />
      <line x1={P} y1={P} x2={P} y2={H - P} stroke="#bbb" />

      {/* courbe */}
      <path d={path} fill="none" stroke="#2C3D38" strokeWidth="2.5" />
      {/* point et label final */}
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="3" fill="#333" />
      <text x={x(data.length - 1) + 6} y={y(data[data.length - 1]) - 6} fontSize="12" fill="#333">
        {fmt(data[data.length - 1], 0)} €
      </text>
    </svg>
  )
}
