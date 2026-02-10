import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { invalidate, broadcastInvalidation } from '@/utils/fiscalSettingsCache.js';
import { migrateV1toV2 } from '@/utils/fiscalitySettingsMigrator';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { numberOrEmpty, createFieldUpdater } from '@/utils/settingsHelpers.js';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import SettingsTable from '@/components/settings/SettingsTable';
import './SettingsFiscalites.css';

import type {
  FiscalitySettingsV2,
  Product,
  ProductHolders,
  ProductNature,
  Ruleset,
  OfficialSource,
} from '@/types/fiscalitySettings';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const NATURE_OPTIONS: ProductNature[] = ['Assurance', 'Bancaire', 'Titres', 'Immobilier', 'D\u00e9fiscalisation', 'Autres'];
const HOLDERS_OPTIONS: ProductHolders[] = ['PP', 'PM', 'PP+PM'];
const HOLDERS_LABEL: Record<string, string> = { PP: 'Pers. physique', PM: 'Pers. morale', 'PP+PM': 'PP + PM' };

const REF_HINT = 'Valeur r\u00e9f\u00e9renc\u00e9e depuis Param\u00e8tres imp\u00f4ts ou Param\u00e8tres sociaux';

const FIELD_LABELS: Record<string, string> = {
  retraitsCapital: 'Retraits / rachats',
  psRatePercent: 'Taux pr\u00e9l\u00e8vements sociaux (%)',
  irRatePercent: 'Taux IR forfaitaire (%)',
  irRateOverThresholdPercent: 'Taux IR au-del\u00e0 du seuil (%)',
  avant2017: 'Versements avant le 27/09/2017',
  depuis2017: 'Versements depuis le 27/09/2017',
  moins8Ans: 'Contrat de moins de 8 ans',
  plus8Ans: 'Contrat de 8 ans et plus',
  abattementSingle: 'Abattement (c\u00e9libataire)',
  abattementCouple: 'Abattement (couple)',
  seuilPrimes: 'Seuil de primes vers\u00e9es',
  tauxSousSeuil: 'Taux sous le seuil (%)',
  tauxSurSeuil: 'Taux au-dessus du seuil (%)',
  successionArt990I: 'Succession \u2014 Art. 990 I',
  successionArt757B: 'Succession \u2014 Art. 757 B',
  abattement: 'Abattement',
  tranche1Taux: 'Taux tranche 1 (%)',
  tranche1Plafond: 'Plafond tranche 1',
  tranche2Taux: 'Taux tranche 2 (%)',
  epargne: 'Phase d\'\u00e9pargne',
  sortieCapital: 'Sortie en capital',
  pfu: 'Pr\u00e9l\u00e8vement forfaitaire unique (PFU)',
  bareme: 'Bar\u00e8me progressif',
  rente: 'Sortie en rente',
  deces: 'D\u00e9c\u00e8s',
  deduits: 'Versements d\u00e9duits',
  nonDeduits: 'Versements non d\u00e9duits',
  capitalQuotePart: 'Quote-part capital',
  interestsQuotePart: 'Quote-part int\u00e9r\u00eats',
  rvtoTaxableFractionByAgeAtFirstPayment: 'Fraction imposable par \u00e2ge (RVTO)',
  ancienneteMinAns: 'Anciennet\u00e9 minimale (ann\u00e9es)',
  exonerationIRApresAnciennete: 'Exon\u00e9ration IR apr\u00e8s anciennet\u00e9',
  abattementPercent: 'Abattement (%)',
  dividendesAbattementPercent: 'Abattement dividendes (%)',
  rateSocial: 'Taux social (%)',
  rateIR: 'Taux IR (%)',
  from: 'De',
  to: '\u00c0',
  rate: 'Taux',
  age: '\u00c2ge',
  fraction: 'Fraction',
};

function labelFor(key: string): string {
  return FIELD_LABELS[key] || key;
}

