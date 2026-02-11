/**
 * settingsDefaults.ts
 *
 * Source unique de vérité pour les valeurs par défaut des trois tables de paramètres :
 *   - tax_settings   → DEFAULT_TAX_SETTINGS
 *   - ps_settings    → DEFAULT_PS_SETTINGS
 *   - fiscality_settings (V1 format) → DEFAULT_FISCALITY_SETTINGS
 *
 * Utilisé comme fallback quand Supabase ne répond pas, ET comme état initial
 * des pages Settings (SettingsImpots, SettingsPrelevements, BaseContrat).
 *
 * ⚠️  Ne jamais dupliquer ces objets ailleurs — toujours importer depuis ce fichier.
 */

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_TAX_SETTINGS
// Source : barème 2025 (revenus 2024) + brochure IR 2025 / barème 2024
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_TAX_SETTINGS = {
  incomeTax: {
    currentYearLabel: '2025 (revenus 2024)',
    previousYearLabel: '2024 (revenus 2023)',
    scaleCurrent: [
      { from: 0, to: 11497, rate: 0, deduction: 0 },
      { from: 11498, to: 29315, rate: 11, deduction: 1264.78 },
      { from: 29316, to: 83823, rate: 30, deduction: 6834.63 },
      { from: 83824, to: 180294, rate: 41, deduction: 16055.16 },
      { from: 180295, to: null, rate: 45, deduction: 23266.92 },
    ],
    scalePrevious: [
      { from: 0, to: 11294, rate: 0, deduction: 0 },
      { from: 11295, to: 28797, rate: 11, deduction: 0 },
      { from: 28798, to: 82341, rate: 30, deduction: 0 },
      { from: 82342, to: 177106, rate: 41, deduction: 0 },
      { from: 177107, to: null, rate: 45, deduction: 0 },
    ],
    quotientFamily: {
      current: {
        plafondPartSup: 1791,
        plafondParentIsoléDeuxPremièresParts: 4224,
      },
      previous: {
        plafondPartSup: 1791,
        plafondParentIsoléDeuxPremièresParts: 4224,
      },
    },
    decote: {
      current: {
        triggerSingle: 1964,
        triggerCouple: 3248,
        amountSingle: 889,
        amountCouple: 1470,
        ratePercent: 45.25,
      },
      previous: {
        triggerSingle: 1964,
        triggerCouple: 3248,
        amountSingle: 889,
        amountCouple: 1470,
        ratePercent: 45.25,
      },
    },
    abat10: {
      current: { plafond: 14426, plancher: 504 },
      previous: { plafond: 14171, plancher: 495 },
      retireesCurrent: { plafond: 4399, plancher: 450 },
      retireesPrevious: { plafond: 4321, plancher: 442 },
    },
    domAbatement: {
      current: {
        gmr: { ratePercent: 30, cap: 2450 },
        guyane: { ratePercent: 40, cap: 4050 },
      },
      previous: {
        gmr: { ratePercent: 30, cap: 2450 },
        guyane: { ratePercent: 40, cap: 4050 },
      },
    },
  },
  pfu: {
    current: { rateIR: 12.8, rateSocial: 17.2, rateTotal: 30.0 },
    previous: { rateIR: 12.8, rateSocial: 17.2, rateTotal: 30.0 },
  },
  cehr: {
    current: {
      single: [
        { from: 250000, to: 500000, rate: 3 },
        { from: 500000, to: null, rate: 4 },
      ],
      couple: [
        { from: 500000, to: 1000000, rate: 3 },
        { from: 1000000, to: null, rate: 4 },
      ],
    },
    previous: {
      single: [
        { from: 250000, to: 500000, rate: 3 },
        { from: 500000, to: null, rate: 4 },
      ],
      couple: [
        { from: 500000, to: 1000000, rate: 3 },
        { from: 1000000, to: null, rate: 4 },
      ],
    },
  },
  cdhr: {
    current: { minEffectiveRate: 20, thresholdSingle: 250000, thresholdCouple: 500000 },
    previous: { minEffectiveRate: 20, thresholdSingle: 250000, thresholdCouple: 500000 },
  },
  corporateTax: {
    current: {
      normalRate: 25,
      reducedRate: 15,
      reducedThreshold: 42500,
    },
    previous: {
      normalRate: 25,
      reducedRate: 15,
      reducedThreshold: 42500,
    },
  },
  dmtg: {
    ligneDirecte: {
      abattement: 100000,
      scale: [
        { from: 0, to: 8072, rate: 5 },
        { from: 8072, to: 12109, rate: 10 },
        { from: 12109, to: 15932, rate: 15 },
        { from: 15932, to: 552324, rate: 20 },
        { from: 552324, to: 902838, rate: 30 },
        { from: 902838, to: 1805677, rate: 40 },
        { from: 1805677, to: null, rate: 45 },
      ],
    },
    frereSoeur: {
      abattement: 15932,
      scale: [
        { from: 0, to: 24430, rate: 35 },
        { from: 24430, to: null, rate: 45 },
      ],
    },
    neveuNiece: {
      abattement: 7967,
      scale: [
        { from: 0, to: null, rate: 55 },
      ],
    },
    autre: {
      abattement: 1594,
      scale: [
        { from: 0, to: null, rate: 60 },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_PS_SETTINGS
// Source : fichier Excel PS.xlsx + bases officielles CNIEG / CRPCEN
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_PS_SETTINGS = {
  labels: {
    currentYearLabel: '2025 (RFR 2023 & Avis IR 2024)',
    previousYearLabel: '2024 (RFR 2022 & Avis IR 2023)',
  },

  // PS sur patrimoine / capital
  patrimony: {
    current: {
      totalRate: 17.2,
      csgDeductibleRate: 6.8,
    },
    previous: {
      totalRate: 17.2,
      csgDeductibleRate: 6.8,
    },
  },

  // PS sur les retraites (barème par tranche de RFR pour 1 part)
  retirement: {
    current: {
      brackets: [
        {
          label: 'Exonération',
          rfrMin1Part: 0,
          rfrMax1Part: 11432,
          csgRate: 0,
          crdsRate: 0,
          casaRate: 0,
          maladieRate: 0,
          totalRate: 0,
          csgDeductibleRate: 0,
        },
        {
          label: 'Taux réduit',
          rfrMin1Part: 11433,
          rfrMax1Part: 14944,
          csgRate: 3.8,
          crdsRate: 0.5,
          casaRate: 0,
          maladieRate: 0,
          totalRate: 4.3,
          csgDeductibleRate: 3.8,
        },
        {
          label: 'Taux médian',
          rfrMin1Part: 14945,
          rfrMax1Part: 23193,
          csgRate: 6.6,
          crdsRate: 0.5,
          casaRate: 0.3,
          maladieRate: 1.0,
          totalRate: 8.4,
          csgDeductibleRate: 4.2,
        },
        {
          label: 'Taux normal',
          rfrMin1Part: 23193,
          rfrMax1Part: null,
          csgRate: 8.3,
          crdsRate: 0.5,
          casaRate: 0.3,
          maladieRate: 1.0,
          totalRate: 10.1,
          csgDeductibleRate: 5.9,
        },
      ],
    },
    previous: {
      brackets: [
        {
          label: 'Exonération',
          rfrMin1Part: 0,
          rfrMax1Part: 11432,
          csgRate: 0,
          crdsRate: 0,
          casaRate: 0,
          maladieRate: 0,
          totalRate: 0,
          csgDeductibleRate: 0,
        },
        {
          label: 'Taux réduit',
          rfrMin1Part: 11433,
          rfrMax1Part: 14944,
          csgRate: 3.8,
          crdsRate: 0.5,
          casaRate: 0,
          maladieRate: 0,
          totalRate: 4.3,
          csgDeductibleRate: 3.8,
        },
        {
          label: 'Taux médian',
          rfrMin1Part: 14945,
          rfrMax1Part: 23193,
          csgRate: 6.6,
          crdsRate: 0.5,
          casaRate: 0.3,
          maladieRate: 1.0,
          totalRate: 8.4,
          csgDeductibleRate: 4.2,
        },
        {
          label: 'Taux normal',
          rfrMin1Part: 23193,
          rfrMax1Part: null,
          csgRate: 8.3,
          crdsRate: 0.5,
          casaRate: 0.3,
          maladieRate: 1.0,
          totalRate: 10.1,
          csgDeductibleRate: 5.9,
        },
      ],
    },
  },

  // Seuils RFR pour CSG / CRDS / CASA par lieu de résidence
  retirementThresholds: {
    current: {
      metropole: {
        rfrMaxExemption1Part: 12817,
        rfrMaxReduced1Part: 16755,
        rfrMaxMedian1Part: 26004,
        incrementQuarterExemption: 1711,
        incrementQuarterReduced: 2237,
        incrementQuarterMedian: 3471,
      },
      gmr: {
        rfrMaxExemption1Part: 15164,
        rfrMaxReduced1Part: 18331,
        rfrMaxMedian1Part: 26004,
        incrementQuarterExemption: 1882,
        incrementQuarterReduced: 2459,
        incrementQuarterMedian: 3471,
      },
      guyane: {
        rfrMaxExemption1Part: 15856,
        rfrMaxReduced1Part: 19200,
        rfrMaxMedian1Part: 26004,
        incrementQuarterExemption: 1968,
        incrementQuarterReduced: 2572,
        incrementQuarterMedian: 3471,
      },
    },
    previous: {
      metropole: {
        rfrMaxExemption1Part: 12230,
        rfrMaxReduced1Part: 15988,
        rfrMaxMedian1Part: 24812,
        incrementQuarterExemption: 1633,
        incrementQuarterReduced: 2135,
        incrementQuarterMedian: 3312,
      },
      gmr: {
        rfrMaxExemption1Part: 14469,
        rfrMaxReduced1Part: 17491,
        rfrMaxMedian1Part: 24812,
        incrementQuarterExemption: 1633,
        incrementQuarterReduced: 2135,
        incrementQuarterMedian: 3312,
      },
      guyane: {
        rfrMaxExemption1Part: 15130,
        rfrMaxReduced1Part: 18321,
        rfrMaxMedian1Part: 24812,
        incrementQuarterExemption: 1633,
        incrementQuarterReduced: 2135,
        incrementQuarterMedian: 3312,
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_FISCALITY_SETTINGS  (V1 format — assuranceVie + perIndividuel)
// Source : tableau Excel PJ / BOFiP
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_FISCALITY_SETTINGS = {
  perIndividuel: {
    epargne: {
      plafond163Quatervicies: {
        ratePercent: 10,
        base: "revenu imposable après abattement 10% (frais pro éventuels)",
        minPassMultiple: 1,
        maxPassMultiple: 8,
        note:
          "Plafond = 10% des revenus imposables (après abattement 10% si applicable). Minimum = 10% d'1 PASS, maximum = 10% de 8 PASS.",
      },
      plafond154Bis: {
        assiettePotentielle: {
          base:
            "assiette sociale (revenu imposable majoré des cotisations facultatives)",
          part15: {
            ratePercent: 15,
            base: "revenus - 1 PASS",
            maxPassMultiple: 8,
          },
          part10: {
            ratePercent: 10,
            base:
              "revenus (après abattement 10% si applicable) - composante plancher/plafond",
            minPassMultiple: 1,
            maxPassMultiple: 8,
          },
        },
        assietteReportDeclaration: {
          base:
            "recalcul sur revenu imposable (après abattement 10% si applicable) : on reporte uniquement le dépassement de l'enveloppe 15%",
          note:
            "Assiette report = dépassement de l'enveloppe 15%, recalculé sur l'assiette 'revenu imposable après abattement 10%'.",
        },
        note:
          "Plafond 'Madelin' (154 bis) : 15% des revenus - 1 PASS (max 8 PASS) + 10% des revenus (max 8 PASS avec mini 10% PASS).",
      },
    },

    sortieCapital: {
      pfu: {
        irRatePercent: 12.8,
        psRatePercent: 17.2,
        allowBaremeIR: true,
      },
      retraite: {
        deduits: {
          versements: { irMode: "bareme", note: "Part versements déduits : imposable au barème IR (sans abattement)." },
          gains: { mode: "pfu", note: "Part gains : PFU (12,8% + 17,2%) par défaut, option barème pour la part IR possible." },
        },
        nonDeduits: {
          versements: { irMode: "exonere", note: "Part versements non déduits : exonérée d'IR." },
          gains: { mode: "pfu", note: "Part gains : PFU (12,8% + 17,2%) par défaut, option barème pour la part IR possible." },
        },
      },
      anticipation: {
        achatRP: {
          deduits: { versementsIR: "bareme", gains: "pfu" },
          nonDeduits: { versementsIR: "exonere", gains: "pfu" },
          note: "Déblocage anticipé pour achat de résidence principale : logique proche de la sortie à la retraite.",
        },
        accidentsDeLaVie: {
          note:
            "Déblocages anticipés 'accidents de la vie' : traitement fiscal à gérer au cas par cas (règles spécifiques, souvent exonérations).",
        },
      },
    },

    deces: {
      perAssurantiel: {
        allowancePerBeneficiary: 152500,
        displayThresholdTotal: 852500,
        taxableThresholdPart: 700000,
        rates: [
          { upToTotal: 852500, ratePercent: 20 },
          { upToTotal: null, ratePercent: 31.25 },
        ],
        apres70ans: {
          globalAllowance: 30500,
          mode: "dmtg",
          note: "Au-delà : DMTG (barème succession).",
        },
        note: "PER assurantiel : transmission alignée assurance-vie (990 I / 757 B).",
      },
      perBancaire: {
        mode: "succession",
        note: "PER bancaire : intégration à l'actif successoral (DMTG barème succession).",
      },
    },

    rente: {
      rvtoTaxableFractionByAgeAtFirstPayment: [
        { label: "< 50 ans", ageMaxInclusive: 49, fraction: 0.7 },
        { label: "50 à 59 ans", ageMaxInclusive: 59, fraction: 0.5 },
        { label: "60 à 69 ans", ageMaxInclusive: 69, fraction: 0.4 },
        { label: "≥ 70 ans", ageMaxInclusive: null, fraction: 0.3 },
      ],
      deduits: {
        capitalQuotePart: {
          irMode: "bareme_sans_abattement_10",
          psRatePercent: 0.3,
          psLabel: "CASA",
          note:
            "Quote-part capital : rente à titre gratuit, imposée au barème IR (sans abattement 10%). PS : CASA 0,3%.",
        },
        interestsQuotePart: {
          irMode: "rvto",
          psRatePercent: 17.2,
          note:
            "Quote-part intérêts : RVTO (fraction imposable selon âge). PS : 17,2% sur l'assiette après abattement RVTO.",
        },
      },
      nonDeduits: {
        irMode: "rvto",
        psRatePercent: 17.2,
        note:
          "Totalité de la rente : RVTO (fraction imposable selon âge). PS : 17,2% sur l'assiette après abattement RVTO.",
      },
    },
  },

  assuranceVie: {
    epargne: {
      versementDeductibleIR: false,
      socialOnInterestsDuringAccumulation: {
        psRatePercent: 17.2,
        note: "PS sur intérêts (fonds €) prélevés annuellement.",
      },
    },

    retraitsCapital: {
      baseImposable: 'interets',
      psRatePercent: 17.2,

      depuis2017: {
        startDate: '2017-09-27',
        moins8Ans: {
          irRatePercent: 12.8,
          allowBaremeIR: true,
          label: '< 8 ans',
        },
        plus8Ans: {
          label: '> 8 ans',
          abattementAnnuel: {
            single: 4600,
            couple: 9200,
          },
          primesNettesSeuil: 150000,
          irRateUnderThresholdPercent: 7.5,
          irRateOverThresholdPercent: 12.8,
          allowBaremeIR: true,
        },
      },

      avant2017: {
        endDate: '2017-09-26',
        moins4Ans: { label: '< 4 ans', irRatePercent: 35, allowBaremeIR: true },
        de4a8Ans: { label: '4 à 8 ans', irRatePercent: 15, allowBaremeIR: true },
        plus8Ans: {
          label: '> 8 ans',
          abattementAnnuel: { single: 4600, couple: 9200 },
          irRatePercent: 7.5,
          allowBaremeIR: true,
        },
      },
    },

    deces: {
      contratAvantDate: '1998-10-12',
      contratApresDate: '1998-10-13',
      agePivotPrimes: 70,

      primesAvant1998: {
        taxRatePercent: 0,
        note: "Contrats souscrits avant le 13/10/1998 : primes versées avant le 13/10/1998 exonérées.",
      },

      primesApres1998: {
        allowancePerBeneficiary: 152500,
        brackets: [
          { upTo: 852500, ratePercent: 20 },
          { upTo: null, ratePercent: 35 },
        ],
        note: 'Barème par bénéficiaire (990 I).',
      },

      apres70ans: {
        globalAllowance: 30500,
        taxationMode: 'dmtg',
        note: 'Au-delà de 30 500 € (global), taxation aux DMTG (barème succession).',
      },
    },

    rente: {
      possible: true,
      psRatePercent: 17.2,
      taxableFractionByAgeAtLiquidation: [
        { label: '< 60 ans', ageMaxInclusive: 59, fraction: 0.5 },
        { label: '< 70 ans', ageMaxInclusive: 69, fraction: 0.4 },
        { label: '≥ 70 ans', ageMaxInclusive: null, fraction: 0.3 },
      ],
      irMode: 'bareme',
      notePs: "Les PS sont calculés sur l'assiette après abattement.",
      noteCapitalOnDeath:
        'Transmission des capitaux en cas de décès : non (sauf éventuelle réversion de la rente).',
    },
  },
};
