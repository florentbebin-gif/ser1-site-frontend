import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import SettingsNav from "../SettingsNav";
import "./SettingsImpots.css";
import "./SettingsFiscalites.css";

const SETTINGS_KEY = "fiscalites_v1";
const TABLE_NAME = "settings_fiscalites";

/** =========================
 * Helpers matrice / affichage
 * ========================= */

const BG_GREY = "F2F2F2";
const BG_GREEN = "F8FCF6";

function makeCell(v = "", opts = {}) {
  return { v, ...opts };
}

function defaultColumns() {
  return [
    "Phase",
    "Régime par défaut",
    "Type 1",
    "Type 2",
    "Type 3",
    "Type 4",
    "Type 5",
    "Type 6",
    "Type 7",
    "Type 8",
    "Valeur par défaut",
    "Commentaires",
  ];
}

function formatCellValue(cell) {
  if (!cell) return "";
  const { v, fmt } = cell;

  if (fmt === "percent") {
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    if (Number.isFinite(n)) {
      const digits = Number.isInteger(n) ? 0 : 2;
      return `${(n * (n <= 1 ? 100 : 1)).toFixed(digits)}%`;
      // NOTE: ton Excel stocke parfois 0.128 (=12,8%) => on convertit si <=1
    }
    return String(v ?? "");
  }

  if (fmt === "currency") {
    const n = typeof v === "number" ? v : Number(String(v).replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(n)) {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(n);
    }
    return String(v ?? "");
  }

  if (fmt === "date") return String(v ?? "");
  return String(v ?? "");
}

function parseAdminInput(cell, raw) {
  const next = { ...(cell || {}) };

  // admin tape du texte => on essaye de conserver number si fmt
  if (next.fmt === "percent") {
    const cleaned = String(raw).trim().replace("%", "").replace(",", ".");
    const n = Number(cleaned);
    if (Number.isFinite(n)) {
      // si admin tape 12.8 => on stocke 0.128 (cohérent avec ton modèle)
      next.v = n > 1 ? n / 100 : n;
      return next;
    }
    next.v = raw;
    return next;
  }

  if (next.fmt === "currency") {
    const cleaned = String(raw).replace(/[€\s]/g, "").replace(",", ".");
    const n = Number(cleaned);
    next.v = Number.isFinite(n) ? n : raw;
    return next;
  }

  // default : string
  next.v = raw;
  return next;
}

function getRowSpan(merges, rowIndex, colIndex) {
  const m = (merges || []).find(
    (x) => x.col === colIndex && rowIndex >= x.start && rowIndex <= x.end
  );
  if (!m) return 1;
  if (rowIndex === m.start) return m.end - m.start + 1;
  return 0;
}

/** =========================
 * Matrices par produit
 * (Assurance-vie = matrice Excel que tu avais déjà)
 * ========================= */

