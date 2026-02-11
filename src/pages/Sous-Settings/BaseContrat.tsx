/**
 * BaseContrat — Référentiel contrats V3
 *
 * Page /settings/base-contrat.
 * Remplace ProductCatalog.tsx (conservé intact pour rollback).
 */

import React from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { useBaseContratSettings } from '@/hooks/useBaseContratSettings';
import { UserInfoBanner } from '@/components/UserInfoBanner';

export default function BaseContrat() {
  const { isAdmin } = useUserRole();
  const { settings, loading, saving, message, save, setSettings, setMessage } =
    useBaseContratSettings();

  if (loading) return <p>Chargement…</p>;
  if (!settings) return <p>Aucune donnée.</p>;

  const products = settings.products ?? [];

  return (
    <div style={{ marginTop: 16 }}>
      <UserInfoBanner />

      <div
        style={{
          fontSize: 15,
          marginTop: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Header */}
        <div className="settings-premium-card" style={{ padding: '20px 24px' }}>
          <h2
            className="settings-premium-title"
            style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--color-c10)' }}
          >
            Référentiel contrats
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-c9)' }}>
            Catalogue des produits d'investissement et de leurs règles fiscales par phase
            (constitution, sortie, décès).
          </p>
        </div>

        {/* Product list placeholder — will be replaced in COMMIT 5 */}
        {products.length === 0 ? (
          <div
            className="settings-premium-card"
            style={{ padding: '32px 24px', textAlign: 'center' }}
          >
            <p style={{ color: 'var(--color-c9)', fontSize: 14, margin: 0 }}>
              Aucun produit enregistré.
              {isAdmin && ' Utilisez le bouton ci-dessous pour ajouter un produit.'}
            </p>
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="settings-premium-card"
              style={{ padding: '16px 24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'var(--color-c3)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                  }}
                >
                  {p.holders}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'var(--color-c8)',
                    color: 'var(--color-c10)',
                  }}
                >
                  {p.family}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-c10)' }}>
                  {p.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>
                  ({p.id})
                </span>
              </div>
            </div>
          ))
        )}

        {/* Status message */}
        {message && (
          <p style={{ fontSize: 13, color: 'var(--color-c9)', fontStyle: 'italic' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
