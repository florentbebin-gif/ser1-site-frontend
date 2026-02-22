/**
 * BaseContrat — Référentiel contrats V3
 *
 * Page /settings/base-contrat.
 * Remplace ProductCatalog.tsx (historique disponible via git).
 *
 * Layout: accordion par produit → 3 colonnes (constitution / sortie / décès).
 * Versioning: rulesets[] trié effectiveDate DESC. rulesets[0] = éditable.
 */

import React, { useState, useMemo } from 'react';
import { PhaseColumn } from './base-contrat/PhaseColumn';
import { useUserRole } from '@/auth/useUserRole';
import { useBaseContratSettings } from '@/hooks/useBaseContratSettings';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import {
  CONFIDENCE_LABELS,
  CONFIDENCE_ICONS,
  ACTION_LABELS,
  FORM_LABELS,
  MISC_LABELS,
  GRANDE_FAMILLE_OPTIONS,
  NATURE_OPTIONS,
  ELIGIBLE_PM_LABELS,
  ELIGIBLE_PM_OPTIONS,
  SOUSCRIPTION_OUVERTE_LABELS,
  SOUSCRIPTION_OUVERTE_OPTIONS,
} from '@/constants/baseContratLabels';
import { SEED_PRODUCTS, mergeSeedIntoProducts } from '@/constants/baseContratSeed';
import type {
  BaseContratProduct,
  BaseContratSettings,
  VersionedRuleset,
  Block,
  ConfidenceLevel,
  GrandeFamille,
  ProductNature,
  EligiblePM,
  SouscriptionOuverte,
} from '@/types/baseContratSettings';
import { EMPTY_PRODUCT, EMPTY_RULESET } from '@/types/baseContratSettings';
import { buildTemplateRuleset, TEMPLATE_KEYS, TEMPLATE_LABELS } from '@/constants/baseContratTemplates';
import { ConfigureRulesModal } from './base-contrat/modals/ConfigureRulesModal';
import type { TemplateKey } from '@/constants/baseContratTemplates';
import { validateProductSlug, slugifyLabelToCamelCase, suggestAlternativeSlug, normalizeLabel } from '@/utils/slug';
import { evaluatePublicationGate } from '@/features/settings/publicationGate';
import { migrateBaseContratSettingsToLatest } from '@/utils/baseContratSettingsCache';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const PHASE_KEYS = ['constitution', 'sortie', 'deces'] as const;

function chipStyle(bg: string, fg: string): React.CSSProperties {
  return { fontSize: 11, padding: '2px 8px', borderRadius: 4, background: bg, color: fg, fontWeight: 600, lineHeight: '18px' };
}

