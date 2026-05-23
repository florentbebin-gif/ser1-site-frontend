-- Seed v2 2026 : régimes obligatoires de prévoyance extraits du Mémento 2026.
-- Rollback : supprimer les codes v2 ajoutés ci-dessous, puis réappliquer 20260523000200_seed_prevoyance_regime_settings_2026.sql.
-- Attention métier : les sources indiquent que la validation humaine reste requise avant usage conseil.

DELETE FROM public.prevoyance_regime_settings WHERE code = 'carcdsf';

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'salarie-cpam',
  'Salarié secteur privé — CPAM',
  'CPAM',
  'salarie',
  'collectif',
  2026,
  $prevoyance_data_salarie_cpam${
  "arret": {
    "carences": {
      "maladie": 3,
      "accident": 3,
      "hospitalisation": 3
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 4,
        "toDay": 1095,
        "label": "IJSS — 50% du salaire journalier moyen plafonné à 1,4 SMIC",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 41.95,
          "unit": "€/jour brut max",
          "label": "Max 41,95 €/j 2026"
        }
      }
    ],
    "notes": [
      "Durée max 12 mois sur 3 ans glissants (3 ans en cas d'ALD).",
      "Conditions : avoir travaillé 150 h sur 3 mois ou cotisé sur 1015 SMIC horaire sur 6 mois.",
      "Pas de carence en cas de reprise d'activité < 48 h ou d'ALD."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": null,
        "label": "Catégorie 1 — capable d'exercer une activité",
        "amount": {
          "mode": "percent_salary",
          "value": 30,
          "unit": "% du salaire annuel moyen 10 meilleures années (plafonné PASS)",
          "label": "Cat 1 : 4 059,72 € min / 14 418 € max 2026"
        },
        "category": "1"
      },
      {
        "fromRate": 66,
        "toRate": null,
        "label": "Catégorie 2 — incapable d'exercer toute activité",
        "amount": {
          "mode": "percent_salary",
          "value": 50,
          "unit": "% du salaire annuel moyen 10 meilleures années (plafonné PASS)",
          "label": "Cat 2 : 4 059,72 € min / 24 030 € max 2026"
        },
        "category": "2"
      },
      {
        "fromRate": 66,
        "toRate": null,
        "label": "Catégorie 3 — incapacité totale + tierce personne",
        "amount": {
          "mode": "percent_salary",
          "value": 50,
          "unit": "% du salaire + majoration tierce personne",
          "label": "Cat 3 : 19 517,28 € min / 39 487,56 € max 2026"
        },
        "category": "3"
      }
    ],
    "notes": [
      "Seuil de déclenchement : 2/3 (66%).",
      "Versement jusqu'à l'âge légal de retraite (62 ans), prorogeable à 67 ans si activité.",
      "Cumul pension + revenus plafonné à l'ancien salaire."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 4009,
      "label": "Capital décès forfaitaire 2026 (revalorisé en avril)"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": null,
    "renteEducation": null,
    "notes": [
      "Bénéficiaires : conjoint/PACS > enfants > ascendants."
    ]
  },
  "cotisations": {
    "mode": "percent_salary",
    "value": 13,
    "assiette": "TA-TB-TC",
    "min": null,
    "max": null,
    "repartition": {
      "employeur": 100,
      "salarie": 0
    },
    "madelinEligible": false,
    "notes": [
      "Taux réduit à 7% si rémunération brute ≤ 2,5 SMIC (non ouvert aux assimilés salariés).",
      "Cotisation supplémentaire en régime local Alsace-Moselle."
    ]
  }
}$prevoyance_data_salarie_cpam$::jsonb,
  $prevoyance_sources_salarie_cpam${
  "fiche": "Mémento 2026 — Fiche 33",
  "pagesPdf": [
    115,
    116,
    117
  ],
  "noteValidation": "Extraction LLM 2026-05-23, à relire métier avant migration v2. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_salarie_cpam$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'salarie-msa',
  'Salarié agricole — MSA',
  'MSA salariés',
  'salarie',
  'collectif',
  2026,
  $prevoyance_data_salarie_msa${
  "arret": {
    "carences": {
      "maladie": 3,
      "accident": 3,
      "hospitalisation": 3
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 4,
        "toDay": 1095,
        "label": "IJSS MSA — règles identiques au régime général CPAM",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 41.95,
          "unit": "€/jour brut max",
          "label": "Max 41,95 €/j 2026 (référence CPAM)"
        }
      }
    ],
    "notes": [
      "Le Mémento Fiche 33 précise : règles identiques entre CPAM et MSA salariés.",
      "Durée max 12 mois sur 3 ans glissants."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": null,
        "label": "Catégorie 1 — règles identiques régime général",
        "amount": {
          "mode": "percent_salary",
          "value": 30,
          "label": "Cat 1 : 4 059,72 € min / 14 418 € max 2026"
        },
        "category": "1"
      },
      {
        "fromRate": 66,
        "toRate": null,
        "label": "Catégorie 2 — règles identiques régime général",
        "amount": {
          "mode": "percent_salary",
          "value": 50,
          "label": "Cat 2 : 4 059,72 € min / 24 030 € max 2026"
        },
        "category": "2"
      },
      {
        "fromRate": 66,
        "toRate": null,
        "label": "Catégorie 3 — règles identiques régime général",
        "amount": {
          "mode": "percent_salary",
          "value": 50,
          "label": "Cat 3 : 19 517,28 € min / 39 487,56 € max 2026"
        },
        "category": "3"
      }
    ],
    "notes": [
      "Seuil 66%, montants identiques CPAM."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 4009,
      "label": "Capital décès 4 009 € 2026 (référence régime général)"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": null,
    "renteEducation": null
  },
  "cotisations": {
    "mode": "percent_salary",
    "value": 13,
    "assiette": "TA-TB-TC",
    "repartition": {
      "employeur": 100,
      "salarie": 0
    },
    "madelinEligible": false,
    "notes": [
      "Cotisations URSSAF MSA, alignées sur régime général."
    ]
  }
}$prevoyance_data_salarie_msa$::jsonb,
  $prevoyance_sources_salarie_msa${
  "fiche": "Mémento 2026 — Fiche 33 (mention MSA salariés)",
  "pagesPdf": [
    115
  ],
  "noteValidation": "Mémento ne dédie pas de fiche distincte MSA salarié, règles alignées CPAM. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_salarie_msa$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'ssi-artisan-commercant',
  'Artisan / commerçant — SSI',
  'SSI',
  'tns',
  'individuel',
  2026,
  $prevoyance_data_ssi_artisan_commercant${
  "arret": {
    "carences": {
      "maladie": 3,
      "accident": 3,
      "hospitalisation": 3
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 4,
        "toDay": 1095,
        "label": "IJ SSI — 1/730 revenu moyen 3 ans plafonné PASS",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 65.83,
          "unit": "€/jour max",
          "label": "Max 65,83 €/j 2026 — Min 26,33 €/j (cotisation min)"
        }
      }
    ],
    "notes": [
      "Durée 360 jours sur 3 ans glissants.",
      "Reprise activité temps partiel : versement maintenu 90 jours, montant divisé par 2.",
      "Condition : 12 mois d'affiliation continue (sauf passage régime général sans interruption)."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": null,
        "label": "PIPM — Pension Incapacité Partielle au Métier",
        "amount": {
          "mode": "percent_income",
          "value": 30,
          "unit": "% revenu annuel moyen 10 meilleures années",
          "label": "6 312,12 € min / 14 130 € max 2026"
        },
        "category": "PIPM"
      },
      {
        "fromRate": 66,
        "toRate": null,
        "label": "PITD — Pension Invalidité Totale et Définitive",
        "amount": {
          "mode": "percent_income",
          "value": 50,
          "label": "8 892,84 € min / 23 550 € max 2026"
        },
        "category": "PITD"
      },
      {
        "fromRate": 66,
        "toRate": null,
        "label": "PITD + Majoration Tierce Personne",
        "amount": {
          "mode": "percent_income",
          "value": 50,
          "label": "24 350,40 € min / 39 007,56 € max 2026"
        },
        "category": "PITD+MTP"
      }
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 9612,
      "label": "20% du PASS 2026 = 9 612 € (+5% PASS par enfant < 16 ans à charge)"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": null,
    "renteEducation": null
  },
  "cotisations": {
    "mode": "percent_income",
    "value": 1.3,
    "assiette": "TA",
    "min": 11.5,
    "max": null,
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Bloc invalidité-décès : 1,3% revenu plafonné 1 PASS, assiette min 11,5% PASS.",
      "Cotisation arrêt IJ séparée : 0,85% revenu plafonné 5 PASS, assiette min 40% PASS."
    ]
  }
}$prevoyance_data_ssi_artisan_commercant$::jsonb,
  $prevoyance_sources_ssi_artisan_commercant${
  "fiche": "Mémento 2026 — Fiche 34",
  "pagesPdf": [
    118,
    119,
    120
  ],
  "noteValidation": "Extraction LLM 2026-05-23, à relire métier. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_ssi_artisan_commercant$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'cnavpl',
  'Profession libérale — socle CNAVPL',
  'CNAVPL',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_cnavpl${
  "arret": {
    "carences": {
      "maladie": 3,
      "accident": 3,
      "hospitalisation": 3
    },
    "maxDurationDays": 90,
    "paliers": [
      {
        "fromDay": 4,
        "toDay": 90,
        "label": "IJ CNAVPL — 50% revenu moyen 3 ans plafonné 3 PASS",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 198,
          "label": "Max 198 €/j 2026, min 26 €/j"
        }
      }
    ],
    "notes": [
      "Versement uniquement les 90 premiers jours — relais par caisse professionnelle au-delà.",
      "Mis en place depuis le 1er juillet 2021."
    ]
  },
  "invalidite": {
    "paliers": [],
    "notes": [
      "Socle CNAVPL ne couvre pas l'invalidité — gestion par la caisse professionnelle (fiches 36-46)."
    ]
  },
  "deces": {
    "capital": {
      "mode": "formula",
      "value": null,
      "label": "Géré par la caisse professionnelle"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": null,
    "renteEducation": null,
    "notes": [
      "Socle CNAVPL ne couvre pas le décès — voir caisse pro."
    ]
  },
  "cotisations": {
    "mode": "percent_income",
    "value": 0.3,
    "assiette": "TA-TB-TC",
    "min": 40,
    "max": null,
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "0,30% du revenu plafonné 3 PASS, assiette minimale 40% PASS.",
      "Cotisation invalidité-décès gérée à part par la caisse professionnelle."
    ]
  }
}$prevoyance_data_cnavpl$::jsonb,
  $prevoyance_sources_cnavpl${
  "fiche": "Mémento 2026 — Fiche 35",
  "pagesPdf": [
    121
  ],
  "noteValidation": "Socle commun, à compléter par les fiches caisses pro. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_cnavpl$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'cipav',
  'Profession libérale réglementée — CIPAV',
  'CIPAV',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_cipav${
  "arret": {
    "carences": {
      "maladie": 0,
      "accident": 0,
      "hospitalisation": 0
    },
    "maxDurationDays": 0,
    "paliers": [
      {
        "fromDay": 0,
        "toDay": null,
        "label": "Pas d'IJ CIPAV — souscrire contrat individuel recommandé",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 0
        }
      }
    ],
    "notes": [
      "La CIPAV ne verse aucune IJ en cas d'arrêt de travail.",
      "Exonération possible des cotisations CNAVPL et CIPAV après 6 mois d'incapacité, attribution gratuite 400 points."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle (≥ 66%)",
        "amount": {
          "mode": "formula",
          "value": null,
          "label": "1/3 des points + 5% PASS — min 6 120 € / max 24 254 € 2026"
        }
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale 100%",
        "amount": {
          "mode": "formula",
          "value": null,
          "label": "1/3 des points + 5% PASS — min 9 272 € / max 36 748 € 2026"
        }
      }
    ],
    "notes": [
      "Clause de ressources pour invalidité partielle (entre 1 SMIC et 2 SMIC annuels).",
      "Versement après délai 6 mois, jusqu'à 65 ans.",
      "Exonération totale des cotisations en cas d'invalidité totale."
    ]
  },
  "deces": {
    "capital": {
      "mode": "formula",
      "value": null,
      "label": "Capital points + 15% PASS — min 27 816 € / max 110 244 € 2026 (toutes causes)"
    },
    "doublementAccident": true,
    "doubleEffet": false,
    "renteConjoint": {
      "mode": "formula",
      "value": null,
      "label": "10% points + 1,5% PASS — min 2 782 € / max 11 024 €/an 2026 (jusqu'à 60 ans conjoint)"
    },
    "renteEducation": {
      "mode": "formula",
      "value": null,
      "label": "Selon classe : min 2 782 € / max 11 024 €/an 2026 (jusqu'à 21 ans, 25 si études)"
    },
    "notes": [
      "Décès accidentel : 5 000 points supplémentaires (capital min 42 866 € / max 125 294 € 2026).",
      "Rente conjoint suspendue en cas de remariage."
    ]
  },
  "cotisations": {
    "mode": "percent_income",
    "value": 0.5,
    "assiette": "TA-TB",
    "min": 89,
    "max": 445,
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "0,5% revenu plafonné 1,85 PASS. Assiette min 37% PASS = 89 €. Max 445 € 2026.",
      "Conversion en points : valeur d'achat 0,013 €/point, valeur service 3,01 € 2026."
    ]
  }
}$prevoyance_data_cipav$::jsonb,
  $prevoyance_sources_cipav${
  "fiche": "Mémento 2026 — Fiche 36",
  "pagesPdf": [
    122,
    123,
    124
  ],
  "noteValidation": "Extraction LLM 2026-05-23, à relire métier. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_cipav$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'carpimko',
  'Auxiliaire médical — CARPIMKO',
  'CARPIMKO',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_carpimko${
  "arret": {
    "carences": {
      "maladie": 90,
      "accident": 90,
      "hospitalisation": 90
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 91,
        "toDay": 365,
        "label": "IJ totale CARPIMKO",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 55.44,
          "label": "55,44 €/j 2026 + 8,06 €/enfant à charge < 18 ans + 20,16 €/j tierce personne"
        }
      },
      {
        "fromDay": 366,
        "toDay": 1095,
        "label": "IJ totale prolongée si pas de reclassement",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 55.44,
          "label": "Maintenue à 55,44 €/j si reclassement impossible"
        }
      },
      {
        "fromDay": 366,
        "toDay": 1095,
        "label": "IJ partielle (≥ 66%) après 1 an d'allocation totale, sur 2 ans",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 27.72,
          "label": "Allocation partielle 27,72 €/j 2026"
        }
      }
    ],
    "notes": [
      "Franchise 90 jours.",
      "Prestation partielle conditionnée à plafond de ressources et incapacité ≥ 66%."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité permanente partielle (≥ 66%)",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 10080,
          "label": "10 080 €/an 2025 — moitié de l'invalidité totale"
        }
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité permanente totale",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 20160,
          "label": "20 160 €/an 2026 + 3 024 €/enfant à charge + 6 048 € tierce personne"
        }
      }
    ],
    "notes": [
      "Délai d'attente 4 ans (relais de l'incapacité temporaire).",
      "Prestations supprimées si reclassement possible.",
      "Exonération cotisations CNAVPL et CARPIMKO si invalide 100% + tierce personne."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 36288,
      "label": "36 288 € conjoint sans enfants / 54 432 € avec enfants / 18 144 € enfants ou ascendants (2025)"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": {
      "mode": "fixed_eur_year",
      "value": 10080,
      "label": "10 080 €/an 2025 (jusqu'à 65 ans conjoint, suspendu si remariage)"
    },
    "renteEducation": {
      "mode": "fixed_eur_year",
      "value": 7560,
      "label": "7 560 €/an 2025 (jusqu'à 18 ans, 25 si études)"
    },
    "notes": [
      "Plusieurs montants encore exprimés en 2025 dans le Mémento."
    ]
  },
  "cotisations": {
    "mode": "fixed_eur",
    "value": 1022,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Forfaitaire 1 022 € pour 2026."
    ]
  }
}$prevoyance_data_carpimko$::jsonb,
  $prevoyance_sources_carpimko${
  "fiche": "Mémento 2026 — Fiche 37",
  "pagesPdf": [
    125,
    126,
    127
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Montants 2025 maintenus si pas revalorisés. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_carpimko$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'carmf',
  'Médecin — CARMF',
  'CARMF',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_carmf${
  "arret": {
    "carences": {
      "maladie": 90,
      "accident": 90,
      "hospitalisation": 90
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 91,
        "toDay": 1095,
        "label": "IJ médecin < 62 ans — classe A",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 65.84,
          "label": "Classe A : 65,84 €/j 2026"
        }
      },
      {
        "fromDay": 91,
        "toDay": 1095,
        "label": "IJ médecin < 62 ans — classe B",
        "amount": {
          "mode": "formula",
          "value": null,
          "label": "Classe B : 1/730ième des revenus"
        }
      },
      {
        "fromDay": 91,
        "toDay": 1095,
        "label": "IJ médecin < 62 ans — classe C",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 197.51,
          "label": "Classe C : 197,51 €/j 2026"
        }
      }
    ],
    "notes": [
      "Carence 90 jours.",
      "Barème dégressif 62-69 ans : 100% / 75% / 50% selon année.",
      "70+ ans : 50% du taux normal.",
      "Versement cesse en cas de reprise d'activité, même à temps partiel."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale et définitive — classe A",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 23662,
          "label": "Classe A : 23 662 €/an 2026"
        },
        "category": "A"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale et définitive — classe B",
        "amount": {
          "mode": "formula",
          "value": null,
          "label": "Classe B : variable selon revenus"
        },
        "category": "B"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale et définitive — classe C",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 31549,
          "label": "Classe C : 31 549 €/an 2026"
        },
        "category": "C"
      }
    ],
    "notes": [
      "Versement uniquement si incapacité totale et définitive (pas d'invalidité partielle).",
      "Majoration +35% si tierce personne ou conjoint < 25 001,60 € de revenus.",
      "Majoration +10% si ≥ 3 enfants.",
      "Rente éducation par enfant identique à la rente décès."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 71500,
      "label": "Capital décès forfaitaire 71 500 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": {
      "mode": "fixed_eur_year",
      "value": 12835,
      "label": "Moyenne 8 557,20 € à 17 114,40 €/an 2026 selon points cotisés"
    },
    "renteEducation": {
      "mode": "fixed_eur_year",
      "value": 10078.48,
      "label": "10 078,48 €/an 2026 par enfant (jusqu'à 18 ans, 25 si études)"
    },
    "notes": [
      "Rente conjoint majorée +10% si conjoint a eu ≥ 3 enfants.",
      "Conjoint marié ≥ 2 ans (dérogation si enfant à charge), versée jusqu'à 60 ans."
    ]
  },
  "cotisations": {
    "mode": "formula",
    "value": null,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Classe A (revenus < 1 PASS) : 626 € 2026.",
      "Classe B (revenus < 3 PASS) : 434 € + 0,4% revenus 2026.",
      "Classe C (revenus > 3 PASS) : 1 010 € 2026.",
      "Début d'activité : 2 premières années en classe A."
    ]
  }
}$prevoyance_data_carmf$::jsonb,
  $prevoyance_sources_carmf${
  "fiche": "Mémento 2026 — Fiche 38",
  "pagesPdf": [
    128,
    129,
    130
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_carmf$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'carcdsf-dentiste',
  'Chirurgien-dentiste — CARCDSF',
  'CARCDSF',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_carcdsf_dentiste${
  "arret": {
    "carences": {
      "maladie": 90,
      "accident": 90,
      "hospitalisation": 90
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 91,
        "toDay": 1095,
        "label": "IJ chirurgien-dentiste",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 113.22,
          "label": "113,22 €/j 2026"
        }
      }
    ],
    "notes": [
      "Versement cesse en cas de reprise d'activité même partielle."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": null,
        "label": "Invalidité — handicap physique ou mental permanent",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 32463,
          "label": "32 463 €/an 2026 + 9 501,60 €/enfant à charge < 18 ans (25 si études)"
        }
      }
    ],
    "notes": [
      "Cession ou fermeture du cabinet exigée.",
      "Versement trimestriel jusqu'à l'âge légal de retraite."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 19605,
      "label": "Capital décès forfaitaire 19 605 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": {
      "mode": "fixed_eur_year",
      "value": 20859.72,
      "label": "20 859,72 €/an 2026 (jusqu'à 65 ans conjoint, suspendu si remariage)"
    },
    "renteEducation": {
      "mode": "fixed_eur_year",
      "value": 14115.6,
      "label": "14 115,60 €/an 2026 par enfant (jusqu'à 18 ans, 25 si études)"
    },
    "notes": [
      "Conjoint marié ≥ 2 ans, dérogation si enfant à charge."
    ]
  },
  "cotisations": {
    "mode": "fixed_eur",
    "value": 1235,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Forfaitaire 1 235 € pour 2026."
    ]
  }
}$prevoyance_data_carcdsf_dentiste$::jsonb,
  $prevoyance_sources_carcdsf_dentiste${
  "fiche": "Mémento 2026 — Fiche 39",
  "pagesPdf": [
    131,
    132
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Précédemment code 'carcdsf' générique à éclater. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_carcdsf_dentiste$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'carcdsf-sagefemme',
  'Sage-femme — CARCDSF',
  'CARCDSF',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_carcdsf_sagefemme${
  "arret": {
    "carences": {
      "maladie": 90,
      "accident": 90,
      "hospitalisation": 90
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 91,
        "toDay": 1095,
        "label": "IJ sage-femme",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 49.7,
          "label": "49,70 €/j 2026"
        }
      }
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": null,
        "label": "Invalidité — handicap physique ou mental permanent",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 13729,
          "label": "13 729 €/an 2026"
        }
      }
    ],
    "notes": [
      "Pas de majoration enfant à charge documentée pour sage-femme."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 15128,
      "label": "Capital décès forfaitaire 15 128 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": null,
    "renteEducation": null,
    "notes": [
      "Le régime sage-femme ne prévoit ni rente conjoint ni rente éducation."
    ]
  },
  "cotisations": {
    "mode": "fixed_eur",
    "value": 384,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Forfaitaire 384 € pour 2026 (réduit vs dentiste car prestations moindres)."
    ]
  }
}$prevoyance_data_carcdsf_sagefemme$::jsonb,
  $prevoyance_sources_carcdsf_sagefemme${
  "fiche": "Mémento 2026 — Fiche 40",
  "pagesPdf": [
    133,
    134
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_carcdsf_sagefemme$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'cavp',
  'Pharmacien — CAVP',
  'CAVP',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_cavp${
  "arret": {
    "carences": {
      "maladie": 0,
      "accident": 0,
      "hospitalisation": 0
    },
    "maxDurationDays": 0,
    "paliers": [
      {
        "fromDay": 0,
        "toDay": null,
        "label": "Pas d'IJ CAVP — couverture par contrat individuel recommandée",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 0
        }
      }
    ],
    "notes": [
      "La CAVP ne verse aucune IJ. Relais socle CNAVPL pour les 90 premiers jours."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale empêchant l'exercice",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 16872,
          "label": "16 872 €/an 2026"
        }
      }
    ],
    "notes": [
      "Pour le pharmacien invalide : rente conjoint éventuelle 8 436 €/an (moitié allocation).",
      "Rente éducation enfants identique au régime décès."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 25308,
      "label": "Capital décès 25 308 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": {
      "mode": "fixed_eur_year",
      "value": 16872,
      "label": "16 872 €/an 2026 (jusqu'à 60 ans conjoint)"
    },
    "renteEducation": {
      "mode": "fixed_eur_year",
      "value": 16872,
      "label": "16 872 €/an 2026 par enfant (jusqu'à 21 ans, 25 si études)"
    }
  },
  "cotisations": {
    "mode": "fixed_eur",
    "value": 696,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Forfaitaire 696 € pour 2026."
    ]
  }
}$prevoyance_data_cavp$::jsonb,
  $prevoyance_sources_cavp${
  "fiche": "Mémento 2026 — Fiche 41",
  "pagesPdf": [
    135,
    136
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_cavp$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'carpv',
  'Vétérinaire — CARPV',
  'CARPV',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_carpv${
  "arret": {
    "carences": {
      "maladie": 0,
      "accident": 0,
      "hospitalisation": 0
    },
    "maxDurationDays": 0,
    "paliers": [
      {
        "fromDay": 0,
        "toDay": null,
        "label": "Pas d'IJ CARPV — couverture par contrat individuel recommandée",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 0
        }
      }
    ],
    "notes": [
      "La CARPV ne verse aucune IJ. Socle CNAVPL applicable."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe minimum",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 8560,
          "label": "Classe Min : 8 560 €/an 2026 (partielle 66%)"
        },
        "category": "Min"
      },
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe médium",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 17120,
          "label": "Classe Médium : 17 120 €/an 2026"
        },
        "category": "Médium"
      },
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe maximum",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 25680,
          "label": "Classe Max : 25 680 €/an 2026"
        },
        "category": "Maximum"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe minimum",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 13375,
          "label": "Classe Min : 13 375 €/an 2026 (totale 100%)"
        },
        "category": "Min"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe médium",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 26750,
          "label": "Classe Médium : 26 750 €/an 2026"
        },
        "category": "Médium"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe maximum",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 40125,
          "label": "Classe Max : 40 125 €/an 2026"
        },
        "category": "Maximum"
      }
    ],
    "notes": [
      "Délai d'attente : invalidité supérieure ≥ 66% depuis au moins 1 an. Versement jusqu'à 65 ans."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 75970,
      "label": "Classe Min : 37 985 € / Médium : 75 970 € / Max : 113 955 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": {
      "mode": "fixed_eur_year",
      "value": 9630,
      "label": "Classe Min : 4 815 € / Médium : 9 630 € / Max : 14 445 €/an 2026"
    },
    "renteEducation": {
      "mode": "fixed_eur_year",
      "value": 8560,
      "label": "Classe Min : 4 280 € / Médium : 8 560 € / Max : 12 840 €/an 2026"
    },
    "notes": [
      "Capital minoré dès 65 ans selon coefficient d'âge.",
      "Conjoint marié/pacsé ≥ 2 ans, dérogation si enfant à charge."
    ]
  },
  "cotisations": {
    "mode": "fixed_eur",
    "value": 780,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Classe Min : 390 € / Médium : 780 € / Maximum : 1 170 € pour 2026.",
      "Tarif réduit médium/max si moins de 35 ans.",
      "Par défaut : classe maximum si pas de choix exprimé."
    ]
  }
}$prevoyance_data_carpv$::jsonb,
  $prevoyance_sources_carpv${
  "fiche": "Mémento 2026 — Fiche 42",
  "pagesPdf": [
    137,
    138,
    139
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_carpv$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'cavec',
  'Expert-comptable — CAVEC',
  'CAVEC',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_cavec${
  "arret": {
    "carences": {
      "maladie": 90,
      "accident": 90,
      "hospitalisation": 90
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 91,
        "toDay": 1095,
        "label": "IJ expert-comptable forfaitaire",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 130,
          "label": "130 €/j brut 2026"
        }
      }
    ],
    "notes": [
      "Versement cesse en cas de reprise d'activité, même partielle."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe 1",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 8227,
          "label": "Classe 1 : 8 227 €/an"
        },
        "category": "1"
      },
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe 2",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 10969,
          "label": "Classe 2 : 10 969 €/an"
        },
        "category": "2"
      },
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe 3",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 21938,
          "label": "Classe 3 : 21 938 €/an"
        },
        "category": "3"
      },
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe 4",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 32908,
          "label": "Classe 4 : 32 908 €/an"
        },
        "category": "4"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe 1",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 12465,
          "label": "Classe 1 : 12 465 €/an"
        },
        "category": "1"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe 2",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 16620,
          "label": "Classe 2 : 16 620 €/an"
        },
        "category": "2"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe 3",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 33240,
          "label": "Classe 3 : 33 240 €/an"
        },
        "category": "3"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe 4",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 49860,
          "label": "Classe 4 : 49 860 €/an"
        },
        "category": "4"
      }
    ],
    "notes": [
      "Délai d'attente 1 an, plafond d'âge 70 ans."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 96950,
      "label": "Classe 1 : 72 713 € / 2 : 96 950 € / 3 : 193 900 € / 4 : 290 850 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": null,
    "renteEducation": {
      "mode": "fixed_eur_year",
      "value": 5540,
      "label": "Classe 1 : 4 155 € / 2 : 5 540 € / 3 : 11 080 € / 4 : 16 620 €/an 2026"
    },
    "notes": [
      "Pas de rente conjoint. Rente éducation jusqu'à 21 ans (25 si études)."
    ]
  },
  "cotisations": {
    "mode": "fixed_eur",
    "value": 396,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Classe 1 : 288 € (≤ 14 920 € revenus) / Classe 2 : 396 € (≤ 44 822 €) / Classe 3 : 612 € (≤ 81 454 €) / Classe 4 : 828 € (> 81 454 €) 2026.",
      "Option : cotiser en classe supérieure pour améliorer couverture.",
      "Début d'activité : classe 1 par défaut."
    ]
  }
}$prevoyance_data_cavec$::jsonb,
  $prevoyance_sources_cavec${
  "fiche": "Mémento 2026 — Fiche 43",
  "pagesPdf": [
    140,
    141,
    142
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_cavec$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'cprn',
  'Notaire — CPRN',
  'CPRN',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_cprn${
  "arret": {
    "carences": {
      "maladie": 0,
      "accident": 0,
      "hospitalisation": 0
    },
    "maxDurationDays": 0,
    "paliers": [
      {
        "fromDay": 0,
        "toDay": null,
        "label": "Pas d'IJ CPRN — couverture par contrat individuel recommandée",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 0
        }
      }
    ],
    "notes": [
      "La CPRN ne verse aucune IJ. Socle CNAVPL applicable."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité permanente totale notaire",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 26400,
          "label": "26 400 €/an 2026"
        }
      }
    ],
    "notes": [
      "Conditions : handicap physique ou mental permanent et total.",
      "Versement jusqu'à 62 ans."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 110000,
      "label": "Capital décès 110 000 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": {
      "mode": "formula",
      "value": null,
      "label": "Rente temporaire = 450 € × (âge notaire - 25) + rente viagère = 900 € × (65 - âge notaire) 2026"
    },
    "renteEducation": {
      "mode": "fixed_eur_year",
      "value": 19800,
      "label": "19 800 €/an 2026 par enfant (jusqu'à 21 ans, 25 si études)"
    }
  },
  "cotisations": {
    "mode": "fixed_eur",
    "value": 1324,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Forfaitaire 1 324 € pour 2026.",
      "Début d'activité : -50% les 3 premières années, -25% les 3 suivantes."
    ]
  }
}$prevoyance_data_cprn$::jsonb,
  $prevoyance_sources_cprn${
  "fiche": "Mémento 2026 — Fiche 44",
  "pagesPdf": [
    143,
    144
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_cprn$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'cavom',
  'Officier ministériel — CAVOM',
  'CAVOM',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_cavom${
  "arret": {
    "carences": {
      "maladie": 0,
      "accident": 0,
      "hospitalisation": 0
    },
    "maxDurationDays": 0,
    "paliers": [
      {
        "fromDay": 0,
        "toDay": null,
        "label": "Pas d'IJ CAVOM — couverture par contrat individuel recommandée",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 0
        }
      }
    ],
    "notes": [
      "La CAVOM ne verse aucune IJ. Socle CNAVPL applicable."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe A",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 5457,
          "label": "Classe A : 5 457 €/an"
        },
        "category": "A"
      },
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe B",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 10913,
          "label": "Classe B : 10 913 €/an"
        },
        "category": "B"
      },
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe C",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 21826,
          "label": "Classe C : 21 826 €/an"
        },
        "category": "C"
      },
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle classe D",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 32739,
          "label": "Classe D : 32 739 €/an"
        },
        "category": "D"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe A",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 8268,
          "label": "Classe A : 8 268 €/an"
        },
        "category": "A"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe B",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 16535,
          "label": "Classe B : 16 535 €/an"
        },
        "category": "B"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe C",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 33070,
          "label": "Classe C : 33 070 €/an"
        },
        "category": "C"
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale classe D",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 49605,
          "label": "Classe D : 49 605 €/an"
        },
        "category": "D"
      }
    ],
    "notes": [
      "Versement après délai 6 mois, jusqu'à 65 ans."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 35432,
      "label": "Classe A : 17 716 € / B : 35 432 € / C : 70 965 € / D : 106 297 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": {
      "mode": "fixed_eur_year",
      "value": 10630,
      "label": "Classe A : 5 315 € / B : 10 630 € / C : 21 259 € / D : 31 889 €/an 2026"
    },
    "renteEducation": {
      "mode": "fixed_eur_year",
      "value": 10630,
      "label": "Classe A : 5 315 € / B : 10 630 € / C : 21 259 € / D : 31 889 €/an 2026 (jusqu'à 21 ans, 25 si études)"
    },
    "notes": [
      "Conjoint marié/pacsé ≥ 2 ans, dérogation si enfants ou décès accidentel."
    ]
  },
  "cotisations": {
    "mode": "fixed_eur",
    "value": 630,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Classe A : 315 € / B : 630 € (défaut) / C : 1 260 € / D : 1 890 € pour 2026."
    ]
  }
}$prevoyance_data_cavom$::jsonb,
  $prevoyance_sources_cavom${
  "fiche": "Mémento 2026 — Fiche 45",
  "pagesPdf": [
    145,
    146,
    147
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_cavom$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'cavamac',
  'Agent général d''assurance — CAVAMAC',
  'CAVAMAC',
  'liberal',
  'individuel',
  2026,
  $prevoyance_data_cavamac${
  "arret": {
    "carences": {
      "maladie": 0,
      "accident": 0,
      "hospitalisation": 0
    },
    "maxDurationDays": 0,
    "paliers": [
      {
        "fromDay": 0,
        "toDay": null,
        "label": "Pas d'IJ CAVAMAC — couverture par contrat individuel recommandée",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 0
        }
      }
    ],
    "notes": [
      "La CAVAMAC ne verse aucune IJ. Socle CNAVPL applicable."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 33,
        "toRate": 65,
        "label": "Invalidité partielle (33%-66%)",
        "amount": {
          "mode": "formula",
          "value": null,
          "label": "3n/2 de la pension totale (proportionnel au taux d'invalidité)"
        }
      },
      {
        "fromRate": 66,
        "toRate": null,
        "label": "Invalidité totale",
        "amount": {
          "mode": "percent_income",
          "value": 25,
          "unit": "% commissions et rémunérations brutes N-1",
          "label": "25% commissions N-1 (ou moyenne 3 ans si + favorable). Min = 60 000 points × valeur service"
        }
      }
    ],
    "notes": [
      "Délai 1 an d'invalidité avérée.",
      "Cessation d'activité obligatoire."
    ]
  },
  "deces": {
    "capital": {
      "mode": "percent_income",
      "value": 50,
      "unit": "% commissions et rémunérations brutes",
      "label": "50% commissions brutes (doublé si accident)"
    },
    "doublementAccident": true,
    "doubleEffet": false,
    "renteConjoint": null,
    "renteEducation": null,
    "notes": [
      "Régime ne prévoit ni rente conjoint ni rente éducation."
    ]
  },
  "cotisations": {
    "mode": "percent_income",
    "value": 0.7,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "0,7% des commissions et rémunérations brutes plafonnées N-1.",
      "1ère année : cotisation appelée sur assiette forfaitaire en % du PASS."
    ]
  }
}$prevoyance_data_cavamac$::jsonb,
  $prevoyance_sources_cavamac${
  "fiche": "Mémento 2026 — Fiche 46",
  "pagesPdf": [
    148,
    149
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_cavamac$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'cnbf',
  'Avocat — CNBF',
  'CNBF',
  'avocat',
  'individuel',
  2026,
  $prevoyance_data_cnbf${
  "arret": {
    "carences": {
      "maladie": 90,
      "accident": 90,
      "hospitalisation": 90
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 91,
        "toDay": 1095,
        "label": "IJ avocat CNBF",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 90,
          "label": "90 €/j forfaitaire 2026"
        }
      }
    ],
    "notes": [
      "Garanties complémentaires LPA ou AON pour les 90 premiers jours (selon barreau).",
      "Condition : 12 mois d'affiliation, cessation totale d'activité."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale et définitive < 20 ans d'affiliation",
        "amount": {
          "mode": "fixed_eur_year",
          "value": 9577,
          "label": "9 577 €/an 2026 = 50% retraite forfaitaire"
        }
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale et définitive ≥ 20 ans d'affiliation",
        "amount": {
          "mode": "formula",
          "value": null,
          "label": "50% de la retraite de base proportionnelle"
        }
      }
    ],
    "notes": [
      "Prise en charge après 1095 jours d'arrêt de travail.",
      "Garanties complémentaires LPA/AON pour invalidité partielle."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 50000,
      "label": "Capital décès 50 000 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": null,
    "renteEducation": {
      "mode": "fixed_eur_year",
      "value": 4789,
      "label": "25% retraite forfaitaire = 4 789 €/an 2026 + 25% points complémentaires"
    },
    "notes": [
      "Pas de rente conjoint dans le régime obligatoire."
    ]
  },
  "cotisations": {
    "mode": "fixed_eur",
    "value": 170,
    "assiette": "TA",
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "68 € les 4 premières années d'affiliation puis 170 € pour 2026.",
      "Cotisation forfaitaire supplémentaire versée par le Barreau pour chaque avocat non-salarié."
    ]
  }
}$prevoyance_data_cnbf$::jsonb,
  $prevoyance_sources_cnbf${
  "fiche": "Mémento 2026 — Fiche 47",
  "pagesPdf": [
    150,
    151
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_cnbf$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;

INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
VALUES (
  'msa-exploitant',
  'Exploitant agricole — MSA AMEXA',
  'MSA AMEXA',
  'exploitant_agricole',
  'individuel',
  2026,
  $prevoyance_data_msa_exploitant${
  "arret": {
    "carences": {
      "maladie": 3,
      "accident": 3,
      "hospitalisation": 3
    },
    "maxDurationDays": 1095,
    "paliers": [
      {
        "fromDay": 4,
        "toDay": 28,
        "label": "IJ AMEXA — 28 premiers jours indemnisés",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 26,
          "label": "26 €/j 2026"
        }
      },
      {
        "fromDay": 29,
        "toDay": 360,
        "label": "IJ AMEXA — à partir du 29ème jour",
        "amount": {
          "mode": "fixed_eur_day",
          "value": 34.66,
          "label": "34,66 €/j 2026"
        }
      }
    ],
    "notes": [
      "Durée max 360 jours sur 3 ans glissants (sauf ALD ou arrêt > 6 mois).",
      "Revalorisation au 1er avril.",
      "Condition : 12 mois d'affiliation continue."
    ]
  },
  "invalidite": {
    "paliers": [
      {
        "fromRate": 66,
        "toRate": 99,
        "label": "Invalidité partielle",
        "amount": {
          "mode": "percent_income",
          "value": 30,
          "unit": "% revenu annuel moyen 3 meilleures années sur 7",
          "label": "4 465,69 € min / 7 209 € max 2026"
        }
      },
      {
        "fromRate": 100,
        "toRate": null,
        "label": "Invalidité totale",
        "amount": {
          "mode": "percent_income",
          "value": 50,
          "label": "7 916,45 € min / 12 015 € max 2026"
        }
      }
    ],
    "notes": [
      "Conditions : 12 mois d'affiliation, capacité d'exercice réduite ≥ 2/3."
    ]
  },
  "deces": {
    "capital": {
      "mode": "fixed_eur_year",
      "value": 4009,
      "label": "Capital décès 4 009 € 2026"
    },
    "doublementAccident": false,
    "doubleEffet": false,
    "renteConjoint": null,
    "renteEducation": null
  },
  "cotisations": {
    "mode": "percent_income",
    "value": 1.1,
    "assiette": "TA",
    "min": 11.5,
    "max": null,
    "repartition": null,
    "madelinEligible": true,
    "notes": [
      "Cotisation invalidité-décès : 1,1% du revenu professionnel 2026, assiette min 11,5% PASS.",
      "Cotisation IJ séparée : 250 € forfaitaire 2026."
    ]
  }
}$prevoyance_data_msa_exploitant$::jsonb,
  $prevoyance_sources_msa_exploitant${
  "fiche": "Mémento 2026 — Fiche 48",
  "pagesPdf": [
    152,
    153
  ],
  "noteValidation": "Extraction LLM 2026-05-23. Migration SQL v2 générée le 2026-05-23 depuis l'extraction Mémento ; validation métier humaine requise avant usage conseil."
}$prevoyance_sources_msa_exploitant$::jsonb
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  caisse = EXCLUDED.caisse,
  population = EXCLUDED.population,
  default_contract_kind = EXCLUDED.default_contract_kind,
  year = EXCLUDED.year,
  data = EXCLUDED.data,
  sources = EXCLUDED.sources;
