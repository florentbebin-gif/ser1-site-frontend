/**
 * TresoHypotheses.tsx — Hypothèses et limites du simulateur trésorerie société IS
 *
 * Section collapsible listant toutes les simplifications retenues.
 * Visible en bas de la colonne principale.
 */

import { useState } from 'react';
import { SimDisclosureButton } from '@/components/ui/sim';

export function TresoHypotheses() {
  const [open, setOpen] = useState(false);

  return (
    <div className="ts-hypotheses">
      <SimDisclosureButton
        expanded={open}
        onToggle={() => setOpen((v) => !v)}
        className="ts-hypotheses__toggle"
        labelClosed="Hypothèses et limites"
        labelOpen="Hypothèses et limites"
        controls="ts-hypotheses-body"
      />

      {open && (
        <div id="ts-hypotheses-body" className="ts-hypotheses__body">
          <section className="ts-hyp-section">
            <h3 className="ts-hyp-title">Fiscalité IS</h3>
            <ul className="ts-hyp-list">
              <li>
                IS calculé selon la formule progressive : taux réduit sur la tranche ≤ seuil, taux
                normal au-delà. Barème lu depuis les paramètres fiscaux (CGI art. 219).
              </li>
              <li>
                Base IS clampée à 0 — report de pertes hors scope V1. Une perte comptable réduit les
                réserves sans générer d'IS.
              </li>
              <li>
                Réserve légale modélisée : dotation de 5 % du résultat net bénéficiaire jusqu'à 10 %
                du capital social. Elle réduit la capacité distribuable.
              </li>
            </ul>
          </section>

          <section className="ts-hyp-section">
            <h3 className="ts-hyp-title">Compte bancaire pivot et placements</h3>
            <ul className="ts-hyp-list">
              <li>
                Les sorties courantes de la holding sont financées par le compte bancaire. Les
                placements ne sont pas liquidés automatiquement avant leur terme.
              </li>
              <li>
                Au terme d'une poche, le produit revient sur le compte bancaire. La répétition
                éventuelle ne réinvestit que le surplus disponible au-delà du solde minimum bancaire
                et du BFR.
              </li>
              <li>
                Une trésorerie non allouée à une poche reste sur le compte bancaire, sans rendement.
              </li>
            </ul>
          </section>

          <section className="ts-hyp-section">
            <h3 className="ts-hyp-title">Poches de capitalisation</h3>
            <ul className="ts-hyp-list">
              <li>
                Aucun IS annuel — IS payable uniquement à la sortie sur la plus-value nette (preuve
                : formule M21 sheet31 du modèle de référence).
              </li>
              <li>
                IS latent affiché pour information, non inclus dans les flux trésorerie décaissés.
              </li>
              <li>
                En l'absence de <em>valeur actuelle</em> et <em>capital investi historique</em> pour
                une société existante, l'IS latent est calculé sur la plus-value depuis la
                souscription.
              </li>
            </ul>
          </section>

          <section className="ts-hyp-section">
            <h3 className="ts-hyp-title">Parcours associé</h3>
            <ul className="ts-hyp-list">
              <li>
                Les paliers de revenus de l'associé sélectionné portent les sous-phases de
                rémunération, distribution, constitution CCA et remboursement CCA.
              </li>
              <li>
                Les dividendes sont plafonnés par la trésorerie disponible et par la capacité
                distribuable après dotation de réserve légale.
              </li>
            </ul>
          </section>

          <section className="ts-hyp-section">
            <h3 className="ts-hyp-title">Délai de jouissance</h3>
            <ul className="ts-hyp-list">
              <li>
                Un mois est productif si son premier jour est ≥ à la date de début de jouissance
                (dateSouscription + délaiJouissanceMois).
              </li>
              <li>
                Revenus calculés au prorata des mois productifs de l'année civile (CGI art. 38
                quater).
              </li>
              <li>
                En cas de répétition au terme, le délai de jouissance se réapplique au début de
                chaque nouveau cycle.
              </li>
            </ul>
          </section>

          <section className="ts-hyp-section">
            <h3 className="ts-hyp-title">Dividendes et PFU</h3>
            <ul className="ts-hyp-list">
              <li>
                V1 : fiscalité dividendes PFU uniquement (taux IR + prélèvements sociaux lus depuis
                les paramètres fiscaux). Option barème IR avec abattement 40 % hors scope V1.
              </li>
              <li>
                Convention Option A : les dividendes sortent en brut unique dans les flux
                trésorerie. Le PFU est calculé pour affichage (revenus nets associés) mais n'entre
                pas une seconde fois dans la trésorerie nette.
              </li>
            </ul>
          </section>

          <section className="ts-hyp-section">
            <h3 className="ts-hyp-title">Régime mère-fille</h3>
            <ul className="ts-hyp-list">
              <li>
                L'utilisateur confirme l'éligibilité — SER1 applique l'option sans valider
                juridiquement les conditions (BOI-IS-BASE-10-10-10-10 §101-103).
              </li>
              <li>
                Conditions minimales indicatives : taux de détention ≥ 5 %, durée de conservation ≥
                2 ans.
              </li>
              <li>
                Quote-part de frais et charges (QPFC) : 5 % (standard) ou 1 % (groupe fiscal
                intégré), lue depuis les paramètres fiscaux.
              </li>
            </ul>
          </section>

          <section className="ts-hyp-section">
            <h3 className="ts-hyp-title">Société à l'IR</h3>
            <ul className="ts-hyp-list">
              <li>
                Société à l'IR (SARL de famille) — disponible prochainement. La transparence fiscale
                IR requiert un couplage avec un moteur IR complet.
              </li>
            </ul>
          </section>

          <p className="ts-hyp-disclaimer">
            Ce simulateur est un outil d'aide à l'analyse patrimoniale pour le CGP. Il ne remplace
            pas un expert-comptable ni un conseil juridique spécialisé.
          </p>
        </div>
      )}
    </div>
  );
}
