import { getEconomicRightsPct } from './simulateTresorerieV2.helpers';
import type { RuntimeAssociateInput } from './types';

export function getPlainPropertyCapitalPct(associate: RuntimeAssociateInput): number {
  return associate.ownershipLots
    .filter((lot) => lot.right === 'pleine_propriete')
    .reduce((sum, lot) => sum + (lot.capitalPct || 0), 0);
}

export function computeDistributableCapacity(params: {
  associates: RuntimeAssociateInput[];
  resultatNetComptable: number;
  dotationReserveLegale: number;
  reservesDebut: number;
  usufructuaryAppropriatesReserves: boolean;
}): number {
  const {
    associates,
    resultatNetComptable,
    dotationReserveLegale,
    reservesDebut,
    usufructuaryAppropriatesReserves,
  } = params;
  const resultatCourantDistribuable = Math.max(0, resultatNetComptable - dotationReserveLegale);
  const reservesDisponibles = Math.max(0, reservesDebut);
  const totalPlainPropertyPct = associates.reduce(
    (sum, a) => sum + getPlainPropertyCapitalPct(a),
    0,
  );
  const reservesEffectivementDistribuables = usufructuaryAppropriatesReserves
    ? reservesDisponibles
    : totalPlainPropertyPct > 0
      ? reservesDisponibles
      : 0;
  return resultatCourantDistribuable + reservesEffectivementDistribuables;
}

export function computeDividendsDistribution(params: {
  associates: RuntimeAssociateInput[];
  resultatNetComptable: number;
  dotationReserveLegale: number;
  reservesDebut: number;
  usufructuaryAppropriatesReserves: boolean;
  dividendesDemandesTotaux: number;
  tresoDispoApresCCAEtIS: number;
}): {
  dividendesAssociesBruts: number;
  capaciteDistribuable: number;
  grossDividendsByAssociate: Map<string, number>;
} {
  const {
    associates,
    resultatNetComptable,
    dotationReserveLegale,
    reservesDebut,
    usufructuaryAppropriatesReserves,
    dividendesDemandesTotaux,
    tresoDispoApresCCAEtIS,
  } = params;
  const resultatCourantDistribuable = Math.max(0, resultatNetComptable - dotationReserveLegale);
  const capaciteDistribuable = computeDistributableCapacity({
    associates,
    resultatNetComptable,
    dotationReserveLegale,
    reservesDebut,
    usufructuaryAppropriatesReserves,
  });
  const dividendesAssociesBruts = Math.min(
    dividendesDemandesTotaux,
    capaciteDistribuable,
    tresoDispoApresCCAEtIS,
  );
  const dividendesIssusResultat = Math.min(dividendesAssociesBruts, resultatCourantDistribuable);
  const dividendesIssusReserves = Math.max(0, dividendesAssociesBruts - dividendesIssusResultat);
  const totalPlainPropertyPct = associates.reduce(
    (sum, a) => sum + getPlainPropertyCapitalPct(a),
    0,
  );

  const grossDividendsByAssociate = new Map<string, number>();
  associates.forEach((associate) => {
    const economicShare = getEconomicRightsPct(associate) / 100;
    const fromResult = dividendesIssusResultat * economicShare;
    let fromReserves = 0;
    if (dividendesIssusReserves > 0) {
      if (usufructuaryAppropriatesReserves) {
        fromReserves = dividendesIssusReserves * economicShare;
      } else if (totalPlainPropertyPct > 0) {
        fromReserves =
          dividendesIssusReserves * (getPlainPropertyCapitalPct(associate) / totalPlainPropertyPct);
      }
    }
    const total = fromResult + fromReserves;
    if (total > 0) grossDividendsByAssociate.set(associate.id, total);
  });

  return { dividendesAssociesBruts, capaciteDistribuable, grossDividendsByAssociate };
}
