        {/* 1. Barème impôt sur le revenu */}
        <section>
          <h3>Barème de l’impôt sur le revenu</h3>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
            Barème progressif par tranches (taux et retraitement) pour le
            barème actuel et celui de l’année précédente.
          </p>

          <div className="income-tax-columns">
            {/* Colonne 2025 / revenus 2024 */}
            <div className="income-tax-col">
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Barème {incomeTax.currentYearLabel}
              </div>

              {/* Tableau barème 2025 */}
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>De</th>
                    <th>À</th>
                    <th>Taux&nbsp;%</th>
                    <th>Retraitement&nbsp;€</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeTax.scaleCurrent.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="number"
                          value={numberOrEmpty(row.from)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scaleCurrent',
                              idx,
                              'from',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={numberOrEmpty(row.to)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scaleCurrent',
                              idx,
                              'to',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={numberOrEmpty(row.rate)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scaleCurrent',
                              idx,
                              'rate',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={numberOrEmpty(row.deduction)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scaleCurrent',
                              idx,
                              'deduction',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Blocs sous le barème 2025 */}
              <div className="income-tax-extra">
                {/* 1. Plafond du quotient familial */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Plafond du quotient familial
                  </div>
                  <div className="settings-field-row">
                    <label>Par 1/2 part supplémentaire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.quotientFamily.plafondPartSup
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'quotientFamily', 'plafondPartSup'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Parent isolé (2 premières parts)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.quotientFamily
                          .plafondParentIsoléDeuxPremièresParts
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'quotientFamily',
                            'plafondParentIsoléDeuxPremièresParts',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* 2. Décote */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">Décote</div>
                  <div className="settings-field-row">
                    <label>Déclenchement célibataire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.decote.triggerSingle)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'triggerSingle'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Déclenchement couple</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.decote.triggerCouple)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'triggerCouple'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Montant célibataire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.decote.amountSingle)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'amountSingle'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Montant couple</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.decote.amountCouple)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'amountCouple'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Taux de la décote</label>
                    <input
                      type="number"
                      step="0.01"
                      value={numberOrEmpty(incomeTax.decote.ratePercent)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'ratePercent'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>%</span>
                  </div>
                </div>

                {/* 3. Abattement 10 % */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;%
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.current.plafond)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'current', 'plafond'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.current.plancher)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'current', 'plancher'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* 4. Abattement 10 % pensions retraite */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;% pensions retraite
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesCurrent.plafond
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'retireesCurrent', 'plafond'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesCurrent.plancher
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'abat10',
                            'retireesCurrent',
                            'plancher',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 2024 / revenus 2023 */}
            <div className="income-tax-col income-tax-col-right">
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Barème {incomeTax.previousYearLabel}
              </div>

              {/* Tableau barème 2024 */}
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>De</th>
                    <th>À</th>
                    <th>Taux&nbsp;%</th>
                    <th>Retraitement&nbsp;€</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeTax.scalePrevious.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="number"
                          value={numberOrEmpty(row.from)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scalePrevious',
                              idx,
                              'from',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={numberOrEmpty(row.to)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scalePrevious',
                              idx,
                              'to',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={numberOrEmpty(row.rate)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scalePrevious',
                              idx,
                              'rate',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={numberOrEmpty(row.deduction)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scalePrevious',
                              idx,
                              'deduction',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Blocs sous le barème 2024 */}
              <div className="income-tax-extra">
                {/* 1. Plafond du quotient familial */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Plafond du quotient familial
                  </div>
                  <div className="settings-field-row">
                    <label>Par 1/2 part supplémentaire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.quotientFamily.plafondPartSup
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'quotientFamily', 'plafondPartSup'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Parent isolé (2 premières parts)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.quotientFamily
                          .plafondParentIsoléDeuxPremièresParts
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'quotientFamily',
                            'plafondParentIsoléDeuxPremièresParts',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* 2. Décote */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">Décote</div>
                  <div className="settings-field-row">
                    <label>Déclenchement célibataire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.decote.triggerSingle)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'triggerSingle'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Déclenchement couple</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.decote.triggerCouple)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'triggerCouple'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Montant célibataire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.decote.amountSingle)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'amountSingle'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Montant couple</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.decote.amountCouple)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'amountCouple'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Taux de la décote</label>
                    <input
                      type="number"
                      step="0.01"
                      value={numberOrEmpty(incomeTax.decote.ratePercent)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'ratePercent'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>%</span>
                  </div>
                </div>

                {/* 3. Abattement 10 % */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;%
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.previous.plafond)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'previous', 'plafond'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.previous.plancher)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'previous', 'plancher'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* 4. Abattement 10 % pensions retraite */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;% pensions retraite
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesPrevious.plafond
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'abat10',
                            'retireesPrevious',
                            'plafond',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesPrevious.plancher
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'abat10',
                            'retireesPrevious',
                            'plancher',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