function buildDefaultMatrix_PERIN() {
  const columns = defaultColumns();

  const rows = [
    [
      makeCell("Épargne"),
      makeCell("Versement déductible des revenus"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("Oui", { bg: BG_GREEN }),
      makeCell("Déductible dans la limite du plafond épargne retraite (à paramétrer/mettre en note)."),
    ],
    [
      makeCell(""),
      makeCell("Fiscalité en cours de constitution sur les intérêts"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("Non", { bg: BG_GREEN }),
      makeCell("Pas d’imposition tant qu’il n’y a pas de sortie."),
    ],
    [
      makeCell(""),
      makeCell("Disponibilité / déblocages anticipés"),
      makeCell(""),
      makeCell("Cas principaux"),
      makeCell("Invalidité"),
      makeCell("Décès"),
      makeCell("Fin droits chômage"),
      makeCell("Surendettement"),
      makeCell("Achat RP"),
      makeCell(""),
      makeCell("Oui", { bg: BG_GREEN }),
      makeCell("Achat RP : possible selon règles (PERIN)."),
    ],

    [
      makeCell("Retraits en capital"),
      makeCell("Assiette :"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("Capital + gains", { bg: BG_GREEN }),
      makeCell("Toujours dissocier capital (versements) vs gains."),
    ],
    [
      makeCell(""),
      makeCell("Capital (versements déduits à l’entrée)"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("Barème (TMI)", { bg: BG_GREEN }),
      makeCell("Imposé au barème IR (pensions/selon régime PER) – adapter si besoin."),
    ],
    [
      makeCell(""),
      makeCell("Gains (intérêts / plus-values)"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("*Ou barème IR (option globale annuelle)."),
    ],
    [
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PS", { bg: BG_GREY }),
      makeCell(0.172, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("Prélèvements sociaux sur gains."),
    ],
    [
      makeCell(""),
      makeCell("Sur option (à l’entrée) : versements NON déduits"),
      makeCell(""),
      makeCell(""),
      makeCell("Capital"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("0%", { bg: BG_GREEN }),
      makeCell("Capital non imposé à la sortie si non déduit."),
    ],
    [
      makeCell(""),
      makeCell("Gains sur versements non déduits"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell(""),
    ],
    [
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PS", { bg: BG_GREY }),
      makeCell(0.172, { bg: BG_GREEN, fmt: "percent" }),
      makeCell(""),
    ],

    [
      makeCell("Décès"),
      makeCell("Traitement au décès"),
      makeCell("Dépend du type de PER"),
      makeCell("PER assurantiel vs compte-titres"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("À préciser", { bg: BG_GREEN }),
      makeCell("Si tu veux une grille chiffrée type AV, il faut distinguer PER assurantiel / bancaire."),
    ],
  ];

  const merges = [
    { col: 0, start: 0, end: 2 },
    { col: 0, start: 3, end: 9 },
    { col: 0, start: 10, end: 10 },
  ];

  return { columns, rows, merges };
}

function buildDefaultMatrix_CTO() {
  const columns = defaultColumns();

  const rows = [
    [
      makeCell("Épargne"),
      makeCell("Versement déductible des revenus"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("Non", { bg: BG_GREEN }),
      makeCell(""),
    ],
    [
      makeCell(""),
      makeCell("Fiscalité des revenus (dividendes / intérêts)"),
      makeCell(""),
      makeCell("Régime par défaut"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("*Ou option barème IR (globale annuelle)."),
    ],
    [
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PS", { bg: BG_GREY }),
      makeCell(0.172, { bg: BG_GREEN, fmt: "percent" }),
      makeCell(""),
    ],
    [
      makeCell(""),
      makeCell("Dividendes si option barème"),
      makeCell("Abattement"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("40%", { bg: BG_GREEN }),
      makeCell("Abattement 40% sur dividendes éligibles (IR uniquement)."),
    ],

    [
      makeCell("Retraits / cessions"),
      makeCell("Assiette : plus-value de cession"),
      makeCell("PV = prix - PRU"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("La cession déclenche l’impôt (pas le retrait)."),
    ],
    [
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PS", { bg: BG_GREY }),
      makeCell(0.172, { bg: BG_GREEN, fmt: "percent" }),
      makeCell(""),
    ],
    [
      makeCell(""),
      makeCell("Sur option : barème IR"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("Barème", { bg: BG_GREEN }),
      makeCell("Option globale PFU → barème sur revenus mobiliers et PV."),
    ],
    [
      makeCell(""),
      makeCell("Moins-values"),
      makeCell("Imputation"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("Oui", { bg: BG_GREEN }),
      makeCell("MV imputables sur PV de même nature + report (à préciser si tu veux détailler)."),
    ],

    [
      makeCell("Décès"),
      makeCell("Transmission"),
      makeCell("Actif successoral"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("DMTG", { bg: BG_GREY }),
      makeCell("Barème", { bg: BG_GREEN }),
      makeCell("En principe, pas d’IR sur PV latentes (PRU réévalué)."),
    ],
  ];

  const merges = [
    { col: 0, start: 0, end: 3 },
    { col: 0, start: 4, end: 7 },
    { col: 0, start: 8, end: 8 },
  ];

  return { columns, rows, merges };
}

function buildDefaultMatrix_PEA() {
  const columns = defaultColumns();

  const rows = [
    [
      makeCell("Épargne"),
      makeCell("Versement déductible des revenus"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("Non", { bg: BG_GREEN }),
      makeCell(""),
    ],
    [
      makeCell(""),
      makeCell("Fiscalité en cours de constitution"),
      makeCell(""),
      makeCell("Tant qu’aucun retrait"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("0%", { bg: BG_GREEN }),
      makeCell("Pas d’IR tant que pas de retrait."),
    ],

    [
      makeCell("Retraits"),
      makeCell("Avant 5 ans"),
      makeCell(""),
      makeCell("Clôture (règle générale)"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("Gains imposés (règles à affiner si tu veux détailler cas 5-8 ans etc.)."),
    ],
    [
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PS", { bg: BG_GREY }),
      makeCell(0.172, { bg: BG_GREEN, fmt: "percent" }),
      makeCell(""),
    ],
    [
      makeCell(""),
      makeCell("Après 5 ans"),
      makeCell(""),
      makeCell("Exonération IR"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("0%", { bg: BG_GREEN }),
      makeCell("Gains exonérés d’IR (mais PS dus)."),
    ],
    [
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PS", { bg: BG_GREY }),
      makeCell(0.172, { bg: BG_GREEN, fmt: "percent" }),
      makeCell(""),
    ],

    [
      makeCell("Décès"),
      makeCell("Clôture + succession"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("DMTG", { bg: BG_GREY }),
      makeCell("Barème", { bg: BG_GREEN }),
      makeCell("Le PEA est clôturé au décès (principes)."),
    ],
  ];

  const merges = [
    { col: 0, start: 0, end: 1 },
    { col: 0, start: 2, end: 5 },
    { col: 0, start: 6, end: 6 },
  ];

  return { columns, rows, merges };
}

function buildDefaultMatrix_SCPI() {
  const columns = defaultColumns();

  const rows = [
    [
      makeCell("Épargne"),
      makeCell("Revenus fonciers (SCPI en direct)"),
      makeCell("Assiette"),
      makeCell("Revenus nets fonciers"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("Barème (TMI)", { bg: BG_GREEN }),
      makeCell("Micro-foncier vs réel (sur option selon conditions)."),
    ],
    [
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PS", { bg: BG_GREY }),
      makeCell(0.172, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("PS sur revenus fonciers."),
    ],
    [
      makeCell("Retraits / cession"),
      makeCell("Plus-value immobilière des particuliers"),
      makeCell("Assiette"),
      makeCell("PV = prix - prix acquisition"),
      makeCell(""),
      makeCell("Abattements durée"),
      makeCell("IR / PS"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("Oui", { bg: BG_GREEN }),
      makeCell("À détailler : abattements IR et PS selon durée de détention."),
    ],
    [
      makeCell("Décès"),
      makeCell("Transmission"),
      makeCell("Parts dans la succession"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("DMTG", { bg: BG_GREY }),
      makeCell("Barème", { bg: BG_GREEN }),
      makeCell("Droits de succession selon lien de parenté."),
    ],
  ];

  const merges = [
    { col: 0, start: 0, end: 1 },
    { col: 0, start: 2, end: 2 },
    { col: 0, start: 3, end: 3 },
  ];

  return { columns, rows, merges };
}

function buildDefaultMatrix_LIVRET() {
  const columns = defaultColumns();

  const rows = [
    [
      makeCell("Épargne"),
      makeCell("Versement déductible des revenus"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("Non", { bg: BG_GREEN }),
      makeCell("Note : Livret A / LDDS = exonérés IR + PS (hors livret fiscalisé)."),
    ],
    [
      makeCell(""),
      makeCell("Fiscalité des intérêts"),
      makeCell("Assiette"),
      makeCell("Intérêts"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("*Ou barème IR (option globale annuelle)."),
    ],
    [
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PS", { bg: BG_GREY }),
      makeCell(0.172, { bg: BG_GREEN, fmt: "percent" }),
      makeCell(""),
    ],
    [
      makeCell("Retraits"),
      makeCell("Retrait"),
      makeCell(""),
      makeCell("Non taxable"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("—", { bg: BG_GREEN }),
      makeCell("La fiscalité porte sur les intérêts, pas sur le retrait en lui-même."),
    ],
    [
      makeCell("Décès"),
      makeCell("Transmission"),
      makeCell("Solde dans succession"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("DMTG", { bg: BG_GREY }),
      makeCell("Barème", { bg: BG_GREEN }),
      makeCell(""),
    ],
  ];

  const merges = [
    { col: 0, start: 0, end: 2 },
    { col: 0, start: 3, end: 3 },
    { col: 0, start: 4, end: 4 },
  ];

  return { columns, rows, merges };
}

/** =========================
 * DEFAULT_FISCALITES_SETTINGS
 * ========================= */

export const DEFAULT_FISCALITES_SETTINGS = {
  meta: {
    title: "Matrice fiscalité des enveloppes (seuils & taux éditables)",
    assumptions: [
      "Résident fiscal France",
      "Matrice inspirée de l’Excel (lignes et sous-lignes par thématiques)",
      "L’Admin peut modifier directement montants, taux et textes cellule par cellule",
      "SCPI uniquement en direct (revenus fonciers)",
    ],
    lastReview: "2025-12-30",
  },
  products: [
    {
      id: "assurance_vie",
      label: "Assurance-vie",
      subtitle: "Matrice conforme au modèle Excel fourni",
      matrix: {
        columns: defaultColumns(),
        rows: [
          [
            { v: "Épargne" },
            { v: "Versement déductible des revenus" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Non", bg: BG_GREEN },
            { v: "-" },
          ],
          [
            { v: "" },
            { v: "Fiscalité en cours de constitution sur les intérêts :" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Non", bg: BG_GREEN },
            { v: "*17.20% sur les intérêts du fonds € prélevés annuellement" },
          ],

          [{ v: "Retraits en capital" }, { v: "Assiette :" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "Intérets", bg: BG_GREEN }, { v: "" }],
          [
            { v: "" },
            { v: "Taux applicable : " },
            { v: "Versements effectués à partir du " },
            { v: "2017-09-27", fmt: "date" },
            { v: "<8 ans" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "PFU*", bg: BG_GREY },
            { v: 0.128, bg: BG_GREEN, fmt: "percent" },
            { v: "*Ou barème" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: ">8 ans" },
            { v: "Célibataire" },
            { v: 4600, fmt: "currency" },
            { v: "Gain provenant des" },
            { v: "<150 000 €" },
            { v: "PFL*", bg: BG_GREY },
            { v: 0.075, bg: BG_GREEN, fmt: "percent" },
            { v: "*Ou barème" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Gain au delà des" },
            { v: ">150 000 €" },
            { v: "PFU*", bg: BG_GREY },
            { v: 0.128, bg: BG_GREEN, fmt: "percent" },
            { v: "*Ou barème" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Couple" },
            { v: 9200, fmt: "currency" },
            { v: "Gain provenant des" },
            { v: "<150 000 €" },
            { v: "PFL*", bg: BG_GREY },
            { v: 0.075, bg: BG_GREEN, fmt: "percent" },
            { v: "*Ou barème" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Gain au delà des" },
            { v: ">150 000 €" },
            { v: "PFU*", bg: BG_GREY },
            { v: 0.128, bg: BG_GREEN, fmt: "percent" },
            { v: "*Ou barème" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],

          [
            { v: "" },
            { v: "" },
            { v: "Versements effectués avant" },
            { v: "2017-09-27", fmt: "date" },
            { v: "<4 ans" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "PFL*", bg: BG_GREY },
            { v: 0.35, bg: BG_GREEN, fmt: "percent" },
            { v: "*Ou barème" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "4 à 8 ans" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "PFL*", bg: BG_GREY },
            { v: 0.15, bg: BG_GREEN, fmt: "percent" },
            { v: "*Ou barème" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: ">8 ans" },
            { v: "Célibataire" },
            { v: 4600, fmt: "currency" },
            { v: "" },
            { v: "" },
            { v: "PFL*", bg: BG_GREY },
            { v: 0.075, bg: BG_GREEN, fmt: "percent" },
            { v: "*Ou barème" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Couple" },
            { v: 9200, fmt: "currency" },
            { v: "" },
            { v: "" },
            { v: "PFL*", bg: BG_GREY },
            { v: 0.075, bg: BG_GREEN, fmt: "percent" },
            { v: "*Ou barème" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],

          [
            { v: "Décès" },
            { v: "Règles de transmission" },
            { v: "Contrat souscrit avant le" },
            { v: "1991-11-20", fmt: "date" },
            { v: "Vst des primes jusqu'au" },
            { v: "1998-10-12", fmt: "date" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: 0, bg: BG_GREEN },
            { v: "" },
          ],
          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Vst des primes à partir" },
            { v: "1998-10-13", fmt: "date" },
            { v: "<152 500 €" },
            { v: "/bénef" },
            { v: "" },
            { v: 0, bg: BG_GREEN },
            { v: "" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "<852 500 €" }, { v: "/bénef" }, { v: "" }, { v: 0.2, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: ">852 500 €" }, { v: "/bénef" }, { v: "" }, { v: 0.35, bg: BG_GREEN, fmt: "percent" }, { v: "" }],

          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "1991-11-20", fmt: "date" },
            { v: "Vst des primes jusqu'au" },
            { v: "1998-10-12", fmt: "date" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: 0, bg: BG_GREEN },
            { v: "" },
          ],
          [
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Vst des primes à partir" },
            { v: "1998-10-13", fmt: "date" },
            { v: "<152 500 €" },
            { v: "/bénef" },
            { v: "" },
            { v: 0, bg: BG_GREEN },
            { v: "" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "<852 500 €" }, { v: "/bénef" }, { v: "" }, { v: 0.2, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: ">852 500 €" }, { v: "/bénef" }, { v: "" }, { v: 0.35, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "Vst ≥70ans" }, { v: "" }, { v: "" }, { v: "< 30 500 €" }, { v: "global" }, { v: "" }, { v: 0, bg: BG_GREEN }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "> 30 500 €" }, { v: "global" }, { v: "DMTG*", bg: BG_GREY }, { v: 1, bg: BG_GREEN }, { v: "*Intègre le barème des droits de succession" }],

          [
            { v: "" },
            { v: "" },
            { v: "Contrat souscrit après le" },
            { v: "1998-10-13", fmt: "date" },
            { v: "Vst <70ans" },
            { v: "" },
            { v: "" },
            { v: "<152 500 €" },
            { v: "/bénef" },
            { v: "" },
            { v: 0, bg: BG_GREEN },
            { v: "" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "<852 500 €" }, { v: "/bénef" }, { v: "" }, { v: 0.2, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: ">852 500 €" }, { v: "/bénef" }, { v: "" }, { v: 0.35, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "Vst ≥70ans" }, { v: "" }, { v: "" }, { v: "< 30 500 €" }, { v: "global" }, { v: "" }, { v: 0, bg: BG_GREEN }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "> 30 500 €" }, { v: "global" }, { v: "DMTG*", bg: BG_GREY }, { v: 1, bg: BG_GREEN }, { v: "*Intègre le barème des droits de succession" }],

          [
            { v: "Liquidation en rente" },
            { v: "Transformation du capital en rente viagère" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Oui", bg: BG_GREEN },
            { v: "" },
          ],
          [
            { v: "" },
            { v: "Fiscalité de la rente" },
            { v: "Fraction générée par les primes" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Selon l'âge de l’assuré lors de la transformation du capital en rente" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "<60 ans" }, { v: 0.5, fmt: "percent" }, { v: "IR", bg: BG_GREY }, { v: "Barème", bg: BG_GREEN }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "<70 ans" }, { v: 0.4, fmt: "percent" }, { v: "IR", bg: BG_GREY }, { v: "Barème", bg: BG_GREEN }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "≥70 ans" }, { v: 0.3, fmt: "percent" }, { v: "IR", bg: BG_GREY }, { v: "Barème", bg: BG_GREEN }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],

          [
            { v: "" },
            { v: "" },
            { v: "Fraction générée par les intérets" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "Selon l'âge de l’assuré lors de la transformation du capital en rente" },
            { v: "" },
            { v: "" },
            { v: "" },
            { v: "" },
          ],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "Les PS sont calculés sur l'assiette après abattement" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "<60 ans" }, { v: 0.5, fmt: "percent" }, { v: "IR", bg: BG_GREY }, { v: "Barème", bg: BG_GREEN }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "<70 ans" }, { v: 0.4, fmt: "percent" }, { v: "IR", bg: BG_GREY }, { v: "Barème", bg: BG_GREEN }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "≥70 ans" }, { v: 0.3, fmt: "percent" }, { v: "IR", bg: BG_GREY }, { v: "Barème", bg: BG_GREEN }, { v: "" }],
          [{ v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "PS", bg: BG_GREY }, { v: 0.172, bg: BG_GREEN, fmt: "percent" }, { v: "" }],

          [{ v: "" }, { v: "Transmission des capitaux en cas de décès" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "" }, { v: "Non*", bg: BG_GREEN }, { v: "*Sauf éventuelle réversion de la rente" }],
        ],
        merges: [
          { col: 0, start: 0, end: 1 }, // Épargne
          { col: 0, start: 2, end: 20 }, // Retraits
          { col: 0, start: 21, end: 35 }, // Décès
          { col: 0, start: 36, end: 53 }, // Liquidation en rente
        ],
      },
    },

    { id: "per_individuel", label: "PER individuel (PERIN)", subtitle: "Structure identique (seuils & taux éditables)", matrix: buildDefaultMatrix_PERIN() },
    { id: "cto", label: "Compte-titres ordinaire (CTO)", subtitle: "PFU vs option barème, PV/MV, décès", matrix: buildDefaultMatrix_CTO() },
    { id: "pea", label: "PEA", subtitle: "Durées, exonération IR, PS, décès", matrix: buildDefaultMatrix_PEA() },
    { id: "scpi_direct", label: "SCPI en direct", subtitle: "Revenus fonciers + PV immo (direct uniquement)", matrix: buildDefaultMatrix_SCPI() },
    { id: "livret_bancaire", label: "Livret bancaire (fiscalisé)", subtitle: "PFU / option barème ; note Livret A/LDDS", matrix: buildDefaultMatrix_LIVRET() },
  ],
  disclaimer: [
    "Contenu informatif, non constitutif de conseil.",
    "Règles fiscales susceptibles d’évoluer (LF, doctrine). Vérifier l’actualité au moment du conseil.",
    "Adapter au cas client : TMI, RFR, dates, situation familiale, objectifs, etc.",
  ],
};

/** =========================
 * Composant
 * ========================= */

export default function SettingsFiscalites() {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState("User");
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(DEFAULT_FISCALITES_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Admin = user_metadata.role === 'admin' OU user_metadata.is_admin === true (comme SettingsImpots)
  const isAdmin =
    user &&
    ((typeof user?.user_metadata?.role === "string" &&
      user.user_metadata.role.toLowerCase() === "admin") ||
      user?.user_metadata?.is_admin === true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error("Erreur user:", userErr);
          if (mounted) setLoading(false);
          return;
        }

        const u = userData?.user || null;
        if (!mounted) return;

        setUser(u);

        if (u) {
          const meta = u.user_metadata || {};
          const admin =
            (typeof meta.role === "string" && meta.role.toLowerCase() === "admin") ||
            meta.is_admin === true;
          setRoleLabel(admin ? "Admin" : "User");
        } else {
          setRoleLabel("User");
        }

        // Charge settings depuis settings_fiscalites.key = fiscalites_v1 (si la table existe)
        const { data: row, error: setErr } = await supabase
          .from(TABLE_NAME)
          .select("data")
          .eq("key", SETTINGS_KEY)
          .maybeSingle();

        if (setErr) {
          // Si table inexistante ou RLS => on reste en fallback defaults
          console.warn("Load settings fiscalites error:", setErr);
        } else if (row?.data) {
          setSettings((prev) => {
            const incoming = row.data || {};
            return {
              ...prev,
              ...incoming,
              meta: { ...(prev.meta || {}), ...(incoming.meta || {}) },
              products: Array.isArray(incoming.products) ? incoming.products : prev.products,
              disclaimer: Array.isArray(incoming.disclaimer) ? incoming.disclaimer : prev.disclaimer,
            };
          });
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

  const updateCell = (productId, rowIndex, colIndex, rawValue) => {
    setSettings((prev) => {
      const next = structuredClone(prev);
      const prod = (next.products || []).find((p) => p.id === productId);
      if (!prod?.matrix?.rows?.[rowIndex]?.[colIndex]) return prev;

      const currentCell = prod.matrix.rows[rowIndex][colIndex];
      prod.matrix.rows[rowIndex][colIndex] = parseAdminInput(currentCell, rawValue);
      return next;
    });
    setMessage("");
  };

  const handleSave = async () => {
    if (!isAdmin || !user) return;

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        key: SETTINGS_KEY,
        data: settings,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from(TABLE_NAME).upsert(payload, { onConflict: "key" });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setMessage("Fiscalités enregistrées.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (!isAdmin) return;
    setSettings(DEFAULT_FISCALITES_SETTINGS);
    setMessage("Valeurs par défaut restaurées (non enregistrées).");
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
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div className="tax-user-banner">
            <strong>Utilisateur :</strong> {user.email} — <strong>Statut :</strong> {roleLabel}
          </div>

          <section>
            <h3>{settings?.meta?.title || "Matrice fiscalité"}</h3>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
              Mode <strong>Admin</strong> : édition cellule par cellule (taux/montants/texte). Mode{" "}
              <strong>User</strong> : lecture seule.
            </p>

            {Array.isArray(settings?.meta?.assumptions) && settings.meta.assumptions.length > 0 && (
              <ul style={{ fontSize: 13, color: "#555", marginTop: 8 }}>
                {settings.meta.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}

            {isAdmin && (
              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                <button className="chip" onClick={handleSave} disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button className="chip" onClick={handleResetDefault} disabled={saving}>
                  Réinitialiser (non enregistré)
                </button>
                {message && <span style={{ fontSize: 13, color: "#555" }}>{message}</span>}
              </div>
            )}

            {!isAdmin && message && (
              <p style={{ fontSize: 13, color: "#555", marginTop: 10 }}>{message}</p>
            )}
          </section>

          {(settings?.products || []).map((prod) => {
            const columns = prod?.matrix?.columns || [];
            const rows = prod?.matrix?.rows || [];
            const merges = prod?.matrix?.merges || [];

            return (
              <section key={prod.id}>
                <h3>{prod.label}</h3>
                {prod.subtitle && (
                  <p style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
                    {prod.subtitle}
                  </p>
                )}

                <div className="matrix-wrap">
                  <table className="settings-table fiscalites-matrix">
                    <thead>
                      <tr>
                        {columns.map((col, idx) => (
                          <th key={idx} className="matrix-th">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => {
                            const rs = getRowSpan(merges, rIdx, cIdx);
                            if (rs === 0) return null;

                            const style = {};
                            if (cell?.bg) style.background = `#${cell.bg}`;

                            return (
                              <td key={cIdx} rowSpan={rs} style={style}>
                                {isAdmin ? (
                                  <textarea
                                    className="settings-textarea"
                                    value={cell?.v ?? ""}
                                    onChange={(e) => updateCell(prod.id, rIdx, cIdx, e.target.value)}
                                    disabled={!isAdmin}
                                    rows={Math.max(2, String(cell?.v ?? "").split("\n").length)}
                                  />
                                ) : (
                                  <div className="cell-readonly">
                                    {formatCellValue(cell)}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}

          <section>
            <h3>Disclaimer</h3>
            <div className="fiscalites-disclaimer">
              {(settings?.disclaimer || []).map((d, i) => (
                <div key={i} className="cell-readonly">
                  • {d}
                </div>
              ))}
            </div>
          </section>

          {!isAdmin && (
            <p style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
              Lecture seule : demande un accès admin pour modifier et enregistrer les paramètres.
            </p>
          )}

          {isAdmin && !message && (
            <p style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
              Astuce : versionne en changeant <code>{SETTINGS_KEY}</code> (ex : fiscalites_v2) plutôt
              que modifier destructivement.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
