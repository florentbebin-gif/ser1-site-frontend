/**
 * IrSelect — wrapper de compatibilité, délègue à SimSelect (GOUVERNANCE.md §5).
 * Tous les imports existants continuent de fonctionner sans modification.
 */
export type { SimSelectOption as IrSelectOption } from '@/components/ui/sim/SimSelect';
export type { SimSelectProps as IrSelectProps } from '@/components/ui/sim/SimSelect';
export { SimSelect as IrSelect } from '@/components/ui/sim/SimSelect';