const EMPTY_PRODUCT: Omit<Product, 'sortOrder'> = {
  key: '',
  label: '',
  holders: 'PP',
  nature: 'Autres',
  isActive: true,
};

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
                {labelFor(key)}
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
                {labelFor(key)}
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
              <label style={{ flex: '1 1 auto', fontSize: 13 }}>{labelFor(key)}</label>
              <span
                title={REF_HINT}
                style={{
                  fontSize: 12,
                  color: 'var(--color-c9)',
                  fontStyle: 'italic',
                  minWidth: 200,
                  textAlign: 'right',
                  cursor: 'help',
                  borderBottom: '1px dotted var(--color-c8)',
                }}
              >
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
              <label style={{ flex: '1 1 auto', fontSize: 13 }}>{labelFor(key)}</label>
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
            label={labelFor(key)}
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
      header: labelFor(k),
      type: isNum ? ('number' as const) : ('text' as const),
      step: isNum ? 'any' : undefined,
    };
  });

  const handleCellChange = (rowIdx: number, colKey: string, val: unknown) => {
    onChange([...parentPath, String(rowIdx), colKey], val);
  };

  return (
    <div>
      <SettingsTable
        columns={columns}
        rows={rows as Record<string, unknown>[]}
        onCellChange={handleCellChange}
        disabled={disabled}
      />
      {!disabled && (
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button
            onClick={() => {
              const newRow = Object.fromEntries(keys.map((k) => [k, null]));
              onChange([...parentPath, String(rows.length)], newRow);
            }}
            style={{ padding: '4px 12px', fontSize: 12, border: '1px solid var(--color-c8)', borderRadius: 4, background: '#FFFFFF', color: 'var(--color-c10)', cursor: 'pointer' }}
          >
            + Ajouter une ligne
          </button>
          {rows.length > 0 && (
            <button
              onClick={() => {
                const updated = (rows as unknown[]).slice(0, -1);
                onChange(parentPath, updated);
              }}
              style={{ padding: '4px 12px', fontSize: 12, border: '1px solid var(--color-c8)', borderRadius: 4, background: '#FFFFFF', color: 'var(--color-c9)', cursor: 'pointer' }}
            >
              Supprimer la derni\u00e8re ligne
            </button>
          )}
        </div>
      )}
    </div>
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
          style={{ marginBottom: 8, borderLeftColor: 'var(--color-c9)', position: 'relative' }}
        >
          <SettingsFieldRow
            label="Libell\u00e9"
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
          {!disabled && (
            <button
              onClick={() => {
                const updated = sources.filter((_, i) => i !== idx);
                onChange(['rulesetsByKey', productKey, 'sources'], updated);
              }}
              style={{ padding: '4px 10px', fontSize: 11, border: '1px solid var(--color-c8)', borderRadius: 4, background: '#FFFFFF', color: 'var(--color-c9)', cursor: 'pointer', marginTop: 4 }}
            >
              Supprimer cette source
            </button>
          )}
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

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [closingProduct, setClosingProduct] = useState<Product | null>(null);
  const [newVersionProduct, setNewVersionProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Omit<Product, 'sortOrder'>>({ ...EMPTY_PRODUCT });
  const [newVersionDate, setNewVersionDate] = useState('');

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

  // ───────── CRUD handlers ─────────
  const handleAddProduct = () => {
    if (!settings || !productForm.key || !productForm.label) return;
    const exists = settings.products.some((p) => p.key === productForm.key);
    if (exists) { setMessage('Erreur : cette cl\u00e9 existe d\u00e9j\u00e0.'); return; }
    const maxSort = settings.products.reduce((m, p) => Math.max(m, p.sortOrder), 0);
    const newProduct: Product = { ...productForm, sortOrder: maxSort + 1 } as Product;
    const newRuleset: Ruleset = { effectiveDate: new Date().toISOString().slice(0, 10), rules: {}, sources: [] };
    setSettings({
      ...settings,
      products: [...settings.products, newProduct],
      rulesetsByKey: { ...settings.rulesetsByKey, [newProduct.key]: newRuleset },
    });
    setShowAddModal(false);
    setProductForm({ ...EMPTY_PRODUCT });
    setMessage('');
  };

  const handleEditProduct = () => {
    if (!settings || !editingProduct) return;
    setSettings({
      ...settings,
      products: settings.products.map((p) =>
        p.key === editingProduct.key
          ? { ...p, label: productForm.label, holders: productForm.holders, nature: productForm.nature }
          : p,
      ),
    });
    setEditingProduct(null);
    setMessage('');
  };

  const handleCloseProduct = () => {
    if (!settings || !closingProduct) return;
    const today = new Date().toISOString().slice(0, 10);
    setSettings({
      ...settings,
      products: settings.products.map((p) =>
        p.key === closingProduct.key ? { ...p, isActive: false, closedDate: today } : p,
      ),
    });
    setClosingProduct(null);
    setMessage('');
  };

  const handleNewVersion = () => {
    if (!settings || !newVersionProduct || !newVersionDate) return;
    const existing = settings.rulesetsByKey[newVersionProduct.key];
    const newRules = existing ? JSON.parse(JSON.stringify(existing.rules)) : {};
    setSettings({
      ...settings,
      rulesetsByKey: {
        ...settings.rulesetsByKey,
        [newVersionProduct.key]: { effectiveDate: newVersionDate, rules: newRules, sources: existing?.sources || [] },
      },
    });
    setNewVersionProduct(null);
    setNewVersionDate('');
    setMessage('');
  };

  const openEditModal = (product: Product) => {
    setProductForm({ key: product.key, label: product.label, holders: product.holders, nature: product.nature, isActive: product.isActive });
    setEditingProduct(product);
  };

  // ───────── Save (identical pattern to SettingsImpots / SettingsPrelevements) ─────────
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
        setMessage('R\u00e9f\u00e9rentiel contrats enregistr\u00e9.');
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
  if (loading) return <p>Chargement\u2026</p>;
  if (!user) return <p>Vous devez \u00eatre connect\u00e9 pour voir cette page.</p>;
  if (!settings) return <p>Aucune donn\u00e9e.</p>;

  const products = settings.products || [];
  const rulesets = settings.rulesetsByKey || {};
  const activeProducts = products.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const closedProducts = products.filter((p) => !p.isActive);

  return (
    <div style={{ marginTop: 16 }}>
      <UserInfoBanner />

      <div style={{ fontSize: 15, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* CTA Ajouter un produit (admin-only) */}
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="chip"
            onClick={() => { setProductForm({ ...EMPTY_PRODUCT }); setShowAddModal(true); }}
            style={{ padding: '8px 16px', fontWeight: 600 }}
          >
            + Ajouter un produit
          </button>
        </div>
      )}

      {/* Produits actifs */}
      <div className="fisc-accordion">
        {activeProducts.map((product) => {
          const isOpen = openProductKey === product.key;
          const ruleset: Ruleset | undefined = rulesets[product.key];

          return (
            <div key={product.key} className="fisc-acc-item">
              {/* Header */}
              <button
                className="fisc-acc-header"
                onClick={() => setOpenProductKey(isOpen ? null : product.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Holders badge */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    border: '1px solid var(--color-c8)', color: 'var(--color-c9)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>
                    {HOLDERS_LABEL[product.holders] || product.holders}
                  </span>
                  {/* Nature badge */}
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    background: 'var(--color-c7)', color: 'var(--color-c9)',
                  }}>
                    {product.nature}
                  </span>
                  {/* Label + key */}
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-c10)' }}>
                    {product.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>
                    ({product.key})
                  </span>
                  {/* Effective date */}
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
                  {/* Admin actions bar */}
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      <button
                        className="chip"
                        onClick={() => openEditModal(product)}
                        style={{ padding: '4px 12px', fontSize: 12 }}
                      >
                        Modifier le produit
                      </button>
                      <button
                        className="chip"
                        onClick={() => { setNewVersionProduct(product); setNewVersionDate(''); }}
                        style={{ padding: '4px 12px', fontSize: 12 }}
                      >
                        Nouvelle version
                      </button>
                      <button
                        className="chip"
                        onClick={() => setClosingProduct(product)}
                        style={{ padding: '4px 12px', fontSize: 12, color: 'var(--color-c9)' }}
                      >
                        Cl\u00f4turer
                      </button>
                    </div>
                  )}

                  {/* Effective date field */}
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

      {/* Produits cl\u00f4tur\u00e9s */}
      {closedProducts.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="fisc-section-title" style={{ color: 'var(--color-c9)' }}>Produits cl\u00f4tur\u00e9s</div>
          <div className="fisc-accordion">
            {closedProducts.map((product) => (
              <div key={product.key} className="fisc-acc-item" style={{ opacity: 0.6 }}>
                <div className="fisc-acc-header" style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--color-c8)', color: 'var(--color-c9)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {HOLDERS_LABEL[product.holders] || product.holders}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-c10)', textDecoration: 'line-through' }}>
                      {product.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>({product.key})</span>
                    {product.closedDate && (
                      <span style={{ fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic' }}>
                        Cl\u00f4tur\u00e9 le {product.closedDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton Enregistrer (chip, identique aux autres pages Settings) */}
      {isAdmin && (
        <button
          type="button"
          className="chip"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Enregistrement\u2026' : 'Enregistrer les param\u00e8tres'}
        </button>
      )}
      {message && (
        <div className="settings-success-message" style={{
          fontSize: 14,
          marginTop: 12,
          padding: '12px 16px',
          background: message.includes('Erreur') ? 'var(--color-error-bg)' : 'var(--color-success-bg)',
          border: message.includes('Erreur') ? '1px solid var(--color-error-border)' : '1px solid var(--color-success-border)',
          borderRadius: 6,
          color: message.includes('Erreur') ? 'var(--color-error-text)' : 'var(--color-success-text)',
          fontWeight: 500,
        }}>
          {message}
        </div>
      )}

      </div>{/* fin container */}

      {/* ═══════ MODALS ═══════ */}

      {/* Modal : Ajouter un produit */}
      {showAddModal && (
        <div className="report-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="report-modal-header">
              <h3>Ajouter un produit</h3>
              <button className="report-modal-close" onClick={() => setShowAddModal(false)}>&#x2715;</button>
            </div>
            <div className="report-modal-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Cl\u00e9 unique (slug) *</label>
                  <input
                    type="text"
                    value={productForm.key}
                    onChange={(e) => setProductForm({ ...productForm, key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                    placeholder="ex : sciOpci"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>Non modifiable apr\u00e8s cr\u00e9ation</span>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Libell\u00e9 *</label>
                  <input
                    type="text"
                    value={productForm.label}
                    onChange={(e) => setProductForm({ ...productForm, label: e.target.value })}
                    placeholder="ex : SCI / OPCI"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>D\u00e9tenteurs</label>
                  <select
                    value={productForm.holders}
                    onChange={(e) => setProductForm({ ...productForm, holders: e.target.value as ProductHolders })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
                  >
                    {HOLDERS_OPTIONS.map((h) => <option key={h} value={h}>{HOLDERS_LABEL[h]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Nature</label>
                  <select
                    value={productForm.nature}
                    onChange={(e) => setProductForm({ ...productForm, nature: e.target.value as ProductNature })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
                  >
                    {NATURE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setShowAddModal(false)}>Annuler</button>
              <button
                className="chip"
                onClick={handleAddProduct}
                disabled={!productForm.key || !productForm.label}
                style={{ padding: '8px 20px', fontWeight: 600 }}
              >
                Cr\u00e9er le produit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal : Modifier un produit */}
      {editingProduct && (
        <div className="report-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="report-modal-header">
              <h3>Modifier \u00ab {editingProduct.label} \u00bb</h3>
              <button className="report-modal-close" onClick={() => setEditingProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: 'var(--color-c9)' }}>Cl\u00e9</label>
                  <input type="text" value={editingProduct.key} disabled style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: 'var(--color-c7)', color: 'var(--color-c9)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Libell\u00e9 *</label>
                  <input
                    type="text"
                    value={productForm.label}
                    onChange={(e) => setProductForm({ ...productForm, label: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>D\u00e9tenteurs</label>
                  <select
                    value={productForm.holders}
                    onChange={(e) => setProductForm({ ...productForm, holders: e.target.value as ProductHolders })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
                  >
                    {HOLDERS_OPTIONS.map((h) => <option key={h} value={h}>{HOLDERS_LABEL[h]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Nature</label>
                  <select
                    value={productForm.nature}
                    onChange={(e) => setProductForm({ ...productForm, nature: e.target.value as ProductNature })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
                  >
                    {NATURE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setEditingProduct(null)}>Annuler</button>
              <button
                className="chip"
                onClick={handleEditProduct}
                disabled={!productForm.label}
                style={{ padding: '8px 20px', fontWeight: 600 }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal : Nouvelle version */}
      {newVersionProduct && (
        <div className="report-modal-overlay" onClick={() => setNewVersionProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3>Nouvelle version \u2014 {newVersionProduct.label}</h3>
              <button className="report-modal-close" onClick={() => setNewVersionProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content">
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: '0 0 12px' }}>
                Les r\u00e8gles actuelles seront copi\u00e9es dans la nouvelle version.
                Vous pourrez ensuite les modifier.
              </p>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Date d'entr\u00e9e en vigueur *</label>
              <input
                type="date"
                value={newVersionDate}
                onChange={(e) => setNewVersionDate(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
              />
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setNewVersionProduct(null)}>Annuler</button>
              <button
                className="chip"
                onClick={handleNewVersion}
                disabled={!newVersionDate}
                style={{ padding: '8px 20px', fontWeight: 600 }}
              >
                Cr\u00e9er la version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal : Cl\u00f4turer un produit */}
      {closingProduct && (
        <div className="report-modal-overlay" onClick={() => setClosingProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3>Cl\u00f4turer \u00ab {closingProduct.label} \u00bb</h3>
              <button className="report-modal-close" onClick={() => setClosingProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content">
              <p style={{ fontSize: 13, margin: '0 0 8px' }}>
                Le produit sera marqu\u00e9 comme inactif et n'appara\u00eetra plus dans la liste principale.
                Cette action est r\u00e9versible (r\u00e9activation manuelle possible).
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
                Produit : {closingProduct.label} ({closingProduct.key})
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: 0 }}>
                Date de cl\u00f4ture : {new Date().toISOString().slice(0, 10)}
              </p>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setClosingProduct(null)}>Annuler</button>
              <button
                className="chip"
                onClick={handleCloseProduct}
                style={{ padding: '8px 20px', fontWeight: 600 }}
              >
                Confirmer la cl\u00f4ture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
