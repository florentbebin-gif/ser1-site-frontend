import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { invalidate, broadcastInvalidation } from '@/utils/fiscalSettingsCache.js';
import { migrateV1toV2 } from '@/utils/fiscalitySettingsMigrator';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { numberOrEmpty, textOrEmpty, createFieldUpdater } from '@/utils/settingsHelpers.js';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import SettingsTable from '@/components/settings/SettingsTable';
import './SettingsFiscalites.css';

import type {
  FiscalitySettingsV2,
  Product,
  Ruleset,
  OfficialSource,
} from '@/types/fiscalitySettings';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isRef(v: unknown): boolean {
  return typeof v === 'string' && v.startsWith('$ref:');
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (isRef(v)) return String(v).replace('$ref:', '→ ');
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (typeof v === 'number') return String(v);
  return String(v);
}

/** Recursively renders a rules object as SettingsFieldRow-style read-only lines. */
function RulesTree({
  obj,
  pathPrefix,
  onChange,
  disabled,
  depth = 0,
}: {
  obj: Record<string, unknown>;
  pathPrefix: string[];
  onChange: (path: string[], value: unknown) => void;
  disabled: boolean;
  depth?: number;
}) {
  if (!obj || typeof obj !== 'object') return null;

  return (
    <>
      {Object.entries(obj).map(([key, value]) => {
        const currentPath = [...pathPrefix, key];
        const pathKey = currentPath.join('.');

        // Skip arrays — render as table below
        if (Array.isArray(value)) {
          return (
            <div key={pathKey} style={{ marginTop: 8, marginBottom: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, paddingLeft: depth * 12 }}>
                {key}
              </div>
              <RulesArrayTable
                rows={value}
                parentPath={currentPath}
                onChange={onChange}
                disabled={disabled}
              />
            </div>
          );
        }

        // Nested object — recurse with sub-heading
        if (value !== null && typeof value === 'object') {
          return (
            <div key={pathKey} style={{ marginTop: depth === 0 ? 12 : 6 }}>
              <div
                className={depth === 0 ? 'fisc-section-title' : ''}
                style={depth > 0 ? { fontWeight: 600, fontSize: 13, marginBottom: 2, paddingLeft: depth * 12 } : undefined}
              >
                {key}
              </div>
              <div style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
                <RulesTree
                  obj={value as Record<string, unknown>}
                  pathPrefix={currentPath}
                  onChange={onChange}
                  disabled={disabled}
                  depth={depth + 1}
                />
              </div>
            </div>
          );
        }

        // $ref marker — display as read-only reference
        if (isRef(value)) {
          return (
            <div key={pathKey} className="settings-field-row" style={{ paddingLeft: depth * 12 }}>
              <label style={{ flex: '1 1 auto', fontSize: 13 }}>{key}</label>
              <span style={{
                fontSize: 12,
                color: 'var(--color-c9)',
                fontStyle: 'italic',
                minWidth: 200,
                textAlign: 'right',
              }}>
                {renderValue(value)}
              </span>
            </div>
          );
        }

        // Leaf value — editable field
        const isNum = typeof value === 'number';
        const isBool = typeof value === 'boolean';

        if (isBool) {
          return (
            <div key={pathKey} className="settings-field-row" style={{ paddingLeft: depth * 12 }}>
              <label style={{ flex: '1 1 auto', fontSize: 13 }}>{key}</label>
              <select
                value={value ? 'true' : 'false'}
                onChange={(e) => onChange(currentPath, e.target.value === 'true')}
                disabled={disabled}
                style={{
                  padding: '3px 4px',
                  fontSize: 13,
                  border: '1px solid var(--color-c8)',
                  borderRadius: 4,
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-c10)',
                }}
              >
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
          );
        }

        return (
          <SettingsFieldRow
            key={pathKey}
            label={key}
            path={currentPath}
            value={value}
            onChange={onChange}
            type={isNum ? 'number' : 'text'}
            step={isNum ? 'any' : undefined}
            disabled={disabled}
          />
        );
      })}
    </>
  );
}

