/**
 * Façade publique des types PPTX.
 *
 * Les sous-modules gardent un ordre acyclique : core -> domaines -> deck.
 */

export type { TresorerieProjectionSlideSpec, TresorerieSchemaSlideSpec } from './tresorerieTypes';
export type * from './types/core';
export type * from './types/ir';
export type * from './types/succession';
export type * from './types/placement';
export type * from './types/per';
export type * from './types/credit';
export type * from './types/studyDeck';
