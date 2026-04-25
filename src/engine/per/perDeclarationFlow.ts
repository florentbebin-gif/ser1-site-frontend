import type { Declaration2042Boxes, DeclarantRevenus, PlafondMadelinDetail } from './types';

interface Declaration2042Context {
  declarant1: DeclarantRevenus;
  declarant2?: DeclarantRevenus;
  madelin1?: PlafondMadelinDetail | null;
  madelin2?: PlafondMadelinDetail | null;
  mutualisationConjoints: boolean;
}

function buildDeclarantBoxes(
  declarant: DeclarantRevenus,
  madelin: PlafondMadelinDetail | null | undefined,
): Pick<Declaration2042Boxes, 'case6NS' | 'case6RS' | 'case6QS' | 'case6OS'> {
  return {
    case6NS: Math.max(0, declarant.cotisationsPer163Q || 0),
    case6RS: Math.max(0, declarant.cotisationsPerp || 0),
    case6QS: Math.round(
      Math.max(0, declarant.cotisationsArt83 || 0) +
      Math.max(0, declarant.abondementPerco || 0) +
      Math.max(0, madelin?.depassement15Report.madelinRetraite || 0),
    ),
    case6OS: Math.round(Math.max(0, madelin?.depassement15Report.per154bis || 0)),
  };
}

export function computeDeclaration2042({
  declarant1,
  declarant2,
  madelin1,
  madelin2,
  mutualisationConjoints,
}: Declaration2042Context): Declaration2042Boxes {
  const d1Boxes = buildDeclarantBoxes(declarant1, madelin1);
  const d2Boxes = declarant2 ? buildDeclarantBoxes(declarant2, madelin2) : null;

  return {
    case6NS: d1Boxes.case6NS,
    case6NT: d2Boxes?.case6NS,
    case6RS: d1Boxes.case6RS,
    case6RT: d2Boxes?.case6RS,
    case6QS: d1Boxes.case6QS,
    case6QT: d2Boxes?.case6QS,
    case6OS: d1Boxes.case6OS,
    case6OT: d2Boxes?.case6OS,
    case6QR: Boolean(declarant2 && mutualisationConjoints),
  };
}