// FieldRenderer et PhaseColumn extraits dans src/pages/Sous-Settings/base-contrat/
// (refactor godfile — voir PR feat/base-contrat-ux-nav)

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function BaseContrat() {
  const { isAdmin } = useUserRole();
  const { settings, loading, saving, message, save, setSettings, setMessage } =
    useBaseContratSettings();

  // UI state
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BaseContratProduct | null>(null);
  const [closingProduct, setClosingProduct] = useState<BaseContratProduct | null>(null);
  const [newVersionProduct, setNewVersionProduct] = useState<BaseContratProduct | null>(null);
  const [reactivatingProduct, setReactivatingProduct] = useState<BaseContratProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<BaseContratProduct | null>(null);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState('');

  // P0-10: Test import UI state
  const [showImportTestModal, setShowImportTestModal] = useState(false);
  const [importTestJson, setImportTestJson] = useState('');

  // Delete version state
  const [deletingVersionProduct, setDeletingVersionProduct] = useState<BaseContratProduct | null>(null);
  const [deletingVersionIdx, setDeletingVersionIdx] = useState<number | null>(null);

  // P1-03g: Configure rules modal state
  const [configureRulesTarget, setConfigureRulesTarget] = useState<{ productId: string; rulesetIdx: number; phaseKey: 'constitution' | 'sortie' | 'deces' } | null>(null);

  // Navigation / search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFamille, setFilterFamille] = useState<string>('');
  const [filterPPPM, setFilterPPPM] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'actif' | 'cloture' | ''>('');
  const [openFamilyId, setOpenFamilyId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Add/Edit form state
  const [formId, setFormId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formGrandeFamille, setFormGrandeFamille] = useState<GrandeFamille>('Assurance');
  const [formNature, setFormNature] = useState<ProductNature>('Contrat / compte / enveloppe');
  const [formDetensiblePP, setFormDetensiblePP] = useState(true);
  const [formEligiblePM, setFormEligiblePM] = useState<EligiblePM>('non');
  const [formEligiblePMPrecision, setFormEligiblePMPrecision] = useState('');
  const [formSouscriptionOuverte, setFormSouscriptionOuverte] = useState<SouscriptionOuverte>('oui');
  const [formCommentaire, setFormCommentaire] = useState('');
  const [formTemplate, setFormTemplate] = useState('');
  const [formConfidence, setFormConfidence] = useState<ConfidenceLevel | ''>('');
  const [newVersionDate, setNewVersionDate] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Slug validation (live)
  const existingIds = useMemo(() => (settings?.products ?? []).map((p) => p.id), [settings]);
  const slugValidation = useMemo(() => validateProductSlug(formId, existingIds), [formId, existingIds]);
  const slugSuggestion = useMemo(() => {
    if (!formId || !slugValidation.ok) return null;
    const isDuplicate = slugValidation.errors.some((e) => e.includes('existe déjà'));
    if (isDuplicate) return suggestAlternativeSlug(formId, existingIds);
    return null;
  }, [formId, slugValidation, existingIds]);

  const publicationGate = useMemo(
    () => evaluatePublicationGate({ tests: settings?.tests }),
    [settings?.tests],
  );

  // ─── Derived lists (hooks must be before early returns) ───
  const allActiveProducts = useMemo(
    () => (settings?.products ?? []).filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [settings?.products],
  );
  const allClosedProducts = useMemo(
    () => (settings?.products ?? []).filter((p) => !p.isActive),
    [settings?.products],
  );

  const activeProducts = useMemo(() => {
    return allActiveProducts.filter((p) => {
      if (searchQuery && !p.label.toLowerCase().includes(searchQuery.toLowerCase()) && !p.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterFamille && p.grandeFamille !== filterFamille) return false;
      if (filterPPPM === 'pp' && !p.detensiblePP) return false;
      if (filterPPPM === 'pm' && p.eligiblePM === 'non') return false;
      if (filterStatus === 'cloture') return false;
      return true;
    });
  }, [allActiveProducts, searchQuery, filterFamille, filterPPPM, filterStatus]);

  const closedProducts = useMemo(() => {
    if (filterStatus === 'actif') return [];
    return allClosedProducts.filter((p) => {
      if (searchQuery && !p.label.toLowerCase().includes(searchQuery.toLowerCase()) && !p.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterFamille && p.grandeFamille !== filterFamille) return false;
      if (filterPPPM === 'pp' && !p.detensiblePP) return false;
      if (filterPPPM === 'pm' && p.eligiblePM === 'non') return false;
      return true;
    });
  }, [allClosedProducts, searchQuery, filterFamille, filterPPPM, filterStatus]);

  const groupedByFamily = useMemo(() => {
    const map = new Map<string, BaseContratProduct[]>();
    for (const gf of GRANDE_FAMILLE_OPTIONS) {
      const inGroup = activeProducts.filter((p) => p.grandeFamille === gf);
      if (inGroup.length > 0) map.set(gf, inGroup);
    }
    const unclassified = activeProducts.filter((p) => !GRANDE_FAMILLE_OPTIONS.includes(p.grandeFamille as never));
    if (unclassified.length > 0) map.set('Autres', unclassified);
    return map;
  }, [activeProducts]);

  const closedByFamily = useMemo(() => {
    const map = new Map<string, BaseContratProduct[]>();
    for (const p of closedProducts) {
      const gf = p.grandeFamille ?? 'Autres';
      if (!map.has(gf)) map.set(gf, []);
      map.get(gf)!.push(p);
    }
    return map;
  }, [closedProducts]);

  if (loading) return <p>Chargement…</p>;
  if (!settings) return <p>Aucune donnée.</p>;

  const products = settings.products ?? [];

  // ─── Mutations (local state, persisted on Save) ───

  function updateSettings(fn: (_prev: BaseContratSettings) => BaseContratSettings) {
    setSettings((prev) => (prev ? fn(prev) : prev));
    setMessage('');
  }

  function handlePhaseApplicableChange(productId: string, rulesetIdx: number, phaseKey: string, applicable: boolean) {
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          rulesets: p.rulesets.map((rs, ri) => {
            if (ri !== rulesetIdx) return rs;
            return {
              ...rs,
              phases: {
                ...rs.phases,
                [phaseKey]: { ...rs.phases[phaseKey as keyof typeof rs.phases], applicable },
              },
            };
          }),
        };
      }),
    }));
    // Auto-open configure rules modal when activating an empty phase
    if (applicable) {
      const product = settings?.products.find((p) => p.id === productId);
      const rs = product?.rulesets[rulesetIdx];
      const phase = rs?.phases[phaseKey as keyof typeof rs.phases];
      if (phase && phase.blocks.length === 0) {
        setConfigureRulesTarget({ productId, rulesetIdx, phaseKey: phaseKey as 'constitution' | 'sortie' | 'deces' });
      }
    }
  }

  function handleConfigureRulesSave(
    productId: string,
    rulesetIdx: number,
    phaseKey: 'constitution' | 'sortie' | 'deces',
    newBlocks: import('@/types/baseContratSettings').Block[],
  ) {
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          rulesets: p.rulesets.map((rs, ri) => {
            if (ri !== rulesetIdx) return rs;
            return {
              ...rs,
              phases: {
                ...rs.phases,
                [phaseKey]: { ...rs.phases[phaseKey], applicable: true, blocks: [...rs.phases[phaseKey].blocks, ...newBlocks] },
              },
            };
          }),
        };
      }),
    }));
  }

  function handleFieldChange(productId: string, rulesetIdx: number, blockId: string, fieldKey: string, value: unknown) {
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          rulesets: p.rulesets.map((rs, ri) => {
            if (ri !== rulesetIdx) return rs;
            return {
              ...rs,
              phases: PHASE_KEYS.reduce((acc, pk) => {
                const phase = rs.phases[pk];
                acc[pk] = {
                  ...phase,
                  blocks: phase.blocks.map((b: Block) => {
                    if (b.blockId !== blockId) return b;
                    return {
                      ...b,
                      payload: {
                        ...b.payload,
                        [fieldKey]: { ...b.payload[fieldKey], value },
                      },
                    };
                  }),
                };
                return acc;
              }, { ...rs.phases } as VersionedRuleset['phases']),
            };
          }),
        };
      }),
    }));
  }

  function handleAddProduct() {
    if (!formId || !formLabel || !formConfidence) return;
    const validation = validateProductSlug(formId, existingIds);
    if (!validation.ok) { setMessage(validation.errors.join(' ')); return; }
    const maxSort = products.reduce((m, p) => Math.max(m, p.sortOrder), 0);
    const today = new Date().toISOString().slice(0, 10);
    const initialRuleset = formTemplate && TEMPLATE_KEYS.includes(formTemplate as TemplateKey)
      ? buildTemplateRuleset(formTemplate as TemplateKey, today)
      : { ...EMPTY_RULESET, effectiveDate: today };
    // Dériver les champs legacy depuis les métadonnées V2
    const holdersLegacy = formDetensiblePP && formEligiblePM === 'oui'
      ? 'PP+PM' : !formDetensiblePP && formEligiblePM === 'oui'
      ? 'PM' : 'PP';
    const newProduct: BaseContratProduct = {
      ...EMPTY_PRODUCT,
      id: formId,
      label: formLabel,
      grandeFamille: formGrandeFamille,
      nature: formNature,
      detensiblePP: formDetensiblePP,
      eligiblePM: formEligiblePM,
      eligiblePMPrecision: null,
      souscriptionOuverte: formSouscriptionOuverte,
      commentaireQualification: formCommentaire.trim() || null,
      family: 'Autres',
      holders: holdersLegacy as BaseContratProduct['holders'],
      envelopeType: formId,
      open2026: formSouscriptionOuverte === 'oui',
      templateKey: formTemplate || null,
      confidenceLevel: formConfidence,
      sortOrder: maxSort + 1,
      rulesets: [initialRuleset],
    };
    updateSettings((prev) => ({ ...prev, products: [...prev.products, newProduct] }));
    setShowAddModal(false);
    resetForm();
  }

  function handleEditProduct() {
    if (!editingProduct) return;
    const holdersLegacy = formDetensiblePP && formEligiblePM === 'oui'
      ? 'PP+PM' : !formDetensiblePP && formEligiblePM === 'oui'
      ? 'PM' : 'PP';
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              label: formLabel,
              grandeFamille: formGrandeFamille,
              nature: formNature,
              detensiblePP: formDetensiblePP,
              eligiblePM: formEligiblePM,
              eligiblePMPrecision: null,
              souscriptionOuverte: formSouscriptionOuverte,
              commentaireQualification: formCommentaire.trim() || null,
              confidenceLevel: formConfidence as ConfidenceLevel,
              holders: holdersLegacy as BaseContratProduct['holders'],
              open2026: formSouscriptionOuverte === 'oui',
            }
          : p,
      ),
    }));
    setEditingProduct(null);
    resetForm();
  }

  function handleCloseProduct() {
    if (!closingProduct) return;
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === closingProduct.id
          ? { ...p, isActive: false, closedDate: new Date().toISOString().slice(0, 10) }
          : p,
      ),
    }));
    setClosingProduct(null);
  }

  function handleReactivateProduct() {
    if (!reactivatingProduct) return;
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === reactivatingProduct.id
          ? { ...p, isActive: true, closedDate: null }
          : p,
      ),
    }));
    setReactivatingProduct(null);
  }

  function handleDeleteProduct() {
    if (!deletingProduct || deleteConfirmSlug !== 'SUPPRIMER') return;
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== deletingProduct.id),
    }));
    setDeletingProduct(null);
    setDeleteConfirmSlug('');
  }

  function handleDeleteVersion() {
    if (!deletingVersionProduct || deletingVersionIdx === null) return;
    if (deletingVersionIdx === 0) {
      setMessage(FORM_LABELS.confirmDeleteVersionActive);
      setDeletingVersionProduct(null);
      setDeletingVersionIdx(null);
      return;
    }
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== deletingVersionProduct.id) return p;
        const newRulesets = p.rulesets.filter((_, i) => i !== deletingVersionIdx);
        return { ...p, rulesets: newRulesets };
      }),
    }));
    // Clamp selectedVersionIdx to 0 after deletion
    setSelectedVersionIdx((prev) => ({ ...prev, [deletingVersionProduct.id]: 0 }));
    setDeletingVersionProduct(null);
    setDeletingVersionIdx(null);
  }

  function handleInitCatalogue() {
    if (!isAdmin) return;
    const today = new Date().toISOString().slice(0, 10);
    const withDates = SEED_PRODUCTS.map((p) => ({
      ...p,
      rulesets: [{ ...EMPTY_RULESET, effectiveDate: today }],
    }));
    updateSettings((prev) => ({ ...prev, products: withDates }));
    setMessage(`Catalogue initialisé : ${withDates.length} produits chargés.`);
  }

  function handleCompleteCatalogue() {
    if (!isAdmin) return;
    const today = new Date().toISOString().slice(0, 10);
    const existing = settings?.products ?? [];
    const merged = mergeSeedIntoProducts(existing).map((p) =>
      p.rulesets.length === 0 ? { ...p, rulesets: [{ ...EMPTY_RULESET, effectiveDate: today }] } : p
    );
    const added = merged.length - existing.length;
    updateSettings((prev) => ({ ...prev, products: merged }));
    setMessage(added > 0 ? MISC_LABELS.completeCatalogueResult(added) : MISC_LABELS.completeCatalogueUpToDate);
  }

  async function handleSyncCatalogue() {
    if (!isAdmin || !settings) return;
    // 1) Apply full migration chain (purges structured, assimilates OPC/GF/crypto, splits PP/PM)
    const migrated = migrateBaseContratSettingsToLatest(settings);
    // 2) Merge with seed to add any missing products
    const today = new Date().toISOString().slice(0, 10);
    const merged = mergeSeedIntoProducts(migrated.products).map((p) =>
      p.rulesets.length === 0 ? { ...p, rulesets: [{ ...EMPTY_RULESET, effectiveDate: today }] } : p
    );
    const synced: BaseContratSettings = { ...migrated, products: merged };
    // 3) Save to Supabase
    const ok = await save(synced);
    if (ok) {
      setMessage(MISC_LABELS.syncCatalogueResult(synced.products.length));
    }
  }

  function handleNewVersion() {
    if (!newVersionProduct || !newVersionDate) return;
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== newVersionProduct.id) return p;
        const copied: VersionedRuleset = JSON.parse(JSON.stringify(p.rulesets[0] ?? EMPTY_RULESET));
        copied.effectiveDate = newVersionDate;
        return { ...p, rulesets: [copied, ...p.rulesets] };
      }),
    }));
    setSelectedVersionIdx((prev) => ({ ...prev, [newVersionProduct.id]: 0 }));
    setNewVersionProduct(null);
    setNewVersionDate('');
  }

  async function handleSave() {
    if (!isAdmin || !settings) return;
    await save(settings);
  }

  // P0-10: Import test handler
  function handleImportTest() {
    if (!importTestJson.trim()) {
      setMessage('Collez un JSON de test valide.');
      return;
    }
    try {
      const parsed = JSON.parse(importTestJson);
      // Validation minimale : doit avoir input et expectedOutput
      if (!parsed.input || !parsed.expectedOutput) {
        setMessage('JSON invalide : doit contenir "input" et "expectedOutput".');
        return;
      }
      const newTest = {
        id: crypto.randomUUID(),
        productId: parsed.productId || 'general',
        description: parsed.description || 'Test importé',
        input: parsed.input,
        expectedOutput: parsed.expectedOutput,
        importedAt: new Date().toISOString(),
        importedBy: 'admin', // Simplifié pour MVP
      };
      updateSettings((prev) => ({
        ...prev,
        tests: [...(prev.tests ?? []), newTest],
      }));
      setShowImportTestModal(false);
      setImportTestJson('');
      setMessage(`✓ Test importé : ${newTest.description}`);
    } catch (e) {
      setMessage('JSON invalide : ' + (e instanceof Error ? e.message : 'erreur de parsing'));
    }
  }

  function resetForm() {
    setFormId('');
    setFormLabel('');
    setFormGrandeFamille('Assurance');
    setFormNature('Contrat / compte / enveloppe');
    setFormDetensiblePP(true);
    setFormEligiblePM('non');
    setFormEligiblePMPrecision('');
    setFormSouscriptionOuverte('oui');
    setFormCommentaire('');
    setFormTemplate('');
    setFormConfidence('');
    setSlugManuallyEdited(false);
  }

  function openEditModal(p: BaseContratProduct) {
    setFormLabel(p.label);
    setFormGrandeFamille(p.grandeFamille ?? 'Assurance');
    setFormNature(p.nature ?? 'Contrat / compte / enveloppe');
    setFormDetensiblePP(p.detensiblePP ?? true);
    setFormEligiblePM(p.eligiblePM ?? 'non');
    setFormEligiblePMPrecision(p.eligiblePMPrecision ?? '');
    setFormSouscriptionOuverte(p.souscriptionOuverte ?? 'oui');
    setFormCommentaire(p.commentaireQualification ?? '');
    setFormConfidence(p.confidenceLevel);
    setEditingProduct(p);
  }

  // ─── Render ───

  return (
    <div style={{ marginTop: 16 }}>
      <UserInfoBanner />

      <div style={{ fontSize: 15, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div className="settings-premium-card" style={{ padding: '20px 24px' }}>
          <h2 className="settings-premium-title" style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--color-c10)' }}>
            Référentiel contrats
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-c9)' }}>
            Catalogue des produits d&apos;investissement et de leurs règles fiscales par phase (constitution, sortie, décès).
          </p>
        </div>

        {/* CTA Admin */}
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            {products.length === 0 && (
              <button className="chip" onClick={handleInitCatalogue} style={{ padding: '8px 20px', fontWeight: 600 }} title={MISC_LABELS.initCatalogueHint}>
                {ACTION_LABELS.initCatalogue}
              </button>
            )}
            {products.length > 0 && (
              <button className="chip" onClick={handleCompleteCatalogue} style={{ padding: '8px 20px', fontWeight: 600 }} title={MISC_LABELS.completeCatalogueHint}>
                {ACTION_LABELS.completeCatalogue}
              </button>
            )}
            {products.length > 0 && (
              <button className="chip" onClick={handleSyncCatalogue} style={{ padding: '8px 20px', fontWeight: 600 }} title={MISC_LABELS.syncCatalogueHint}>
                {ACTION_LABELS.syncCatalogue}
              </button>
            )}
            <button className="chip" onClick={() => { resetForm(); setShowAddModal(true); }} style={{ padding: '8px 20px', fontWeight: 600 }}>
              + {ACTION_LABELS.addProduct}
            </button>
            <button className="chip" onClick={() => setShowImportTestModal(true)} style={{ padding: '8px 20px', fontWeight: 600 }}>
              Importer un cas de test
            </button>
          </div>
        )}

        {/* ── Barre recherche + filtres ── */}
        {products.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit…"
              style={{ flex: '1 1 200px', fontSize: 13, padding: '7px 12px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
            />
            <select
              value={filterFamille}
              onChange={(e) => setFilterFamille(e.target.value)}
              style={{ fontSize: 12, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
            >
              <option value="">Toutes les familles</option>
              {GRANDE_FAMILLE_OPTIONS.map((gf) => <option key={gf} value={gf}>{gf}</option>)}
            </select>
            <select
              value={filterPPPM}
              onChange={(e) => setFilterPPPM(e.target.value)}
              style={{ fontSize: 12, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
            >
              <option value="">PP + PM</option>
              <option value="pp">PP direct</option>
              <option value="pm">Éligible PM</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'actif' | 'cloture' | '')}
              style={{ fontSize: 12, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
            >
              <option value="">Actifs + clôturés</option>
              <option value="actif">Actifs seulement</option>
              <option value="cloture">Clôturés seulement</option>
            </select>
            {(searchQuery || filterFamille || filterPPPM || filterStatus) && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setFilterFamille(''); setFilterPPPM(''); setFilterStatus(''); }}
                style={{ fontSize: 12, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', background: 'none', color: 'var(--color-c9)', cursor: 'pointer' }}
              >
                Réinitialiser
              </button>
            )}
            <span style={{ width: 1, height: 24, background: 'var(--color-c8)', alignSelf: 'center' }} />
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              title={showDetails ? 'Masquer les détails techniques (clés internes, $ref)' : 'Afficher les détails techniques pour diagnostic'}
              style={{
                fontSize: 12,
                padding: '7px 12px',
                borderRadius: 6,
                border: `1px solid ${showDetails ? 'var(--color-c3)' : 'var(--color-c8)'}`,
                background: showDetails ? 'var(--color-c3)' : 'none',
                color: showDetails ? '#FFFFFF' : 'var(--color-c9)',
                cursor: 'pointer',
                fontWeight: showDetails ? 600 : 400,
              }}
            >
              {showDetails ? '⚙ Mode détaillé' : '⚙ Afficher les détails'}
            </button>
          </div>
        )}

        {/* Empty state */}
        {allActiveProducts.length === 0 && (
          <div className="settings-premium-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-c9)', fontSize: 14, margin: 0 }}>
              {isAdmin ? MISC_LABELS.noProductsAdmin : MISC_LABELS.noProducts}
            </p>
          </div>
        )}

        {/* Résultat vide après filtres */}
        {allActiveProducts.length > 0 && activeProducts.length === 0 && closedProducts.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-c9)', fontStyle: 'italic', textAlign: 'center' }}>Aucun produit ne correspond aux filtres.</p>
        )}

        {/* ── Groupes par Grande famille ── */}
        {Array.from(groupedByFamily.entries()).map(([famille, familyProducts]) => {
          const isFamilyOpen = openFamilyId === famille;
          const closedInFamily = closedByFamily.get(famille) ?? [];
          return (
            <div key={famille} className="settings-premium-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Family header */}
              <div
                onClick={() => setOpenFamilyId(isFamilyOpen ? null : famille)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', cursor: 'pointer', background: 'var(--color-c7)', borderBottom: isFamilyOpen ? '1px solid var(--color-c8)' : 'none' }}
              >
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-c10)' }}>{famille}</span>
                <span style={chipStyle('var(--color-c8)', 'var(--color-c9)')}>{familyProducts.length} actif{familyProducts.length > 1 ? 's' : ''}</span>
                {closedInFamily.length > 0 && (
                  <span style={chipStyle('var(--color-c8)', 'var(--color-c9)')}>{closedInFamily.length} clôturé{closedInFamily.length > 1 ? 's' : ''}</span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--color-c9)' }}>{isFamilyOpen ? '▲' : '▼'}</span>
              </div>

              {isFamilyOpen && (
                <div style={{ padding: '8px 0' }}>
                  {/* Active products in family */}
                  {familyProducts.map((product) => {
                    const isOpen = openProductId === product.id;
                    const vIdx = selectedVersionIdx[product.id] ?? 0;
                    const ruleset = product.rulesets[vIdx];
                    const isEditableVersion = vIdx === 0;

                    return (
                      <div key={product.id} style={{ borderTop: '1px solid var(--color-c8)' }}>
                        {/* Product header */}
                        <div
                          onClick={() => setOpenProductId(isOpen ? null : product.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', cursor: 'pointer', flexWrap: 'wrap' }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--color-c10)', fontSize: 14 }}>{product.label}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>({product.id})</span>
                          {ruleset && (
                            <span style={{ fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic' }}>
                              {MISC_LABELS.activeVersion} : {ruleset.effectiveDate}
                            </span>
                          )}
                          <span style={chipStyle(
                            product.confidenceLevel === 'confirmed' ? 'var(--color-c3)'
                              : product.confidenceLevel === 'toVerify' ? 'var(--color-c6)'
                              : 'var(--color-c8)',
                            product.confidenceLevel === 'confirmed' ? '#FFFFFF' : 'var(--color-c10)',
                          )}>
                            {CONFIDENCE_ICONS[product.confidenceLevel]} {CONFIDENCE_LABELS[product.confidenceLevel]}
                          </span>
                          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-c9)' }}>{isOpen ? '▲' : '▼'}</span>
                        </div>

                        {/* Product body */}
                        {isOpen && (
                          <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-c8)' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12, marginBottom: 16 }}>
                              {product.rulesets.length > 1 && (
                                <select
                                  value={vIdx}
                                  onChange={(e) => setSelectedVersionIdx((prev) => ({ ...prev, [product.id]: Number(e.target.value) }))}
                                  style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
                                >
                                  {product.rulesets.map((rs, i) => (
                                    <option key={i} value={i}>
                                      {rs.effectiveDate}{i === 0 ? ` (${MISC_LABELS.activeVersion})` : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>{MISC_LABELS.versionCount(product.rulesets.length)}</span>
                              {isAdmin && (
                                <>
                                  <button className="chip" onClick={() => openEditModal(product)} style={{ padding: '4px 12px', fontSize: 12 }}>{ACTION_LABELS.editProduct}</button>
                                  <button className="chip" onClick={() => { setNewVersionProduct(product); setNewVersionDate(''); }} style={{ padding: '4px 12px', fontSize: 12 }}>{ACTION_LABELS.newVersion}</button>
                                  {product.rulesets.length > 1 && vIdx > 0 && (
                                    <button
                                      className="chip"
                                      onClick={() => { setDeletingVersionProduct(product); setDeletingVersionIdx(vIdx); }}
                                      style={{ padding: '4px 12px', fontSize: 12, color: 'var(--color-c1)', borderColor: 'var(--color-c1)' }}
                                    >
                                      {ACTION_LABELS.deleteVersion}
                                    </button>
                                  )}
                                  <button className="chip" onClick={() => setClosingProduct(product)} style={{ padding: '4px 12px', fontSize: 12 }}>{ACTION_LABELS.closeProduct}</button>
                                </>
                              )}
                            </div>
                            {ruleset ? (
                              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                {PHASE_KEYS.map((pk) => (
                                  <PhaseColumn
                                    key={pk}
                                    phaseKey={pk}
                                    phase={ruleset.phases[pk]}
                                    disabled={!isAdmin || !isEditableVersion}
                                    onFieldChange={(blockId, fieldKey, value) =>
                                      handleFieldChange(product.id, vIdx, blockId, fieldKey, value)
                                    }
                                    showDetails={showDetails}
                                    onApplicableChange={isAdmin && isEditableVersion
                                      ? (applicable) => handlePhaseApplicableChange(product.id, vIdx, pk, applicable)
                                      : undefined
                                    }
                                    onConfigureRules={isAdmin && isEditableVersion
                                      ? () => setConfigureRulesTarget({ productId: product.id, rulesetIdx: vIdx, phaseKey: pk })
                                      : undefined
                                    }
                                  />
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: 13, color: 'var(--color-c9)', fontStyle: 'italic' }}>Aucune version définie pour ce produit.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Clôturés dans cette famille */}
                  {closedInFamily.length > 0 && (
                    <details style={{ borderTop: '1px solid var(--color-c8)', padding: '8px 20px' }}>
                      <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--color-c9)', fontWeight: 600, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>▸</span> {MISC_LABELS.closedProducts} ({closedInFamily.length})
                      </summary>
                      <div style={{ marginTop: 8 }}>
                        {closedInFamily.map((p) => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: 'var(--color-c9)' }}>
                            <span>{p.label} ({p.id}) — clôturé le {p.closedDate}</span>
                            {isAdmin && (
                              <>
                                <button className="chip" onClick={() => setReactivatingProduct(p)} style={{ padding: '2px 10px', fontSize: 11 }}>{ACTION_LABELS.reactivateProduct}</button>
                                <button onClick={() => { setDeletingProduct(p); setDeleteConfirmSlug(''); }} style={{ padding: '2px 10px', fontSize: 11, background: 'none', border: '1px solid var(--color-c1)', color: 'var(--color-c1)', borderRadius: 6, cursor: 'pointer' }}>{ACTION_LABELS.deleteProduct}</button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Clôturés hors familles actives (filtre cloture seulement) */}
        {filterStatus === 'cloture' && closedProducts.length > 0 && groupedByFamily.size === 0 && (
          <div className="settings-premium-card" style={{ padding: '12px 20px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-c9)', margin: '0 0 8px' }}>{MISC_LABELS.closedProducts} ({closedProducts.length})</p>
            {closedProducts.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: 'var(--color-c9)' }}>
                <span style={chipStyle('var(--color-c8)', 'var(--color-c9)')}>{p.grandeFamille ?? p.family}</span>
                <span>{p.label} ({p.id}) — clôturé le {p.closedDate}</span>
                {isAdmin && (
                  <>
                    <button className="chip" onClick={() => setReactivatingProduct(p)} style={{ padding: '2px 10px', fontSize: 11 }}>{ACTION_LABELS.reactivateProduct}</button>
                    <button onClick={() => { setDeletingProduct(p); setDeleteConfirmSlug(''); }} style={{ padding: '2px 10px', fontSize: 11, background: 'none', border: '1px solid var(--color-c1)', color: 'var(--color-c1)', borderRadius: 6, cursor: 'pointer' }}>{ACTION_LABELS.deleteProduct}</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Save — toujours actif (gate = warning non-bloquant) */}
        {isAdmin && (
          <button
            type="button"
            className="chip"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 28px', fontWeight: 600, alignSelf: 'flex-end' }}
          >
            {saving ? ACTION_LABELS.saving : ACTION_LABELS.save}
          </button>
        )}

        {/* Gate warnings (non-bloquants) */}
        {isAdmin && publicationGate.blocked && (
          <div style={{ background: 'var(--color-c7)', border: '1px solid var(--color-c8)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--color-c9)' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--color-c10)' }}>⚠️ {MISC_LABELS.gateWarningNoTests}</p>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600 }}>{MISC_LABELS.gateTestGuideTitle}</p>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.7 }}>
              {MISC_LABELS.gateTestGuideSteps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        )}

        {/* Message */}
        {message && (
          <p style={{ fontSize: 13, color: 'var(--color-c9)', fontStyle: 'italic' }}>{message}</p>
        )}
      </div>

      {/* ──── Modal: Importer un test ──── */}
      {showImportTestModal && (
        <div className="report-modal-overlay" onClick={() => setShowImportTestModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="report-modal-header">
              <h3>Importer un cas de test JSON (P0-10 Gate)</h3>
              <button className="report-modal-close" onClick={() => setShowImportTestModal(false)}>&#x2715;</button>
            </div>
            <div className="report-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: 0 }}>
                <strong>Obligatoire avant publication :</strong> Importez au moins 1 cas de test JSON.
                Le bouton "Enregistrer" sera bloqué tant qu'aucun test n'est importé.
              </p>
              <label style={{ fontSize: 13, fontWeight: 600 }}>JSON du test :</label>
              <textarea
                value={importTestJson}
                onChange={(e) => setImportTestJson(e.target.value)}
                placeholder={`{\n  "description": "Test assurance vie - rachat partiel",\n  "productId": "assuranceVie",\n  "input": { "capital": 100000, "duree": 8 },\n  "expectedOutput": { "tmi": 30, "impot": 7500 }\n}`}
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  padding: '12px',
                  borderRadius: 6,
                  border: '1px solid var(--color-c8)',
                  backgroundColor: '#FFFFFF',
                  minHeight: 200,
                  resize: 'vertical',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--color-c9)' }}>
                Format attendu : {"{ \"input\": {...}, \"expectedOutput\": {...}, \"description\": \"...\" }"}
              </div>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setShowImportTestModal(false)}>Annuler</button>
              <button className="chip" onClick={handleImportTest} disabled={!importTestJson.trim()} style={{ padding: '8px 20px', fontWeight: 600 }}>
                Valider l'import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Configurer les règles (P1-03g) ──── */}
      {configureRulesTarget && (() => {
        const tgt = configureRulesTarget;
        const product = products.find((p) => p.id === tgt.productId);
        const ruleset = product?.rulesets[tgt.rulesetIdx];
        if (!product || !ruleset) return null;
        return (
          <ConfigureRulesModal
            product={product}
            ruleset={ruleset}
            initialPhase={tgt.phaseKey}
            onClose={() => setConfigureRulesTarget(null)}
            onSave={(phaseKey, newBlocks) => {
              handleConfigureRulesSave(tgt.productId, tgt.rulesetIdx, phaseKey, newBlocks);
              setConfigureRulesTarget(null);
            }}
          />
        );
      })()}

      {/* ──── Modal: Ajouter un produit ──── */}
      {showAddModal && (
        <div className="report-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="report-modal-header">
              <h3>{ACTION_LABELS.addProduct}</h3>
              <button className="report-modal-close" onClick={() => setShowAddModal(false)}>&#x2715;</button>
            </div>
            <div className="report-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productLabel} *</label>
              <input
                value={formLabel}
                onChange={(e) => {
                  const normalized = normalizeLabel(e.target.value);
                  setFormLabel(normalized);
                  if (!slugManuallyEdited) {
                    setFormId(slugifyLabelToCamelCase(normalized));
                  }
                }}
                placeholder="Assurance-vie"
                style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
              />

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productId} *</label>
              <input
                value={formId}
                onChange={(e) => { setFormId(e.target.value); setSlugManuallyEdited(true); }}
                placeholder="ex : assuranceVie"
                style={{
                  fontSize: 13, padding: '8px 10px', borderRadius: 6, backgroundColor: '#FFFFFF',
                  border: `1px solid ${formId ? (slugValidation.ok ? 'var(--color-c3)' : 'var(--color-c1)') : 'var(--color-c8)'}`,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                {formId ? (
                  slugValidation.ok
                    ? <span style={{ fontSize: 11, color: 'var(--color-c3)', fontWeight: 600 }}>&#x2713; Slug valide</span>
                    : <span style={{ fontSize: 11, color: 'var(--color-c1)' }}>{slugValidation.errors[0]}</span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>{FORM_LABELS.productIdHint}</span>
                )}
                <span style={{ fontSize: 10, color: 'var(--color-c9)', whiteSpace: 'nowrap' }}>{formId.length}/40</span>
              </div>
              {slugSuggestion && (
                <div style={{ fontSize: 11, color: 'var(--color-c9)' }}>
                  Suggestion : <button type="button" onClick={() => setFormId(slugSuggestion)} style={{ fontSize: 11, color: 'var(--color-c2)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>{slugSuggestion}</button>
                </div>
              )}
              <div style={{ background: 'var(--color-c7)', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: 'var(--color-c9)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--color-c10)' }}>R&#232;gles slug</strong><br />
                &#x2022; camelCase, commence par une minuscule<br />
                &#x2022; Lettres (a-z, A-Z) et chiffres uniquement, 3 &#224; 40 car.<br />
                &#x2022; Ex : <code>assuranceVie</code>, <code>perIndividuel</code>, <code>scpiPinel</code>
              </div>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productGrandeFamille} *</label>
              <select value={formGrandeFamille} onChange={(e) => setFormGrandeFamille(e.target.value as GrandeFamille)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                {GRANDE_FAMILLE_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productNature} *</label>
              <select value={formNature} onChange={(e) => setFormNature(e.target.value as ProductNature)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                {NATURE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productDetensiblePP} *</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {[true, false].map((v) => (
                  <label key={String(v)} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="detensiblePP" checked={formDetensiblePP === v} onChange={() => setFormDetensiblePP(v)} />
                    {v ? 'Oui' : 'Non'}
                  </label>
                ))}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productEligiblePM} *</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {ELIGIBLE_PM_OPTIONS.map((v) => (
                  <label key={v} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="eligiblePM" checked={formEligiblePM === v} onChange={() => setFormEligiblePM(v)} />
                    {ELIGIBLE_PM_LABELS[v]}
                  </label>
                ))}
              </div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productSouscriptionOuverte} *</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {SOUSCRIPTION_OUVERTE_OPTIONS.map((v) => (
                  <label key={v} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="souscriptionOuverte" checked={formSouscriptionOuverte === v} onChange={() => setFormSouscriptionOuverte(v)} />
                    {SOUSCRIPTION_OUVERTE_LABELS[v]}
                  </label>
                ))}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productCommentaire}</label>
              <textarea
                value={formCommentaire}
                onChange={(e) => setFormCommentaire(e.target.value)}
                placeholder={FORM_LABELS.productCommentaireHint}
                rows={2}
                style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF', resize: 'vertical' }}
              />

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.confidenceLevel} *</label>
              <select
                value={formConfidence}
                onChange={(e) => setFormConfidence(e.target.value as ConfidenceLevel)}
                style={{ fontSize: 13, padding: '8px 10px', border: `1px solid ${formConfidence ? 'var(--color-c8)' : 'var(--color-c1)'}`, borderRadius: 6, backgroundColor: '#FFFFFF' }}
              >
                <option value="">{FORM_LABELS.confidencePlaceholder}</option>
                <option value="confirmed">{CONFIDENCE_ICONS.confirmed} {CONFIDENCE_LABELS.confirmed}</option>
                <option value="provisional">{CONFIDENCE_ICONS.provisional} {CONFIDENCE_LABELS.provisional}</option>
                <option value="toVerify">{CONFIDENCE_ICONS.toVerify} {CONFIDENCE_LABELS.toVerify}</option>
              </select>
              <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>{FORM_LABELS.confidenceHint}</span>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.templateKey}</label>
              <select value={formTemplate} onChange={(e) => setFormTemplate(e.target.value)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                <option value="">{FORM_LABELS.templateNone}</option>
                {TEMPLATE_KEYS.map((k) => <option key={k} value={k}>{TEMPLATE_LABELS[k]}</option>)}
              </select>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setShowAddModal(false)}>{ACTION_LABELS.cancel}</button>
              <button className="chip" onClick={handleAddProduct} disabled={!formId || !formLabel || !formConfidence || !slugValidation.ok} style={{ padding: '8px 20px', fontWeight: 600 }}>
                {ACTION_LABELS.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Modifier ──── */}
      {editingProduct && (
        <div className="report-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3>{ACTION_LABELS.editProduct} — {editingProduct.label}</h3>
              <button className="report-modal-close" onClick={() => setEditingProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productLabel}</label>
              <input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }} />

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productGrandeFamille}</label>
              <select value={formGrandeFamille} onChange={(e) => setFormGrandeFamille(e.target.value as GrandeFamille)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                {GRANDE_FAMILLE_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productNature}</label>
              <select value={formNature} onChange={(e) => setFormNature(e.target.value as ProductNature)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                {NATURE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productDetensiblePP}</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {[true, false].map((v) => (
                  <label key={String(v)} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="editDetensiblePP" checked={formDetensiblePP === v} onChange={() => setFormDetensiblePP(v)} />
                    {v ? 'Oui' : 'Non'}
                  </label>
                ))}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productEligiblePM}</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {ELIGIBLE_PM_OPTIONS.map((v) => (
                  <label key={v} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="editEligiblePM" checked={formEligiblePM === v} onChange={() => setFormEligiblePM(v)} />
                    {ELIGIBLE_PM_LABELS[v]}
                  </label>
                ))}
              </div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productSouscriptionOuverte}</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {SOUSCRIPTION_OUVERTE_OPTIONS.map((v) => (
                  <label key={v} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="editSouscriptionOuverte" checked={formSouscriptionOuverte === v} onChange={() => setFormSouscriptionOuverte(v)} />
                    {SOUSCRIPTION_OUVERTE_LABELS[v]}
                  </label>
                ))}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productCommentaire}</label>
              <textarea
                value={formCommentaire}
                onChange={(e) => setFormCommentaire(e.target.value)}
                placeholder={FORM_LABELS.productCommentaireHint}
                rows={2}
                style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF', resize: 'vertical' }}
              />

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.confidenceLevel}</label>
              <select
                value={formConfidence}
                onChange={(e) => setFormConfidence(e.target.value as ConfidenceLevel)}
                style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
              >
                <option value="confirmed">{CONFIDENCE_ICONS.confirmed} {CONFIDENCE_LABELS.confirmed}</option>
                <option value="provisional">{CONFIDENCE_ICONS.provisional} {CONFIDENCE_LABELS.provisional}</option>
                <option value="toVerify">{CONFIDENCE_ICONS.toVerify} {CONFIDENCE_LABELS.toVerify}</option>
              </select>
              <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>{FORM_LABELS.confidenceHint}</span>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setEditingProduct(null)}>{ACTION_LABELS.cancel}</button>
              <button className="chip" onClick={handleEditProduct} style={{ padding: '8px 20px', fontWeight: 600 }}>{ACTION_LABELS.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Supprimer une version ──── */}
      {deletingVersionProduct && deletingVersionIdx !== null && (
        <div className="report-modal-overlay" onClick={() => { setDeletingVersionProduct(null); setDeletingVersionIdx(null); }}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3 style={{ color: 'var(--color-c1)' }}>{ACTION_LABELS.deleteVersion}</h3>
              <button className="report-modal-close" onClick={() => { setDeletingVersionProduct(null); setDeletingVersionIdx(null); }}>&#x2715;</button>
            </div>
            <div className="report-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--color-c1)', fontWeight: 600, margin: 0 }}>
                {FORM_LABELS.confirmDeleteVersion}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: 0 }}>
                {deletingVersionProduct.label} — version du {deletingVersionProduct.rulesets[deletingVersionIdx]?.effectiveDate}
              </p>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => { setDeletingVersionProduct(null); setDeletingVersionIdx(null); }}>{ACTION_LABELS.cancel}</button>
              <button
                className="chip"
                onClick={handleDeleteVersion}
                style={{ padding: '8px 20px', fontWeight: 600, background: 'var(--color-c1)', color: '#FFFFFF' }}
              >
                {ACTION_LABELS.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Nouvelle version ──── */}
      {newVersionProduct && (
        <div className="report-modal-overlay" onClick={() => setNewVersionProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3>{ACTION_LABELS.newVersion} — {newVersionProduct.label}</h3>
              <button className="report-modal-close" onClick={() => setNewVersionProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content">
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: '0 0 12px' }}>{FORM_LABELS.effectiveDateHint}</p>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>{FORM_LABELS.effectiveDate} *</label>
              <input
                type="date"
                value={newVersionDate}
                onChange={(e) => setNewVersionDate(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
              />
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setNewVersionProduct(null)}>{ACTION_LABELS.cancel}</button>
              <button className="chip" onClick={handleNewVersion} disabled={!newVersionDate} style={{ padding: '8px 20px', fontWeight: 600 }}>
                {ACTION_LABELS.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Clôturer ──── */}
      {closingProduct && (
        <div className="report-modal-overlay" onClick={() => setClosingProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3>{ACTION_LABELS.closeProduct} — {closingProduct.label}</h3>
              <button className="report-modal-close" onClick={() => setClosingProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content">
              <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>{FORM_LABELS.confirmClose}</p>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setClosingProduct(null)}>{ACTION_LABELS.cancel}</button>
              <button className="chip" onClick={handleCloseProduct} style={{ padding: '8px 20px', fontWeight: 600 }}>{ACTION_LABELS.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Réactiver ──── */}
      {reactivatingProduct && (
        <div className="report-modal-overlay" onClick={() => setReactivatingProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3>{ACTION_LABELS.reactivateProduct} — {reactivatingProduct.label}</h3>
              <button className="report-modal-close" onClick={() => setReactivatingProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content">
              <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>{FORM_LABELS.confirmReactivate}</p>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setReactivatingProduct(null)}>{ACTION_LABELS.cancel}</button>
              <button className="chip" onClick={handleReactivateProduct} style={{ padding: '8px 20px', fontWeight: 600 }}>{ACTION_LABELS.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Supprimer définitivement ──── */}
      {deletingProduct && (
        <div className="report-modal-overlay" onClick={() => { setDeletingProduct(null); setDeleteConfirmSlug(''); }}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3 style={{ color: 'var(--color-c1)' }}>{FORM_LABELS.confirmDeleteTitle}</h3>
              <button className="report-modal-close" onClick={() => { setDeletingProduct(null); setDeleteConfirmSlug(''); }}>&#x2715;</button>
            </div>
            <div className="report-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--color-c1)', fontWeight: 600, margin: 0 }}>
                {FORM_LABELS.confirmDeleteWarning}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: 0 }}>
                {deletingProduct.label} (<code>{deletingProduct.id}</code>) — {deletingProduct.rulesets.length} version{deletingProduct.rulesets.length > 1 ? 's' : ''}
              </p>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                {FORM_LABELS.confirmDeleteTypeSUPPRIMER}
              </label>
              <input
                value={deleteConfirmSlug}
                onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                placeholder="SUPPRIMER"
                autoComplete="off"
                style={{
                  fontSize: 13, padding: '8px 10px', borderRadius: 6, backgroundColor: '#FFFFFF',
                  border: `1px solid ${deleteConfirmSlug === 'SUPPRIMER' ? 'var(--color-c1)' : 'var(--color-c8)'}`,
                }}
              />
            </div>
            <div className="report-modal-actions">
              <button onClick={() => { setDeletingProduct(null); setDeleteConfirmSlug(''); }}>{ACTION_LABELS.cancel}</button>
              <button
                onClick={handleDeleteProduct}
                disabled={deleteConfirmSlug !== 'SUPPRIMER'}
                style={{
                  padding: '8px 20px', fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                  backgroundColor: deleteConfirmSlug === 'SUPPRIMER' ? 'var(--color-c1)' : 'var(--color-c8)',
                  color: '#FFFFFF', border: 'none',
                }}
              >
                {ACTION_LABELS.deleteProduct}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
