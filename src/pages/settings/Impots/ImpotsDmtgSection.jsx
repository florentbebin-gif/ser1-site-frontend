import React from 'react';
import SettingsTable from '@/components/settings/SettingsTable';
import { numberOrEmpty } from '@/utils/settingsHelpers.js';

export default function ImpotsDmtgSection({
  dmtg,
  updateDmtgCategory,
  isAdmin,
  openSection,
  setOpenSection,
}) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-dmtg"
        aria-expanded={openSection === 'dmtg'}
        aria-controls="impots-panel-dmtg"
        onClick={() => setOpenSection(openSection === 'dmtg' ? null : 'dmtg')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Droits de Mutation à Titre Gratuit (DMTG)
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'dmtg' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'dmtg' && (
        <div
          className="fisc-acc-body"
          id="impots-panel-dmtg"
          role="region"
          aria-labelledby="impots-header-dmtg"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Barèmes applicables aux successions et donations selon le lien de parenté.
            Utilisés par le simulateur de placement pour la phase de transmission.
          </p>

          {[
            {
              key: 'ligneDirecte',
              title: 'Ligne directe (enfants, petits-enfants)',
              labelAbattement: 'Abattement par enfant',
            },
            {
              key: 'frereSoeur',
              title: 'Frères et sœurs',
              labelAbattement: 'Abattement frère/sœur',
            },
            {
              key: 'neveuNiece',
              title: 'Neveux et nièces',
              labelAbattement: 'Abattement neveu/nièce',
            },
            {
              key: 'autre',
              title: 'Autres (non-parents)',
              labelAbattement: 'Abattement par défaut',
            },
          ].map(({ key, title, labelAbattement }) => {
            const catData = dmtg?.[key];
            if (!catData) return null;
            return (
              <div
                key={key}
                className="income-tax-block"
                style={{ marginBottom: 24 }}
              >
                <div
                  className="income-tax-block-title"
                  style={{
                    color: 'var(--color-c1)',
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  {title}
                </div>
                <div style={{ paddingLeft: 8 }}>
                  <div className="settings-field-row" style={{ marginBottom: 12 }}>
                    <label>{labelAbattement}</label>
                    <input
                      type="number"
                      value={numberOrEmpty(catData.abattement)}
                      onChange={(e) =>
                        updateDmtgCategory(
                          key,
                          'abattement',
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <SettingsTable
                    columns={[
                      { key: 'from', header: 'De (€)' },
                      { key: 'to', header: 'À (€)' },
                      {
                        key: 'rate',
                        header: 'Taux %',
                        step: '0.1',
                        className: 'taux-col',
                      },
                    ]}
                    rows={catData.scale || []}
                    onCellChange={(idx, colKey, value) =>
                      updateDmtgCategory(key, 'scale', { idx, key: colKey, value })
                    }
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
