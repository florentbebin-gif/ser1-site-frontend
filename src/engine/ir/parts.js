// IR quotient familial: parts computation (moved from utils/irEngine.js for PR-03 split)

// Règle parent isolé (case T) :
// - Enfants à charge comptés avant les enfants en alternée pour les 2 premiers rangs.
// - Bonus parent isolé = 0,5 si au moins un enfant est à charge.
// - Si uniquement alternée : bonus = 0,25 par enfant alternée (plafonné à 0,5).
export function computeAutoPartsWithChildren({ status, isIsolated, children = [] }) {
  const baseParts = status === 'couple' ? 2 : 1;

  const chargeCount = children.filter((child) => child && child.mode === 'charge').length;
  const sharedCount = children.filter((child) => child && child.mode === 'shared').length;

  let childrenParts = 0;
  let remainingFirstSlots = 2;

  const chargeFirstSlots = Math.min(chargeCount, remainingFirstSlots);
  childrenParts += chargeFirstSlots * 0.5;
  remainingFirstSlots -= chargeFirstSlots;

  const chargeBeyond = chargeCount - chargeFirstSlots;
  if (chargeBeyond > 0) {
    childrenParts += chargeBeyond * 1;
  }

  const sharedFirstSlots = Math.min(sharedCount, remainingFirstSlots);
  childrenParts += sharedFirstSlots * 0.25;
  remainingFirstSlots -= sharedFirstSlots;

  const sharedBeyond = sharedCount - sharedFirstSlots;
  if (sharedBeyond > 0) {
    childrenParts += sharedBeyond * 0.5;
  }

  let isolatedBonus = 0;
  if (status === 'single' && isIsolated) {
    if (chargeCount > 0) {
      isolatedBonus = 0.5;
    } else if (sharedCount > 0) {
      isolatedBonus = Math.min(0.5, sharedCount * 0.25);
    }
  }

  return baseParts + childrenParts + isolatedBonus;
}
