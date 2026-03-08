import { calculateSuccession, type HeritiersInput, type LienParente, type SuccessionResult } from '../../engine/succession';
import type {
  FamilyMember,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionEnfant,
} from './successionDraft';
import type { SuccessionDevolutionAnalysis } from './successionDevolution';
import { buildSuccessionDescendantRecipients } from './successionEnfants';
import type { DmtgSettings } from '../../engine/civil';

export interface SuccessionTransmissionRow {
  label: string;
  brut: number;
  droits: number;
  net: number;
  exonerated?: boolean;
}

export interface SuccessionDirectDisplayAnalysis {
  actifNetSuccession: number;
  simulatedDeceased: 'epoux1' | 'epoux2';
  heirs: HeritiersInput[];
  result: SuccessionResult | null;
  transmissionRows: SuccessionTransmissionRow[];
  warnings: string[];
}

interface BuildSuccessionDirectDisplayInput {
  civil: SuccessionCivilContext;
  devolution: SuccessionDevolutionAnalysis;
  devolutionContext: SuccessionDevolutionContext;
  dmtgSettings: DmtgSettings;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  order?: 'epoux1' | 'epoux2';
}

function asAmount(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getRelevantDeceased(
  civil: SuccessionCivilContext,
  order: 'epoux1' | 'epoux2' | undefined,
): 'epoux1' | 'epoux2' {
  if (civil.situationMatrimoniale === 'pacse') return order === 'epoux2' ? 'epoux2' : 'epoux1';
  return 'epoux1';
}

function getRelevantDescendantRecipients(
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  deceased: 'epoux1' | 'epoux2',
) {
  const relevantEnfants = enfantsContext.filter(
    (enfant) => enfant.rattachement === 'commun' || enfant.rattachement === deceased,
  );
  const relevantEnfantIds = new Set(relevantEnfants.map((enfant) => enfant.id));
  const relevantFamilyMembers = familyMembers.filter(
    (member) => member.type !== 'petit_enfant'
      || (member.parentEnfantId && relevantEnfantIds.has(member.parentEnfantId)),
  );
  return buildSuccessionDescendantRecipients(relevantEnfants, relevantFamilyMembers);
}

function splitAmountAcrossRecipients(
  recipients: Array<{ lien: Extract<LienParente, 'enfant' | 'petit_enfant'>; branchId: string }>,
  amount: number,
): HeritiersInput[] {
  if (amount <= 0 || recipients.length === 0) return [];

  const byBranch = recipients.reduce((map, recipient) => {
    const branchRecipients = map.get(recipient.branchId) ?? [];
    branchRecipients.push(recipient);
    map.set(recipient.branchId, branchRecipients);
    return map;
  }, new Map<string, typeof recipients>());

  const branchCount = Math.max(1, byBranch.size);
  const amountByBranch = amount / branchCount;

  return Array.from(byBranch.values()).flatMap((branchRecipients) => {
    const amountByRecipient = amountByBranch / branchRecipients.length;
    return branchRecipients.map((recipient) => ({
      lien: recipient.lien,
      partSuccession: amountByRecipient,
    }));
  });
}

function getSideRelatives(
  familyMembers: FamilyMember[],
  deceased: 'epoux1' | 'epoux2',
  type: FamilyMember['type'],
): FamilyMember[] {
  return familyMembers.filter(
    (member) => member.type === type && (!member.branch || member.branch === deceased),
  );
}

function buildParentAndSiblingHeirs(
  devolution: SuccessionDevolutionAnalysis,
  familyMembers: FamilyMember[],
  deceased: 'epoux1' | 'epoux2',
): HeritiersInput[] {
  const heirs: HeritiersInput[] = [];
  const parentsLine = devolution.lines.find(
    (line) => line.heritier === 'Père et mère' || line.heritier === 'Ascendants (père et mère)',
  );
  const parentLine = devolution.lines.find((line) => line.heritier === 'Ascendant survivant');
  const siblingsLine = devolution.lines.find((line) => line.heritier === 'Frères et sœurs');

  if (parentsLine && asAmount(parentsLine.montantEstime) > 0) {
    const parentCount = Math.max(2, getSideRelatives(familyMembers, deceased, 'parent').length);
    const amountByParent = asAmount(parentsLine.montantEstime) / parentCount;
    for (let index = 0; index < parentCount; index += 1) {
      heirs.push({ lien: 'parent', partSuccession: amountByParent });
    }
  } else if (parentLine && asAmount(parentLine.montantEstime) > 0) {
    const parentCount = Math.max(1, getSideRelatives(familyMembers, deceased, 'parent').length);
    const amountByParent = asAmount(parentLine.montantEstime) / parentCount;
    for (let index = 0; index < parentCount; index += 1) {
      heirs.push({ lien: 'parent', partSuccession: amountByParent });
    }
  }

  if (siblingsLine && asAmount(siblingsLine.montantEstime) > 0) {
    const siblingCount = Math.max(1, getSideRelatives(familyMembers, deceased, 'frere_soeur').length);
    const amountBySibling = asAmount(siblingsLine.montantEstime) / siblingCount;
    for (let index = 0; index < siblingCount; index += 1) {
      heirs.push({ lien: 'frere_soeur', partSuccession: amountBySibling });
    }
  }

  return heirs;
}

function buildPartnerHeirs(
  civil: SuccessionCivilContext,
  devolution: SuccessionDevolutionAnalysis,
): HeritiersInput[] {
  if (civil.situationMatrimoniale === 'pacse') {
    const partnerLine = devolution.lines.find((line) => line.heritier === 'Partenaire pacsé');
    const amount = asAmount(partnerLine?.montantEstime);
    return amount > 0 ? [{ lien: 'conjoint', partSuccession: amount }] : [];
  }

  if (civil.situationMatrimoniale === 'concubinage') {
    const concubinLine = devolution.lines.find((line) => line.heritier === 'Concubin');
    const amount = asAmount(concubinLine?.montantEstime);
    return amount > 0 ? [{ lien: 'autre', partSuccession: amount }] : [];
  }

  if (civil.situationMatrimoniale === 'marie') {
    const conjointLine = devolution.lines.find((line) => line.heritier === 'Conjoint survivant');
    const amount = asAmount(conjointLine?.montantEstime);
    return amount > 0 ? [{ lien: 'conjoint', partSuccession: amount }] : [];
  }

  return [];
}

function buildTransmissionRows(result: SuccessionResult | null): SuccessionTransmissionRow[] {
  if (!result) return [];

  const grouped = result.detailHeritiers.reduce((map, heir) => {
    let key: string;
    let label: string;

    if (heir.lien === 'conjoint') {
      key = 'conjoint';
      label = 'Conjoint / partenaire';
    } else if (heir.lien === 'enfant' || heir.lien === 'petit_enfant') {
      key = 'descendants';
      label = 'Descendants';
    } else if (heir.lien === 'parent') {
      key = 'parents';
      label = 'Parents';
    } else if (heir.lien === 'frere_soeur') {
      key = 'freres_soeurs';
      label = 'Frères / sœurs';
    } else if (heir.lien === 'neveu_niece') {
      key = 'neveux_nieces';
      label = 'Neveux / nièces';
    } else {
      key = 'autres';
      label = 'Autres bénéficiaires';
    }

    const current = map.get(key) ?? {
      label,
      brut: 0,
      droits: 0,
      net: 0,
      exonerated: heir.lien === 'conjoint',
    };
    current.brut += heir.partBrute;
    current.droits += heir.droits;
    current.net += heir.partBrute - heir.droits;
    current.exonerated = current.exonerated && heir.lien === 'conjoint';
    map.set(key, current);
    return map;
  }, new Map<string, SuccessionTransmissionRow>());

  return Array.from(grouped.values());
}

export function buildSuccessionDirectDisplayAnalysis(
  input: BuildSuccessionDirectDisplayInput,
): SuccessionDirectDisplayAnalysis {
  const simulatedDeceased = getRelevantDeceased(input.civil, input.order);
  const warnings = [...input.devolution.warnings];
  const heirs: HeritiersInput[] = [];
  const estateAmount = Math.max(0, input.devolution.masseReference);

  const partnerHeirs = buildPartnerHeirs(input.civil, input.devolution);
  heirs.push(...partnerHeirs);

  const descendantsLine = input.devolution.lines.find((line) => line.heritier === 'Descendants');
  const descendantsAmount = (
    input.devolutionContext.testamentActif
    && (input.civil.situationMatrimoniale === 'pacse' || input.civil.situationMatrimoniale === 'concubinage')
  )
    ? Math.max(0, estateAmount - partnerHeirs.reduce((sum, heir) => sum + heir.partSuccession, 0))
    : asAmount(descendantsLine?.montantEstime);
  if (descendantsAmount > 0) {
    const recipients = getRelevantDescendantRecipients(
      input.enfantsContext,
      input.familyMembers,
      simulatedDeceased,
    );
    const descendantHeirs = splitAmountAcrossRecipients(recipients, descendantsAmount);
    if (descendantHeirs.length > 0) {
      heirs.push(...descendantHeirs);
    } else {
      const branchCount = Math.max(1, input.devolution.nbEnfantsTotal);
      const amountByBranch = descendantsAmount / branchCount;
      for (let index = 0; index < branchCount; index += 1) {
        heirs.push({ lien: 'enfant', partSuccession: amountByBranch });
      }
      warnings.push('Répartition descendants: repli sur une ventilation égale par branche, faute d’identifiants détaillés.');
    }
  }

  heirs.push(...buildParentAndSiblingHeirs(input.devolution, input.familyMembers, simulatedDeceased));

  if (
    input.devolutionContext.testamentActif
    && heirs.length === 0
    && input.civil.situationMatrimoniale !== 'marie'
    && input.civil.situationMatrimoniale !== 'pacse'
    && input.civil.situationMatrimoniale !== 'concubinage'
  ) {
    warnings.push('Testament actif hors couple: bénéficiaire testamentaire non détaillé dans cet affichage simplifié.');
  }

  const actifNetSuccession = heirs.reduce((sum, heir) => sum + heir.partSuccession, 0) || estateAmount;
  const result = heirs.length > 0
    ? calculateSuccession({
      actifNetSuccession,
      heritiers: heirs,
      dmtgSettings: input.dmtgSettings,
    }).result
    : null;

  return {
    actifNetSuccession,
    simulatedDeceased,
    heirs,
    result,
    transmissionRows: buildTransmissionRows(result),
    warnings,
  };
}
