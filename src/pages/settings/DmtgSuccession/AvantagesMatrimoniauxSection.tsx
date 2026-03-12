// @ts-nocheck
import React from 'react';
import { AVANTAGES_MATRIMONIAUX_REFERENCE } from './dmtgReferenceData';

export default function AvantagesMatrimoniauxSection({ openSection, setOpenSection }) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={openSection === 'avantagesMatrimoniaux'}
        onClick={() => setOpenSection(openSection === 'avantagesMatrimoniaux' ? null : 'avantagesMatrimoniaux')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Avantages matrimoniaux
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'avantagesMatrimoniaux' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'avantagesMatrimoniaux' && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Clauses de contrat de mariage influençant la liquidation civile avant calcul des droits de succession.
            Ces éléments doivent être qualifiés avant tout calcul DMTG.
          </p>

          {AVANTAGES_MATRIMONIAUX_REFERENCE.map((item) => (
            <div key={item.id} className="income-tax-block" style={{ marginBottom: 12 }}>
              <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
                {item.label}
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: '0 0 6px 0' }}>
                <strong style={{ color: 'var(--color-c1)' }}>Définition :</strong> {item.definition}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: '0 0 6px 0' }}>
                <strong style={{ color: 'var(--color-c1)' }}>Impact patrimonial :</strong> {item.impact}
              </p>
              <div style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 6 }}>
                <strong style={{ color: 'var(--color-c1)' }}>Champs minimaux :</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {item.minimumFields.map((field) => <li key={field}>{field}</li>)}
                </ul>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-c9)', margin: 0 }}>
                Références: {item.legalRefs}
              </p>
            </div>
          ))}

          <div className="income-tax-block" style={{ marginTop: 4 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Vigilances juridiques
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--color-c9)', fontSize: 13 }}>
              <li style={{ marginBottom: 4 }}>
                Les avantages matrimoniaux ne sont en principe pas qualifiés de donations.
                Références : C. civ. art. 1516, 1525, 1527.
              </li>
              <li style={{ marginBottom: 4 }}>
                En présence d&apos;enfants non communs, l&apos;excédent au-delà de la quotité entre époux peut être réduit.
                Références : C. civ. art. 1527 et 1094-1.
              </li>
              <li>
                En cas de divorce, les avantages à effet différé sont révoqués de plein droit sauf volonté contraire.
                Référence : C. civ. art. 265 (version en vigueur depuis le 2 juin 2024).
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

