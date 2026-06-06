-- Correction Lot 5 prévoyance : remplacer les URLs 404 restantes par des pages catégorielles contrôlées.
-- Ne pas modifier les migrations 20260606000200/20260606000300 déjà appliquées.

WITH regime_sources(code, sources) AS (
  VALUES
    ('salarie-cpam', $prevoyance_sources_lot5_fix_20260606000400_salarie_cpam$
{
  "references": [
    {
      "organisme": "Ameli",
      "titre": "Arrêt de travail — Salarié secteur privé — CPAM",
      "url": "https://www.ameli.fr/assure/remboursements/indemnites-journalieres-maladie-maternite-paternite/arret-maladie-salarie",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle Ameli est rattachée au régime Salarié secteur privé — CPAM (salarie-cpam, caisse CPAM) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "Ameli",
      "titre": "Invalidité — Salarié secteur privé — CPAM",
      "url": "https://www.ameli.fr/assure/droits-demarches/invalidite-handicap/invalidite",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle Ameli est rattachée au régime Salarié secteur privé — CPAM (salarie-cpam, caisse CPAM) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "Ameli",
      "titre": "Décès — Salarié secteur privé — CPAM",
      "url": "https://www.ameli.fr/assure/droits-demarches/fin-de-vie-deuil/deces-proche-capital-deces",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle Ameli est rattachée au régime Salarié secteur privé — CPAM (salarie-cpam, caisse CPAM) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "Ameli",
      "titre": "Cotisations — Salarié secteur privé — CPAM",
      "url": "https://www.urssaf.fr/accueil/employeur/cotisations/liste-cotisations.html",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle Ameli est rattachée au régime Salarié secteur privé — CPAM (salarie-cpam, caisse CPAM) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Salarié secteur privé — CPAM."
}
$prevoyance_sources_lot5_fix_20260606000400_salarie_cpam$::jsonb),
    ('salarie-msa', $prevoyance_sources_lot5_fix_20260606000400_salarie_msa$
{
  "references": [
    {
      "organisme": "MSA",
      "titre": "Arrêt de travail — Salarié agricole — MSA",
      "url": "https://www.msa.fr/lfp/sante/accident-maladie-invalidite",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle MSA est rattachée au régime Salarié agricole — MSA (salarie-msa, caisse MSA salariés) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "MSA",
      "titre": "Invalidité — Salarié agricole — MSA",
      "url": "https://www.msa.fr/lfp/sante/accident-maladie-invalidite",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle MSA est rattachée au régime Salarié agricole — MSA (salarie-msa, caisse MSA salariés) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "MSA",
      "titre": "Décès — Salarié agricole — MSA",
      "url": "https://www.msa.fr/lfp/documents/11566/251289599/Info%2BPresse%2B-%2BCapital%2Bd%C3%A9c%C3%A8s.pdf",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle MSA est rattachée au régime Salarié agricole — MSA (salarie-msa, caisse MSA salariés) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "MSA",
      "titre": "Cotisations — Salarié agricole — MSA",
      "url": "https://www.msa.fr/lfp/employeur/taux-cotisations-sur-salaires",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle MSA est rattachée au régime Salarié agricole — MSA (salarie-msa, caisse MSA salariés) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Salarié agricole — MSA."
}
$prevoyance_sources_lot5_fix_20260606000400_salarie_msa$::jsonb),
    ('ssi-artisan-commercant', $prevoyance_sources_lot5_fix_20260606000400_ssi_artisan_commercant$
{
  "references": [
    {
      "organisme": "Ameli / URSSAF",
      "titre": "Arrêt de travail — Artisan / commerçant — SSI",
      "url": "https://www.ameli.fr/assure/remboursements/indemnites-journalieres-maladie-maternite-paternite/arret-maladie-artisans-commercants",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle Ameli / URSSAF est rattachée au régime Artisan / commerçant — SSI (ssi-artisan-commercant, caisse SSI) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "Ameli / URSSAF",
      "titre": "Invalidité — Artisan / commerçant — SSI",
      "url": "https://www.ameli.fr/assure/remboursements/pensions-allocations-rentes/invalidite",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle Ameli / URSSAF est rattachée au régime Artisan / commerçant — SSI (ssi-artisan-commercant, caisse SSI) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "Ameli / URSSAF",
      "titre": "Décès — Artisan / commerçant — SSI",
      "url": "https://www.ameli.fr/assure/droits-demarches/fin-de-vie-deuil/deces-proche-capital-deces",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle Ameli / URSSAF est rattachée au régime Artisan / commerçant — SSI (ssi-artisan-commercant, caisse SSI) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "Ameli / URSSAF",
      "titre": "Cotisations — Artisan / commerçant — SSI",
      "url": "https://www.urssaf.fr/accueil/independant/cotisations.html",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle Ameli / URSSAF est rattachée au régime Artisan / commerçant — SSI (ssi-artisan-commercant, caisse SSI) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Artisan / commerçant — SSI."
}
$prevoyance_sources_lot5_fix_20260606000400_ssi_artisan_commercant$::jsonb),
    ('cnavpl', $prevoyance_sources_lot5_fix_20260606000400_cnavpl$
{
  "references": [
    {
      "organisme": "CNAVPL",
      "titre": "Arrêt de travail — Profession libérale — socle CNAVPL",
      "url": "https://www.cnavpl.fr/les-pl-indemnises-des-ij/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CNAVPL est rattachée au régime Profession libérale — socle CNAVPL (cnavpl, caisse CNAVPL) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CNAVPL",
      "titre": "Invalidité — Profession libérale — socle CNAVPL",
      "url": "https://www.cnavpl.fr/definition/regime-invalidite-deces-rid/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CNAVPL est rattachée au régime Profession libérale — socle CNAVPL (cnavpl, caisse CNAVPL) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CNAVPL",
      "titre": "Décès — Profession libérale — socle CNAVPL",
      "url": "https://www.cnavpl.fr/definition/regime-invalidite-deces-rid/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CNAVPL est rattachée au régime Profession libérale — socle CNAVPL (cnavpl, caisse CNAVPL) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CNAVPL",
      "titre": "Cotisations — Profession libérale — socle CNAVPL",
      "url": "https://www.cnavpl.fr/definition/cotisation-invalidite-deces/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CNAVPL est rattachée au régime Profession libérale — socle CNAVPL (cnavpl, caisse CNAVPL) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Profession libérale — socle CNAVPL."
}
$prevoyance_sources_lot5_fix_20260606000400_cnavpl$::jsonb),
    ('cipav', $prevoyance_sources_lot5_fix_20260606000400_cipav$
{
  "references": [
    {
      "organisme": "CIPAV",
      "titre": "Arrêt de travail — Profession libérale réglementée — CIPAV",
      "url": "https://www.lacipav.fr/prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CIPAV est rattachée au régime Profession libérale réglementée — CIPAV (cipav, caisse CIPAV) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CIPAV",
      "titre": "Invalidité — Profession libérale réglementée — CIPAV",
      "url": "https://www.lacipav.fr/prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CIPAV est rattachée au régime Profession libérale réglementée — CIPAV (cipav, caisse CIPAV) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CIPAV",
      "titre": "Décès — Profession libérale réglementée — CIPAV",
      "url": "https://www.lacipav.fr/prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CIPAV est rattachée au régime Profession libérale réglementée — CIPAV (cipav, caisse CIPAV) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CIPAV",
      "titre": "Cotisations — Profession libérale réglementée — CIPAV",
      "url": "https://www.lacipav.fr/cotiser-pour-acquerir-des-droits-retraite-prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CIPAV est rattachée au régime Profession libérale réglementée — CIPAV (cipav, caisse CIPAV) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Profession libérale réglementée — CIPAV."
}
$prevoyance_sources_lot5_fix_20260606000400_cipav$::jsonb),
    ('carpimko', $prevoyance_sources_lot5_fix_20260606000400_carpimko$
{
  "references": [
    {
      "organisme": "CARPIMKO",
      "titre": "Arrêt de travail — Auxiliaire médical — CARPIMKO",
      "url": "https://www.carpimko.com/je-minstalle/mes-droits/mes-garanties-invalidite-deces",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARPIMKO est rattachée au régime Auxiliaire médical — CARPIMKO (carpimko, caisse CARPIMKO) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARPIMKO",
      "titre": "Invalidité — Auxiliaire médical — CARPIMKO",
      "url": "https://www.carpimko.com/je-minstalle/mes-droits/mes-garanties-invalidite-deces",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARPIMKO est rattachée au régime Auxiliaire médical — CARPIMKO (carpimko, caisse CARPIMKO) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARPIMKO",
      "titre": "Décès — Auxiliaire médical — CARPIMKO",
      "url": "https://www.carpimko.com/je-minstalle/mes-droits/mes-garanties-invalidite-deces",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARPIMKO est rattachée au régime Auxiliaire médical — CARPIMKO (carpimko, caisse CARPIMKO) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARPIMKO",
      "titre": "Cotisations — Auxiliaire médical — CARPIMKO",
      "url": "https://www.carpimko.com/je-minstalle/des-cotisations-adaptees-a-ma-situation/des-cotisations-adaptees-a-mes-revenus",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARPIMKO est rattachée au régime Auxiliaire médical — CARPIMKO (carpimko, caisse CARPIMKO) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Auxiliaire médical — CARPIMKO."
}
$prevoyance_sources_lot5_fix_20260606000400_carpimko$::jsonb),
    ('carmf', $prevoyance_sources_lot5_fix_20260606000400_carmf$
{
  "references": [
    {
      "organisme": "CARMF",
      "titre": "Arrêt de travail — Médecin — CARMF",
      "url": "https://www.carmf.fr/page.php?page=prevoyance/prevoyance.htm",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARMF est rattachée au régime Médecin — CARMF (carmf, caisse CARMF) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARMF",
      "titre": "Invalidité — Médecin — CARMF",
      "url": "https://www.carmf.fr/page.php?page=prevoyance/invalidite.htm",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARMF est rattachée au régime Médecin — CARMF (carmf, caisse CARMF) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARMF",
      "titre": "Décès — Médecin — CARMF",
      "url": "https://www.carmf.fr/page.php?page=prevoyance/deces.htm",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARMF est rattachée au régime Médecin — CARMF (carmf, caisse CARMF) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARMF",
      "titre": "Cotisations — Médecin — CARMF",
      "url": "https://www.carmf.fr/page.php?page=cotisations/cotisations.htm",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARMF est rattachée au régime Médecin — CARMF (carmf, caisse CARMF) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Médecin — CARMF."
}
$prevoyance_sources_lot5_fix_20260606000400_carmf$::jsonb),
    ('carcdsf-dentiste', $prevoyance_sources_lot5_fix_20260606000400_carcdsf_dentiste$
{
  "references": [
    {
      "organisme": "CARCDSF",
      "titre": "Arrêt de travail — Chirurgien-dentiste — CARCDSF",
      "url": "https://www.carcdsf.fr/prevoyance/indemnites-journalieres",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARCDSF est rattachée au régime Chirurgien-dentiste — CARCDSF (carcdsf-dentiste, caisse CARCDSF) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARCDSF",
      "titre": "Invalidité — Chirurgien-dentiste — CARCDSF",
      "url": "https://www.carcdsf.fr/prevoyance/rente-d-invalidite",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARCDSF est rattachée au régime Chirurgien-dentiste — CARCDSF (carcdsf-dentiste, caisse CARCDSF) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARCDSF",
      "titre": "Décès — Chirurgien-dentiste — CARCDSF",
      "url": "https://www.carcdsf.fr/prevoyance/deces",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARCDSF est rattachée au régime Chirurgien-dentiste — CARCDSF (carcdsf-dentiste, caisse CARCDSF) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARCDSF",
      "titre": "Cotisations — Chirurgien-dentiste — CARCDSF",
      "url": "https://www.carcdsf.fr/cotisations-du-praticien/montant-des-cotisations",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARCDSF est rattachée au régime Chirurgien-dentiste — CARCDSF (carcdsf-dentiste, caisse CARCDSF) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Chirurgien-dentiste — CARCDSF."
}
$prevoyance_sources_lot5_fix_20260606000400_carcdsf_dentiste$::jsonb),
    ('carcdsf-sagefemme', $prevoyance_sources_lot5_fix_20260606000400_carcdsf_sagefemme$
{
  "references": [
    {
      "organisme": "CARCDSF",
      "titre": "Arrêt de travail — Sage-femme — CARCDSF",
      "url": "https://www.carcdsf.fr/prevoyance/indemnites-journalieres",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARCDSF est rattachée au régime Sage-femme — CARCDSF (carcdsf-sagefemme, caisse CARCDSF) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARCDSF",
      "titre": "Invalidité — Sage-femme — CARCDSF",
      "url": "https://www.carcdsf.fr/prevoyance/rente-d-invalidite",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARCDSF est rattachée au régime Sage-femme — CARCDSF (carcdsf-sagefemme, caisse CARCDSF) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARCDSF",
      "titre": "Décès — Sage-femme — CARCDSF",
      "url": "https://www.carcdsf.fr/prevoyance/deces",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARCDSF est rattachée au régime Sage-femme — CARCDSF (carcdsf-sagefemme, caisse CARCDSF) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARCDSF",
      "titre": "Cotisations — Sage-femme — CARCDSF",
      "url": "https://www.carcdsf.fr/cotisations-du-praticien/montant-des-cotisations",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARCDSF est rattachée au régime Sage-femme — CARCDSF (carcdsf-sagefemme, caisse CARCDSF) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Sage-femme — CARCDSF."
}
$prevoyance_sources_lot5_fix_20260606000400_carcdsf_sagefemme$::jsonb),
    ('cavp', $prevoyance_sources_lot5_fix_20260606000400_cavp$
{
  "references": [
    {
      "organisme": "CAVP",
      "titre": "Arrêt de travail — Pharmacien — CAVP",
      "url": "https://www.cavp.fr/votre-profil/nouvel-affili%C3%A9-cavp-2/le-fonctionnement-des-r%C3%A9gimes-auxquels-vous-cotiserez",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVP est rattachée au régime Pharmacien — CAVP (cavp, caisse CAVP) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVP",
      "titre": "Invalidité — Pharmacien — CAVP",
      "url": "https://www.cavp.fr/votre-profil/nouvel-affili%C3%A9-cavp-2/le-fonctionnement-des-r%C3%A9gimes-auxquels-vous-cotiserez",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVP est rattachée au régime Pharmacien — CAVP (cavp, caisse CAVP) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVP",
      "titre": "Décès — Pharmacien — CAVP",
      "url": "https://www.cavp.fr/votre-profil/nouvel-affili%C3%A9-cavp-2/le-fonctionnement-des-r%C3%A9gimes-auxquels-vous-cotiserez",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVP est rattachée au régime Pharmacien — CAVP (cavp, caisse CAVP) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVP",
      "titre": "Cotisations — Pharmacien — CAVP",
      "url": "https://www.cavp.fr/votre-profil/pharmacien-en-activite/regler-vos-cotisations",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVP est rattachée au régime Pharmacien — CAVP (cavp, caisse CAVP) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Pharmacien — CAVP."
}
$prevoyance_sources_lot5_fix_20260606000400_cavp$::jsonb),
    ('carpv', $prevoyance_sources_lot5_fix_20260606000400_carpv$
{
  "references": [
    {
      "organisme": "CARPV",
      "titre": "Arrêt de travail — Vétérinaire — CARPV",
      "url": "https://www.carpv.fr/votre-prevoyance/la-prevoyance/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARPV est rattachée au régime Vétérinaire — CARPV (carpv, caisse CARPV) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARPV",
      "titre": "Invalidité — Vétérinaire — CARPV",
      "url": "https://www.carpv.fr/votre-prevoyance/la-prevoyance/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARPV est rattachée au régime Vétérinaire — CARPV (carpv, caisse CARPV) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARPV",
      "titre": "Décès — Vétérinaire — CARPV",
      "url": "https://www.carpv.fr/votre-prevoyance/la-prevoyance/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARPV est rattachée au régime Vétérinaire — CARPV (carpv, caisse CARPV) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CARPV",
      "titre": "Cotisations — Vétérinaire — CARPV",
      "url": "https://www.carpv.fr/vos-retraites/comprendre-vos-cotisations-et-vos-appels-de-cotisations/?lang=e",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CARPV est rattachée au régime Vétérinaire — CARPV (carpv, caisse CARPV) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Vétérinaire — CARPV."
}
$prevoyance_sources_lot5_fix_20260606000400_carpv$::jsonb),
    ('cavec', $prevoyance_sources_lot5_fix_20260606000400_cavec$
{
  "references": [
    {
      "organisme": "CAVEC",
      "titre": "Arrêt de travail — Expert-comptable — CAVEC",
      "url": "https://www.cavec.fr/vous-etes-liberal-tns/votre-prevoyance/tout-savoir-sur-la-prevoyance-cavec/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVEC est rattachée au régime Expert-comptable — CAVEC (cavec, caisse CAVEC) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVEC",
      "titre": "Invalidité — Expert-comptable — CAVEC",
      "url": "https://www.cavec.fr/vous-etes-liberal-tns/votre-prevoyance/tout-savoir-sur-la-prevoyance-cavec/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVEC est rattachée au régime Expert-comptable — CAVEC (cavec, caisse CAVEC) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVEC",
      "titre": "Décès — Expert-comptable — CAVEC",
      "url": "https://www.cavec.fr/vous-etes-liberal-tns/votre-prevoyance/tout-savoir-sur-la-prevoyance-cavec/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVEC est rattachée au régime Expert-comptable — CAVEC (cavec, caisse CAVEC) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVEC",
      "titre": "Cotisations — Expert-comptable — CAVEC",
      "url": "https://www.cavec.fr/votre-retraite/vos-cotisations/vos-cotisations-en-tant-que-liberal-tns/montant-de-vos-cotisations/vos-cotisations-retraite-prevoyance-et-options/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVEC est rattachée au régime Expert-comptable — CAVEC (cavec, caisse CAVEC) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Expert-comptable — CAVEC."
}
$prevoyance_sources_lot5_fix_20260606000400_cavec$::jsonb),
    ('cprn', $prevoyance_sources_lot5_fix_20260606000400_cprn$
{
  "references": [
    {
      "organisme": "CPRN",
      "titre": "Arrêt de travail — Notaire — CPRN",
      "url": "https://cprn.fr/ma-prevoyance/tout-savoir-sur-ma-prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CPRN est rattachée au régime Notaire — CPRN (cprn, caisse CPRN) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CPRN",
      "titre": "Invalidité — Notaire — CPRN",
      "url": "https://cprn.fr/ma-prevoyance/tout-savoir-sur-ma-prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CPRN est rattachée au régime Notaire — CPRN (cprn, caisse CPRN) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CPRN",
      "titre": "Décès — Notaire — CPRN",
      "url": "https://cprn.fr/ma-prevoyance/tout-savoir-sur-ma-prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CPRN est rattachée au régime Notaire — CPRN (cprn, caisse CPRN) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CPRN",
      "titre": "Cotisations — Notaire — CPRN",
      "url": "https://cprn.fr/je-suis-affilie/je-suis-actif/mes-cotisations/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CPRN est rattachée au régime Notaire — CPRN (cprn, caisse CPRN) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Notaire — CPRN."
}
$prevoyance_sources_lot5_fix_20260606000400_cprn$::jsonb),
    ('cavom', $prevoyance_sources_lot5_fix_20260606000400_cavom$
{
  "references": [
    {
      "organisme": "CAVOM",
      "titre": "Arrêt de travail — Officier ministériel — CAVOM",
      "url": "https://www.cavom.fr/prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVOM est rattachée au régime Officier ministériel — CAVOM (cavom, caisse CAVOM) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVOM",
      "titre": "Invalidité — Officier ministériel — CAVOM",
      "url": "https://www.cavom.fr/prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVOM est rattachée au régime Officier ministériel — CAVOM (cavom, caisse CAVOM) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVOM",
      "titre": "Décès — Officier ministériel — CAVOM",
      "url": "https://www.cavom.fr/prevoyance",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVOM est rattachée au régime Officier ministériel — CAVOM (cavom, caisse CAVOM) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVOM",
      "titre": "Cotisations — Officier ministériel — CAVOM",
      "url": "https://www.cavom.fr/cotisations",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVOM est rattachée au régime Officier ministériel — CAVOM (cavom, caisse CAVOM) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Officier ministériel — CAVOM."
}
$prevoyance_sources_lot5_fix_20260606000400_cavom$::jsonb),
    ('cavamac', $prevoyance_sources_lot5_fix_20260606000400_cavamac$
{
  "references": [
    {
      "organisme": "CAVAMAC",
      "titre": "Arrêt de travail — Agent général d'assurance — CAVAMAC",
      "url": "https://www.cavamac.fr/je-suis-en-activite/ma-prevoyance/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVAMAC est rattachée au régime Agent général d'assurance — CAVAMAC (cavamac, caisse CAVAMAC) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVAMAC",
      "titre": "Invalidité — Agent général d'assurance — CAVAMAC",
      "url": "https://www.cavamac.fr/je-suis-en-activite/ma-prevoyance/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVAMAC est rattachée au régime Agent général d'assurance — CAVAMAC (cavamac, caisse CAVAMAC) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVAMAC",
      "titre": "Décès — Agent général d'assurance — CAVAMAC",
      "url": "https://www.cavamac.fr/je-suis-en-activite/ma-prevoyance/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVAMAC est rattachée au régime Agent général d'assurance — CAVAMAC (cavamac, caisse CAVAMAC) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CAVAMAC",
      "titre": "Cotisations — Agent général d'assurance — CAVAMAC",
      "url": "https://www.cavamac.fr/je-suis-en-activite/mes-cotisations-rco-et-rid/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CAVAMAC est rattachée au régime Agent général d'assurance — CAVAMAC (cavamac, caisse CAVAMAC) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Agent général d'assurance — CAVAMAC."
}
$prevoyance_sources_lot5_fix_20260606000400_cavamac$::jsonb),
    ('cnbf', $prevoyance_sources_lot5_fix_20260606000400_cnbf$
{
  "references": [
    {
      "organisme": "CNBF",
      "titre": "Arrêt de travail — Avocat — CNBF",
      "url": "https://www.cnbf.fr/espace-avocats/les-droits/linvalidite-deces/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CNBF est rattachée au régime Avocat — CNBF (cnbf, caisse CNBF) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CNBF",
      "titre": "Invalidité — Avocat — CNBF",
      "url": "https://www.cnbf.fr/espace-avocats/les-droits/linvalidite-deces/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CNBF est rattachée au régime Avocat — CNBF (cnbf, caisse CNBF) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CNBF",
      "titre": "Décès — Avocat — CNBF",
      "url": "https://www.cnbf.fr/espace-avocats/les-droits/linvalidite-deces/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CNBF est rattachée au régime Avocat — CNBF (cnbf, caisse CNBF) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "CNBF",
      "titre": "Cotisations — Avocat — CNBF",
      "url": "https://www.cnbf.fr/espace-avocats/les-cotisations/les-cotisations-de-lavocat-non-salarie/",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle CNBF est rattachée au régime Avocat — CNBF (cnbf, caisse CNBF) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Avocat — CNBF."
}
$prevoyance_sources_lot5_fix_20260606000400_cnbf$::jsonb),
    ('msa-exploitant', $prevoyance_sources_lot5_fix_20260606000400_msa_exploitant$
{
  "references": [
    {
      "organisme": "MSA",
      "titre": "Arrêt de travail — Exploitant agricole — MSA AMEXA",
      "url": "https://www.msa.fr/lfp/sante/accident-maladie-invalidite",
      "dateConsultation": "2026-06-06",
      "rubrique": "Arrêt de travail",
      "valeursCouvertes": [
        "arret"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle MSA est rattachée au régime Exploitant agricole — MSA AMEXA (msa-exploitant, caisse MSA AMEXA) pour contrôler la catégorie arrêt de travail sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "MSA",
      "titre": "Invalidité — Exploitant agricole — MSA AMEXA",
      "url": "https://www.msa.fr/lfp/sante/invalidite-inaptitude",
      "dateConsultation": "2026-06-06",
      "rubrique": "Invalidité",
      "valeursCouvertes": [
        "invalidite"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle MSA est rattachée au régime Exploitant agricole — MSA AMEXA (msa-exploitant, caisse MSA AMEXA) pour contrôler la catégorie invalidité sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "MSA",
      "titre": "Décès — Exploitant agricole — MSA AMEXA",
      "url": "https://www.msa.fr/lfp/documents/11566/251289599/Info%2BPresse%2B-%2BCapital%2Bd%C3%A9c%C3%A8s.pdf",
      "dateConsultation": "2026-06-06",
      "rubrique": "Décès",
      "valeursCouvertes": [
        "deces"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle MSA est rattachée au régime Exploitant agricole — MSA AMEXA (msa-exploitant, caisse MSA AMEXA) pour contrôler la catégorie décès sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    },
    {
      "organisme": "MSA",
      "titre": "Cotisations — Exploitant agricole — MSA AMEXA",
      "url": "https://www.msa.fr/lfp/exploitant/cotisations-et-contributions",
      "dateConsultation": "2026-06-06",
      "rubrique": "Cotisations",
      "valeursCouvertes": [
        "cotisations"
      ],
      "confiance": "moyenne",
      "relevanceNote": "La page institutionnelle MSA est rattachée au régime Exploitant agricole — MSA AMEXA (msa-exploitant, caisse MSA AMEXA) pour contrôler la catégorie cotisations sans claim global quatre catégories.",
      "verifiedAt": "2026-06-06"
    }
  ],
  "noteAdmin": "Migration 20260606000400 : remplacement des URLs 404 restantes par des pages catégorielles contrôlées pour Exploitant agricole — MSA AMEXA."
}
$prevoyance_sources_lot5_fix_20260606000400_msa_exploitant$::jsonb)
)
UPDATE public.prevoyance_regime_settings AS target
SET
  sources = regime_sources.sources,
  updated_at = now()
FROM regime_sources
WHERE target.code = regime_sources.code;
