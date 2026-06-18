import { useEffect, useRef, type RefObject } from 'react';

/**
 * Repositionne l'en-tête d'un accordéon mémento dans le viewport.
 *
 * Le `@media (prefers-reduced-motion: reduce)` global ne réduit que les animations/transitions CSS ;
 * il ne gouverne PAS un `scrollIntoView({ behavior: 'smooth' })` déclenché en JS. On teste donc la
 * préférence ici et on bascule en `behavior: 'auto'` quand elle est active.
 */
export function scrollAccordionHeaderIntoView(element: HTMLElement | null): void {
  if (!element || typeof element.scrollIntoView !== 'function' || typeof window === 'undefined') {
    return;
  }

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    element.scrollIntoView({
      block: 'nearest',
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  } catch {
    // `scrollIntoView` n'est pas implémenté dans certains environnements (jsdom, SSR) et y lève une
    // erreur : le repositionnement est un confort de lecture, jamais une fonction critique.
  }
}

/**
 * Hook d'accordéon (niveau composant) : au passage fermé → ouvert, ramène le bouton dans le viewport
 * en conservant le focus clavier dessus (aucun transfert de focus vers le panneau). `enabled` permet
 * de neutraliser le scroll quand l'ouverture est subie (ex. recherche qui déplie tout d'un coup).
 */
export function useAccordionScroll(
  isOpen: boolean,
  enabled = true,
): RefObject<HTMLButtonElement | null> {
  const headerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (enabled && isOpen && !wasOpen.current) {
      scrollAccordionHeaderIntoView(headerRef.current);
    }
    wasOpen.current = isOpen;
  }, [enabled, isOpen]);

  return headerRef;
}
