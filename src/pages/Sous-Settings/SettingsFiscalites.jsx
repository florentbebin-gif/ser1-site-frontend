import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SettingsNav from '../SettingsNav';
import './SettingsImpots.css';
import './SettingsFiscalites.css';

// ----------------------
// Clé de version
// ----------------------
const SETTINGS_KEY = 'fiscalites_v1';

// ----------------------
// Valeurs par défaut
// ----------------------
export const DEFAULT_FISCALITES_SETTINGS = {
  meta: {
    title: 'Synthèse fiscalité des enveloppes',
    assumptions: [
      'Résident fiscal France',
      'Pour chaque point : ligne « Régime par défaut » + ligne « Sur option »',
      'SCPI uniquement en direct (revenus fonciers) — pas de SCPI logée en AV/SCI/usufruit',
      'Synthèse opérationnelle : assiette, fait générateur, taux/abattements/conditions, points d’attention',
    ],
    lastReview: '2025-12-30',
  },
  devices: [
    {
      id: 'assurance_vie',
      label: 'Assurance-vie',
      subtitle: 'Enveloppe de capitalisation (fonds € / UC)',
      table: {
        columns: ['Phase', 'Régime par défaut', 'Sur option', "Notes / points d’attention"],
        rows: [
          {
            phase: 'Épargne',
            default:
              '• Versements : pas d’IR dû à l’entrée.\n' +
              '• Fiscalité annuelle : pas d’IR tant qu’il n’y a pas de rachat.\n' +
              '• Prélèvements sociaux (PS) : en pratique, sur fonds en euros les PS sont généralement prélevés au fil de l’eau (sur les intérêts crédités) ; sur unités de compte, les PS sont dus lors d’un fait générateur (rachat / dénouement).',
            option:
              '• Arbitrages internes : non imposables à l’IR (pas de cession taxable), mais certains frais/arbitrages peuvent impacter la perf.\n' +
              '• Choix du mode de gestion (libre/mandatée) et supports : impacts économiques, pas une « option fiscale » au sens IR.',
            notes:
              'Assiette imposable à terme = gains inclus dans le rachat (prorata). Bien distinguer : primes versées / valeur de rachat / gains latents. PS : règles et dates de prélèvement varient selon contrats/supports.',
          },
          {
            phase: 'Retraits',
            default:
              '• Fait générateur : rachat partiel/total (ou dénouement).\n' +
              '• Assiette : seule la quote-part de gains incluse dans le rachat est imposable (prorata gains/encours).\n' +
              '• Régime : par défaut, imposition des gains au PFU (prélèvement forfaitaire + PS) selon règles en vigueur ; abattement annuel sur gains après 8 ans (4 600 € / 9 200 € selon situation) applicable avant calcul de l’IR.\n' +
              '• PS : dus sur la fraction de gains rachetés (si non déjà prélevés sur fonds €).',
            option:
              '• Option barème IR : possible sur l’IR (au lieu du PFU) ; PS restent dus.\n' +
              '• Certains contrats peuvent proposer un prélèvement libératoire à la source (selon ancienneté/date de versement) : à vérifier contrat + date des primes.\n' +
              '• Stratégie : optimiser via abattement après 8 ans (programmation de rachats), et via fractionnement par foyer fiscal.',
            notes:
              'Points clés : ancienneté du contrat (seuil 8 ans), date des versements (avant/après réformes), seuils/abattements, et articulation PFU vs barème. Toujours raisonner en « gains dans le rachat », pas sur le montant retiré total.',
          },
          {
            phase: 'Décès',
            default:
              '• Fait générateur : décès de l’assuré, dénouement du contrat.\n' +
              '• Principe : capitaux versés aux bénéficiaires = régime spécifique assurance-vie (hors succession civile, mais fiscalité propre).\n' +
              '• Assiette et taxation : dépend de l’âge de l’assuré au versement des primes (règles distinctes) et des abattements applicables ; taxation au niveau des bénéficiaires.',
            option:
              '• Clause bénéficiaire : rédaction/option de démembrement, bénéficiaires multiples, représentation : n’est pas une option fiscale « barème/PFU », mais un levier majeur d’ingénierie (répartition, démembrement, quasi-usufruit, etc.).\n' +
              '• Possibilité de donation/rachat avant décès : change la mécanique (à traiter au cas par cas).',
            notes:
              'Toujours distinguer : primes versées avant/après un certain âge, et application des abattements spécifiques. Vérifier : bénéficiaires, primes manifestement exagérées, et éventuel traitement des PS/produits non encore taxés selon contrat.',
          },
        ],
      },
    },

    {
      id: 'per_individuel',
      label: 'PER individuel (PERIN)',
      subtitle: 'Épargne retraite (compartiments : versements volontaires déductibles ou non)',
      table: {
        columns: ['Phase', 'Régime par défaut', 'Sur option', "Notes / points d’attention"],
        rows: [
          {
            phase: 'Épargne',
            default:
              '• Versements volontaires : par défaut, déductibles du revenu imposable (dans la limite du plafond épargne retraite du foyer).\n' +
              '• Effet : réduction d’assiette IR (gain fiscal = versement déductible × TMI, sous réserve du plafond).\n' +
              '• Pas d’imposition tant qu’il n’y a pas de sortie (capital/rente), hors cas de déblocage.',
            option:
              '• Renonciation à la déductibilité : possible (versements « non déduits ») → pas de gain fiscal à l’entrée mais fiscalité de sortie du capital plus favorable sur la part « versements ».\n' +
              '• Choix allocation/gestion pilotée : impacts économiques, pas une option IR directe.',
            notes:
              'Indispensable : tracer ce qui est « déduit » vs « non déduit » (justificatifs), car la fiscalité de sortie dépend de ce choix. Vérifier plafond disponible (avis d’IR) et arbitrer selon TMI actuelle vs future.',
          },
          {
            phase: 'Retraits',
            default:
              '• Fait générateur : sortie à la retraite (ou déblocage anticipé autorisé).\n' +
              '• Sortie en capital (versements déduits) : la part correspondant aux versements déduits est imposée au barème IR (assimilée à revenu) ; la part correspondant aux gains est imposée comme revenus du capital (PFU par défaut + PS).\n' +
              '• Sortie en rente : rente viagère imposée comme pension/retraite au barème IR (avec abattement 10% dans les conditions générales des pensions), + PS/CSG selon règles applicables.',
            option:
              '• Option barème IR vs PFU sur la fraction « gains » (selon règles PFU) : possibilité d’opter globalement pour le barème.\n' +
              '• Si versements non déduits : en sortie capital, la part « versements » n’est pas réimposée à l’IR (seuls les gains sont taxés comme revenus du capital).\n' +
              '• Sortie partielle/programmée : lisser l’IR (gestion de tranche).',
            notes:
              'Attention aux effets de seuils (TMI, CEHR, etc.) en cas de sortie massive en capital. Bien distinguer : versements (déduits/non déduits) vs gains. Cas particulier déblocage anticipé : régimes spécifiques.',
          },
          {
            phase: 'Décès',
            default:
              '• Fait générateur : décès du titulaire.\n' +
              '• Principe : dépend de la nature du PER et des modalités contractuelles ; en général, liquidation au profit des bénéficiaires, avec traitement fiscal distinct de l’AV.\n' +
              '• Assiette : droits transmis (capital) et régime de mutation (souvent successoral) selon lien de parenté + abattements, sauf dispositions particulières.',
            option:
              '• Clause bénéficiaire (si prévue) et choix de rente réversible / options de réversion : impact sur bénéficiaires et assiette.\n' +
              '• Stratégie : arbitrer entre PER et AV selon objectifs transmission/retraite (au cas client).',
            notes:
              'Point d’attention majeur : le PER n’est pas « fiscalement équivalent » à l’assurance-vie en décès. Vérifier contrat (assurantiel vs titre), existence d’une clause bénéficiaire, et le régime appliqué (successions/droits de mutation).',
          },
        ],
      },
    },

    {
      id: 'cto',
      label: 'Compte-titres ordinaire (CTO)',
      subtitle: 'Détention de titres en direct (actions/obligations/OPC, etc.)',
      table: {
        columns: ['Phase', 'Régime par défaut', 'Sur option', "Notes / points d’attention"],
        rows: [
          {
            phase: 'Épargne',
            default:
              '• Fait générateur : perception de revenus (dividendes/coupons) et cessions avec plus-values.\n' +
              '• Revenus (dividendes/intérêts) : imposés au PFU par défaut (IR forfaitaire + PS) au moment du paiement.\n' +
              '• Plus-values : imposées lors de la cession (prix de vente - prix de revient corrigé), au PFU par défaut + PS.',
            option:
              '• Option barème IR : possible (option globale pour l’ensemble des revenus et plus-values soumis au PFU pour l’année) ; les dividendes peuvent alors bénéficier d’un abattement (selon règles en vigueur) si éligibles.\n' +
              '• Imputation des moins-values : régime de droit commun (imputables sur plus-values de même nature, reportables selon durée légale).',
            notes:
              'Toujours raisonner : fait générateur = encaissement (revenu) / cession (PV). Bien suivre PRU, frais, opérations sur titres. Dividendes : attention à l’acompte et aux options annuelles.',
          },
          {
            phase: 'Retraits',
            default:
              '• CTO : pas de notion de « rachat ». Un retrait de liquidités n’est pas taxable en soi.\n' +
              '• Taxation uniquement si retrait provient de cessions : c’est la cession qui déclenche l’impôt (PV/MV), pas le virement bancaire.',
            option:
              '• Choix des lots / arbitrage de cession : pilotage du réalisé (cristalliser MV pour compenser PV).\n' +
              '• Option barème IR (annuelle) si pertinente vs PFU.',
            notes:
              'Important : « je retire » ≠ taxable. Seule la vente (cession) + revenus encaissés comptent. Bien distinguer : liquidités issues de ventes vs apports.',
          },
          {
            phase: 'Décès',
            default:
              '• Fait générateur : décès → transmission des titres (successions).\n' +
              '• Fiscalité : droits de mutation selon lien de parenté après abattements.\n' +
              '• Plus-values latentes : en principe, purge au décès (réévaluation des prix de revient à la valeur au décès) — à vérifier selon cas particuliers/actifs.',
            option:
              '• Démembrement, donation de son vivant, pactes (Dutreil si titres éligibles) : leviers patrimoniaux.\n' +
              '• Arbitrage avant décès (cristalliser PV/MV) : à analyser selon objectifs et horizons.',
            notes:
              'Le CTO est très « successoral ». Documenter valeurs au décès, gérer indivision, et vérifier règles spécifiques sur certains actifs (non cotés, étrangers, etc.).',
          },
        ],
      },
    },

    {
      id: 'pea',
      label: 'PEA',
      subtitle: 'Plan d’épargne en actions (cadre fiscal conditionné à la durée)',
      table: {
        columns: ['Phase', 'Régime par défaut', 'Sur option', "Notes / points d’attention"],
        rows: [
          {
            phase: 'Épargne',
            default:
              '• Versements : pas d’IR à l’entrée.\n' +
              '• Revenus/dividendes et plus-values à l’intérieur : capitalisation sans IR tant qu’il n’y a pas de retrait.\n' +
              '• PS : dus lors d’un fait générateur (retrait/clôture) sur les gains, selon règles applicables.',
            option:
              '• Arbitrages internes : non imposables à l’IR.\n' +
              '• Choix PEA vs PEA-PME (si applicable) : impacts d’éligibilité/plafonds, pas option IR annuelle.',
            notes:
              'Cadre très dépendant de la durée et des événements (retrait, clôture). Vérifier éligibilité des titres/OPC et respect des plafonds de versements.',
          },
          {
            phase: 'Retraits',
            default:
              '• Fait générateur : retrait partiel/total, clôture.\n' +
              '• Règle clé : avant une certaine durée, retraits peuvent entraîner clôture et fiscalité moins favorable ; après durée, exonération d’IR sur gains (mais PS restent dus) selon régime en vigueur.\n' +
              '• Assiette : gains nets du plan lors du retrait/clôture.',
            option:
              '• Modalités de retrait après durée minimale : possibilité de retraits sans clôture (selon réglementation en vigueur) et/ou conversions (rente dans certains cadres).\n' +
              '• Optimisation : différer les retraits pour bénéficier de l’exonération d’IR ; gérer les moins-values via clôture si pertinent.',
            notes:
              'Toujours préciser : date d’ouverture du PEA + âge au moment du retrait (seuils 5 ans / autres seuils selon règles applicables). Les PS restent généralement dus même si IR exonéré.',
          },
          {
            phase: 'Décès',
            default:
              '• Fait générateur : décès → clôture du PEA.\n' +
              '• IR : gains peuvent être exonérés selon le cadre de détention/ancienneté, mais PS dus selon règles applicables.\n' +
              '• Transmission : titres/avoirs entrent dans la succession (droits de mutation selon lien).',
            option:
              '• Stratégies de transmission se font plutôt en amont (donations, démembrement si possible sur titres hors PEA).',
            notes:
              'Le PEA ne se transmet pas « tel quel » : décès = clôture. Bien anticiper si objectif transmission.',
          },
        ],
      },
    },

    {
      id: 'scpi_direct',
      label: 'SCPI en direct',
      subtitle: 'Détention en direct (revenus fonciers) — hors SCPI en assurance-vie/SCI/usufruit',
      table: {
        columns: ['Phase', 'Régime par défaut', 'Sur option', "Notes / points d’attention"],
        rows: [
          {
            phase: 'Épargne',
            default:
              '• Fait générateur : perception des loyers (revenus fonciers) distribués par la SCPI.\n' +
              '• Imposition : revenus fonciers au barème IR + PS (sur revenu net foncier).\n' +
              '• Assiette : revenu net = loyers - charges déductibles (selon justificatifs/règles).',
            option:
              '• Micro-foncier (si conditions remplies) : abattement forfaitaire sur recettes, sans déduction des charges réelles.\n' +
              '• Régime réel : déduction des charges (intérêts d’emprunt, travaux/charges selon règles), création possible d’un déficit foncier imputable dans les limites légales.',
            notes:
              'SCPI en direct = revenus fonciers. Attention : fiscalité variable si SCPI investit à l’étranger (crédits d’impôt/traités) : à documenter SCPI par SCPI.',
          },
          {
            phase: 'Retraits',
            default:
              '• Fait générateur : cession de parts de SCPI.\n' +
              '• Imposition : plus-value immobilière des particuliers (PV = prix de cession - prix d’acquisition/frais), avec abattements pour durée de détention (IR et PS selon barèmes de durée).\n' +
              '• Prélèvements : surtaxe éventuelle si PV élevée (selon règles en vigueur).',
            option:
              '• Option de calcul/frais : prise en compte de certains frais d’acquisition dans le prix de revient (forfaits/justificatifs selon réglementation).\n' +
              '• Stratégie : arbitrer moment de vente vs abattements de durée (IR/PS distincts).',
            notes:
              'Liquidité/valeur : délais de revente et décote potentielle. Abattements PV immo dépendent de la durée ; distinguer abattement IR vs PS (rythmes différents).',
          },
          {
            phase: 'Décès',
            default:
              '• Fait générateur : décès → transmission des parts (successions).\n' +
              '• Fiscalité : droits de mutation selon lien de parenté après abattements.\n' +
              '• Valeur : base taxable = valeur des parts au décès (selon règles d’évaluation).',
            option:
              '• Démembrement, donations, pactes : leviers patrimoniaux à traiter au cas par cas.\n' +
              '• Assurance-vie/SCI/Usufruit : hors périmètre de cette fiche (SCPI direct uniquement).',
            notes:
              'Les parts de SCPI sont des actifs successoraux classiques. Bien préparer inventaire/valorisation et gérer indivision si besoin.',
          },
        ],
      },
    },

    {
      id: 'livret_bancaire',
      label: 'Livret bancaire (fiscalisé)',
      subtitle: 'Livrets imposables (hors Livret A/LDDS/LEP etc. en note)',
      table: {
        columns: ['Phase', 'Régime par défaut', 'Sur option', "Notes / points d’attention"],
        rows: [
          {
            phase: 'Épargne',
            default:
              '• Fait générateur : intérêts crédités (souvent annuellement).\n' +
              '• Imposition : intérêts soumis au PFU par défaut (IR forfaitaire + PS) lors du paiement/crédit.\n' +
              '• Acompte : selon établissements, prélèvement à la source (acompte IR) et PS au fil de l’eau.',
            option:
              '• Option barème IR : possible (option globale annuelle) → intérêts imposés au barème IR + PS.\n' +
              '• Dispense d’acompte IR : possible sous conditions de RFR (n’affecte pas l’impôt final).',
            notes:
              'Livrets fiscalisés = intérêts (RCM). Bien distinguer acompte vs impôt final. Voir aussi comptes à terme.',
          },
          {
            phase: 'Retraits',
            default:
              '• Retrait du capital : non taxable en soi.\n' +
              '• La fiscalité est attachée aux intérêts crédités (imposables au moment du fait générateur).',
            option:
              '• Pas de mécanisme de « rachat » : optimisation = piloter rémunération/échéances.\n' +
              '• Option barème IR annuelle si pertinente.',
            notes: 'Pédagogie : on ne taxe pas le retrait, on taxe les intérêts.',
          },
          {
            phase: 'Décès',
            default:
              '• Fait générateur : décès → solde du livret dans l’actif successoral.\n' +
              '• Fiscalité : droits de mutation selon lien de parenté après abattements.\n' +
              '• Intérêts courus : traitement selon banque/arrêté du compte ; intégration à l’actif successoral et/ou imposition en revenus selon date de crédit.',
            option:
              '• Stratégies de transmission : donation ; pas de clause bénéficiaire sur livret (hors enveloppes assurantielles).',
            notes:
              'Note : Livret A/LDDS (et autres livrets réglementés exonérés) → intérêts exonérés d’IR et de PS ; ils restent dans l’actif successoral au décès (capital transmis).',
          },
        ],
      },
    },
  ],
  disclaimer: [
    'Contenu informatif, non constitutif de conseil personnalisé (pas de recommandation au sens réglementaire).',
    'Règles fiscales et seuils susceptibles d’évoluer (LF, doctrine, jurisprudence) : vérifier la version en vigueur à la date du conseil.',
    'Cette synthèse n’intègre pas les cas particuliers (non-résidents, démembrement complexe, régimes spécifiques, actifs étrangers, etc.).',
    'Toujours valider l’assiette exacte, le fait générateur, et les options déclaratives au niveau du foyer fiscal.',
  ],
};

