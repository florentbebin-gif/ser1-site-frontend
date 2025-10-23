import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'https://cdn.skypack.dev/chart.js';
Chart.register(...registerables);

/* ---------- fonctions utilitaires ---------- */
// formate un nombre en français avec 2 décimales
const fmt = (n) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------- composant principal ---------- */
export default function Credit() {
  const canvasRef = useRef(null);
  const chartRef   = useRef(null);

  /* ---------- état (champs saisissables) ---------- */
  const [C, setC]       = React.useState(447072);   // capital emprunté
  const [taux, setTaux] = React.useState(3.4);      // taux annuel %
  const [duree, setDuree] = React.useState(120);    // durée en mois

  /* ---------- variables dérivées ---------- */
  const tauxMens = taux / 100 / 12;
  const nbMois   = duree;

  // calcule la mensualité constante (formule française d’un prêt amortissable)
  const mensualiteCalc = () => {
    if (tauxMens === 0) return C / nbMois;
    return (C * tauxMens) / (1 - Math.pow(1 + tauxMens, -nbMois));
  };

  // tableau d’amortissement
  const table = React.useMemo(() => {
    const m = mensualiteCalc();
    const lines = [];
    let capitalRestant = C;
    for (let i = 1; i <= nbMois; i++) {
      const interet = capitalRestant * tauxMens;
      const amort   = m - interet;
      capitalRestant -= amort;
      if (capitalRestant < 0) capitalRestant = 0;
      lines.push({
        mois: i,
        interet,
        amortissement: amort,
        crd: capitalRestant,
      });
    }
    return lines;
  }, [C, taux, duree]);

  const coutTotal = table.reduce((s, l) => s + l.interet, 0);

  /* ---------- graphique ---------- */
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: table.map((_, i) => i + 1),
        datasets: [{
          label: 'Capital restant dû (€)',
          data: table.map(l => l.crd),
          borderColor: '#2C3D38',
          backgroundColor: 'rgba(44,61,56,.05)',
          tension: .25,
          fill: true,
          pointRadius: 0,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Mois' } },
          y: { title: { display: true, text: '€' } }
        }
      }
    });
  }, [table]);

  /* ---------- rendu ---------- */
  return (
    <div className="panel">
      <h2>Crédit amortissable</h2>

      <div className="grid-2" style={{ gap: 32 }}>
        {/* ---------- gauche : saisies + tableau ---------- */}
        <div>
          <div className="tiles" style={{ marginBottom: 24 }}>
            <div className="tile">
              <div className="label"><div className="bar"></div><div>Montant emprunté (€)</div></div>
              <input type="number" value={C} onChange={e => setC(Number(e.target.value))} />
            </div>
            <div className="tile">
              <div className="label"><div className="bar"></div><div>Taux annuel (%)</div></div>
              <input type="number" step="0.01" value={taux} onChange={e => setTaux(Number(e.target.value))} />
            </div>
            <div className">
              <div className="label"><div className="bar"></div><div>Durée (mois)</div></div>
              <input type="number" value={duree} onChange={e => setDuree(Number(e.target.value))} />
            </div>
            <div className="tile">
              <div className="label"><div className="bar"></div><div>Mensualité calculée (€)</div></div>
              <input type="text" readOnly value={fmt(mensualiteCalc())} />
            </div>
            <div className="tile">
              <div className="label"><div className="bar"></div><div>Coût total du crédit (€)</div></div>
              <input type="text" readOnly value={fmt(coutTotal)} />
            </div>
          </div>

          {/* tableau d’amortissement (24 premières lignes) */}
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
                  <td style={{ padding: 6, textAlign: 'right' }}>{fmt(l.amortissement)}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{fmt(l.crd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="footer-note">* Les 24 premières lignes sont affichées. Le tableau complet alimente le graphique.</div>
        </div>

        {/* ---------- droite : graphique ---------- */}
        <div>
          <div className="section-title">
            <h3>Capital restant dû par mois</h3>
          </div>
          <canvas ref={canvasRef} style={{ maxHeight: 320 }} />
        </div>
      </div>
    </div>
  );
}
