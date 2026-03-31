/**
 * SituationFiscaleStep — Step 3: income, deductions, and PER contributions per declarant.
 */

import React from 'react';
import type { DeclarantRevenus } from '../../../../../engine/per';

interface SituationFiscaleStepProps {
  situationFamiliale: 'celibataire' | 'marie';
  nombreParts: number;
  isole: boolean;
  isCouple: boolean;
  mutualisationConjoints: boolean;
  declarant1: DeclarantRevenus;
  declarant2: DeclarantRevenus;
  onUpdateSituation: (_patch: Partial<{
    situationFamiliale: 'celibataire' | 'marie';
    nombreParts: number;
    isole: boolean;
    mutualisationConjoints: boolean;
  }>) => void;
  onUpdateDeclarant: (_decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
}

function NumField({ label, value, onChange, suffix, min }: {
  label: string; value: number; onChange: (_v: number) => void; suffix?: string; min?: number;
}): React.ReactElement {
  return (
    <div className="per-field">
      <label>{label}{suffix ? ` (${suffix})` : ''}</label>
      <input type="number" min={min ?? 0} value={value || ''} placeholder="0"
        onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

function DeclarantBlock({ label, d, onChange }: {
  label: string; d: DeclarantRevenus; onChange: (_patch: Partial<DeclarantRevenus>) => void;
}): React.ReactElement {
  return (
    <div className="per-declarant-block">
      <h3 className="per-declarant-title">{label}</h3>

      <h4 className="per-section-label">Revenus</h4>
      <div className="per-fields">
        <NumField label="Traitements et salaires" value={d.salaires} onChange={(v) => onChange({ salaires: v })} suffix="€" />
        <NumField label="Revenus art. 62 (gérants)" value={d.art62} onChange={(v) => onChange({ art62: v })} suffix="€" />
        <NumField label="BIC / BNC / BA" value={d.bic} onChange={(v) => onChange({ bic: v })} suffix="€" />
        <NumField label="Pensions et retraites" value={d.retraites} onChange={(v) => onChange({ retraites: v })} suffix="€" />
        <NumField label="Revenus fonciers nets" value={d.fonciersNets} onChange={(v) => onChange({ fonciersNets: v })} suffix="€" />
        <NumField label="Autres revenus" value={d.autresRevenus} onChange={(v) => onChange({ autresRevenus: v })} suffix="€" />
      </div>

      <div className="per-frais-reels">
        <label className="per-toggle-label">
          <input type="checkbox" checked={d.fraisReels} onChange={(e) => onChange({ fraisReels: e.target.checked })} />
          <span>Frais réels</span>
        </label>
        {d.fraisReels && (
          <NumField label="Montant frais réels" value={d.fraisReelsMontant} onChange={(v) => onChange({ fraisReelsMontant: v })} suffix="€" />
        )}
      </div>

      <h4 className="per-section-label">Versements épargne retraite</h4>
      <div className="per-fields">
        <NumField label="PER 163 quatervicies (6NS/6NT)" value={d.cotisationsPer163Q} onChange={(v) => onChange({ cotisationsPer163Q: v })} suffix="€" />
        <NumField label="PERP et assimilés (6RS/6RT)" value={d.cotisationsPerp} onChange={(v) => onChange({ cotisationsPerp: v })} suffix="€" />
        <NumField label="Art. 83 employeur+salarié (6QS/6QT)" value={d.cotisationsArt83} onChange={(v) => onChange({ cotisationsArt83: v })} suffix="€" />
        <NumField label="PER 154 bis Madelin (6OS/6OT)" value={d.cotisationsMadelin154bis} onChange={(v) => onChange({ cotisationsMadelin154bis: v })} suffix="€" />
        <NumField label="Madelin retraite" value={d.cotisationsMadelinRetraite} onChange={(v) => onChange({ cotisationsMadelinRetraite: v })} suffix="€" />
        <NumField label="Abondement PERCO" value={d.abondementPerco} onChange={(v) => onChange({ abondementPerco: v })} suffix="€" />
        <NumField label="Prévoyance Madelin" value={d.cotisationsPrevo} onChange={(v) => onChange({ cotisationsPrevo: v })} suffix="€" />
      </div>
    </div>
  );
}

export default function SituationFiscaleStep({
  situationFamiliale, nombreParts, isole, isCouple, mutualisationConjoints,
  declarant1, declarant2, onUpdateSituation, onUpdateDeclarant,
}: SituationFiscaleStepProps): React.ReactElement {
  return (
    <div className="per-step">
      <h2 className="per-step-title">Situation fiscale et versements</h2>

      <div className="per-card">
        <div className="per-fields">
          <div className="per-field">
            <label>Situation familiale</label>
            <select value={situationFamiliale}
              onChange={(e) => onUpdateSituation({ situationFamiliale: e.target.value as 'celibataire' | 'marie' })}>
              <option value="marie">Marié / Pacsé</option>
              <option value="celibataire">Célibataire / Veuf / Divorcé</option>
            </select>
          </div>
          <NumField label="Nombre de parts" value={nombreParts}
            onChange={(v) => onUpdateSituation({ nombreParts: Math.max(1, v) })} min={1} />
          {situationFamiliale === 'celibataire' && (
            <div className="per-field">
              <label className="per-toggle-label">
                <input type="checkbox" checked={isole} onChange={(e) => onUpdateSituation({ isole: e.target.checked })} />
                <span>Parent isolé</span>
              </label>
            </div>
          )}
          {isCouple && (
            <div className="per-field">
              <label className="per-toggle-label">
                <input type="checkbox" checked={mutualisationConjoints}
                  onChange={(e) => onUpdateSituation({ mutualisationConjoints: e.target.checked })} />
                <span>Mutualisation des plafonds (case 6QR)</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <DeclarantBlock label="Déclarant 1" d={declarant1} onChange={(p) => onUpdateDeclarant(1, p)} />
      {isCouple && (
        <DeclarantBlock label="Déclarant 2" d={declarant2} onChange={(p) => onUpdateDeclarant(2, p)} />
      )}
    </div>
  );
}