export default function SettingsFiscalites() {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState('User');
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(DEFAULT_FISCALITES_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const isAdmin = useMemo(() => roleLabel === 'Admin', [roleLabel]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        // 1) Auth user
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error('Erreur user:', userErr);
          if (mounted) setLoading(false);
          return;
        }

        const u = userData?.user || null;
        if (!mounted) return;

        setUser(u);
        setRoleLabel('User');

        if (!u) {
          setLoading(false);
          return;
        }

        // 2) Role via profiles.role (contrainte)
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', u.id)
          .single();

        if (profErr) {
          // Ne pas bloquer l’écran : user ok, mais pas de role trouvé
          console.warn('Erreur chargement profile.role:', profErr);
        } else {
          const r = (profile?.role || '').toString().toLowerCase();
          setRoleLabel(r === 'admin' ? 'Admin' : 'User');
        }

        // 3) Load settings_fiscalites (by key)
        const { data: row, error: setErr } = await supabase
          .from('settings_fiscalites')
          .select('data')
          .eq('key', SETTINGS_KEY)
          .maybeSingle();

        if (setErr) {
          console.error('Erreur chargement settings_fiscalites:', setErr);
        } else if (row?.data) {
          setSettings((prev) => ({
            ...prev,
            ...row.data,
            // merge plus sûr : devices/disclaimer doivent venir de la base si présents
            devices: Array.isArray(row.data?.devices) ? row.data.devices : prev.devices,
            disclaimer: Array.isArray(row.data?.disclaimer) ? row.data.disclaimer : prev.disclaimer,
            meta: { ...prev.meta, ...(row.data?.meta || {}) },
          }));
        } else {
          // row absent => fallback default (déjà en state)
        }

        if (mounted) setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateMetaField = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      meta: { ...(prev.meta || {}), [field]: value },
    }));
    setMessage('');
  };

  const updateCell = (deviceId, rowIndex, field, value) => {
    setSettings((prev) => {
      const clone = structuredClone(prev);
      const dev = clone.devices?.find((d) => d.id === deviceId);
      if (!dev?.table?.rows?.[rowIndex]) return prev;

      dev.table.rows[rowIndex][field] = value;
      return clone;
    });
    setMessage('');
  };

  const handleSave = async () => {
    if (!isAdmin || !user) return;

    try {
      setSaving(true);
      setMessage('');

      const payload = {
        key: SETTINGS_KEY,
        data: settings,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('settings_fiscalites')
        .upsert(payload, { onConflict: 'key' });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setMessage('Paramètres fiscalités enregistrés.');
      }
    } catch (e) {
      console.error(e);
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!isAdmin) return;
    setSettings(DEFAULT_FISCALITES_SETTINGS);
    setMessage('Valeurs par défaut restaurées (non enregistrées).');
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <SettingsNav />
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <SettingsNav />
          <p>Aucun utilisateur connecté.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>
        <SettingsNav />

        <div
          style={{
            fontSize: 15,
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Bandeau user (style SettingsImpots) */}
          <div className="tax-user-banner">
            <strong>Utilisateur :</strong> {user.email} — <strong>Statut :</strong> {roleLabel}
          </div>

          {/* Meta */}
          <section>
            <h3>{settings?.meta?.title || 'Synthèse fiscalité des enveloppes'}</h3>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
              Synthèse structurée par enveloppe et par phase (épargne / retraits / décès).
              En mode Admin, les champs sont éditables et enregistrés en base (Supabase) via la clé{' '}
              <strong>{SETTINGS_KEY}</strong>.
            </p>

            <div className="settings-field-row">
              <label>Dernière revue</label>
              <input
                type="text"
                value={settings?.meta?.lastReview || ''}
                onChange={(e) => updateMetaField('lastReview', e.target.value)}
                disabled={!isAdmin}
                style={{ width: 160, textAlign: 'left' }}
                placeholder="YYYY-MM-DD"
              />
              <span />
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Hypothèses</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#555' }}>
                {(settings?.meta?.assumptions || []).map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Devices */}
          {(settings?.devices || []).map((dev) => (
            <section key={dev.id}>
              <h3>{dev.label}</h3>
              {dev.subtitle && (
                <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>{dev.subtitle}</p>
              )}

              <table className="settings-table fiscalites-table">
                <thead>
                  <tr>
                    <th style={{ width: 120, textAlign: 'left' }}>Phase</th>
                    <th>Régime par défaut</th>
                    <th>Sur option</th>
                    <th>Notes / points d’attention</th>
                  </tr>
                </thead>
                <tbody>
                  {(dev?.table?.rows || []).map((row, idx) => (
                    <tr key={`${dev.id}_${idx}`}>
                      <td style={{ textAlign: 'left', verticalAlign: 'top', fontWeight: 600 }}>
                        {row.phase}
                      </td>

                      {/* Default */}
                      <td style={{ textAlign: 'left', verticalAlign: 'top' }}>
                        <textarea
                          className="settings-textarea"
                          value={row.default || ''}
                          onChange={(e) => updateCell(dev.id, idx, 'default', e.target.value)}
                          disabled={!isAdmin}
                          rows={6}
                        />
                      </td>

                      {/* Option */}
                      <td style={{ textAlign: 'left', verticalAlign: 'top' }}>
                        <textarea
                          className="settings-textarea"
                          value={row.option || ''}
                          onChange={(e) => updateCell(dev.id, idx, 'option', e.target.value)}
                          disabled={!isAdmin}
                          rows={6}
                        />
                      </td>

                      {/* Notes */}
                      <td style={{ textAlign: 'left', verticalAlign: 'top' }}>
                        <textarea
                          className="settings-textarea"
                          value={row.notes || ''}
                          onChange={(e) => updateCell(dev.id, idx, 'notes', e.target.value)}
                          disabled={!isAdmin}
                          rows={6}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}

          {/* Disclaimer */}
          <section>
            <h3>Disclaimer</h3>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
              À afficher en bas de page / export PDF : cadre informatif et règles évolutives.
            </p>

            <div className="fiscalites-disclaimer">
              {(settings?.disclaimer || []).map((d, idx) => (
                <div key={idx} className="fiscalites-disclaimer-item">
                  {isAdmin ? (
                    <textarea
                      className="settings-textarea"
                      value={d}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSettings((prev) => {
                          const clone = structuredClone(prev);
                          if (!Array.isArray(clone.disclaimer)) clone.disclaimer = [];
                          clone.disclaimer[idx] = v;
                          return clone;
                        });
                        setMessage('');
                      }}
                      disabled={!isAdmin}
                      rows={2}
                    />
                  ) : (
                    <div style={{ fontSize: 13, color: '#555' }}>• {d}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="chip"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer les fiscalités'}
              </button>

              <button
                type="button"
                className="chip"
                onClick={handleResetDefault}
                disabled={saving}
                title="Remet en mémoire les valeurs par défaut (puis enregistrer si souhaité)"
              >
                Réinitialiser aux valeurs par défaut
              </button>
            </div>
          )}

          {message && <div style={{ fontSize: 13, marginTop: 8 }}>{message}</div>}
        </div>
      </div>
    </div>
  );
}