/** Renders an array of objects as a settings table. */
function RulesArrayTable({
  rows,
  parentPath,
  onChange,
  disabled,
}: {
  rows: unknown[];
  parentPath: string[];
  onChange: (path: string[], value: unknown) => void;
  disabled: boolean;
}) {
  if (!rows.length) return <p style={{ fontSize: 12, color: 'var(--color-c9)' }}>Aucun élément</p>;

  // Infer columns from first row
  const sample = rows[0];
  if (typeof sample !== 'object' || sample === null) return null;

  const keys = Object.keys(sample as Record<string, unknown>);
  const columns = keys.map((k) => {
    const sampleVal = (sample as Record<string, unknown>)[k];
    const isNum = typeof sampleVal === 'number' || sampleVal === null;
    return {
      key: k,
      header: k,
      type: isNum ? ('number' as const) : ('text' as const),
      step: isNum ? 'any' : undefined,
    };
  });

  const handleCellChange = (rowIdx: number, colKey: string, val: unknown) => {
    onChange([...parentPath, String(rowIdx), colKey], val);
  };

  return (
    <SettingsTable
      columns={columns}
      rows={rows as Record<string, unknown>[]}
      onCellChange={handleCellChange}
      disabled={disabled}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sources section (admin-only)
// ─────────────────────────────────────────────────────────────────────────────

function SourcesSection({
  sources,
  productKey,
  onChange,
  disabled,
}: {
  sources: OfficialSource[];
  productKey: string;
  onChange: (path: string[], value: unknown) => void;
  disabled: boolean;
}) {
  if (!disabled && sources.length === 0) {
    // Admin with no sources — show add button
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Sources officielles</div>
        <button
          onClick={() =>
            onChange(
              ['rulesetsByKey', productKey, 'sources'],
              [{ label: '', url: '', note: '' }],
            )
          }
          style={{
            padding: '6px 14px',
            fontSize: 12,
            border: '1px solid var(--color-c8)',
            borderRadius: 6,
            background: '#FFFFFF',
            color: 'var(--color-c10)',
            cursor: 'pointer',
          }}
        >
          + Ajouter une source
        </button>
      </div>
    );
  }

  if (disabled) {
    // Non-admin: sources are hidden
    return null;
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Sources officielles</div>
      {sources.map((src, idx) => (
        <div
          key={idx}
          className="income-tax-block"
          style={{ marginBottom: 8, borderLeftColor: 'var(--color-c9)' }}
        >
          <SettingsFieldRow
            label="Label"
            path={['rulesetsByKey', productKey, 'sources', String(idx), 'label']}
            value={src.label}
            onChange={onChange}
            type="text"
            disabled={disabled}
          />
          <SettingsFieldRow
            label="URL"
            path={['rulesetsByKey', productKey, 'sources', String(idx), 'url']}
            value={src.url}
            onChange={onChange}
            type="text"
            disabled={disabled}
          />
          <SettingsFieldRow
            label="Note"
            path={['rulesetsByKey', productKey, 'sources', String(idx), 'note']}
            value={src.note}
            onChange={onChange}
            type="text"
            disabled={disabled}
          />
        </div>
      ))}
      <button
        onClick={() => {
          const updated = [...sources, { label: '', url: '', note: '' }];
          onChange(['rulesetsByKey', productKey, 'sources'], updated);
        }}
        style={{
          padding: '6px 14px',
          fontSize: 12,
          border: '1px solid var(--color-c8)',
          borderRadius: 6,
          background: '#FFFFFF',
          color: 'var(--color-c10)',
          cursor: 'pointer',
        }}
      >
        + Ajouter une source
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductCatalog() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null>(null);
  const [settings, setSettings] = useState<FiscalitySettingsV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openProductKey, setOpenProductKey] = useState<string | null>(null);

  const isAdmin =
    user &&
    ((typeof user?.user_metadata?.role === 'string' &&
      (user.user_metadata.role as string).toLowerCase() === 'admin') ||
      user?.user_metadata?.is_admin === true);

  // ───────── Load ─────────
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error('Erreur user:', userErr);
          if (mounted) setLoading(false);
          return;
        }
        const u = userData?.user || null;
        if (!mounted) return;
        setUser(u as typeof user);

        const { data: rows, error: err } = await supabase
          .from('fiscality_settings')
          .select('data')
          .eq('id', 1);

        if (!err && rows && rows.length > 0 && rows[0].data) {
          const v2 = migrateV1toV2(rows[0].data);
          if (mounted) setSettings(v2);
        } else {
          // No DB data — use migrated empty
          if (mounted) setSettings(migrateV1toV2({}));
        }

        if (err && err.code !== 'PGRST116') {
          console.error('Erreur chargement fiscality_settings:', err);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // ───────── Helpers ─────────
  const updateField = useCallback(
    createFieldUpdater(
      setSettings as unknown as React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
      setMessage,
    ),
    [],
  );

  // ───────── Save (same pattern as SettingsFiscalites) ─────────
  const handleSave = async () => {
    if (!isAdmin || !settings) return;

    try {
      setSaving(true);
      setMessage('');

      const { error } = await supabase
        .from('fiscality_settings')
        .upsert({ id: 1, data: settings });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setMessage('Catalogue produits enregistr\u00e9.');
        invalidate('fiscality');
        broadcastInvalidation('fiscality');
      }
    } catch (e) {
      console.error(e);
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // ───────── Render ─────────
  if (loading) return <p>Chargement...</p>;
  if (!user) return <p>Vous devez \u00eatre connect\u00e9 pour voir cette page.</p>;
  if (!settings) return <p>Aucune donn\u00e9e.</p>;

  const products = settings.products || [];
  const rulesets = settings.rulesetsByKey || {};

  return (
    <div style={{ fontSize: 15, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <UserInfoBanner />

      {/* Accordion */}
      <div className="fisc-accordion">
        {products
          .filter((p) => p.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((product) => {
            const isOpen = openProductKey === product.key;
            const ruleset: Ruleset | undefined = rulesets[product.key];

            return (
              <div key={product.key} className="fisc-acc-item">
                {/* Header */}
                <button
                  className="fisc-acc-header"
                  onClick={() => setOpenProductKey(isOpen ? null : product.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--color-c8)',
                      color: 'var(--color-c9)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {product.category}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-c10)' }}>
                      {product.label}
                    </span>
                    {ruleset?.effectiveDate && (
                      <span style={{ fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic' }}>
                        En vigueur : {ruleset.effectiveDate}
                      </span>
                    )}
                  </div>
                  <span className="fisc-acc-chevron">{isOpen ? '\u25B2' : '\u25BC'}</span>
                </button>

                {/* Body */}
                {isOpen && (
                  <div className="fisc-acc-body">
                    {/* Effective date */}
                    <SettingsFieldRow
                      label="Date d'entr\u00e9e en vigueur"
                      path={['rulesetsByKey', product.key, 'effectiveDate']}
                      value={ruleset?.effectiveDate || ''}
                      onChange={updateField}
                      type="text"
                      disabled={!isAdmin}
                    />

                    {/* Rules tree */}
                    {ruleset?.rules && Object.keys(ruleset.rules).length > 0 ? (
                      <RulesTree
                        obj={ruleset.rules as Record<string, unknown>}
                        pathPrefix={['rulesetsByKey', product.key, 'rules']}
                        onChange={updateField}
                        disabled={!isAdmin}
                      />
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--color-c9)', fontStyle: 'italic', marginTop: 8 }}>
                        Aucune r\u00e8gle d\u00e9finie pour ce produit.
                      </p>
                    )}

                    {/* Sources (admin-only) */}
                    <SourcesSection
                      sources={ruleset?.sources || []}
                      productKey={product.key}
                      onChange={updateField}
                      disabled={!isAdmin}
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Save button (admin) */}
      {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 28px',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              borderRadius: 8,
              background: 'var(--color-c2)',
              color: '#FFFFFF',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {message && (
            <span style={{ fontSize: 13, color: message.includes('Erreur') ? '#996600' : 'var(--color-c9)' }}>
              {message}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
