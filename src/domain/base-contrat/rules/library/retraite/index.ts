import type { Audience, ProductRules } from '../../types';
import {
  ARTICLE_39_PP,
  ARTICLE_83_PP,
  EPARGNE_SALARIALE_PEE_PP,
  PERO_PP,
} from './individual-collective';
import { PERIN_ASSURANCE, PERIN_BANCAIRE, PERP_MADELIN_ANCIEN } from './individual-per';
import {
  ARTICLE_39_PM,
  ARTICLE_83_PM,
  EPARGNE_SALARIALE_PEE_PM,
  PERO_PM,
  PPV_INTERESSEMENT_PARTICIPATION_PM,
} from './collective';

export function getRetraiteRules(productId: string, audience: Audience): ProductRules | undefined {
  switch (productId) {
    case 'perin_assurance':
      return PERIN_ASSURANCE;
    case 'perin_bancaire':
      return PERIN_BANCAIRE;
    case 'pee_pp':
    case 'percol_pp':
    case 'perco_ancien_pp':
      return EPARGNE_SALARIALE_PEE_PP;
    case 'pee_pm':
    case 'percol_pm':
    case 'perco_ancien_pm':
      return EPARGNE_SALARIALE_PEE_PM;
    case 'pee':
    case 'percol':
    case 'perco_ancien':
      return audience === 'pm' ? EPARGNE_SALARIALE_PEE_PM : EPARGNE_SALARIALE_PEE_PP;
    case 'article_83_pp':
      return ARTICLE_83_PP;
    case 'article_83_pm':
      return ARTICLE_83_PM;
    case 'article_83':
      return audience === 'pm' ? ARTICLE_83_PM : ARTICLE_83_PP;
    case 'article_39_pp':
      return ARTICLE_39_PP;
    case 'article_39_pm':
      return ARTICLE_39_PM;
    case 'article_39':
      return audience === 'pm' ? ARTICLE_39_PM : ARTICLE_39_PP;
    case 'pero_pp':
      return PERO_PP;
    case 'pero_pm':
      return PERO_PM;
    case 'pero':
      return audience === 'pm' ? PERO_PM : PERO_PP;
    case 'ppv_prime_partage_valeur':
    case 'interessement':
    case 'participation':
      return audience === 'pm' ? PPV_INTERESSEMENT_PARTICIPATION_PM : undefined;
    case 'perp_ancien':
    case 'madelin_retraite_ancien':
      return PERP_MADELIN_ANCIEN;
    default:
      return undefined;
  }
}
