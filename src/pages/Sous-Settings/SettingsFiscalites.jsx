import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import SettingsNav from "../SettingsNav";
import "./SettingsImpots.css";
import "./SettingsFiscalites.css";

const SETTINGS_KEY = "fiscalites_v1";

/**
 * DEFAULT_FISCALITES_SETTINGS
 * - Assurance-vie : matrice extraite du fichier Excel fourni (valeurs + couleurs + rowspans de "Phase")
 * - Autres enveloppes : matrice construite sur le même modèle (modifiable admin)
 */
export const DEFAULT_FISCALITES_SETTINGS = {
  meta: {
    title: "Matrice fiscalité des enveloppes (seuils & taux éditables)",
    assumptions: [
      "Résident fiscal France",
      "Matrice inspirée de l’Excel (lignes et sous-lignes par thématiques)",
      "L’Admin peut modifier directement montants, taux et textes cellule par cellule",
      "SCPI uniquement en direct (revenus fonciers)"
    ],
    lastReview: "2025-12-30"
  },
  products: [
    {
      id: "assurance_vie",
      label: "Assurance-vie",
      subtitle: "Matrice conforme au modèle Excel fourni",
      matrix: {
        columns: [
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
          "Commentaires"
        ],
        // rows = 54 lignes, 12 colonnes (cellules)
        // NOTE: bg F2F2F2 = gris (col Type 8 : PFU/PS/IR)
        //       bg F8FCF6 = vert clair (col Valeur par défaut : taux/montants)
        rows: [
          [{"v":"Épargne"},{"v":"Versement déductible des revenus"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Non"},{"v":"-"}],
          [{"v":""},{"v":"Fiscalité en cours de constitution sur les intérêts :"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Non"},{"v":"*17.20% sur les intérêts du fonds € prélevés annuellement"}],

          [{"v":"Retraits en capital"},{"v":"Assiette :"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Intérets"},{"v":""}],
          [{"v":""},{"v":"Taux applicable : "},{"v":"Versements effectués à partir du "},{"v":"2017-09-27","fmt":"date"},{"v":"<8 ans"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PFU*","bg":"F2F2F2"},{"v":0.128,"bg":"F8FCF6","fmt":"percent"},{"v":"*Ou barème"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":">8 ans"},{"v":"Célibataire"},{"v":4600,"fmt":"currency"},{"v":"Gain provenant des"},{"v":"<150 000 €"},{"v":"PFL*","bg":"F2F2F2"},{"v":0.075,"bg":"F8FCF6","fmt":"percent"},{"v":"*Ou barème"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Gain au delà des"},{"v":">150 000 €"},{"v":"PFU*","bg":"F2F2F2"},{"v":0.128,"bg":"F8FCF6","fmt":"percent"},{"v":"*Ou barème"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Couple"},{"v":9200,"fmt":"currency"},{"v":"Gain provenant des"},{"v":"<150 000 €"},{"v":"PFL*","bg":"F2F2F2"},{"v":0.075,"bg":"F8FCF6","fmt":"percent"},{"v":"*Ou barème"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Gain au delà des"},{"v":">150 000 €"},{"v":"PFU*","bg":"F2F2F2"},{"v":0.128,"bg":"F8FCF6","fmt":"percent"},{"v":"*Ou barème"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],

          [{"v":""},{"v":""},{"v":"Versements effectués avant"},{"v":"2017-09-27","fmt":"date"},{"v":"<4 ans"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PFL*","bg":"F2F2F2"},{"v":0.35,"bg":"F8FCF6","fmt":"percent"},{"v":"*Ou barème"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":"4 à 8 ans"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PFL*","bg":"F2F2F2"},{"v":0.15,"bg":"F8FCF6","fmt":"percent"},{"v":"*Ou barème"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":">8 ans"},{"v":"Célibataire"},{"v":4600,"fmt":"currency"},{"v":""},{"v":""},{"v":"PFL*","bg":"F2F2F2"},{"v":0.075,"bg":"F8FCF6","fmt":"percent"},{"v":"*Ou barème"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Couple"},{"v":9200,"fmt":"currency"},{"v":""},{"v":""},{"v":"PFL*","bg":"F2F2F2"},{"v":0.075,"bg":"F8FCF6","fmt":"percent"},{"v":"*Ou barème"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],

          [{"v":"Décès"},{"v":"Règles de transmission"},{"v":"Contrat souscrit avant le"},{"v":"1991-11-20","fmt":"date"},{"v":"Vst des primes jusqu'au"},{"v":"1998-10-12","fmt":"date"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":0,"bg":"F8FCF6"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Vst des primes à partir"},{"v":"1998-10-13","fmt":"date"},{"v":"<152 500 €"},{"v":"/bénef"},{"v":""},{"v":0,"bg":"F8FCF6"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"<852 500 €"},{"v":"/bénef"},{"v":""},{"v":0.2,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":">852 500 €"},{"v":"/bénef"},{"v":""},{"v":0.35,"bg":"F8FCF6","fmt":"percent"},{"v":""}],

          [{"v":""},{"v":""},{"v":""},{"v":"1991-11-20","fmt":"date"},{"v":"Vst des primes jusqu'au"},{"v":"1998-10-12","fmt":"date"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":0,"bg":"F8FCF6"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Vst des primes à partir"},{"v":"1998-10-13","fmt":"date"},{"v":"<152 500 €"},{"v":"/bénef"},{"v":""},{"v":0,"bg":"F8FCF6"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"<852 500 €"},{"v":"/bénef"},{"v":""},{"v":0.2,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":">852 500 €"},{"v":"/bénef"},{"v":""},{"v":0.35,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Vst ≥70ans"},{"v":""},{"v":""},{"v":"< 30 500 €"},{"v":"global"},{"v":""},{"v":0,"bg":"F8FCF6"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"> 30 500 €"},{"v":"global"},{"v":"DMTG*","bg":"F2F2F2"},{"v":1,"bg":"F8FCF6"},{"v":"*Intègre le barème des droits de succession"}],

          [{"v":""},{"v":""},{"v":"Contrat souscrit après le"},{"v":"1998-10-13","fmt":"date"},{"v":"Vst <70ans"},{"v":""},{"v":""},{"v":"<152 500 €"},{"v":"/bénef"},{"v":""},{"v":0,"bg":"F8FCF6"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"<852 500 €"},{"v":"/bénef"},{"v":""},{"v":0.2,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":">852 500 €"},{"v":"/bénef"},{"v":""},{"v":0.35,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Vst ≥70ans"},{"v":""},{"v":""},{"v":"< 30 500 €"},{"v":"global"},{"v":""},{"v":0,"bg":"F8FCF6"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"> 30 500 €"},{"v":"global"},{"v":"DMTG*","bg":"F2F2F2"},{"v":1,"bg":"F8FCF6"},{"v":"*Intègre le barème des droits de succession"}],

          [{"v":"Liquidation en rente"},{"v":"Transformation du capital en rente viagère"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Oui"},{"v":""}],
          [{"v":""},{"v":"Fiscalité de la rente"},{"v":"Fraction générée par les primes"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Selon l'âge de l’assuré lors de la transformation du capital en rente"},{"v":""},{"v":""},{"v":""},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"<60 ans"},{"v":0.5,"fmt":"percent"},{"v":"IR","bg":"F2F2F2"},{"v":"Barème"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"<70 ans"},{"v":0.4,"fmt":"percent"},{"v":"IR","bg":"F2F2F2"},{"v":"Barème"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"≥70 ans"},{"v":0.3,"fmt":"percent"},{"v":"IR","bg":"F2F2F2"},{"v":"Barème"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],

          [{"v":""},{"v":""},{"v":"Fraction générée par les intérets"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Selon l'âge de l’assuré lors de la transformation du capital en rente"},{"v":""},{"v":""},{"v":""},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":"Les PS sont calculés sur l'assiette après abattement"}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"<60 ans"},{"v":0.5,"fmt":"percent"},{"v":"IR","bg":"F2F2F2"},{"v":"Barème"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"<70 ans"},{"v":0.4,"fmt":"percent"},{"v":"IR","bg":"F2F2F2"},{"v":"Barème"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"≥70 ans"},{"v":0.3,"fmt":"percent"},{"v":"IR","bg":"F2F2F2"},{"v":"Barème"},{"v":""}],
          [{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"PS","bg":"F2F2F2"},{"v":0.172,"bg":"F8FCF6","fmt":"percent"},{"v":""}],

          [{"v":""},{"v":"Transmission des capitaux en cas de décès"},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":""},{"v":"Non*"},{"v":"*Sauf éventuelle réversion de la rente"}]
        ],
        merges: [
          { col: 0, start: 0, end: 1 },     // Épargne
          { col: 0, start: 2, end: 20 },    // Retraits en capital
          { col: 0, start: 21, end: 35 },   // Décès
          { col: 0, start: 36, end: 53 }    // Liquidation en rente
        ]
      }
    },

    // ---------- AUTRES PRODUITS (même matrice, éditable) ----------
    {
      id: "per_individuel",
      label: "PER individuel (PERIN)",
      subtitle: "Même structure de matrice (taux/assiettes/conditions)",
      matrix: buildDefaultMatrix_PERIN()
    },
    {
      id: "cto",
      label: "Compte-titres ordinaire (CTO)",
      subtitle: "PFU vs option barème, PV/MV, décès",
      matrix: buildDefaultMatrix_CTO()
    },
    {
      id: "pea",
      label: "PEA",
      subtitle: "Seuils de durée, exonération IR, PS, décès",
      matrix: buildDefaultMatrix_PEA()
    },
    {
      id: "scpi_direct",
      label: "SCPI en direct",
      subtitle: "Revenus fonciers + PV immobilières (direct uniquement)",
      matrix: buildDefaultMatrix_SCPI()
    },
    {
      id: "livret_bancaire",
      label: "Livret bancaire (fiscalisé)",
      subtitle: "PFU / option barème ; note Livret A/LDDS",
      matrix: buildDefaultMatrix_LIVRET()
    }
  ],
  disclaimer: [
    "Contenu informatif, non constitutif de conseil.",
    "Règles fiscales susceptibles d’évoluer (LF, doctrine). Vérifier l’actualité au moment du conseil.",
    "Adapter au cas client : TMI, RFR, dates, situation familiale, objectifs, etc."
  ]
};

/** ===== Helpers Matrice ===== */

const BG_GREY = "F2F2F2";
const BG_GREEN = "F8FCF6";

function makeCell(v = "", opts = {}) {
  return { v, ...opts };
}

function makeRow(vals) {
  const row = [];
  for (let i = 0; i < 12; i++) row.push(makeCell(vals[i] ?? ""));
  return row;
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
    "Commentaires"
  ];
}

function buildDefaultMatrix_PERIN() {
  const columns = defaultColumns();
  const rows = [
    makeRow(["Épargne", "Versement déductible des revenus", "", "", "", "", "", "", "", "", "Oui", "Plafond épargne retraite (à préciser/ajuster)"]),
    makeRow(["", "Fiscalité en cours de constitution sur les intérêts", "", "", "", "", "", "", "", "", "Non", "Aucune taxation tant qu’il n’y a pas de sortie"]),
    makeRow(["", "Disponibilité des fonds", "", "", "Cas de déblocage anticipé", "", "", "", "", "", "Oui", "Invalidité, décès, fin droits chômage, achat RP (selon règles)"]),

    makeRow(["Retraits en capital", "Assiette :", "", "", "", "", "", "", "", "", "Capital + Gains", "Distinguer 'versements' vs 'gains'"]),
    // Versements déduits
    [
      makeCell(""),
      makeCell("Versements déduits à l'entrée"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("Barème"),
      makeCell("Sur la part 'capital' (TMI)")
    ],
    [
      makeCell(""),
      makeCell("Gains (intérêts/plus-values)"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("*Ou barème (option globale annuelle)")
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
      makeCell("")
    ],
    // Versements non déduits
    [
      makeCell(""),
      makeCell("Versements NON déduits (sur option à l'entrée)"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("0%"),
      makeCell("Capital non imposé (si non déduit)")
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
      makeCell("")
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
      makeCell("")
    ],

    makeRow(["Liquidation en rente", "Transformation du capital en rente viagère", "", "", "", "", "", "", "", "", "Oui", ""]),
    makeRow(["", "Fiscalité de la rente (principe)", "Rente assimilée pension", "", "", "", "", "", "", "IR", "Barème", "RTVG (règles à adapter)"]),
    makeRow(["", "", "", "", "", "", "", "", "", "PS", "Selon règles", "CSG/CRDS sur pensions (à adapter)"]),

    makeRow(["Décès", "Traitement en cas de décès", "Dépend du type de PER", "", "", "", "", "", "", "", "Succession", "À préciser selon PER assurantiel / compte-titres"]),
    makeRow(["", "Clause bénéficiaire (si PER assurantiel)", "", "", "", "", "", "", "", "", "Oui", "Peut s’approcher d’un schéma AV selon contrat"]),
    makeRow(["", "Réversion éventuelle de rente", "", "", "", "", "", "", "", "", "Oui", "Selon option de liquidation"])
  ];

  const merges = [
    { col: 0, start: 0, end: 2 },
    { col: 0, start: 3, end: 9 },
    { col: 0, start: 10, end: 12 },
    { col: 0, start: 13, end: 15 }
  ];

  return { columns, rows, merges };
}

function buildDefaultMatrix_CTO() {
  const columns = defaultColumns();
  const rows = [
    makeRow(["Épargne", "Versement déductible des revenus", "", "", "", "", "", "", "", "", "Non", ""]),
    [
      makeCell(""),
      makeCell("Fiscalité des revenus (dividendes / intérêts)"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("*Ou barème (option globale annuelle)")
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
      makeCell("")
    ],
    makeRow(["", "Abattement dividendes (si option barème)", "", "", "", "", "", "", "", "", "40%", "Sur dividendes éligibles (IR)"]),

    makeRow(["Retraits en capital", "Assiette : plus-value de cession", "", "", "", "", "", "", "", "", "PV nette", "PV = prix cession - prix revient (frais)"]),
    [
      makeCell(""),
      makeCell("Taux applicable (régime par défaut)"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("")
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
      makeCell("")
    ],
    makeRow(["", "Sur option : barème IR", "", "", "", "", "", "", "", "IR", "Barème", "Option globale PFU -> barème"]),
    makeRow(["", "Moins-values", "", "", "", "", "", "", "", "", "Oui", "MV imputables, report (à ajuster)"]),

    [
      makeCell("Décès"),
      makeCell("Règles de transmission"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("DMTG*", { bg: BG_GREY }),
      makeCell(""),
      makeCell("Droits de succession (actif successoral)")
    ],
    makeRow(["", "Plus-values latentes", "", "", "", "", "", "", "", "", "Non", "En principe, pas d’IR sur PV latentes au décès (base réévaluée)"])
  ];

  const merges = [
    { col: 0, start: 0, end: 3 },
    { col: 0, start: 4, end: 8 },
    { col: 0, start: 9, end: 10 }
  ];

  return { columns, rows, merges };
}

function buildDefaultMatrix_PEA() {
  const columns = defaultColumns();
  const rows = [
    makeRow(["Épargne", "Versement déductible des revenus", "", "", "", "", "", "", "", "", "Non", ""]),
    makeRow(["", "Fiscalité en cours de constitution", "", "", "", "", "", "", "", "", "Non", "Tant qu’aucun retrait"]),

    makeRow(["Retraits en capital", "Assiette : gains (produits)", "", "", "", "", "", "", "", "", "Gains", "Retrait selon durée : impact fiscal"]),
    [
      makeCell(""),
      makeCell("Avant 5 ans"),
      makeCell(""),
      makeCell(""),
      makeCell("Retrait"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("Clôture + PFU sur gains (à ajuster selon règles)")
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
      makeCell("")
    ],
    [
      makeCell(""),
      makeCell("Après 5 ans"),
      makeCell(""),
      makeCell(""),
      makeCell("Retrait"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("0%"),
      makeCell("Exonération IR sur gains")
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
      makeCell("PS dus sur gains")
    ],

    [
      makeCell("Décès"),
      makeCell("Transmission"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("DMTG*", { bg: BG_GREY }),
      makeCell(""),
      makeCell("PEA clôturé, actif successoral")
    ]
  ];

  const merges = [
    { col: 0, start: 0, end: 1 },
    { col: 0, start: 2, end: 6 },
    { col: 0, start: 7, end: 7 }
  ];

  return { columns, rows, merges };
}

function buildDefaultMatrix_SCPI() {
  const columns = defaultColumns();
  const rows = [
    makeRow(["Épargne", "Versement déductible des revenus", "", "", "", "", "", "", "", "", "Non", "Achat de parts : pas de déduction IR"]),
    [
      makeCell(""),
      makeCell("Revenus (direct uniquement)"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("IR", { bg: BG_GREY }),
      makeCell("Barème"),
      makeCell("Revenus fonciers imposés au barème")
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
      makeCell("")
    ],
    [
      makeCell(""),
      makeCell("Micro-foncier (sur option)"),
      makeCell(""),
      makeCell(""),
      makeCell("Seuil recettes"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("Abattement", { bg: BG_GREY }),
      makeCell(0.30, { bg: BG_GREEN }),
      makeCell("Applicable si recettes ≤ 15 000 € (à vérifier/ajuster)")
    ],

    makeRow(["Retraits en capital", "Cession de parts : plus-value immobilière", "", "", "", "", "", "", "", "", "PV immo", "Régime PV immo des particuliers"]),
    makeRow(["", "Durée de détention", "", "", "", "", "", "", "", "", "Oui", "Abattements (IR/PS) selon durée (à détailler si besoin)"]),

    [
      makeCell("Décès"),
      makeCell("Transmission"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("DMTG*", { bg: BG_GREY }),
      makeCell(""),
      makeCell("Parts dans l’actif successoral")
    ]
  ];

  const merges = [
    { col: 0, start: 0, end: 3 },
    { col: 0, start: 4, end: 5 },
    { col: 0, start: 6, end: 6 }
  ];

  return { columns, rows, merges };
}

function buildDefaultMatrix_LIVRET() {
  const columns = defaultColumns();
  const rows = [
    makeRow(["Épargne", "Versement déductible des revenus", "", "", "", "", "", "", "", "", "Non", ""]),
    [
      makeCell(""),
      makeCell("Intérêts fiscalisés (livrets bancaires)"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("PFU*", { bg: BG_GREY }),
      makeCell(0.128, { bg: BG_GREEN, fmt: "percent" }),
      makeCell("*Ou barème (option globale annuelle)")
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
      makeCell("")
    ],
    makeRow(["", "Livret A / LDDS (note)", "", "", "", "", "", "", "", "IR", "0%", "Intérêts exonérés IR/PS (rappel)"]),

    makeRow(["Retraits en capital", "Retrait (fait générateur)", "", "", "", "", "", "", "", "", "Aucun", "Retrait non imposable : seuls intérêts le sont"]),

    [
      makeCell("Décès"),
      makeCell("Transmission"),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell("DMTG*", { bg: BG_GREY }),
      makeCell(""),
      makeCell("Solde au décès = actif successoral")
    ]
  ];

  const merges = [
    { col: 0, start: 0, end: 3 },
    { col: 0, start: 4, end: 4 },
    { col: 0, start: 5, end: 5 }
  ];

  return { columns, rows, merges };
}

function formatDisplay(cell) {
  const v = cell?.v;

  if (cell?.fmt === "percent") {
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v ?? "");
    const pct = n * 100;
    // 2 décimales si besoin
    const digits = Number.isInteger(pct) ? 0 : 2;
    return `${pct.toFixed(digits)}%`;
  }

  if (cell?.fmt === "currency") {
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v ?? "");
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(n);
  }

  return String(v ?? "");
}

function getRowSpan(merges, rowIndex, colIndex) {
  const m = (merges || []).find((x) => x.col === colIndex && rowIndex >= x.start && rowIndex <= x.end);
  if (!m) return 1;
  if (rowIndex === m.start) return m.end - m.start + 1;
  return 0; // dans la fusion mais pas la cellule "départ" => on ne rend pas la td
}

export default function SettingsFiscalites() {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState("User");
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(DEFAULT_FISCALITES_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = useMemo(() => roleLabel === "Admin", [roleLabel]);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        setLoading(true);

        // 1) user
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error(userErr);
          if (mounted) setLoading(false);
          return;
        }

        const u = userData?.user || null;
        if (!mounted) return;

        setUser(u);
        setRoleLabel("User");

        if (!u) {
          setLoading(false);
          return;
        }

        // 2) role
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single();

        if (!profErr) {
          const r = String(profile?.role || "").toLowerCase();
          setRoleLabel(r === "admin" ? "Admin" : "User");
        } else {
          console.warn("profiles.role error:", profErr);
        }

        // 3) settings row
        const { data: row, error: setErr } = await supabase
          .from("settings_fiscalites")
          .select("data")
          .eq("key", SETTINGS_KEY)
          .maybeSingle();

        if (setErr) {
          console.error("settings_fiscalites load error:", setErr);
        } else if (row?.data) {
          setSettings((prev) => {
            const incoming = row.data;
            return {
              ...prev,
              ...incoming,
              meta: { ...(prev.meta || {}), ...(incoming.meta || {}) },
              products: Array.isArray(incoming.products) ? incoming.products : prev.products,
              disclaimer: Array.isArray(incoming.disclaimer) ? incoming.disclaimer : prev.disclaimer
            };
          });
        }

        if (mounted) setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  const updateCell = (productId, rowIndex, colIndex, newValue) => {
    setSettings((prev) => {
      const next = structuredClone(prev);
      const p = next.products?.find((x) => x.id === productId);
      if (!p?.matrix?.rows?.[rowIndex]?.[colIndex]) return prev;
      p.matrix.rows[rowIndex][colIndex].v = newValue;
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
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from("settings_fiscalites").upsert(payload, { onConflict: "key" });

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

        <div style={{ fontSize: 15, marginTop: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="tax-user-banner">
            <strong>Utilisateur :</strong> {user.email} — <strong>Statut :</strong> {roleLabel}
          </div>

          <section>
            <h3>{settings?.meta?.title || "Matrice fiscalité"}</h3>
            <p style={{ fontSize: 13, color: "#555" }}>
              Mode Admin : édition cellule par cellule (taux/montants/texte). Mode User : lecture seule.
            </p>
          </section>

          {(settings?.products || []).map((prod) => {
            const { columns, rows, merges } = prod.matrix || {};
            return (
              <section key={prod.id}>
                <h3>{prod.label}</h3>
                {prod.subtitle && <p style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>{prod.subtitle}</p>}

                <div className="matrix-wrap">
                  <table className="settings-table fiscalites-matrix">
                    <thead>
                      <tr>
                        {(columns || []).map((col, idx) => (
                          <th key={idx} className="matrix-th">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {(rows || []).map((r, rowIdx) => (
                        <tr key={rowIdx}>
                          {r.map((cell, colIdx) => {
                            const rowSpan = colIdx === 0 ? getRowSpan(merges, rowIdx, colIdx) : 1;
                            if (colIdx === 0 && rowSpan === 0) return null;

                            const bg = cell?.bg ? `#${cell.bg}` : undefined;
                            const isLongText = typeof cell?.v === "string" && cell.v.length > 40;

                            const commonStyle = {
                              background: bg,
                              whiteSpace: "pre-wrap"
                            };

                            return (
                              <td
                                key={colIdx}
                                rowSpan={rowSpan}
                                className={colIdx === 0 ? "matrix-phase" : ""}
                                style={commonStyle}
                              >
                                {!isAdmin ? (
                                  <div className="matrix-readonly">{formatDisplay(cell)}</div>
                                ) : (
                                  <>
                                    {cell?.fmt === "percent" ? (
                                      <input
                                        className="matrix-input"
                                        type="number"
                                        step="0.0001"
                                        value={cell?.v ?? ""}
                                        onChange={(e) => updateCell(prod.id, rowIdx, colIdx, e.target.value)}
                                      />
                                    ) : cell?.fmt === "currency" ? (
                                      <input
                                        className="matrix-input"
                                        type="number"
                                        step="1"
                                        value={cell?.v ?? ""}
                                        onChange={(e) => updateCell(prod.id, rowIdx, colIdx, e.target.value)}
                                      />
                                    ) : cell?.fmt === "date" ? (
                                      <input
                                        className="matrix-input"
                                        type="text"
                                        placeholder="YYYY-MM-DD"
                                        value={cell?.v ?? ""}
                                        onChange={(e) => updateCell(prod.id, rowIdx, colIdx, e.target.value)}
                                      />
                                    ) : isLongText ? (
                                      <textarea
                                        className="settings-textarea"
                                        rows={3}
                                        value={cell?.v ?? ""}
                                        onChange={(e) => updateCell(prod.id, rowIdx, colIdx, e.target.value)}
                                      />
                                    ) : (
                                      <input
                                        className="matrix-input"
                                        type="text"
                                        value={cell?.v ?? ""}
                                        onChange={(e) => updateCell(prod.id, rowIdx, colIdx, e.target.value)}
                                      />
                                    )}
                                  </>
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
              {(settings?.disclaimer || []).map((d, idx) => (
                <div key={idx}>
                  {isAdmin ? (
                    <textarea
                      className="settings-textarea"
                      rows={2}
                      value={d}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSettings((prev) => {
                          const next = structuredClone(prev);
                          next.disclaimer[idx] = v;
                          return next;
                        });
                        setMessage("");
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 13, color: "#555" }}>• {d}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {isAdmin && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" className="chip" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>

              <button type="button" className="chip" onClick={handleResetDefault} disabled={saving}>
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
