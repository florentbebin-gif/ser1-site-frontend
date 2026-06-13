import type { MementoChapterId } from './types';

export interface MementoChapterEditorial {
  chapterId: MementoChapterId;
  summary: string;
  keyPoints: readonly string[];
  sections?: readonly MementoEditorialSection[];
}

export interface MementoEditorialSection {
  title: string;
  body: string;
}

export const MEMENTO_EDITORIAL: readonly MementoChapterEditorial[] = [
  {
    chapterId: 'foyer',
    summary:
      'Le foyer décrit les personnes concernées, leurs liens familiaux et leur capacité à porter les projets patrimoniaux.',
    keyPoints: [
      'Qualifier la situation familiale, les personnes à charge et les liens de dépendance.',
      'Distinguer composition du foyer, rattachement fiscal et organisation patrimoniale.',
      'Situer les objectifs dans le temps pour lire correctement les autres dispositifs.',
    ],
    sections: [
      {
        title: 'Composition familiale',
        body: 'La lecture commence par les personnes : couple, enfants, personnes à charge, ascendants et liens de dépendance. Cette qualification prépare la lecture civile, fiscale et successorale.',
      },
      {
        title: 'Capacité patrimoniale',
        body: 'Revenus, charges, dettes et épargne disponible permettent d’apprécier la marge de manœuvre du foyer. Ils éclairent la capacité à transmettre, protéger ou investir.',
      },
      {
        title: 'Personnes à protéger',
        body: 'Le foyer met en évidence les personnes dont la protection doit être organisée : conjoint, partenaire, enfants mineurs, personnes vulnérables ou proches dépendants.',
      },
    ],
  },
  {
    chapterId: 'civil',
    summary:
      'Le civil explique qui possède quoi, qui décide et comment le patrimoine circule en cas de séparation ou de décès.',
    keyPoints: [
      'Lire le régime matrimonial avant toute analyse successorale.',
      'Distinguer propriété, usufruit, nue-propriété et pouvoirs de gestion.',
      'Repérer les clauses civiles utiles sans les assimiler à un acte notarié.',
    ],
    sections: [
      {
        title: 'Régimes matrimoniaux',
        body: 'Le régime matrimonial détermine les masses de biens, les pouvoirs de chaque époux et les effets d’une dissolution. Il doit être lu avant toute projection successorale.',
      },
      {
        title: 'PACS et union libre',
        body: 'Le PACS organise une vie commune avec un régime patrimonial propre, tandis que l’union libre laisse moins d’effets automatiques. La protection du partenaire doit donc être formalisée.',
      },
      {
        title: 'Dévolution successorale',
        body: 'La dévolution identifie les héritiers appelés à la succession et l’ordre dans lequel ils interviennent. Le conjoint survivant se lit séparément des autres héritiers.',
      },
      {
        title: 'Réserve et quotité disponible',
        body: 'La réserve protège certains héritiers contre les libéralités excessives. La quotité disponible correspond à la fraction qui peut être transmise librement.',
      },
    ],
  },
  {
    chapterId: 'patrimoine',
    summary:
      'Le patrimoine se lit comme une photo structurée : actifs, dettes, liquidités et masses à transmettre ou arbitrer.',
    keyPoints: [
      'Rattacher chaque actif au bon détenteur et au bon objectif.',
      'Séparer valeur de marché, valeur fiscale et valeur de conseil.',
      'Distinguer les liquidités disponibles des actifs difficiles à céder.',
    ],
  },
  {
    chapterId: 'fiscalite-foyer',
    summary:
      'La fiscalité du foyer présente les mécanismes d’imposition des revenus, du patrimoine et des contributions associées.',
    keyPoints: [
      'Partir du revenu imposable avant de lire les effets du quotient familial.',
      'Séparer barème progressif, revenus du capital et contributions spécifiques.',
      'Relier la fiscalité courante à la détention immobilière taxable.',
    ],
    sections: [
      {
        title: 'Impôt sur le revenu',
        body: 'Le revenu net imposable est réparti par parts de quotient familial avant application du barème progressif. La décote, les abattements et les contributions sur hauts revenus corrigent ensuite l’impôt selon la composition du foyer et la nature des revenus.',
      },
      {
        title: 'Revenus du capital',
        body: 'Les dividendes, intérêts et plus-values mobilières relèvent en principe du prélèvement forfaitaire unique, avec option possible pour le barème progressif lorsque cette option est globale et cohérente avec les autres revenus du foyer.',
      },
      {
        title: 'Patrimoine immobilier taxable',
        body: 'L’IFI vise les immeubles et droits immobiliers non affectés à une activité opérationnelle. La lecture porte autant sur l’actif imposable que sur les dettes admises, les règles de démembrement et le plafonnement.',
      },
    ],
  },
  {
    chapterId: 'transmission',
    summary:
      'La transmission prépare le passage du patrimoine : héritiers, libéralités, assurance-vie et liquidité disponible.',
    keyPoints: [
      'Commencer par la règle civile avant l’évaluation fiscale.',
      'Séparer donation, succession et clause bénéficiaire.',
      'Repérer la liquidité nécessaire au règlement de la transmission.',
    ],
    sections: [
      {
        title: 'Dévolution et réserve',
        body: 'La succession commence par l’identification des héritiers, du conjoint survivant et des droits réservataires. Les règles civiles déterminent la masse à partager avant toute lecture fiscale.',
      },
      {
        title: 'Donations et libéralités',
        body: 'Donation simple, donation-partage, legs et libéralités graduelles organisent une transmission anticipée ou testamentaire. Leur effet dépend de la qualification de l’acte, du rapport et de la réduction.',
      },
      {
        title: 'Assurance-vie au décès',
        body: 'La clause bénéficiaire organise une transmission hors règlement successoral ordinaire. Elle doit rester cohérente avec le droit civil, les primes versées et le régime fiscal applicable au décès.',
      },
      {
        title: 'Droits de mutation',
        body: 'Les droits de succession et de donation se lisent après qualification du lien familial, des abattements applicables et de la part taxable. Les tableaux DMTG portent les valeurs à utiliser.',
      },
    ],
  },
  {
    chapterId: 'placements',
    summary:
      'Les placements comparent les enveloppes, leur usage patrimonial et les règles de sortie ou de transmission.',
    keyPoints: [
      'Situer chaque enveloppe selon sa durée, sa disponibilité et sa fiscalité.',
      'Distinguer assurance-vie, capitalisation, titres et liquidités.',
      'Lire les règles détaillées dans le référentiel contrats.',
    ],
    sections: [
      {
        title: 'Enveloppes de placement',
        body: 'Assurance-vie, capitalisation, compte-titres, plans d’actions et livrets ne répondent pas aux mêmes besoins. La lecture combine disponibilité, horizon de détention, fiscalité des revenus, transmission et niveau de risque.',
      },
      {
        title: 'Revenus du capital',
        body: 'Les revenus financiers peuvent relever du prélèvement forfaitaire unique ou du barème progressif selon l’option retenue. Les prélèvements sociaux se lisent séparément pour comprendre le coût fiscal total.',
      },
      {
        title: 'Sortie et transmission',
        body: 'Chaque enveloppe possède ses propres règles de rachat, retrait, clôture ou décès. La maturité du contrat ou du plan modifie souvent le traitement fiscal et les effets successoraux.',
      },
    ],
  },
  {
    chapterId: 'immobilier',
    summary:
      'L’immobilier combine usage, financement, fiscalité, détention et capacité de revente.',
    keyPoints: [
      'Qualifier le mode de détention avant de comparer les régimes.',
      'Séparer rendement, fiscalité, crédit et risque de liquidité.',
      'Distinguer immobilier d’usage, locatif et détention indirecte.',
    ],
    sections: [
      {
        title: 'Revenus et détention',
        body: 'La location nue relève des revenus fonciers, tandis que la location meublée suit une logique de bénéfices commerciaux. Le choix entre détention directe, société civile ou enveloppe collective modifie la lecture des revenus, des charges et de la transmission.',
      },
      {
        title: 'Cession immobilière',
        body: 'La plus-value immobilière se lit à partir du prix de cession, du prix d’acquisition, des frais admissibles et de la durée de détention. Les exonérations, surtaxes et abattements exceptionnels dépendent de la nature du bien et de la situation du cédant.',
      },
      {
        title: 'Dispositifs spécifiques',
        body: 'Les régimes locatifs ou patrimoniaux favorables reposent sur des conditions d’usage, de travaux, de conservation et de location. Leur lecture doit rester attachée à la date d’engagement et au texte applicable au dispositif.',
      },
    ],
  },
  {
    chapterId: 'arbitrage',
    summary: 'L’arbitrage aide à choisir entre conserver, vendre, réemployer ou attendre.',
    keyPoints: [
      'Comparer les scénarios avec les mêmes hypothèses de départ.',
      'Ne pas confondre gain fiscal, risque pris et besoin de trésorerie.',
      'Lire ensemble les effets sur le foyer, la société et la transmission.',
    ],
    sections: [
      {
        title: 'Cession ou conservation',
        body: 'La décision de céder un actif confronte la fiscalité de sortie, le risque conservé, la liquidité obtenue et les objectifs familiaux. Un report peut être pertinent si le coût fiscal immédiat absorbe l’intérêt économique de l’opération.',
      },
      {
        title: 'Réemploi',
        body: 'Le réemploi compare les enveloppes disponibles, leur horizon, leur disponibilité et leur traitement successoral. La fiscalité n’est qu’un élément de l’arbitrage aux côtés du risque, du rendement attendu et du besoin de revenus.',
      },
    ],
  },
  {
    chapterId: 'retraite',
    summary:
      'La retraite obligatoire expose les droits de base, les régimes complémentaires et les conditions de liquidation.',
    keyPoints: [
      'Identifier le régime avant de parler de liquidation.',
      'Séparer âge, durée, points, réversion et départ anticipé.',
      'Distinguer régimes salariés, indépendants, libéraux et fonction publique.',
    ],
    sections: [
      {
        title: 'Régime de base',
        body: 'La pension de base dépend du régime d’affiliation, de la durée validée, de l’assiette de revenus et de la date de liquidation. La lecture distingue les périodes cotisées, les périodes assimilées et les effets d’une carrière incomplète.',
      },
      {
        title: 'Complémentaires',
        body: 'Les régimes complémentaires fonctionnent souvent par points ou par classes de cotisation. Le repère utile consiste à identifier la caisse, l’assiette de cotisation, la valeur des droits et les conditions de service.',
      },
      {
        title: 'Départ et réversion',
        body: 'Le départ peut relever d’un âge légal, d’un taux plein, d’une carrière longue, d’une retraite progressive ou d’un cumul emploi-retraite. La réversion se lit séparément, avec ses propres conditions de bénéficiaire et de ressources.',
      },
    ],
  },
  {
    chapterId: 'epargne-retraite',
    summary:
      'L’épargne retraite relie effort d’épargne, fiscalité d’entrée, disponibilité et sortie en rente ou capital.',
    keyPoints: [
      'Distinguer PER, anciens contrats et épargne salariale.',
      'Lire les plafonds dans les tableaux de valeurs dédiés.',
      'Séparer transfert de contrat, potentiel de versement et liquidation.',
    ],
    sections: [
      {
        title: 'Familles de contrats',
        body: 'Le PER individuel, les anciens contrats retraite, les contrats collectifs et l’épargne salariale ne répondent pas au même usage. Il faut distinguer l’origine des versements, le titulaire, le cadre collectif et les droits de sortie.',
      },
      {
        title: 'Déductibilité et compartiments',
        body: 'L’avantage fiscal d’entrée dépend de la nature du versement et du plafond disponible. La sortie dépend ensuite du compartiment, du choix rente ou capital et du régime social applicable aux revenus de remplacement.',
      },
      {
        title: 'Transfert et disponibilité',
        body: 'Le transfert compare les frais, garanties, options de rente, contraintes contractuelles et modalités de sortie. Les cas de disponibilité anticipée restent attachés au cadre légal du produit et à la situation du titulaire.',
      },
    ],
  },
  {
    chapterId: 'prevoyance',
    summary:
      'La prévoyance mesure la protection du foyer et du dirigeant face à l’arrêt de travail, l’invalidité et le décès.',
    keyPoints: [
      'Comparer régime obligatoire, maintien employeur et contrat privé.',
      'Relier les garanties au besoin familial avant de parler cotisation.',
      'Distinguer arrêt de travail, invalidité, décès et maintien de revenu.',
    ],
    sections: [
      {
        title: 'Régimes obligatoires',
        body: 'La protection obligatoire varie selon le statut : salarié, agricole, indépendant, profession libérale ou dirigeant. Chaque régime doit être lu par risque, avec ses franchises, assiettes, prestations et conditions de versement.',
      },
      {
        title: 'Maintien employeur',
        body: 'Le maintien de salaire relève d’abord de la relation de travail, puis des conventions collectives et contrats complémentaires. Il ne se confond pas avec les prestations de sécurité sociale ni avec une garantie individuelle.',
      },
      {
        title: 'Contrats privés',
        body: 'Les contrats de prévoyance assurantiels complètent le régime obligatoire. La lecture porte sur le risque garanti, le bénéficiaire, la durée d’indemnisation, les exclusions et le traitement fiscal ou social des prestations.',
      },
    ],
  },
  {
    chapterId: 'societe',
    summary: 'La société rassemble résultat, distribution, trésorerie et opérations sur titres.',
    keyPoints: [
      'Séparer fiscalité société, droit des associés et stratégie patrimoniale.',
      'Distinguer dividendes, réserves, compte courant et trésorerie disponible.',
      'Repérer les opérations sur titres et leurs effets pour les associés.',
    ],
    sections: [
      {
        title: 'Impôt sur les sociétés',
        body: 'L’IS s’applique au résultat fiscal de la société. La lecture distingue le bénéfice imposable, le taux applicable, les intérêts déductibles et les régimes intragroupe comme le régime mère-fille.',
      },
      {
        title: 'Distribution et réserves',
        body: 'Le résultat distribuable dépend du bénéfice, des pertes antérieures, des réserves et des décisions sociales. Le dividende se lit ensuite chez l’associé selon sa situation fiscale et sociale.',
      },
      {
        title: 'Titres et opérations de capital',
        body: 'Valorisation, cession, apport à une holding, compte courant et épargne salariale relient la société au patrimoine privé. Ces opérations demandent une lecture conjointe du droit des sociétés et de la fiscalité des associés.',
      },
    ],
  },
  {
    chapterId: 'dirigeant',
    summary:
      'Le dirigeant se lit à la jonction de la rémunération, du social, de la retraite et de la protection familiale.',
    keyPoints: [
      'Identifier le statut social avant toute comparaison de rémunération.',
      'Distinguer revenu personnel, flux société et protection sociale.',
      'Repérer les effets croisés entre rémunération, dividendes et prévoyance.',
    ],
    sections: [
      {
        title: 'Statut social',
        body: 'Le statut du dirigeant oriente l’affiliation, les cotisations, les droits retraite et les garanties de prévoyance. La comparaison commence par la fonction exercée, la forme sociale et le niveau de contrôle de la société.',
      },
      {
        title: 'Rémunération et dividendes',
        body: 'Rémunération, dividendes, avantages et compte courant n’ont pas la même nature sociale. Pour les travailleurs non salariés, une part des dividendes peut rejoindre l’assiette sociale selon le cadre applicable.',
      },
      {
        title: 'Protection du foyer',
        body: 'La protection du dirigeant relie revenu professionnel, continuité de l’activité, garanties personnelles et besoins familiaux. Elle se lit avec les statuts de la société, les contrats existants et les régimes obligatoires.',
      },
    ],
  },
  {
    chapterId: 'transmission-entreprise',
    summary:
      'La transmission d’entreprise articule valeur des titres, engagement, fiscalité et liquidité de la famille.',
    keyPoints: [
      'Qualifier la société avant de parler Dutreil ou donation de titres.',
      'Séparer valeur économique, droits de vote et flux futurs.',
      'Coordonner les effets entreprise avec la transmission privée.',
    ],
    sections: [
      {
        title: 'Pacte Dutreil',
        body: 'Le pacte Dutreil repose sur une activité éligible, une conservation des titres et une direction suivie. Sa lecture combine droit des sociétés, fiscalité des transmissions et gouvernance familiale.',
      },
      {
        title: 'Donation de titres',
        body: 'La donation de titres peut porter sur la pleine propriété, l’usufruit ou la nue-propriété. Elle demande une valorisation cohérente et une lecture des pouvoirs conservés par le donateur.',
      },
      {
        title: 'Paiement des droits',
        body: 'La transmission d’entreprise peut créer un besoin de trésorerie distinct de la valeur économique reçue. Le paiement des droits se prépare avec les garanties, les flux futurs et la liquidité familiale.',
      },
    ],
  },
] as const;

export const MEMENTO_EDITORIAL_BY_CHAPTER = new Map<MementoChapterId, MementoChapterEditorial>(
  MEMENTO_EDITORIAL.map((entry) => [entry.chapterId, entry]),
);
